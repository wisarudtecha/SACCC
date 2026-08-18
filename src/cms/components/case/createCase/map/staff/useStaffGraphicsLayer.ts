// Keeps an ArcGIS GraphicsLayer of staff markers in sync with a StaffMarker[].
//
// Three rules drive the design:
//
//   1. The layer is added to the EXISTING map. Rebuilding the MapView to show
//      staff would discard the user's pan/zoom and the case marker, which is the
//      same reason the basemap is swapped in place in ArcgisAddressMap.
//   2. Updates diff in place. `removeAll()` + re-add is one line shorter and
//      visibly flickers every time positions refresh, so graphics are kept in a
//      Map keyed by a namespaced id and only their geometry/symbol are
//      reassigned.
//   3. Officers who overlap on screen are drawn as ONE group circle carrying a
//      count (see staffClusters.ts). That grouping depends on the current zoom,
//      not just on the data, so the sync also runs whenever the view settles.
//
// Marker clicks are resolved through `resolveStaffClick`, which the map's own
// click handler awaits BEFORE deciding to reverse-geocode. hitTest is async, so
// a second `view.on("click")` handler could not call `event.stopPropagation()`
// in time - the ordering has to be explicit, not a matter of listener order.
import { useCallback, useEffect, useRef } from "react";
import Graphic from "@arcgis/core/Graphic.js";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer.js";
import Point from "@arcgis/core/geometry/Point.js";
import * as reactiveUtils from "@arcgis/core/core/reactiveUtils.js";
import type esriMap from "@arcgis/core/Map.js";
import type MapView from "@arcgis/core/views/MapView.js";
import {
  getSeparationZoom,
  groupStaffByProximity,
  STAFF_CLUSTER_RADIUS_PX,
  type ScreenPoint,
  type StaffGroup,
  type StaffGrouping
} from "./staffClusters";
import { getTravelBearing } from "./staffTelemetry";
import {
  createStaffGroupHaloSymbol,
  createStaffGroupLabelSymbol,
  createStaffGroupSymbol,
  createStaffHaloSymbol,
  createStaffHeadingSymbol,
  createStaffSymbol
} from "./staffSymbols";
import { isStaleLocation, type StaffMarker, type StaffSelection } from "./staffTypes";

/** Minimal shape of the hitTest results we read - see the note in ArcgisAddressMap. */
interface HitTestResultLike {
  type?: string;
  graphic?: Graphic;
}

interface HitTestResponseLike {
  results?: HitTestResultLike[];
}

/**
 * What the pointer is over. Distinct from StaffSelection: this is the raw hit,
 * before the click policy decides whether a group should be zoomed into or
 * offered as a picker.
 */
type StaffHit =
  | { type: "staff"; unitId: string }
  | { type: "group"; group: StaffGroup };

interface UseStaffGraphicsLayerOptions {
  mapRef: React.MutableRefObject<esriMap | null>;
  viewRef: React.MutableRefObject<MapView | null>;
  /** True once the MapView has resolved; refs are only safe to use after this. */
  isReady: boolean;
  staff: readonly StaffMarker[];
  selectedStaffId: string | null;
  visible: boolean;
}

export interface UseStaffGraphicsLayerResult {
  /**
   * Resolves a click on the staff layer.
   *
   * Returns the officer clicked, or - for a group that cannot be separated by
   * zooming - the officers inside it, for the caller to offer as a picker. A
   * group that CAN be separated is zoomed into here and returns null: there is
   * nothing to select yet, and the settle that follows redraws its members
   * individually.
   *
   * Stable across renders, so a handler registered once at mount can call it.
   */
  resolveStaffClick: (event: unknown) => Promise<StaffSelection | null>;
}

/** Graphic keys are namespaced so one Map can hold all three kinds. */
const unitKey = (unitId: string) => `unit:${unitId}`;
const groupKey = (groupId: string) => `group:${groupId}`;
const groupLabelKey = (groupId: string) => `label:${groupId}`;

function toPoint(latitude: number, longitude: number): Point {
  return new Point({ latitude, longitude });
}

