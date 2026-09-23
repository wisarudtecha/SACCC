// Keeps an ArcGIS GraphicsLayer of Place markers in sync with a PlaceMarker[].
//
// Places that overlap on screen are drawn as ONE group circle carrying a
// count, same as the staff layer (see staffClusters.ts / useStaffGraphicsLayer
// for the pattern this mirrors). That grouping depends on the current zoom,
// not just on the data, so the sync also runs whenever the view settles.
//
// The same three rules staff/device follow apply: add the layer to the
// EXISTING map (never rebuild the view), diff graphics in place (no removeAll
// flicker), and resolve clicks through `resolvePlaceClick` which
// ArcgisAddressMap's own click handler awaits before it decides whether to
// reverse-geocode.
import { useCallback, useEffect, useRef } from "react";
import Graphic from "@arcgis/core/Graphic.js";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer.js";
import Point from "@arcgis/core/geometry/Point.js";
import * as reactiveUtils from "@arcgis/core/core/reactiveUtils.js";
import type esriMap from "@arcgis/core/Map.js";
import type MapView from "@arcgis/core/views/MapView.js";
import {
  getSeparationZoom,
  groupPlacesByProximity,
  PLACE_CLUSTER_RADIUS_PX,
  type PlaceGroup,
  type PlaceGrouping
} from "./placeClusters";
import {
  createPlaceGroupHaloSymbol,
  createPlaceGroupLabelSymbol,
  createPlaceGroupSymbol,
  createPlaceHaloSymbol,
  createPlaceSymbol
} from "./placeSymbols";
import type { PlaceMarker, PlaceSelection } from "./placeTypes";

/** Minimal shape of the hitTest results we read - see the note in ArcgisAddressMap. */
interface HitTestResultLike {
  type?: string;
  graphic?: Graphic;
}

interface HitTestResponseLike {
  results?: HitTestResultLike[];
}

/** The raw hit, before the click policy decides zoom-in vs. picker. */
export type PlaceHit = { type: "place"; id: string } | { type: "group"; group: PlaceGroup };

interface UseArcgisPlaceLayerOptions {
  mapRef: React.MutableRefObject<esriMap | null>;
  viewRef: React.MutableRefObject<MapView | null>;
  /** True once the MapView has resolved; refs are only safe to use after this. */
  isReady: boolean;
  places: readonly PlaceMarker[];
  selectedPlaceId: string | null;
  visible: boolean;
}

export interface UseArcgisPlaceLayerResult {
  /**
   * Resolves a click on the Place layer to a selection, or null. Stable
   * across renders, so the mount-time click handler can call it.
   */
  resolvePlaceClick: (event: unknown) => Promise<PlaceSelection | null>;
  /**
   * Pure hit-test: what is the pointer over - a Place marker, a group, or
   * nothing? No navigation, no selection. Used by ArcgisAddressMap's
   * centralized pointer-move cursor effect. Stable across renders.
   */
  hitTestPlace: (event: unknown) => Promise<PlaceHit | null>;
}

/** Graphic keys are namespaced so one Map can hold singles, groups and labels. */
const placeKey = (id: string) => `place:${id}`;
const groupKey = (groupId: string) => `group:${groupId}`;
const groupLabelKey = (groupId: string) => `label:${groupId}`;

function toPoint(latitude: number, longitude: number): Point {
  return new Point({ latitude, longitude });
}

