// Keeps an ArcGIS GraphicsLayer of Device markers in sync with a DeviceMarker[].
//
// A copy of useArcgisPlaceLayer: Devices do not cluster and carry no telemetry,
// so there is no grouping pass, no heading chevron, and no view-settle redraw -
// just a diff-in-place marker layer with one selection halo. One extra guard:
// a DeviceMarker's `category` can be null (unrecognised `deviceType`); such a
// marker is skipped here so the symbol builders never get null. useDeviceLayer
// already filters them out, this is belt-and-braces for the type.
//
// The same three rules apply: add the layer to the EXISTING map (never rebuild
// the view), diff graphics in place (no removeAll flicker), and resolve clicks
// through `resolveDeviceClick` which ArcgisAddressMap's own click handler awaits.
import { useCallback, useEffect, useRef } from "react";
import Graphic from "@arcgis/core/Graphic.js";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer.js";
import Point from "@arcgis/core/geometry/Point.js";
import type esriMap from "@arcgis/core/Map.js";
import type MapView from "@arcgis/core/views/MapView.js";
import { createDeviceHaloSymbol, createDeviceSymbol } from "./deviceSymbols";
import type { DeviceMarker } from "./deviceTypes";

/** Minimal shape of the hitTest results we read - see the note in ArcgisAddressMap. */
interface HitTestResultLike {
  type?: string;
  graphic?: Graphic;
}

interface HitTestResponseLike {
  results?: HitTestResultLike[];
}

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
   * Resolves a click on the Device layer to the marker under it, or null. Stable
   * across renders, so the mount-time click handler can call it.
   */
  resolveDeviceClick: (event: unknown) => Promise<DeviceMarker | null>;
}

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
  const haloRef = useRef<Graphic | null>(null);

  const devicesRef = useRef(devices);
  const selectedDeviceIdRef = useRef(selectedDeviceId);
  const visibleRef = useRef(visible);
  devicesRef.current = devices;
  selectedDeviceIdRef.current = selectedDeviceId;
  visibleRef.current = visible;

  const syncGraphics = useCallback(() => {
    const layer = layerRef.current;
    if (!layer) {
      return;
    }

    layer.visible = visibleRef.current;
    if (!visibleRef.current) {
      return;
    }

    const markers = devicesRef.current;
    const selectedId = selectedDeviceIdRef.current;
    const graphics = graphicsRef.current;

    const liveKeys = new Set(
      markers.filter((marker) => marker.category !== null).map((marker) => marker.deviceId)
    );
    graphics.forEach((graphic, id) => {
      if (!liveKeys.has(id)) {
        layer.remove(graphic);
        graphics.delete(id);
      }
    });

    markers.forEach((marker) => {
      if (marker.category === null) {
        return;
      }
      const geometry = toPoint(marker.latitude, marker.longitude);
      const symbol = createDeviceSymbol(marker.category, {
        isSelected: marker.deviceId === selectedId
      });
      const existing = graphics.get(marker.deviceId);
      if (!existing) {
        const graphic = new Graphic({
          geometry,
          symbol,
          attributes: { deviceId: marker.deviceId }
        });
        graphics.set(marker.deviceId, graphic);
        layer.add(graphic);
        return;
      }
      const point = existing.geometry as Point | null;
      if (point?.latitude !== marker.latitude || point?.longitude !== marker.longitude) {
        existing.geometry = geometry;
      }
      existing.symbol = symbol;
      existing.attributes = { deviceId: marker.deviceId };
    });

    // The selection halo, drawn beneath the markers so it reads as a spotlight
    // on the ground rather than a ring over the icon.
    const selected = markers.find(
      (marker) => marker.deviceId === selectedId && marker.category !== null
    );
    if (!selected || selected.category === null) {
      if (haloRef.current) {
        layer.remove(haloRef.current);
        haloRef.current = null;
      }
      return;
    }

    const haloGeometry = toPoint(selected.latitude, selected.longitude);
    const haloSymbol = createDeviceHaloSymbol(selected.category);
    const haloAttributes = { deviceId: selected.deviceId };
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
      // Index 0: the loop above appends markers, so they still sit on top.
      layer.graphics.add(halo, 0);
    }
  }, []);

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

    return () => {
      map.remove(layer);
      layer.removeAll();
      layer.destroy();
      layerRef.current = null;
      graphics.clear();
      haloRef.current = null;
    };
  }, [isReady, mapRef]);

  // Data-driven redraws. No view-settle redraw: nothing here is screen-space.
  useEffect(() => {
    if (!isReady) {
      return;
    }
    syncGraphics();
  }, [isReady, devices, selectedDeviceId, visible, syncGraphics]);

  const hitTestDevice = useCallback(async (event: unknown): Promise<DeviceMarker | null> => {
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

      const hit = (response?.results ?? [])
        .filter((result) => result.type === "graphic")
        .find((result) => result.graphic?.attributes?.deviceId);
      const deviceId = hit?.graphic?.attributes?.deviceId;
      if (typeof deviceId !== "string") {
        return null;
      }
      return devicesRef.current.find((marker) => marker.deviceId === deviceId) ?? null;
    }
    catch (error) {
      console.error("Failed to hit-test the device layer", error);
      return null;
    }
  }, [viewRef]);

  const resolveDeviceClick = useCallback(
    (event: unknown): Promise<DeviceMarker | null> => hitTestDevice(event),
    [hitTestDevice]
  );

  return { resolveDeviceClick };
}
