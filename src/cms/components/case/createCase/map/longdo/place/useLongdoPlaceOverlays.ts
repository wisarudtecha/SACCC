// Keeps the Place overlays in sync with a PlaceMarker[], on a Longdo map. The
// counterpart of useArcgisPlaceLayer, and a stripped-down useLongdoStaffOverlays:
// Places do not cluster, carry no telemetry, and have no group markers, so there
// is no zoom dependency, no grouping pass, and no zoom-to-separate click logic.
//
// It keeps the two rules that matter: overlays are added to the EXISTING map,
// and updates diff rather than clear-and-redraw - each overlay carries a
// SIGNATURE of what its drawing depends on, and only the ones whose signature
// changed are replaced, so a data refresh does not flicker the layer.
//
// Clicks use the same resolver-slot pattern as the staff layer: this hook fills
// `resolverRef.current` while it is live and clears it on unmount, and
// LongdoAddressMap's `overlayClick` handler consults it. Selecting a Place is
// informational only (Q1) - the resolver just reports which marker was hit.
import { useCallback, useEffect, useRef } from "react";
import type { LongdoGlobal, LongdoMap, LongdoOverlay } from "../longdoApi";
import type { PlaceMarker } from "../../place/placeTypes";
import { createPlaceMarkerOptions } from "./longdoPlaceMarkers";

/** `null` = not one of ours (treat as a map click); a `PlaceMarker` = this Place was hit. */
export type PlaceOverlayClickResolver = (overlay: LongdoOverlay) => PlaceMarker | null;

interface UseLongdoPlaceOverlaysOptions {
  longdoRef: React.MutableRefObject<LongdoGlobal | null>;
  mapRef: React.MutableRefObject<LongdoMap | null>;
  isReady: boolean;
  places: readonly PlaceMarker[];
  selectedPlaceId: string | null;
  visible: boolean;
  /** The map's Place-click resolver slot; filled while this layer is live. */
  resolverRef: React.MutableRefObject<PlaceOverlayClickResolver | null>;
}

interface TrackedOverlay {
  overlay: LongdoOverlay;
  signature: string;
}

/** Coordinates rounded to ~1m, so float noise alone does not redraw a marker. */
function roundCoord(value: number): number {
  return Number(value.toFixed(5));
}

export function useLongdoPlaceOverlays({
  longdoRef,
  mapRef,
  isReady,
  places,
  selectedPlaceId,
  visible,
  resolverRef
}: UseLongdoPlaceOverlaysOptions): void {
  const trackedRef = useRef<Map<string, TrackedOverlay>>(new Map());
  // Overlay -> the marker it stands for, keyed by the overlay object itself,
  // which is exactly what `overlayClick` hands back.
  const targetsRef = useRef<Map<LongdoOverlay, PlaceMarker>>(new Map());

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
    };

    if (!visible) {
      dropAll();
      return;
    }

    const desired = new Map<string, { signature: string; build: () => LongdoOverlay; marker: PlaceMarker }>();

    places.forEach((marker) => {
      const isSelected = marker.id === selectedPlaceId;
      desired.set(marker.id, {
        signature: [
          roundCoord(marker.latitude),
          roundCoord(marker.longitude),
          marker.category,
          isSelected ? "sel" : ""
        ].join(":"),
        marker,
        build: () =>
          new longdo.Marker(
            { lon: marker.longitude, lat: marker.latitude },
            {
              ...createPlaceMarkerOptions({ category: marker.category, isSelected }, marker.name),
              weight: longdo.OverlayWeight.Top
            }
          )
      });
    });

    // Remove what is gone or changed; leave the rest untouched.
    tracked.forEach((entry, id) => {
      const next = desired.get(id);
      if (next && next.signature === entry.signature) {
        return;
      }
      map.Overlays.remove(entry.overlay);
      targets.delete(entry.overlay);
      tracked.delete(id);
    });

    desired.forEach((spec, id) => {
      if (tracked.has(id)) {
        return;
      }
      const overlay = spec.build();
      map.Overlays.add(overlay);
      tracked.set(id, { overlay, signature: spec.signature });
      targets.set(overlay, spec.marker);
    });
  }, [longdoRef, mapRef, isReady, places, selectedPlaceId, visible]);

  const resolveOverlayClick = useCallback<PlaceOverlayClickResolver>(
    (overlay) => targetsRef.current.get(overlay) ?? null,
    []
  );

  // Publish the resolver only while this layer is live.
  useEffect(() => {
    resolverRef.current = resolveOverlayClick;
    return () => {
      resolverRef.current = null;
    };
  }, [resolverRef, resolveOverlayClick]);

  // Drop every overlay when this hook goes away. The ref is read IN the cleanup
  // because the map is built asynchronously and is still null when this runs.
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
