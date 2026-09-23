// Keeps an ArcGIS GraphicsLayer of Device markers in sync with a DeviceMarker[].
//
// Devices that overlap on screen are drawn as ONE group circle carrying a
// count, same as the staff/Place layers (see staffClusters.ts /
// useStaffGraphicsLayer for the pattern this mirrors). One extra guard kept
// from before: a DeviceMarker's `category` can be null (unrecognised
// `deviceType`); such a marker is skipped here so the symbol builders never
// get null. useDeviceLayer already filters them out, this is belt-and-braces
// for the type.
//
// The same rules staff/Place follow apply: add the layer to the EXISTING map
// (never rebuild the view), diff graphics in place (no removeAll flicker),
// and resolve clicks through `resolveDeviceClick` which ArcgisAddressMap's own
// click handler awaits. No hit-area workaround for the group circle - it is
// already large enough to hit reliably; only single markers need the
// oversized invisible target (the camera glyph's hollow lens).
import { useCallback, useEffect, useRef } from "react";
import Graphic from "@arcgis/core/Graphic.js";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer.js";
import Point from "@arcgis/core/geometry/Point.js";
import * as reactiveUtils from "@arcgis/core/core/reactiveUtils.js";
import type esriMap from "@arcgis/core/Map.js";
import type MapView from "@arcgis/core/views/MapView.js";
import {
  getSeparationZoom,
  groupDevicesByProximity,
  DEVICE_CLUSTER_RADIUS_PX,
  type DeviceGroup,
  type DeviceGrouping
} from "./deviceClusters";
import {
  createDeviceGroupHaloSymbol,
  createDeviceGroupLabelSymbol,
  createDeviceGroupSymbol,
  createDeviceHaloSymbol,
  createDeviceHitAreaSymbol,
  createDeviceSymbol
} from "./deviceSymbols";
import type { DeviceMarker, DeviceSelection } from "./deviceTypes";

/** Minimal shape of the hitTest results we read - see the note in ArcgisAddressMap. */
interface HitTestResultLike {
  type?: string;
  graphic?: Graphic;
}

interface HitTestResponseLike {
  results?: HitTestResultLike[];
}

/** The raw hit, before the click policy decides zoom-in vs. picker. */
export type DeviceHit = { type: "device"; deviceId: string } | { type: "group"; group: DeviceGroup };

interface UseArcgisDeviceLayerOptions {
  mapRef: React.MutableRefObject<esriMap | null>;
  viewRef: React.MutableRefObject<MapView | null>;
  /** True once the MapView has resolved; refs are only safe to use after this. */
  isReady: boolean;
  devices: readonly DeviceMarker[];
  selectedDeviceId: string | null;
  visible: boolean;
}

export interface UseArcgisDeviceLayerResult {
  /**
   * Resolves a click on the Device layer to a selection, or null. Stable
   * across renders, so the mount-time click handler can call it.
   */
  resolveDeviceClick: (event: unknown) => Promise<DeviceSelection | null>;
  /**
   * Pure hit-test: what is the pointer over - a Device marker, a group, or
   * nothing? No navigation, no selection. Used by ArcgisAddressMap's
   * centralized pointer-move cursor effect. Stable across renders.
   */
  hitTestDevice: (event: unknown) => Promise<DeviceHit | null>;
}

/** Graphic keys are namespaced so one Map can hold singles, groups and labels. */
const deviceKey = (id: string) => `device:${id}`;
const groupKey = (groupId: string) => `group:${groupId}`;
const groupLabelKey = (groupId: string) => `label:${groupId}`;

function toPoint(latitude: number, longitude: number): Point {
  return new Point({ latitude, longitude });
}

