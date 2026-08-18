// Keeps a single-graphic ArcGIS GraphicsLayer in sync with the solved
// officer -> case route polyline.
//
// Copies the discipline of useStaffGraphicsLayer.ts, not its content - there is
// no clustering, no hitTest and no click handling here, so most of that hook's
// complexity does not apply:
//
//   1. The layer is added to the EXISTING map, never a rebuilt MapView - same
//      reason as every other layer on this map.
//   2. The one graphic updates in place (reassigns geometry/symbol) rather than
//      removeAll() + re-add.
//   3. Non-interactive by construction: no popup, no hitTest registration. The
//      brief forbids touching ArcgisAddressMap's click handler, and this layer
//      never needs to - it simply never registers for a hit.
import { useEffect, useRef } from "react";
import Graphic from "@arcgis/core/Graphic.js";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer.js";
import type Polyline from "@arcgis/core/geometry/Polyline.js";
import type esriMap from "@arcgis/core/Map.js";
import type MapView from "@arcgis/core/views/MapView.js";
import { createRouteSymbol } from "./routeSymbols";

/**
 * Coupled to BOUNDARY_LEVELS.length (boundaryLevels.ts): the three boundary
 * layers occupy draw indices 0-2, so the route sits just above them and below
 * the case marker / staff layers, both of which are added to the map after
 * this hook runs (see ArcgisAddressMap.tsx's hook call order).
 */
const ROUTE_DRAW_INDEX = 3;

/** How far to expand the route's extent before framing it - pure padding. */
const ROUTE_FRAME_PADDING_FACTOR = 1.3;

interface UseRouteGraphicsLayerOptions {
  mapRef: React.MutableRefObject<esriMap | null>;
  viewRef: React.MutableRefObject<MapView | null>;
  /** True once the MapView has resolved; refs are only safe to use after this. */
  isReady: boolean;
  geometry: Polyline | null;
  visible: boolean;
  isDarkTheme: boolean;
}

export function useRouteGraphicsLayer({
  mapRef,
  viewRef,
  isReady,
  geometry,
  visible,
  isDarkTheme
}: UseRouteGraphicsLayerOptions): void {
  const layerRef = useRef<GraphicsLayer | null>(null);
  const graphicRef = useRef<Graphic | null>(null);
  // The geometry instance last framed with goTo, so a re-render with the same
  // result does not re-animate the camera.
  const framedGeometryRef = useRef<Polyline | null>(null);

  // Create the layer once the view exists, and tear it down with the map.
  useEffect(() => {
    const map = mapRef.current;
    if (!isReady || !map) {
      return;
    }

    const layer = new GraphicsLayer({ id: "route-layer" });
    layerRef.current = layer;
    map.add(layer);
    map.reorder(layer, ROUTE_DRAW_INDEX);

    return () => {
      map.remove(layer);
      layer.removeAll();
      layer.destroy();
      layerRef.current = null;
      graphicRef.current = null;
      framedGeometryRef.current = null;
    };
  }, [isReady, mapRef]);

  // Data-driven redraw: reassign the single graphic's geometry/symbol, or drop
  // it when there is nothing to show.
  useEffect(() => {
    const layer = layerRef.current;
    if (!isReady || !layer) {
      return;
    }

    layer.visible = visible;
    if (!visible || !geometry) {
      if (graphicRef.current) {
        layer.remove(graphicRef.current);
        graphicRef.current = null;
      }
      return;
    }

    const symbol = createRouteSymbol(isDarkTheme);
    const existing = graphicRef.current;
    if (existing) {
      existing.geometry = geometry;
      existing.symbol = symbol;
      return;
    }

    const graphic = new Graphic({ geometry, symbol });
    graphicRef.current = graphic;
    layer.add(graphic);
  }, [isReady, geometry, visible, isDarkTheme]);

  // Frame the route once, when it first resolves. Respects whatever navigation
  // is already in flight, same as every other goTo call on this map.
  useEffect(() => {
    const view = viewRef.current;
    if (!isReady || !view || !visible || !geometry) {
      return;
    }
    if (framedGeometryRef.current === geometry) {
      return;
    }
    framedGeometryRef.current = geometry;
    const extent = geometry.extent?.expand(ROUTE_FRAME_PADDING_FACTOR);
    if (!extent) {
      return;
    }
    view.goTo(extent).catch(() => {
      /* goTo rejects when interrupted by a newer navigation - safe to ignore */
    });
  }, [isReady, geometry, visible, viewRef]);
}