export function useArcgisPlaceLayer({
  mapRef,
  viewRef,
  isReady,
  places,
  selectedPlaceId,
  visible
}: UseArcgisPlaceLayerOptions): UseArcgisPlaceLayerResult {
  const layerRef = useRef<GraphicsLayer | null>(null);
  const graphicsRef = useRef<Map<string, Graphic>>(new Map());
  const haloRef = useRef<Graphic | null>(null);
  // The grouping the layer currently shows, so a hit on a group circle can be
  // traced back to its members without recomputing.
  const groupingRef = useRef<PlaceGrouping>({ singles: [], groups: [] });

  // Read by both the sync effect and the click path, which runs outside
  // React's render cycle (view-settle).
  const placesRef = useRef(places);
  const selectedPlaceIdRef = useRef(selectedPlaceId);
  const visibleRef = useRef(visible);
  placesRef.current = places;
  selectedPlaceIdRef.current = selectedPlaceId;
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

    const markers = placesRef.current;
    const selectedId = selectedPlaceIdRef.current;
    const graphics = graphicsRef.current;

    const toScreen = (marker: PlaceMarker) => {
      const screenPoint = view.toScreen(toPoint(marker.latitude, marker.longitude));
      return screenPoint ? { x: screenPoint.x, y: screenPoint.y } : null;
    };

    const grouping = groupPlacesByProximity(markers, toScreen, PLACE_CLUSTER_RADIUS_PX);
    groupingRef.current = grouping;

    const liveKeys = new Set<string>();
    grouping.singles.forEach((marker) => liveKeys.add(placeKey(marker.id)));
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
      symbol:
        | ReturnType<typeof createPlaceSymbol>
        | ReturnType<typeof createPlaceGroupSymbol>
        | ReturnType<typeof createPlaceGroupLabelSymbol>,
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
        placeKey(marker.id),
        toPoint(marker.latitude, marker.longitude),
        createPlaceSymbol(marker.category, { isSelected: marker.id === selectedId }),
        { placeId: marker.id }
      );
    });

    grouping.groups.forEach((group) => {
      const geometry = toPoint(group.latitude, group.longitude);
      const count = group.placeIds.length;
      upsert(groupKey(group.id), geometry, createPlaceGroupSymbol(count), { groupId: group.id });
      // Same groupId, so clicking the number counts as clicking the group.
      upsert(groupLabelKey(group.id), geometry, createPlaceGroupLabelSymbol(count), {
        groupId: group.id
      });
    });

    // The selection halo, drawn beneath the markers so it reads as a spotlight
    // on the ground rather than a ring over the icon. Follows the selected
    // Place INTO a group, same reasoning as the staff layer.
    const selectedSingle = grouping.singles.find((marker) => marker.id === selectedId);
    const selectedGroup = selectedId
      ? grouping.groups.find((group) => group.placeIds.includes(selectedId))
      : undefined;

    if (!selectedSingle && !selectedGroup) {
      if (haloRef.current) {
        layer.remove(haloRef.current);
        haloRef.current = null;
      }
      return;
    }

    const haloGeometry = selectedSingle
      ? toPoint(selectedSingle.latitude, selectedSingle.longitude)
      : toPoint(selectedGroup!.latitude, selectedGroup!.longitude);
    const haloSymbol = selectedSingle
      ? createPlaceHaloSymbol(selectedSingle.category)
      : createPlaceGroupHaloSymbol(selectedGroup!.placeIds.length);
    const haloAttributes = selectedSingle
      ? { placeId: selectedSingle.id }
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
      // Index 0: the loops above append, so markers still sit on top.
      layer.graphics.add(halo, 0);
    }
  }, [viewRef]);

  // Create the layer once the map exists, tear it down with the map. Appended
  // (no map.reorder), so the interactive Place layer sits on top like staff.
  useEffect(() => {
    const map = mapRef.current;
    if (!isReady || !map) {
      return;
    }

    const layer = new GraphicsLayer({ id: "place-layer" });
    layerRef.current = layer;
    map.add(layer);

    const graphics = graphicsRef.current;

    return () => {
      map.remove(layer);
      layer.removeAll();
      layer.destroy();
      layerRef.current = null;
      graphics.clear();
      haloRef.current = null;
      groupingRef.current = { singles: [], groups: [] };
    };
  }, [isReady, mapRef]);

  // Data-driven redraws.
  useEffect(() => {
    if (!isReady) {
      return;
    }
    syncGraphics();
  }, [isReady, places, selectedPlaceId, visible, syncGraphics]);

  // View-driven redraws: the grouping is computed in screen space, so panning
  // or zooming changes it even when the data has not moved. Recomputing on
  // settle rather than per frame keeps panning free.
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

  const hitTestPlace = useCallback(async (event: unknown): Promise<PlaceHit | null> => {
    const view = viewRef.current;
    const layer = layerRef.current;
    if (!view || !layer || !layer.visible) {
      return null;
    }
    try {
      const response = (await view.hitTest(
        event as Parameters<MapView["hitTest"]>[0],
        { include: [layer] }
      )) as HitTestResponseLike;

      const results = response?.results?.filter((result) => result.type === "graphic") ?? [];

      // A single Place wins over a group, though the two never overlap: a
      // grouped Place is not drawn on its own.
      const placeHit = results.find((result) => result.graphic?.attributes?.placeId);
      const placeId = placeHit?.graphic?.attributes?.placeId;
      if (typeof placeId === "string") {
        return { type: "place", id: placeId };
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
      console.error("Failed to hit-test the place layer", error);
      return null;
    }
  }, [viewRef]);

  const resolvePlaceClick = useCallback(
    async (event: unknown): Promise<PlaceSelection | null> => {
      const hit = await hitTestPlace(event);
      if (!hit) {
        return null;
      }
      if (hit.type === "place") {
        return { type: "place", id: hit.id };
      }

      const view = viewRef.current;
      const separationZoom = view
        ? getSeparationZoom(
            hit.group,
            view.zoom,
            view.constraints?.effectiveMaxZoom ?? Number.POSITIVE_INFINITY,
            PLACE_CLUSTER_RADIUS_PX
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

      return { type: "group", placeIds: hit.group.placeIds };
    },
    [hitTestPlace, viewRef]
  );

  // No pointer-move cursor effect here: ArcgisAddressMap.tsx owns ONE
  // centralized listener that hit-tests staff/Place/Device in priority order
  // via hitTestPlace below, so cursor-setting never races across layers.

  return { resolvePlaceClick, hitTestPlace };
}
