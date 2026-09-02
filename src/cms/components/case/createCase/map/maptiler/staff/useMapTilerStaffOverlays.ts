// Keeps the staff overlays in sync with a StaffMarker[], on a MapTiler map. The
// counterpart of useStaffGraphicsLayer / useLongdoStaffOverlays, and it keeps
// their three rules: markers are added to the EXISTING map, updates diff rather
// than clear-and-redraw, and officers who overlap on screen are drawn as ONE
// circle with a count.
//
// Simpler than both in one respect: MapLibre `Marker`s are DOM elements, so a
// click on one is a plain element event - no async hitTest to await (ArcGIS) and
// no overlay-click recovery (Longdo) - and DOM markers are not part of the
// style, so a `setStyle` swap leaves them untouched and this hook needs no
// `styleEpoch` dependency.
//
// Harder in one respect, shared with the Longdo hook: a marker's element is
// fixed once created, so a marker whose appearance changed is replaced, not
// mutated. Each marker carries a SIGNATURE of everything its drawing depends on,
// and only the ones whose signature changed are rebuilt - so a position poll
// that moved nobody does not flicker the layer.
import { useCallback, useEffect, useRef, useState } from "react";
import { Marker, type Map as MlMap } from "maplibre-gl";
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
import {
  createStaffGroupMarkerVisual,
  createStaffMarkerVisual,
  type MarkerAnchor
} from "./maptilerStaffMarkers";

/** MapLibre's default zoom ceiling, used for "would zooming separate this?". */
const FALLBACK_MAX_ZOOM = 20;

const unitKey = (unitId: string) => `unit:${unitId}`;
const groupKey = (groupId: string) => `group:${groupId}`;

/** Coordinates rounded to ~1m, so GPS jitter alone does not redraw a marker. */
function roundCoord(value: number): number {
  return Number(value.toFixed(5));
}

type StaffTarget =
  | { type: "staff"; unitId: string }
  | { type: "group"; groupId: string };

interface TrackedMarker {
  marker: Marker;
  signature: string;
}

interface UseMapTilerStaffOverlaysOptions {
  mapRef: React.MutableRefObject<MlMap | null>;
  isReady: boolean;
  staff: readonly StaffMarker[];
  selectedStaffId: string | null;
  visible: boolean;
  /** The view's settled zoom - the grouping is recomputed when it changes. */
  zoom: number;
  onSelect?: (selection: StaffSelection | null) => void;
}