export function useArcgisDeviceLayer({
  mapRef,
  viewRef,
  isReady,
  devices,
  selectedDeviceId,
  visible
}: UseArcgisDeviceLayerOptions): UseArcgisDeviceLayerResult {
  const layerRef = useRef<GraphicsLayer | null>(null);
  const graphicsRef = useRef<Map<string, Graphic>>(new Map());
  const hitAreaGraphicsRef = useRef<Map<string, Graphic>>(new Map());
  const haloRef = useRef<Graphic | null>(null);
  const groupingRef = useRef<DeviceGrouping>({ singles: [], groups: [] });

  const devicesRef = useRef(devices);
  const selectedDeviceIdRef = useRef(selectedDeviceId);
  const visibleRef = useRef(visible);
  devicesRef.current = devices;
  selectedDeviceIdRef.current = selectedDeviceId;
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

    const allMarkers = devicesRef.current.filter((marker) => marker.category !== null);
    const selectedId = selectedDeviceIdRef.current;
    const graphics = graphicsRef.current;
    const hitAreaGraphics = hitAreaGraphicsRef.current;

    const toScreen = (marker: DeviceMarker) => {
      const screenPoint = view.toScreen(toPoint(marker.latitude, marker.longitude));
      return screenPoint ? { x: screenPoint.x, y: screenPoint.y } : null;
    };

    const grouping = groupDevicesByProximity(allMarkers, toScreen, DEVICE_CLUSTER_RADIUS_PX);
    groupingRef.current = grouping;

    const liveKeys = new Set<string>();
    grouping.singles.forEach((marker) => liveKeys.add(deviceKey(marker.deviceId)));
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
    // Only singles carry a hit-area graphic; a dissolved group's members get
    // theirs back on the next pass through the singles loop below.
    const liveSingleKeys = new Set(grouping.singles.map((marker) => deviceKey(marker.deviceId)));
    hitAreaGraphics.forEach((graphic, key) => {
      if (!liveSingleKeys.has(key)) {
        layer.remove(graphic);
        hitAreaGraphics.delete(key);
      }
    });

    const upsert = (
      key: string,
      geometry: Point,
      symbol:
        | ReturnType<typeof createDeviceSymbol>
        | ReturnType<typeof createDeviceGroupSymbol>
        | ReturnType<typeof createDeviceGroupLabelSymbol>,
      attributes: Record<string, string | boolean>
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
      if (marker.category === null) {
        return;
      }
      const geometry = toPoint(marker.latitude, marker.longitude);
      const key = deviceKey(marker.deviceId);
      upsert(
        key,
        geometry,
        createDeviceSymbol(marker.category, { isSelected: marker.deviceId === selectedId }),
        { deviceId: marker.deviceId, isHitArea: false }
      );

      // Invisible, larger hit target underneath the glyph - see
      // createDeviceHitAreaSymbol for why this exists.
      const existingHitArea = hitAreaGraphics.get(key);
      if (!existingHitArea) {
        const hitAreaGraphic = new Graphic({
          geometry,
          symbol: createDeviceHitAreaSymbol(),
          attributes: { deviceId: marker.deviceId, isHitArea: true }
        });
        hitAreaGraphics.set(key, hitAreaGraphic);
        // Under the glyphs (index 0), so the visible icons stay on top.
        layer.graphics.add(hitAreaGraphic, 0);
      }
      else {
        const point = existingHitArea.geometry as Point | null;
        if (point?.latitude !== geometry.latitude || point?.longitude !== geometry.longitude) {
          existingHitArea.geometry = geometry;
        }
      }
    });

    grouping.groups.forEach((group) => {
      const geometry = toPoint(group.latitude, group.longitude);
      const count = group.deviceIds.length;
      upsert(groupKey(group.id), geometry, createDeviceGroupSymbol(count), { groupId: group.id });
      upsert(groupLabelKey(group.id), geometry, createDeviceGroupLabelSymbol(count), {
        groupId: group.id
      });
    });

    // The selection halo, drawn beneath the markers so it reads as a spotlight
    // on the ground rather than a ring over the icon. Follows the selected
    // Device INTO a group, same reasoning as the staff layer.
    const selectedSingle = grouping.singles.find(
      (marker) => marker.deviceId === selectedId && marker.category !== null
    );
    const selectedGroup = selectedId
      ? grouping.groups.find((group) => group.deviceIds.includes(selectedId))
      : undefined;

    if ((!selectedSingle || selectedSingle.category === null) && !selectedGroup) {
      if (haloRef.current) {
        layer.remove(haloRef.current);
        haloRef.current = null;
      }
      return;
    }

    const haloGeometry = selectedSingle
      ? toPoint(selectedSingle.latitude, selectedSingle.longitude)
      : toPoint(selectedGroup!.latitude, selectedGroup!.longitude);
    const haloSymbol =
      selectedSingle && selectedSingle.category !== null
        ? createDeviceHaloSymbol(selectedSingle.category)
        : createDeviceGroupHaloSymbol(selectedGroup!.deviceIds.length);
    const haloAttributes = selectedSingle
      ? { deviceId: selectedSingle.deviceId }
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
  // (no map.reorder), so the interactive Device layer sits on top like staff.
  useEffect(() => {
    const map = mapRef.current;
    if (!isReady || !map) {
      return;
    }

    const layer = new GraphicsLayer({ id: "device-layer" });
    layerRef.current = layer;
    map.add(layer);

    const graphics = graphicsRef.current;
    const hitAreaGraphics = hitAreaGraphicsRef.current;

    return () => {
      map.remove(layer);
      layer.removeAll();
      layer.destroy();
      layerRef.current = null;
      graphics.clear();
      hitAreaGraphics.clear();
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
  }, [isReady, devices, selectedDeviceId, visible, syncGraphics]);

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

  const hitTestDevice = useCallback(async (event: unknown): Promise<DeviceHit | null> => {
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

      const candidates = (response?.results ?? []).filter(
        (result) =>
          result.type === "graphic" && typeof result.graphic?.attributes?.deviceId === "string"
      );
      // An exact hit on the visible glyph always wins; only when the click
      // landed outside every glyph's actual shape (e.g. the camera's lens) do
      // we fall back to whichever invisible hit-area graphic was hit.
      const exact = candidates.find((result) => !result.graphic?.attributes?.isHitArea);
      const deviceHit = exact ?? candidates[0] ?? null;
      const deviceId = deviceHit?.graphic?.attributes?.deviceId;
      if (typeof deviceId === "string") {
        return { type: "device", deviceId };
      }

      const groupResults = response?.results?.filter((result) => result.type === "graphic") ?? [];
      const groupHit = groupResults.find((result) => result.graphic?.attributes?.groupId);
      const groupId = groupHit?.graphic?.attributes?.groupId;
      if (typeof groupId === "string") {
        const group = groupingRef.current.groups.find((candidate) => candidate.id === groupId);
        return group ? { type: "group", group } : null;
      }

      return null;
    }
    catch (error) {
      console.error("Failed to hit-test the device layer", error);
      return null;
    }
  }, [viewRef]);

  const resolveDeviceClick = useCallback(
    async (event: unknown): Promise<DeviceSelection | null> => {
      const hit = await hitTestDevice(event);
      if (!hit) {
        return null;
      }
      if (hit.type === "device") {
        return { type: "device", deviceId: hit.deviceId };
      }

      const view = viewRef.current;
      const separationZoom = view
        ? getSeparationZoom(
            hit.group,
            view.zoom,
            view.constraints?.effectiveMaxZoom ?? Number.POSITIVE_INFINITY,
            DEVICE_CLUSTER_RADIUS_PX
          )
        : null;

      if (view && separationZoom !== null) {
        view
          .goTo({ target: toPoint(hit.group.latitude, hit.group.longitude), zoom: separationZoom })
          .catch(() => {
            /* goTo rejects when interrupted by a newer navigation - safe to ignore */
          });
        return null;
      }

      return { type: "group", deviceIds: hit.group.deviceIds };
    },
    [hitTestDevice, viewRef]
  );

  // No pointer-move cursor effect here: ArcgisAddressMap.tsx owns ONE
  // centralized listener that hit-tests staff/Place/Device in priority order
  // via hitTestDevice below, so cursor-setting never races across layers.

  return { resolveDeviceClick, hitTestDevice };
}
