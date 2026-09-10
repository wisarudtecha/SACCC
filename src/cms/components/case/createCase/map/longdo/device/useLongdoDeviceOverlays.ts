// Keeps the Device overlays in sync with a DeviceMarker[], on a Longdo map. The
// counterpart of useArcgisDeviceLayer, and a near-copy of useLongdoPlaceOverlays.
//
// It keeps the two rules that matter: overlays are added to the EXISTING map,
// and updates diff rather than clear-and-redraw - each overlay carries a
// SIGNATURE of what its drawing depends on, and only the ones whose signature
// changed are replaced, so a data refresh does not flicker the layer.
//
// Clicks use the same resolver-slot pattern as the Place / staff layers: this
// hook fills `resolverRef.current` while it is live and clears it on unmount, and
// LongdoAddressMap's `overlayClick` handler consults it. A Device hit reports the
// marker; the caller opens the info popup and the case write ("link") happens
// only from that popup's button (stakeholder decision Q2).
//
// `DeviceMarker.category` can be null (unrecognised `deviceType`); such a marker
// is skipped here so createDeviceMarkerOptions only ever gets a real category.
import { useCallback, useEffect, useRef } from "react";
import type { LongdoGlobal, LongdoMap, LongdoOverlay } from "../longdoApi";
import type { DeviceMarker } from "../../device/deviceTypes";
import { createDeviceMarkerOptions } from "./longdoDeviceMarkers";

/** `null` = not one of ours (treat as a map click); a `DeviceMarker` = this Device was hit. */
export type DeviceOverlayClickResolver = (overlay: LongdoOverlay) => DeviceMarker | null;

interface UseLongdoDeviceOverlaysOptions {
  longdoRef: React.MutableRefObject<LongdoGlobal | null>;
  mapRef: React.MutableRefObject<LongdoMap | null>;
  isReady: boolean;
  devices: readonly DeviceMarker[];
  selectedDeviceId: string | null;
  visible: boolean;
  /** The map's Device-click resolver slot; filled while this layer is live. */
  resolverRef: React.MutableRefObject<DeviceOverlayClickResolver | null>;
}

interface TrackedOverlay {
  overlay: LongdoOverlay;
  signature: string;
}

/** Coordinates rounded to ~1m, so float noise alone does not redraw a marker. */
function roundCoord(value: number): number {
  return Number(value.toFixed(5));
}

export function useLongdoDeviceOverlays({
  longdoRef,
  mapRef,
  isReady,
  devices,
  selectedDeviceId,
  visible,
  resolverRef
}: UseLongdoDeviceOverlaysOptions): void {
  const trackedRef = useRef<Map<string, TrackedOverlay>>(new Map());
  // Overlay -> the marker it stands for, keyed by the overlay object itself,
  // which is exactly what `overlayClick` hands back.
  const targetsRef = useRef<Map<LongdoOverlay, DeviceMarker>>(new Map());

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

    const desired = new Map<string, { signature: string; build: () => LongdoOverlay; marker: DeviceMarker }>();

    devices.forEach((marker) => {
      if (marker.category === null) {
        return;
      }
      const category = marker.category;
      const isSelected = marker.deviceId === selectedDeviceId;
      desired.set(marker.deviceId, {
        signature: [
          roundCoord(marker.latitude),
          roundCoord(marker.longitude),
          category,
          isSelected ? "sel" : ""
        ].join(":"),
        marker,
        build: () =>
          new longdo.Marker(
            { lon: marker.longitude, lat: marker.latitude },
            {
              ...createDeviceMarkerOptions({ category, isSelected }, marker.deviceType),
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
  }, [longdoRef, mapRef, isReady, devices, selectedDeviceId, visible]);

  const resolveOverlayClick = useCallback<DeviceOverlayClickResolver>(
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