export function useMapTilerStaffOverlays({
  mapRef,
  isReady,
  staff,
  selectedStaffId,
  visible,
  zoom,
  onSelect
}: UseMapTilerStaffOverlaysOptions): void {
  const markersRef = useRef<Map<string, TrackedMarker>>(new Map());
  const groupingRef = useRef<StaffGrouping>({ singles: [], groups: [] });
  // Bumped on every settle, so the grouping (computed in screen space) follows
  // a pan or zoom even when nobody moved.
  const [syncTick, setSyncTick] = useState(0);

  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  /** Resolve a click on one of this layer's markers. Stored in a ref so the
   *  per-marker listener bound at creation always calls the current logic. */
  const resolveClick = useCallback(
    (target: StaffTarget) => {
      if (target.type === "staff") {
        onSelectRef.current?.({ type: "staff", unitId: target.unitId });
        return;
      }
      const group: StaffGroup | undefined = groupingRef.current.groups.find(
        (candidate) => candidate.id === target.groupId
      );
      if (!group) {
        return;
      }
      const map = mapRef.current;
      const separationZoom = map
        ? getSeparationZoom(group, map.getZoom(), FALLBACK_MAX_ZOOM, STAFF_CLUSTER_RADIUS_PX)
        : null;
      if (map && separationZoom !== null) {
        map.easeTo({ center: [group.longitude, group.latitude], zoom: separationZoom });
        // Zoomed in; the settle that follows redraws the members individually.
        return;
      }
      onSelectRef.current?.({ type: "group", unitIds: group.unitIds });
    },
    [mapRef]
  );
  const resolveClickRef = useRef(resolveClick);
  resolveClickRef.current = resolveClick;

  // Build-once: a settle listener that re-triggers the sync, and a teardown that
  // removes every marker.
  useEffect(() => {
    const map = mapRef.current;
    if (!isReady || !map) {
      return;
    }
    const bump = () => setSyncTick((tick) => tick + 1);
    map.on("moveend", bump);
    const markers = markersRef.current;
    return () => {
      map.off("moveend", bump);
      markers.forEach((entry) => entry.marker.remove());
      markers.clear();
      groupingRef.current = { singles: [], groups: [] };
    };
  }, [mapRef, isReady]);

  // Sync.
  useEffect(() => {
    const map = mapRef.current;
    if (!isReady || !map) {
      return;
    }
    const markers = markersRef.current;

    const dropAll = () => {
      markers.forEach((entry) => entry.marker.remove());
      markers.clear();
      groupingRef.current = { singles: [], groups: [] };
    };

    if (!visible) {
      dropAll();
      return;
    }

    const nowMs = Date.now();
    const toScreen = (marker: StaffMarker): ScreenPoint | null => {
      const point = map.project([marker.longitude, marker.latitude]);
      return Number.isFinite(point.x) && Number.isFinite(point.y)
        ? { x: point.x, y: point.y }
        : null;
    };

    const grouping = groupStaffByProximity(staff, toScreen, STAFF_CLUSTER_RADIUS_PX);
    groupingRef.current = grouping;

    interface Spec {
      signature: string;
      lngLat: [number, number];
      visual: { html: string; anchor: MarkerAnchor };
      target: StaffTarget;
    }
    const desired = new Map<string, Spec>();

    grouping.singles.forEach((marker) => {
      const isSelected = marker.unitId === selectedStaffId;
      const isStale = isStaleLocation(marker, nowMs);
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
        lngLat: [marker.longitude, marker.latitude],
        visual: createStaffMarkerVisual(
          { availability, isSelected, isStale, isLogin: marker.isLogin, bearing },
          marker.unitName
        ),
        target: { type: "staff", unitId: marker.unitId }
      });
    });

    grouping.groups.forEach((group) => {
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
        lngLat: [group.longitude, group.latitude],
        visual: createStaffGroupMarkerVisual(group.availability, count, isSelected, ""),
        target: { type: "group", groupId: group.id }
      });
    });

    // Remove what is gone or changed.
    markers.forEach((entry, key) => {
      const next = desired.get(key);
      if (next && next.signature === entry.signature) {
        return;
      }
      entry.marker.remove();
      markers.delete(key);
    });

    // Add what is new.
    desired.forEach((spec, key) => {
      if (markers.has(key)) {
        return;
      }
      const element = document.createElement("div");
      element.style.lineHeight = "0";
      element.innerHTML = spec.visual.html;
      element.addEventListener("click", (event) => {
        event.stopPropagation();
        resolveClickRef.current(spec.target);
      });
      const marker = new Marker({ element, anchor: spec.visual.anchor })
        .setLngLat(spec.lngLat)
        .addTo(map);
      markers.set(key, { marker, signature: spec.signature });
    });
  }, [mapRef, isReady, staff, selectedStaffId, visible, zoom, syncTick]);

  // Bring the selected officer into view, but only when off-screen.
  useEffect(() => {
    const map = mapRef.current;
    if (!isReady || !map || !visible || !selectedStaffId) {
      return;
    }
    const marker = staff.find((item) => item.unitId === selectedStaffId);
    if (!marker) {
      return;
    }
    if (map.getBounds().contains([marker.longitude, marker.latitude])) {
      return;
    }
    map.easeTo({ center: [marker.longitude, marker.latitude] });
  }, [mapRef, isReady, selectedStaffId, staff, visible]);
}
