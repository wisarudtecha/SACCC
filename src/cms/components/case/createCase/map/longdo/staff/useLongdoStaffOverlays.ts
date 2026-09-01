// Keeps the staff overlays in sync with a StaffMarker[], on a Longdo map. The
// counterpart of useStaffGraphicsLayer, and it keeps that hook's three rules:
// overlays are added to the EXISTING map, updates diff rather than clear-and-
// redraw, and officers who overlap on screen are drawn as ONE circle with a
// count.
//
// Two things are genuinely simpler here, and one is harder.
//
// SIMPLER - clicks. Longdo reports `overlayClick` with the overlay that was hit,
// so resolving a click is a synchronous map lookup. ArcGIS has to hitTest, which
// is async, which is why its click handler must await the staff layer BEFORE
// deciding to reverse-geocode. Here there is no ordering problem to have.
//
// SIMPLER - selection. An SVG icon is a drawing, so halo, chevron and figure are
// one overlay (see longdoStaffMarkers.ts) instead of three stacked graphics.
//
// HARDER - updating. Overlay options are fixed at construction, so a marker
// whose appearance changed cannot be reassigned; it has to be replaced. Doing
// that indiscriminately would rebuild every marker on every position poll and
// flicker exactly the way removeAll() + re-add does on the ArcGIS side. So each
// overlay carries a SIGNATURE of everything its drawing depends on, and only the
// ones whose signature actually changed are replaced.
import { useCallback, useEffect, useRef } from "react";
import {
  getSeparationZoom,
  groupStaffByProximity,
  STAFF_CLUSTER_RADIUS_PX,
  type ScreenPoint,
  type StaffGroup,
  type StaffGrouping
} from "../../staff/staffClusters";
import { getStaffAvailability } from "../../staff/staffSymbols";
import { getTravelBearing } from "../../staff/staffTelemetry";
import { isStaleLocation, type StaffMarker, type StaffSelection } from "../../staff/staffTypes";
import type { LongdoGlobal, LongdoMap, LongdoOverlay } from "../longdoApi";
import { toWorldPixel } from "../longdoGeometry";
import { createStaffGroupMarkerOptions, createStaffMarkerOptions } from "./longdoStaffMarkers";

/**
 * What clicking an overlay meant.
 *
 * `null` from the resolver means "not one of ours" - the map then treats the
 * click as the map click the SDK swallowed. A RESULT with a null `selection`
 * means "ours, and handled" (a group we zoomed into), which must NOT fall
 * through to a reverse geocode.
 */
export interface StaffOverlayClickOutcome {
  selection: StaffSelection | null;
}

export type StaffOverlayClickResolver = (
  overlay: LongdoOverlay
) => StaffOverlayClickOutcome | null;

interface UseLongdoStaffOverlaysOptions {
  longdoRef: React.MutableRefObject<LongdoGlobal | null>;
  mapRef: React.MutableRefObject<LongdoMap | null>;
  isReady: boolean;
  staff: readonly StaffMarker[];
  selectedStaffId: string | null;
  visible: boolean;
  /** The view's settled zoom - the grouping is computed at this scale. */
  zoom: number;
  /**
   * The map's click resolver slot. This hook fills it while the layer is live
   * and clears it when the layer goes away, so a map with no staff overlay
   * treats every overlay click as a map click.
   */
  resolverRef: React.MutableRefObject<StaffOverlayClickResolver | null>;
}

/** What an overlay on this layer stands for. */
type StaffOverlayTarget =
  | { type: "staff"; unitId: string }
  | { type: "group"; groupId: string };

interface TrackedOverlay {
  overlay: LongdoOverlay;
  signature: string;
  target: StaffOverlayTarget;
}

/**
 * Longdo's own zoom ceiling, used when the SDK does not report one.
 *
 * Only ever an input to "would zooming separate this cluster?" - too low and a
 * separable group opens a picker instead of zooming, which is a worse answer but
 * never a wrong one.
 */
const FALLBACK_MAX_ZOOM = 20;

/** Keys are namespaced so one map can hold both kinds. */
const unitKey = (unitId: string) => `unit:${unitId}`;
const groupKey = (groupId: string) => `group:${groupId}`;

