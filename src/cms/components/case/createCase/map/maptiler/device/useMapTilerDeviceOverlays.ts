// Keeps the Device overlays in sync with a DeviceMarker[], on a MapTiler map. The
// counterpart of useArcgisDeviceLayer, and a near-copy of useMapTilerPlaceOverlays.
//
// MapLibre `Marker`s are DOM elements, so a click on one is a plain element
// event handled inline - no async hitTest (ArcGIS) and no overlay-click resolver
// (Longdo) - and DOM markers survive `setStyle`, so this hook needs no
// `styleEpoch` dependency. Updates still diff by SIGNATURE: a marker whose
// appearance changed is replaced, not mutated, so a data refresh does not
// flicker the layer.
//
// A Device hit calls `onSelect` with the marker; the caller opens the info popup
// and the case write ("link") happens only from that popup's button (Q2).
//
// `DeviceMarker.category` can be null (unrecognised `deviceType`); such a marker
// is skipped so createDeviceMarkerVisual only ever gets a real category.
import { useCallback, useEffect, useRef } from "react";
import { Marker, type Map as MlMap } from "maplibre-gl";
import type { DeviceMarker } from "../../device/deviceTypes";
import { createDeviceMarkerVisual } from "./maptilerDeviceMarkers";

interface TrackedMarker {
  marker: Marker;
  signature: string;
}

interface UseMapTilerDeviceOverlaysOptions {
  mapRef: React.MutableRefObject<MlMap | null>;
  isReady: boolean;
  devices: readonly DeviceMarker[];
  selectedDeviceId: string | null;
  visible: boolean;
  onSelect?: (device: DeviceMarker | null) => void;
}

/** Coordinates rounded to ~1m, so float noise alone does not redraw a marker. */
function roundCoord(value: number): number {
  return Number(value.toFixed(5));
}

export function useMapTilerDeviceOverlays({
  mapRef,
  isReady,
  devices,
  selectedDeviceId,
  visible,
  onSelect
}: UseMapTilerDeviceOverlaysOptions): void {
  const markersRef = useRef<Map<string, TrackedMarker>>(new Map());
  // Mirrors of the data the click listener reads - the listener is bound once at
  // marker creation and must see current values.
  const devicesRef = useRef(devices);
  const onSelectRef = useRef(onSelect);
  devicesRef.current = devices;
  onSelectRef.current = onSelect;

  const resolveClick = useCallback((deviceId: string) => {
    onSelectRef.current?.(devicesRef.current.find((marker) => marker.deviceId === deviceId) ?? null);
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

    devices.forEach((marker) => {
      if (marker.category === null) {
        return;
      }
      const isSelected = marker.deviceId === selectedDeviceId;
      const visual = createDeviceMarkerVisual({ category: marker.category, isSelected }, marker.deviceType);
      desired.set(marker.deviceId, {
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
  }, [mapRef, isReady, devices, selectedDeviceId, visible]);
}