export function useStaffGraphicsLayer({
  mapRef,
  viewRef,
  isReady,
  staff,
  selectedStaffId,
  visible
}: UseStaffGraphicsLayerOptions): UseStaffGraphicsLayerResult {
  const layerRef = useRef<GraphicsLayer | null>(null);
  const graphicsRef = useRef<Map<string, Graphic>>(new Map());
  // At most one of each: only one officer can be selected at a time.
  const haloRef = useRef<Graphic | null>(null);
  // The direction-of-travel chevron on that halo. Absent far more often than the
  // halo is - it needs the selected officer to be drawn individually, moving, and
  // reporting a recent fix.
  const headingRef = useRef<Graphic | null>(null);
  // The grouping the layer currently shows, so a hit on a group circle can be
  // traced back to its members without recomputing.
  const groupingRef = useRef<StaffGrouping>({ singles: [], groups: [] });

  // The sync reads these rather than closing over them: it is also driven by the
  // view's settle event, which fires outside React's render cycle.
  const staffRef = useRef(staff);
  const selectedStaffIdRef = useRef(selectedStaffId);
  const visibleRef = useRef(visible);
  staffRef.current = staff;
  selectedStaffIdRef.current = selectedStaffId;
  visibleRef.current = visible;

  const syncGraphics = useCallback(() => {
    const view = viewRef.current;
    const layer = layerRef.current;
    if (!view || !layer) {
      return;
    }

    layer.visible = visibleRef.current;
    if (!visibleRef.current) {
      groupingRef.current = { singles: [], groups: [] };
      return;
    }

    const markers = staffRef.current;
    const selectedId = selectedStaffIdRef.current;
    const graphics = graphicsRef.current;
    const nowMs = Date.now();

    const toScreen = (marker: StaffMarker): ScreenPoint | null => {
      const screenPoint = view.toScreen(toPoint(marker.latitude, marker.longitude));
      return screenPoint ? { x: screenPoint.x, y: screenPoint.y } : null;
    };

    const grouping = groupStaffByProximity(markers, toScreen, STAFF_CLUSTER_RADIUS_PX);
    groupingRef.current = grouping;

    // Everything that should be on the map after this pass. Anything else - an
    // officer who left the list, or a group that has just dissolved - goes.
    const liveKeys = new Set<string>();
    grouping.singles.forEach((marker) => liveKeys.add(unitKey(marker.unitId)));
    grouping.groups.forEach((group) => {
      liveKeys.add(groupKey(group.id));
      liveKeys.add(groupLabelKey(group.id));
    });

    graphics.forEach((graphic, key) => {
      if (!liveKeys.has(key)) {
        layer.remove(graphic);
        graphics.delete(key);
      }
    });

    const upsert = (
      key: string,
      geometry: Point,
      // Autocast symbol objects, as everywhere else in this module.
      symbol: ReturnType<typeof createStaffSymbol> | ReturnType<typeof createStaffGroupSymbol> | ReturnType<typeof createStaffGroupLabelSymbol>,
      attributes: Record<string, string>
    ) => {
      const existing = graphics.get(key);
      if (!existing) {
        const graphic = new Graphic({ geometry, symbol, attributes });
        graphics.set(key, graphic);
        layer.add(graphic);
        return;
      }
      const point = existing.geometry as Point | null;
      if (point?.latitude !== geometry.latitude || point?.longitude !== geometry.longitude) {
        existing.geometry = geometry;
      }
      existing.symbol = symbol;
      existing.attributes = attributes;
    };

    grouping.singles.forEach((marker) => {
      upsert(
        unitKey(marker.unitId),
        toPoint(marker.latitude, marker.longitude),
        createStaffSymbol(marker.statusId, {
          isSelected: marker.unitId === selectedId,
          isStale: isStaleLocation(marker, nowMs),
          isLogin: marker.isLogin
        }),
        { unitId: marker.unitId }
      );
    });

    grouping.groups.forEach((group) => {
      const geometry = toPoint(group.latitude, group.longitude);
      const count = group.unitIds.length;
      upsert(groupKey(group.id), geometry, createStaffGroupSymbol(group.availability, count), {
        groupId: group.id
      });
      // Same groupId, so clicking the number counts as clicking the group.
      upsert(groupLabelKey(group.id), geometry, createStaffGroupLabelSymbol(count), {
        groupId: group.id
      });
    });

    // The selection halo, kept in the same pass so it follows a position update
    // rather than lagging a refresh behind the marker it sits under. It also
    // follows the selected officer INTO a group: losing the halo the moment
    // someone else parks next to them would read as losing the selection.
    const selectedSingle = grouping.singles.find((marker) => marker.unitId === selectedId);
    const selectedGroup = selectedId
      ? grouping.groups.find((group) => group.unitIds.includes(selectedId))
      : undefined;

    const removeGraphic = (ref: React.MutableRefObject<Graphic | null>) => {
      if (ref.current) {
        layer.remove(ref.current);
        ref.current = null;
      }
    };

    if (!selectedSingle && !selectedGroup) {
      removeGraphic(haloRef);
      removeGraphic(headingRef);
      return;
    }

    const haloGeometry = selectedSingle
      ? toPoint(selectedSingle.latitude, selectedSingle.longitude)
      : toPoint(selectedGroup!.latitude, selectedGroup!.longitude);
    const haloSymbol = selectedSingle
      ? createStaffHaloSymbol(selectedSingle.statusId, selectedSingle.isLogin)
      : createStaffGroupHaloSymbol(selectedGroup!.availability, selectedGroup!.unitIds.length);
    // Carries what sits above it, so clicking the ring hits the same thing the
    // icon does instead of falling through to the map.
    const haloAttributes = selectedSingle
      ? { unitId: selectedSingle.unitId }
      : { groupId: selectedGroup!.id };

    if (haloRef.current) {
      haloRef.current.geometry = haloGeometry;
      haloRef.current.symbol = haloSymbol;
      haloRef.current.attributes = haloAttributes;
    }
    else {
      const halo = new Graphic({
        geometry: haloGeometry,
        symbol: haloSymbol,
        attributes: haloAttributes
      });
      haloRef.current = halo;
      // Index 0 so it draws beneath everything: the loops above append, so markers
      // added later still sit on top of it.
      layer.graphics.add(halo, 0);
    }

    // The chevron on that halo, pointing where the officer is going. Three things
    // have to hold before an arrow is honest, and only ONE of them is about the
    // data being present:
    //
    //   - the officer is drawn individually - a group circle covers several
    //     people who are not going the same way;
    //   - they are actually moving, so the bearing is a direction of travel
    //     rather than the way they happened to be facing when they parked
    //     (getTravelBearing);
    //   - the fix is recent, because an arrow is a claim about NOW, and the same
    //     staleness rule that mutes the marker applies to it.
    const travelBearing = selectedSingle ? getTravelBearing(selectedSingle) : null;
    if (!selectedSingle || travelBearing === null || isStaleLocation(selectedSingle, nowMs)) {
      removeGraphic(headingRef);
      return;
    }

    const headingSymbol = createStaffHeadingSymbol(
      selectedSingle.statusId,
      selectedSingle.isLogin,
      travelBearing
    );

    if (headingRef.current) {
      headingRef.current.geometry = haloGeometry;
      headingRef.current.symbol = headingSymbol;
      headingRef.current.attributes = haloAttributes;
      return;
    }

    const heading = new Graphic({
      geometry: haloGeometry,
      symbol: headingSymbol,
      attributes: haloAttributes
    });
    headingRef.current = heading;
    // Index 1: directly above the halo it rides on - a translucent fill would
    // tint it from below - and still beneath every marker appended above.
    layer.graphics.add(heading, 1);
  }, [viewRef]);

  // Create the layer once the view exists, and tear it down with the map.
  useEffect(() => {
    const map = mapRef.current;
    if (!isReady || !map) {
      return;
    }

    const layer = new GraphicsLayer({ id: "staff-layer" });
    layerRef.current = layer;
    map.add(layer);

    // Captured here rather than read in the cleanup: the ref holds the Map that
    // belongs to THIS layer, and reading it later could clear a newer one.
    const graphics = graphicsRef.current;

    return () => {
      map.remove(layer);
      layer.removeAll();
      layer.destroy();
      layerRef.current = null;
      graphics.clear();
      haloRef.current = null;
      headingRef.current = null;
      groupingRef.current = { singles: [], groups: [] };
    };
  }, [isReady, mapRef]);

  // Data-driven redraws.
  useEffect(() => {
    if (!isReady) {
      return;
    }
    syncGraphics();
  }, [isReady, staff, selectedStaffId, visible, syncGraphics]);

  // View-driven redraws: the grouping is computed in screen space, so panning or
  // zooming changes it even when the data has not moved. Recomputing on settle
  // rather than per frame keeps panning free.
  useEffect(() => {
    const view = viewRef.current;
    if (!isReady || !view) {
      return;
    }
    const handle = reactiveUtils.watch(
      () => view.stationary,
      (stationary) => {
        if (stationary) {
          syncGraphics();
        }
      }
    );
    return () => handle.remove();
  }, [isReady, viewRef, syncGraphics]);

  // Pure: no navigation, no selection. Both the click path and the cursor path
  // use it, and the cursor path must not move the map.
  const hitTestStaff = useCallback(async (event: unknown): Promise<StaffHit | null> => {
    const view = viewRef.current;
    const layer = layerRef.current;
    if (!view || !layer || !layer.visible) {
      return null;
    }
    try {
      // `include` scopes the test to this layer, so the case marker and basemap
      // features can never be mistaken for an officer.
      const response = (await view.hitTest(
        event as Parameters<MapView["hitTest"]>[0],
        { include: [layer] }
      )) as HitTestResponseLike;

      const results = response?.results?.filter((result) => result.type === "graphic") ?? [];

      // An individual officer wins over a group, though the two never overlap:
      // a grouped officer is not drawn on their own.
      const unitHit = results.find((result) => result.graphic?.attributes?.unitId);
      const unitId = unitHit?.graphic?.attributes?.unitId;
      if (typeof unitId === "string") {
        return { type: "staff", unitId };
      }

      const groupHit = results.find((result) => result.graphic?.attributes?.groupId);
      const groupId = groupHit?.graphic?.attributes?.groupId;
      if (typeof groupId === "string") {
        const group = groupingRef.current.groups.find((candidate) => candidate.id === groupId);
        return group ? { type: "group", group } : null;
      }

      return null;
    }
    catch (error) {
      console.error("Failed to hit-test the staff layer", error);
      return null;
    }
  }, [viewRef]);

  const resolveStaffClick = useCallback(async (event: unknown): Promise<StaffSelection | null> => {
    const hit = await hitTestStaff(event);
    if (!hit) {
      return null;
    }
    if (hit.type === "staff") {
      return { type: "staff", unitId: hit.unitId };
    }

    const view = viewRef.current;
    // Zoom is the natural way out of a crowd, so take it when it would actually
    // work. It cannot when the members report the same coordinates, or when the
    // zoom needed is past what the basemap offers - and those are exactly the
    // cases where a picker is the only way to reach the person underneath.
    const separationZoom = view
      ? getSeparationZoom(
          hit.group,
          view.zoom,
          view.constraints?.effectiveMaxZoom ?? Number.POSITIVE_INFINITY,
          STAFF_CLUSTER_RADIUS_PX
        )
      : null;

    if (view && separationZoom !== null) {
      view
        .goTo({ target: toPoint(hit.group.latitude, hit.group.longitude), zoom: separationZoom })
        .catch(() => {
          /* goTo rejects when interrupted by a newer navigation - safe to ignore */
        });
      // Nothing selected: the settle that follows redraws the members separately.
      return null;
    }

    return { type: "group", unitIds: hit.group.unitIds };
  }, [hitTestStaff, viewRef]);

  // Bring the selected officer into view, but only when they are off-screen -
  // recentring on a marker the operator just clicked is disorienting.
  useEffect(() => {
    const view = viewRef.current;
    if (!isReady || !view || !visible || !selectedStaffId) {
      return;
    }
    const marker = staff.find((item) => item.unitId === selectedStaffId);
    if (!marker) {
      return;
    }
    const point = toPoint(marker.latitude, marker.longitude);
    // Screen-space test rather than `view.extent.contains(point)`: the marker is
    // WGS84 while the view's extent is Web Mercator, and comparing across
    // spatial references is exactly the kind of check that silently returns
    // false. `toScreen` does the projection for us.
    const screenPoint = view.toScreen(point);
    const isOnScreen =
      screenPoint &&
      screenPoint.x >= 0 && screenPoint.x <= view.width &&
      screenPoint.y >= 0 && screenPoint.y <= view.height;
    if (isOnScreen) {
      return;
    }
    view.goTo({ target: point }).catch(() => {
      /* goTo rejects when interrupted by a newer navigation - safe to ignore */
    });
  }, [isReady, selectedStaffId, staff, viewRef, visible]);

  // A marker is clickable, so it has to look clickable. The same hit-test the
  // click path uses answers "is the pointer over staff" - reusing it keeps one
  // definition of what counts as a hit, and leaves ArcgisAddressMap generic.
  useEffect(() => {
    const view = viewRef.current;
    if (!isReady || !view || !visible) {
      return;
    }

    const setCursor = (cursor: string) => {
      if (view.container) {
        view.container.style.cursor = cursor;
      }
    };

    // hitTest is async and pointer-move fires far faster than it resolves, so
    // one outstanding test at a time is the throttle: dropped moves are covered
    // by the next event, and the pointer cannot get ahead of its own cursor.
    let isTesting = false;
    // `unknown` rather than an Esri event type: it goes straight into
    // hitTestStaff, which hands it to hitTest and reads nothing off it.
    const handle = view.on("pointer-move", (event: unknown) => {
      if (isTesting) {
        return;
      }
      isTesting = true;
      hitTestStaff(event)
        .then((hit) => setCursor(hit ? "pointer" : ""))
        .finally(() => {
          isTesting = false;
        });
    });

    return () => {
      handle.remove();
      // Back to Esri's own cursor CSS - it owns grab/grabbing while panning.
      setCursor("");
    };
  }, [isReady, viewRef, visible, hitTestStaff]);

  return { resolveStaffClick };
}
