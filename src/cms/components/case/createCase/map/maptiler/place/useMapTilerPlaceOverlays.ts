// Keeps the Place overlays in sync with a PlaceMarker[], on a MapTiler map. The
// counterpart of useArcgisPlaceLayer / useMapTilerStaffOverlays: Places that
// overlap on screen are drawn as ONE circle carrying a count, same rules as
// staff clustering - the grouping is screen-space, so it also re-syncs on
// `moveend`, not just on data changes.
//
// MapLibre `Marker`s are DOM elements, so a click on one is a plain element
// event handled inline - no async hitTest (ArcGIS) and no overlay-click
// resolver (Longdo) - and DOM markers survive `setStyle`, so this hook needs
// no `styleEpoch` dependency. Updates still diff by SIGNATURE: a marker whose
// appearance changed is replaced, not mutated, so a data refresh does not
// flicker the layer.
//
// Selecting a Place is informational only (Q1); `onSelect` drives the caller's
// info popup and nothing else.
import { useCallback, useEffect, useRef, useState } from "react";
import { Marker, type Map as MlMap } from "maplibre-gl";
import {
  getSeparationZoom,
  groupPlacesByProximity,
  PLACE_CLUSTER_RADIUS_PX,
  type PlaceGroup,
  type PlaceGrouping,
  type ScreenPoint
} from "../../place/placeClusters";
import type { PlaceMarker, PlaceSelection } from "../../place/placeTypes";
import { createPlaceGroupMarkerVisual, createPlaceMarkerVisual } from "./maptilerPlaceMarkers";

/** MapLibre's default zoom ceiling, used for "would zooming separate this?". */
const FALLBACK_MAX_ZOOM = 20;

const placeKey = (id: string) => `place:${id}`;
const groupKey = (groupId: string) => `group:${groupId}`;

/** Coordinates rounded to ~1m, so float noise alone does not redraw a marker. */
function roundCoord(value: number): number {
  return Number(value.toFixed(5));
}

type PlaceTarget = { type: "place"; id: string } | { type: "group"; groupId: string };

interface TrackedMarker {
  marker: Marker;
  signature: string;
}

interface UseMapTilerPlaceOverlaysOptions {
  mapRef: React.MutableRefObject<MlMap | null>;
  isReady: boolean;
  places: readonly PlaceMarker[];
  selectedPlaceId: string | null;
  visible: boolean;
  /** The view's settled zoom - the grouping is recomputed when it changes. */
  zoom: number;
  onSelect?: (selection: PlaceSelection | null) => void;
}

export function useMapTilerPlaceOverlays({
  mapRef,
  isReady,
  places,
  selectedPlaceId,
  visible,
  zoom,
  onSelect
}: UseMapTilerPlaceOverlaysOptions): void {
  const markersRef = useRef<Map<string, TrackedMarker>>(new Map());
  const groupingRef = useRef<PlaceGrouping>({ singles: [], groups: [] });
  // Bumped on every settle, so the grouping (computed in screen space) follows
  // a pan or zoom even when nobody moved.
  const [syncTick, setSyncTick] = useState(0);

  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  const resolveClick = useCallback(
    (target: PlaceTarget) => {
      if (target.type === "place") {
        onSelectRef.current?.({ type: "place", id: target.id });
        return;
      }
      const group: PlaceGroup | undefined = groupingRef.current.groups.find(
        (candidate) => candidate.id === target.groupId
      );
      if (!group) {
        return;
      }
      const map = mapRef.current;
      const separationZoom = map
        ? getSeparationZoom(group, map.getZoom(), FALLBACK_MAX_ZOOM, PLACE_CLUSTER_RADIUS_PX)
        : null;
      if (map && separationZoom !== null) {
        map.easeTo({ center: [group.longitude, group.latitude], zoom: separationZoom });
        return;
      }
      onSelectRef.current?.({ type: "group", placeIds: group.placeIds });
    },
    [mapRef]
  );
  const resolveClickRef = useRef(resolveClick);
  resolveClickRef.current = resolveClick;

  // Build-once: a settle listener that re-triggers the sync, and a teardown
  // that removes every marker.
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

    const toScreen = (marker: PlaceMarker): ScreenPoint | null => {
      const point = map.project([marker.longitude, marker.latitude]);
      return Number.isFinite(point.x) && Number.isFinite(point.y)
        ? { x: point.x, y: point.y }
        : null;
    };

    const grouping = groupPlacesByProximity(places, toScreen, PLACE_CLUSTER_RADIUS_PX);
    groupingRef.current = grouping;

    interface Spec {
      signature: string;
      lngLat: [number, number];
      visual: { html: string; anchor: "center" | "bottom" };
      target: PlaceTarget;
    }
    const desired = new Map<string, Spec>();

    grouping.singles.forEach((marker) => {
      const isSelected = marker.id === selectedPlaceId;
      desired.set(placeKey(marker.id), {
        signature: [
          roundCoord(marker.latitude),
          roundCoord(marker.longitude),
          marker.category,
          isSelected ? "sel" : ""
        ].join(":"),
        lngLat: [marker.longitude, marker.latitude],
        visual: createPlaceMarkerVisual({ category: marker.category, isSelected }, marker.name),
        target: { type: "place", id: marker.id }
      });
    });

    grouping.groups.forEach((group) => {
      const isSelected = Boolean(selectedPlaceId && group.placeIds.includes(selectedPlaceId));
      const count = group.placeIds.length;
      desired.set(groupKey(group.id), {
        signature: [
          roundCoord(group.latitude),
          roundCoord(group.longitude),
          count,
          isSelected ? "sel" : ""
        ].join(":"),
        lngLat: [group.longitude, group.latitude],
        visual: createPlaceGroupMarkerVisual(count, isSelected),
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
  }, [mapRef, isReady, places, selectedPlaceId, visible, zoom, syncTick]);
}