/** Coordinates rounded to ~1m, so GPS jitter alone does not redraw a marker. */
function roundCoord(value: number): number {
  return Number(value.toFixed(5));
}

export function useLongdoStaffOverlays({
  longdoRef,
  mapRef,
  isReady,
  staff,
  selectedStaffId,
  visible,
  zoom,
  resolverRef
}: UseLongdoStaffOverlaysOptions): void {
  const trackedRef = useRef<Map<string, TrackedOverlay>>(new Map());
  // Overlay -> what it stands for, for the click resolver. Keyed by the overlay
  // object itself, which is exactly what `overlayClick` hands back.
  const targetsRef = useRef<Map<LongdoOverlay, StaffOverlayTarget>>(new Map());
  // The grouping currently drawn, so a click on a group circle can be traced to
  // its members without recomputing it.
  const groupingRef = useRef<StaffGrouping>({ singles: [], groups: [] });

  // Draw. Runs whenever the data, the selection, the visibility or the zoom
  // changes - the last because the grouping is computed in screen space, so
  // zooming regroups people who have not moved.
  useEffect(() => {
    const longdo = longdoRef.current;
    const map = mapRef.current;
    if (!isReady || !longdo || !map) {
      return;
    }

    const tracked = trackedRef.current;
    const targets = targetsRef.current;

    const dropAll = () => {
      tracked.forEach((entry) => map.Overlays.remove(entry.overlay));
      tracked.clear();
      targets.clear();
      groupingRef.current = { singles: [], groups: [] };
    };

    if (!visible) {
      dropAll();
      return;
    }

    const nowMs = Date.now();

    // World pixels at the current zoom. Only DISTANCES matter to the grouping,
    // and those are identical in world space and screen space - so this needs
    // neither the map's centre nor its size, and stays correct mid-pan.
    const toScreen = (marker: StaffMarker): ScreenPoint | null =>
      toWorldPixel({ lon: marker.longitude, lat: marker.latitude }, zoom);

    const grouping = groupStaffByProximity(staff, toScreen, STAFF_CLUSTER_RADIUS_PX);
    groupingRef.current = grouping;

    // Everything that should be on the map after this pass. Anything else - an
    // officer who left the list, or a group that has just dissolved - goes.
    const desired = new Map<string, { signature: string; build: () => LongdoOverlay; target: StaffOverlayTarget }>();

    grouping.singles.forEach((marker) => {
      const isSelected = marker.unitId === selectedStaffId;
      const isStale = isStaleLocation(marker, nowMs);
      // Three things have to hold before a heading arrow is honest, and only one
      // is about the data being present: the officer is drawn individually (a
      // group circle covers people going different ways), they are actually
      // moving rather than parked facing somewhere (getTravelBearing), and the
      // fix is recent, because an arrow is a claim about NOW.
      const bearing = isSelected && !isStale ? getTravelBearing(marker) : null;
      const availability = getStaffAvailability(marker.statusId, marker.isLogin);

      desired.set(unitKey(marker.unitId), {
        signature: [
          roundCoord(marker.latitude),
          roundCoord(marker.longitude),
          availability,
          isSelected ? "sel" : "",
          isStale ? "stale" : "",
          marker.isLogin ? "in" : "out",
          bearing === null ? "" : Math.round(bearing)
        ].join(":"),
        target: { type: "staff", unitId: marker.unitId },
        build: () =>
          new longdo.Marker(
            { lon: marker.longitude, lat: marker.latitude },
            {
              ...createStaffMarkerOptions(
                { availability, isSelected, isStale, isLogin: marker.isLogin, bearing },
                marker.unitName
              ),
              weight: longdo.OverlayWeight.Top
            }
          )
      });
    });

    grouping.groups.forEach((group) => {
      // The selection follows an officer INTO a group: losing the halo the
      // moment someone parks next to them would read as losing the selection.
      const isSelected = Boolean(selectedStaffId && group.unitIds.includes(selectedStaffId));
      const count = group.unitIds.length;

      desired.set(groupKey(group.id), {
        signature: [
          roundCoord(group.latitude),
          roundCoord(group.longitude),
          group.availability,
          count,
          isSelected ? "sel" : ""
        ].join(":"),
        target: { type: "group", groupId: group.id },
        build: () =>
          new longdo.Marker(
            { lon: group.longitude, lat: group.latitude },
            {
              ...createStaffGroupMarkerOptions(
                group.availability,
                count,
                isSelected,
                ""
              ),
              weight: longdo.OverlayWeight.Top
            }
          )
      });
    });

    // Remove what is gone or has changed appearance; leave the rest untouched -
    // that is what keeps a position refresh from flickering the whole layer.
    tracked.forEach((entry, key) => {
      const next = desired.get(key);
      if (next && next.signature === entry.signature) {
        return;
      }
      map.Overlays.remove(entry.overlay);
      targets.delete(entry.overlay);
      tracked.delete(key);
    });

    desired.forEach((spec, key) => {
      if (tracked.has(key)) {
        return;
      }
      const overlay = spec.build();
      map.Overlays.add(overlay);
      tracked.set(key, { overlay, signature: spec.signature, target: spec.target });
      targets.set(overlay, spec.target);
    });
  }, [longdoRef, mapRef, isReady, staff, selectedStaffId, visible, zoom]);

  /**
   * Resolve a click on one of this layer's overlays.
   *
   * Zoom is the natural way out of a crowd, so take it when it would actually
   * work. It cannot when the members report identical coordinates, or when the
   * zoom needed is past what the map offers - and those are exactly the cases
   * where a picker is the only way to reach the person underneath.
   */
  const resolveOverlayClick = useCallback<StaffOverlayClickResolver>(
    (overlay) => {
      const target = targetsRef.current.get(overlay);
      if (!target) {
        return null;
      }
      if (target.type === "staff") {
        return { selection: { type: "staff", unitId: target.unitId } };
      }

      const group: StaffGroup | undefined = groupingRef.current.groups.find(
        (candidate) => candidate.id === target.groupId
      );
      if (!group) {
        return { selection: null };
      }

      const map = mapRef.current;
      const separationZoom = map
        ? getSeparationZoom(group, map.zoom(), FALLBACK_MAX_ZOOM, STAFF_CLUSTER_RADIUS_PX)
        : null;

      if (map && separationZoom !== null) {
        map.location({ lon: group.longitude, lat: group.latitude }, true);
        map.zoom(separationZoom, true);
        // Ours and handled: the settle that follows redraws the members
        // individually. Returning a null selection rather than null keeps the
        // click from falling through to a reverse geocode.
        return { selection: null };
      }

      return { selection: { type: "group", unitIds: group.unitIds } };
    },
    [mapRef]
  );

  // Publish the resolver only while this layer is live.
  useEffect(() => {
    resolverRef.current = resolveOverlayClick;
    return () => {
      resolverRef.current = null;
    };
  }, [resolverRef, resolveOverlayClick]);

  // Bring the selected officer into view, but only when they are off-screen -
  // recentring on a marker the operator just clicked is disorienting.
  useEffect(() => {
    const map = mapRef.current;
    if (!isReady || !map || !visible || !selectedStaffId) {
      return;
    }
    const marker = staff.find((item) => item.unitId === selectedStaffId);
    if (!marker) {
      return;
    }
    const bound = map.bound();
    if (!bound) {
      return;
    }
    const isOnScreen =
      marker.longitude >= bound.minLon &&
      marker.longitude <= bound.maxLon &&
      marker.latitude >= bound.minLat &&
      marker.latitude <= bound.maxLat;
    if (isOnScreen) {
      return;
    }
    map.location({ lon: marker.longitude, lat: marker.latitude }, true);
  }, [isReady, mapRef, selectedStaffId, staff, visible]);

  // Drop every overlay when this hook goes away. Explicit, for the same reason
  // the boundary hook is: overlays created here are removed here. The ref is
  // read IN the cleanup because the map is built asynchronously and would still
  // be null when this effect first runs.
  useEffect(() => {
    const tracked = trackedRef.current;
    const targets = targetsRef.current;
    return () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      const map = mapRef.current;
      tracked.forEach((entry) => map?.Overlays.remove(entry.overlay));
      tracked.clear();
      targets.clear();
    };
  }, [mapRef]);
}
