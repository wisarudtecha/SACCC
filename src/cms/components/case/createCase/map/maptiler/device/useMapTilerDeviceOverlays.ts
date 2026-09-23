// Keeps the Device overlays in sync with a DeviceMarker[], on a MapTiler map.
// The counterpart of useArcgisDeviceLayer, and a near-copy of
// useMapTilerPlaceOverlays: Devices that overlap on screen are drawn as ONE
// circle carrying a count, same rules as staff/Place clustering - the
// grouping is screen-space, so it re-syncs on `moveend` too.
//
// MapLibre `Marker`s are DOM elements, so a click on one is a plain element
// event handled inline - no async hitTest (ArcGIS) and no overlay-click
// resolver (Longdo) - and DOM markers survive `setStyle`, so this hook needs
// no `styleEpoch` dependency. Updates still diff by SIGNATURE: a marker whose
// appearance changed is replaced, not mutated, so a data refresh does not
// flicker the layer.
//
// A Device hit calls `onSelect` with a selection; the caller opens the info
// popup and the case write ("link") happens only from that popup's button (Q2).
//
// `DeviceMarker.category` can be null (unrecognised `deviceType`); such a
// marker is skipped so createDeviceMarkerVisual only ever gets a real category.
import { useCallback, useEffect, useRef, useState } from "react";
import { Marker, type Map as MlMap } from "maplibre-gl";
import {
  getSeparationZoom,
  groupDevicesByProximity,
  DEVICE_CLUSTER_RADIUS_PX,
  type DeviceGroup,
  type DeviceGrouping,
  type ScreenPoint
} from "../../device/deviceClusters";
import type { DeviceMarker, DeviceSelection } from "../../device/deviceTypes";
import { createDeviceGroupMarkerVisual, createDeviceMarkerVisual } from "./maptilerDeviceMarkers";

/** MapLibre's default zoom ceiling, used for "would zooming separate this?". */
const FALLBACK_MAX_ZOOM = 20;

const deviceKey = (id: string) => `device:${id}`;
const groupKey = (groupId: string) => `group:${groupId}`;

/** Coordinates rounded to ~1m, so float noise alone does not redraw a marker. */
function roundCoord(value: number): number {
  return Number(value.toFixed(5));
}

type DeviceTarget = { type: "device"; deviceId: string } | { type: "group"; groupId: string };

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
  /** The view's settled zoom - the grouping is recomputed when it changes. */
  zoom: number;
  onSelect?: (selection: DeviceSelection | null) => void;
}

export function useMapTilerDeviceOverlays({
  mapRef,
  isReady,
  devices,
  selectedDeviceId,
  visible,
  zoom,
  onSelect
}: UseMapTilerDeviceOverlaysOptions): void {
  const markersRef = useRef<Map<string, TrackedMarker>>(new Map());
  const groupingRef = useRef<DeviceGrouping>({ singles: [], groups: [] });
  const [syncTick, setSyncTick] = useState(0);

  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  const resolveClick = useCallback(
    (target: DeviceTarget) => {
      if (target.type === "device") {
        onSelectRef.current?.({ type: "device", deviceId: target.deviceId });
        return;
      }
      const group: DeviceGroup | undefined = groupingRef.current.groups.find(
        (candidate) => candidate.id === target.groupId
      );
      if (!group) {
        return;
      }
      const map = mapRef.current;
      const separationZoom = map
        ? getSeparationZoom(group, map.getZoom(), FALLBACK_MAX_ZOOM, DEVICE_CLUSTER_RADIUS_PX)
        : null;
      if (map && separationZoom !== null) {
        map.easeTo({ center: [group.longitude, group.latitude], zoom: separationZoom });
        return;
      }
      onSelectRef.current?.({ type: "group", deviceIds: group.deviceIds });
    },
    [mapRef]
  );
  const resolveClickRef = useRef(resolveClick);
  resolveClickRef.current = resolveClick;

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

    const categorised = devices.filter(
      (marker): marker is DeviceMarker & { category: NonNullable<DeviceMarker["category"]> } =>
        marker.category !== null
    );

    const toScreen = (marker: DeviceMarker): ScreenPoint | null => {
      const point = map.project([marker.longitude, marker.latitude]);
      return Number.isFinite(point.x) && Number.isFinite(point.y)
        ? { x: point.x, y: point.y }
        : null;
    };

    const grouping = groupDevicesByProximity(categorised, toScreen, DEVICE_CLUSTER_RADIUS_PX);
    groupingRef.current = grouping;

    interface Spec {
      signature: string;
      lngLat: [number, number];
      visual: { html: string; anchor: "center" | "bottom" };
      target: DeviceTarget;
    }
    const desired = new Map<string, Spec>();

    grouping.singles.forEach((marker) => {
      if (marker.category === null) {
        return;
      }
      const isSelected = marker.deviceId === selectedDeviceId;
      desired.set(deviceKey(marker.deviceId), {
        signature: [
          roundCoord(marker.latitude),
          roundCoord(marker.longitude),
          marker.category,
          isSelected ? "sel" : ""
        ].join(":"),
        lngLat: [marker.longitude, marker.latitude],
        visual: createDeviceMarkerVisual({ category: marker.category, isSelected }, marker.deviceType),
        target: { type: "device", deviceId: marker.deviceId }
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
        lngLat: [group.longitude, group.latitude],
        visual: createDeviceGroupMarkerVisual(count, isSelected),
        target: { type: "group", groupId: group.id }
      });
    });

    markers.forEach((entry, key) => {
      const next = desired.get(key);
      if (next && next.signature === entry.signature) {
        return;
      }
      entry.marker.remove();
      markers.delete(key);
    });

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
  }, [mapRef, isReady, devices, selectedDeviceId, visible, zoom, syncTick]);
}
