// Keeps the Device overlays in sync with a DeviceMarker[], on a Longdo map. The
// counterpart of useArcgisDeviceLayer, and a near-copy of useLongdoPlaceOverlays:
// Devices that overlap on screen are drawn as ONE circle carrying a count, same
// rules as staff/Place clustering.
//
// It keeps the two rules that matter: overlays are added to the EXISTING map,
// and updates diff rather than clear-and-redraw - each overlay carries a
// SIGNATURE of what its drawing depends on, and only the ones whose signature
// changed are replaced, so a data refresh does not flicker the layer.
//
// Clicks use the same resolver-slot pattern as the Place / staff layers: this
// hook fills `resolverRef.current` while it is live and clears it on unmount,
// and LongdoAddressMap's `overlayClick` handler consults it. A Device hit
// reports the marker; the caller opens the info popup and the case write
// ("link") happens only from that popup's button (stakeholder decision Q2).
//
// `DeviceMarker.category` can be null (unrecognised `deviceType`); such a
// marker is skipped here so createDeviceMarkerOptions only ever gets a real
// category.
import { useCallback, useEffect, useRef } from "react";
import {
  getSeparationZoom,
  groupDevicesByProximity,
  DEVICE_CLUSTER_RADIUS_PX,
  type DeviceGroup,
  type DeviceGrouping,
  type ScreenPoint
} from "../../device/deviceClusters";
import type { DeviceMarker, DeviceSelection } from "../../device/deviceTypes";
import type { LongdoGlobal, LongdoMap, LongdoOverlay } from "../longdoApi";
import { toWorldPixel } from "../longdoGeometry";
import { createDeviceGroupMarkerOptions, createDeviceMarkerOptions } from "./longdoDeviceMarkers";

/** Mirrors PlaceOverlayClickOutcome - see useLongdoPlaceOverlays.ts. */
export interface DeviceOverlayClickOutcome {
  selection: DeviceSelection | null;
}

export type DeviceOverlayClickResolver = (overlay: LongdoOverlay) => DeviceOverlayClickOutcome | null;

interface UseLongdoDeviceOverlaysOptions {
  longdoRef: React.MutableRefObject<LongdoGlobal | null>;
  mapRef: React.MutableRefObject<LongdoMap | null>;
  isReady: boolean;
  devices: readonly DeviceMarker[];
  selectedDeviceId: string | null;
  visible: boolean;
  /** The view's settled zoom - the grouping is computed at this scale. */
  zoom: number;
  /** The map's Device-click resolver slot; filled while this layer is live. */
  resolverRef: React.MutableRefObject<DeviceOverlayClickResolver | null>;
}

type DeviceOverlayTarget = { type: "device"; deviceId: string } | { type: "group"; groupId: string };

interface TrackedOverlay {
  overlay: LongdoOverlay;
  signature: string;
  target: DeviceOverlayTarget;
}

/** Longdo's own zoom ceiling, used when the SDK does not report one. */
const FALLBACK_MAX_ZOOM = 20;

const deviceKey = (id: string) => `device:${id}`;
const groupKey = (groupId: string) => `group:${groupId}`;

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
  zoom,
  resolverRef
}: UseLongdoDeviceOverlaysOptions): void {
  const trackedRef = useRef<Map<string, TrackedOverlay>>(new Map());
  const targetsRef = useRef<Map<LongdoOverlay, DeviceOverlayTarget>>(new Map());
  const groupingRef = useRef<DeviceGrouping>({ singles: [], groups: [] });

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

    const categorised = devices.filter(
      (marker): marker is DeviceMarker & { category: NonNullable<DeviceMarker["category"]> } =>
        marker.category !== null
    );

    const toScreen = (marker: DeviceMarker): ScreenPoint | null =>
      toWorldPixel({ lon: marker.longitude, lat: marker.latitude }, zoom);

    const grouping = groupDevicesByProximity(categorised, toScreen, DEVICE_CLUSTER_RADIUS_PX);
    groupingRef.current = grouping;

    const desired = new Map<
      string,
      { signature: string; build: () => LongdoOverlay; target: DeviceOverlayTarget }
    >();

    grouping.singles.forEach((marker) => {
      if (marker.category === null) {
        return;
      }
      const category = marker.category;
      const isSelected = marker.deviceId === selectedDeviceId;
      desired.set(deviceKey(marker.deviceId), {
        signature: [
          roundCoord(marker.latitude),
          roundCoord(marker.longitude),
          category,
          isSelected ? "sel" : ""
        ].join(":"),
        target: { type: "device", deviceId: marker.deviceId },
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

    grouping.groups.forEach((group) => {
      const isSelected = Boolean(selectedDeviceId && group.deviceIds.includes(selectedDeviceId));
      const count = group.deviceIds.length;
      desired.set(groupKey(group.id), {
        signature: [
          roundCoord(group.latitude),
          roundCoord(group.longitude),
          count,
          isSelected ? "sel" : ""
        ].join(":"),
        target: { type: "group", groupId: group.id },
        build: () =>
          new longdo.Marker(
            { lon: group.longitude, lat: group.latitude },
            {
              ...createDeviceGroupMarkerOptions(count, isSelected),
              weight: longdo.OverlayWeight.Top
            }
          )
      });
    });

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
  }, [longdoRef, mapRef, isReady, devices, selectedDeviceId, visible, zoom]);

  const resolveOverlayClick = useCallback<DeviceOverlayClickResolver>(
    (overlay) => {
      const target = targetsRef.current.get(overlay);
      if (!target) {
        return null;
      }
      if (target.type === "device") {
        return { selection: { type: "device", deviceId: target.deviceId } };
      }

      const group: DeviceGroup | undefined = groupingRef.current.groups.find(
        (candidate) => candidate.id === target.groupId
      );
      if (!group) {
        return { selection: null };
      }

      const map = mapRef.current;
      const separationZoom = map
        ? getSeparationZoom(group, map.zoom(), FALLBACK_MAX_ZOOM, DEVICE_CLUSTER_RADIUS_PX)
        : null;

      if (map && separationZoom !== null) {
        map.location({ lon: group.longitude, lat: group.latitude }, true);
        map.zoom(separationZoom, true);
        return { selection: null };
      }

      return { selection: { type: "group", deviceIds: group.deviceIds } };
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

  // Drop every overlay when this hook goes away. The ref is read IN the
  // cleanup because the map is built asynchronously and is still null when
  // this runs.
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
