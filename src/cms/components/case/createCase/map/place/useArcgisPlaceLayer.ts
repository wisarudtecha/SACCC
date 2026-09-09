// Keeps an ArcGIS GraphicsLayer of Place markers in sync with a PlaceMarker[].
//
// A pared-down useStaffGraphicsLayer: Places do not cluster and carry no
// telemetry, so there is no grouping pass, no heading chevron, and no
// view-settle redraw - just a diff-in-place marker layer with one selection halo.
//
// The same three rules apply: add the layer to the EXISTING map (never rebuild
// the view), diff graphics in place (no removeAll flicker), and resolve clicks
// through `resolvePlaceClick` which ArcgisAddressMap's own click handler awaits
// before it decides whether to reverse-geocode.
import { useCallback, useEffect, useRef } from "react";
import Graphic from "@arcgis/core/Graphic.js";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer.js";
import Point from "@arcgis/core/geometry/Point.js";
import type esriMap from "@arcgis/core/Map.js";
import type MapView from "@arcgis/core/views/MapView.js";
import { createPlaceHaloSymbol, createPlaceSymbol } from "./placeSymbols";
import type { PlaceMarker } from "./placeTypes";

/** Minimal shape of the hitTest results we read - see the note in ArcgisAddressMap. */
interface HitTestResultLike {
  type?: string;
  graphic?: Graphic;
}

interface HitTestResponseLike {
  results?: HitTestResultLike[];
}

interface UseArcgisPlaceLayerOptions {
  mapRef: React.MutableRefObject<esriMap | null>;
  viewRef: React.MutableRefObject<MapView | null>;
  /** True once the MapView has resolved; refs are only safe to use after this. */
  isReady: boolean;
  places: readonly PlaceMarker[];
  selectedPlaceId: string | null;
  visible: boolean;
}

export interface UseArcgisPlaceLayerResult {
  /**
   * Resolves a click on the Place layer to the marker under it, or null. Stable
   * across renders, so the mount-time click handler can call it.
   */
  resolvePlaceClick: (event: unknown) => Promise<PlaceMarker | null>;
}

function toPoint(latitude: number, longitude: number): Point {
  return new Point({ latitude, longitude });
}

export function useArcgisPlaceLayer({
  mapRef,
  viewRef,
  isReady,
  places,
  selectedPlaceId,
  visible
}: UseArcgisPlaceLayerOptions): UseArcgisPlaceLayerResult {
  const layerRef = useRef<GraphicsLayer | null>(null);
  const graphicsRef = useRef<Map<string, Graphic>>(new Map());
  const haloRef = useRef<Graphic | null>(null);

  // Read by both the sync effect and the click/cursor paths, which run outside
  // React's render cycle.
  const placesRef = useRef(places);
  const selectedPlaceIdRef = useRef(selectedPlaceId);
  const visibleRef = useRef(visible);
  placesRef.current = places;
  selectedPlaceIdRef.current = selectedPlaceId;
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

    const markers = placesRef.current;
    const selectedId = selectedPlaceIdRef.current;
    const graphics = graphicsRef.current;

    const liveKeys = new Set(markers.map((marker) => marker.id));
    graphics.forEach((graphic, id) => {
      if (!liveKeys.has(id)) {
        layer.remove(graphic);
        graphics.delete(id);
      }
    });

    markers.forEach((marker) => {
      const geometry = toPoint(marker.latitude, marker.longitude);
      const symbol = createPlaceSymbol(marker.category, { isSelected: marker.id === selectedId });
      const existing = graphics.get(marker.id);
      if (!existing) {
        const graphic = new Graphic({ geometry, symbol, attributes: { placeId: marker.id } });
        graphics.set(marker.id, graphic);
        layer.add(graphic);
        return;
      }
      const point = existing.geometry as Point | null;
      if (point?.latitude !== marker.latitude || point?.longitude !== marker.longitude) {
        existing.geometry = geometry;
      }
      existing.symbol = symbol;
      existing.attributes = { placeId: marker.id };
    });

    // The selection halo, drawn beneath the markers so it reads as a spotlight
    // on the ground rather than a ring over the icon.
    const selected = markers.find((marker) => marker.id === selectedId);
    if (!selected) {
      if (haloRef.current) {
        layer.remove(haloRef.current);
        haloRef.current = null;
      }
      return;
    }

    const haloGeometry = toPoint(selected.latitude, selected.longitude);
    const haloSymbol = createPlaceHaloSymbol(selected.category);
    const haloAttributes = { placeId: selected.id };
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
  // (no map.reorder), so the interactive Place layer sits on top like staff.
  useEffect(() => {
    const map = mapRef.current;
    if (!isReady || !map) {
      return;
    }

    const layer = new GraphicsLayer({ id: "place-layer" });
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
  }, [isReady, places, selectedPlaceId, visible, syncGraphics]);

  const hitTestPlace = useCallback(async (event: unknown): Promise<PlaceMarker | null> => {
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
        .find((result) => result.graphic?.attributes?.placeId);
      const placeId = hit?.graphic?.attributes?.placeId;
      if (typeof placeId !== "string") {
        return null;
      }
      return placesRef.current.find((marker) => marker.id === placeId) ?? null;
    }
    catch (error) {
      console.error("Failed to hit-test the place layer", error);
      return null;
    }
  }, [viewRef]);

  const resolvePlaceClick = useCallback(
    (event: unknown): Promise<PlaceMarker | null> => hitTestPlace(event),
    [hitTestPlace]
  );

  // No pointer-move cursor effect on purpose: the staff layer already owns the
  // map cursor via its own pointer-move hit-test, and a second one racing it
  // would flicker between "pointer" and "". Place markers stay clickable without
  // the cursor hint.

  return { resolvePlaceClick };
}
