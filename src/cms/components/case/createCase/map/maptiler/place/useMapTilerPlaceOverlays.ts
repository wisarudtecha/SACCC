// Keeps the Place overlays in sync with a PlaceMarker[], on a MapTiler map. The
// counterpart of useArcgisPlaceLayer, and a stripped-down useMapTilerStaffOverlays:
// Places do not cluster, so there is no `zoom` option, no `moveend` re-sync, and
// no group markers.
//
// MapLibre `Marker`s are DOM elements, so a click on one is a plain element
// event handled inline - no async hitTest (ArcGIS) and no overlay-click resolver
// (Longdo) - and DOM markers survive `setStyle`, so this hook needs no
// `styleEpoch` dependency. Updates still diff by SIGNATURE: a marker whose
// appearance changed is replaced, not mutated, so a data refresh does not
// flicker the layer.
//
// Selecting a Place is informational only (Q1); `onSelect` drives the caller's
// info popup and nothing else.
import { useCallback, useEffect, useRef } from "react";
import { Marker, type Map as MlMap } from "maplibre-gl";
import type { PlaceMarker } from "../../place/placeTypes";
import { createPlaceMarkerVisual } from "./maptilerPlaceMarkers";

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
  onSelect?: (place: PlaceMarker | null) => void;
}

/** Coordinates rounded to ~1m, so float noise alone does not redraw a marker. */
function roundCoord(value: number): number {
  return Number(value.toFixed(5));
}

export function useMapTilerPlaceOverlays({
  mapRef,
  isReady,
  places,
  selectedPlaceId,
  visible,
  onSelect
}: UseMapTilerPlaceOverlaysOptions): void {
  const markersRef = useRef<Map<string, TrackedMarker>>(new Map());
  // Mirrors of the data the click listener reads - the listener is bound once at
  // marker creation and must see current values.
  const placesRef = useRef(places);
  const onSelectRef = useRef(onSelect);
  placesRef.current = places;
  onSelectRef.current = onSelect;

  const resolveClick = useCallback((placeId: string) => {
    onSelectRef.current?.(placesRef.current.find((marker) => marker.id === placeId) ?? null);
  }, []);
  const resolveClickRef = useRef(resolveClick);
  resolveClickRef.current = resolveClick;

  // Build-once: its only job is the unmount teardown. The sync effect below
  // diffs, so it must NOT clear markers on every re-run.
  useEffect(() => {
    if (!isReady) {
      return;
    }
    const markers = markersRef.current;
    return () => {
      markers.forEach((entry) => entry.marker.remove());
      markers.clear();
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
    };

    if (!visible) {
      dropAll();
      return;
    }

    const desired = new Map<
      string,
      { signature: string; lngLat: [number, number]; html: string; anchor: "center" | "bottom" }
    >();

    places.forEach((marker) => {
      const isSelected = marker.id === selectedPlaceId;
      const visual = createPlaceMarkerVisual({ category: marker.category, isSelected }, marker.name);
      desired.set(marker.id, {
        signature: [
          roundCoord(marker.latitude),
          roundCoord(marker.longitude),
          marker.category,
          isSelected ? "sel" : ""
        ].join(":"),
        lngLat: [marker.longitude, marker.latitude],
        html: visual.html,
        anchor: visual.anchor
      });
    });

    // Remove what is gone or changed.
    markers.forEach((entry, id) => {
      const next = desired.get(id);
      if (next && next.signature === entry.signature) {
        return;
      }
      entry.marker.remove();
      markers.delete(id);
    });

    // Add what is new.
    desired.forEach((spec, id) => {
      if (markers.has(id)) {
        return;
      }
      const element = document.createElement("div");
      element.style.lineHeight = "0";
      element.innerHTML = spec.html;
      element.addEventListener("click", (event) => {
        event.stopPropagation();
        resolveClickRef.current(id);
      });
      const marker = new Marker({ element, anchor: spec.anchor })
        .setLngLat(spec.lngLat)
        .addTo(map);
      markers.set(id, { marker, signature: spec.signature });
    });
  }, [mapRef, isReady, places, selectedPlaceId, visible]);
}
