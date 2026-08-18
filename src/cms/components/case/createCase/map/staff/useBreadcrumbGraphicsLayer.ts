// Keeps a single-graphic ArcGIS GraphicsLayer in sync with the selected
// officer's breadcrumb trail.
//
// Copies useRouteGraphicsLayer.ts, which is itself a deliberate simplification
// of useStaffGraphicsLayer: one graphic, updated in place, no clustering, no
// hitTest, no click handling.
//
// One thing it does NOT copy: the route frames itself with a goTo when it first
// resolves. A trail must never touch the camera. It grows a point at a time
// while the operator is working, and a map that re-framed itself every few
// seconds would be unusable - and would fight both the view's own settle-driven
// re-clustering and the viewpoint ArcgisAddressMap restores when the large map
// reopens.
import { useEffect, useMemo, useRef } from "react";
import Graphic from "@arcgis/core/Graphic.js";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer.js";
import Polyline from "@arcgis/core/geometry/Polyline.js";
import type esriMap from "@arcgis/core/Map.js";
import { createBreadcrumbSymbol } from "./breadcrumbSymbols";
import { MIN_TRAIL_POINTS, type TrailPoint } from "./useStaffTrails";

/**
 * Boundary layers occupy draw indices 0-2 and ROUTE_DRAW_INDEX is 3, so the
 * trail sits just above the route and still below the case marker and the staff
 * layer - where an officer's own icon is never hidden by the path they walked.
 */
const BREADCRUMB_DRAW_INDEX = 4;

interface UseBreadcrumbGraphicsLayerOptions {
  mapRef: React.MutableRefObject<esriMap | null>;
  /** True once the MapView has resolved; refs are only safe to use after this. */
  isReady: boolean;
  points: readonly TrailPoint[] | null;
  visible: boolean;
  isDarkTheme: boolean;
}

export function useBreadcrumbGraphicsLayer({
  mapRef,
  isReady,
  points,
  visible,
  isDarkTheme
}: UseBreadcrumbGraphicsLayerOptions): void {
  const layerRef = useRef<GraphicsLayer | null>(null);
  const graphicRef = useRef<Graphic | null>(null);

  // Built here rather than in the effect so a re-render that changes neither the
  // points nor nothing at all does not rebuild the geometry.
  const geometry = useMemo(() => {
    if (!points || points.length < MIN_TRAIL_POINTS) {
      return null;
    }
    // `paths` are raw coordinate arrays, so they get neither an axis order nor a
    // spatial reference for free - unlike `new Point({ latitude, longitude })`
    // used elsewhere in this folder. Longitude first, and WGS84 stated outright.
    return new Polyline({
      paths: [points.map((point) => [point.longitude, point.latitude])],
      spatialReference: { wkid: 4326 }
    });
  }, [points]);

  // Create the layer once the view exists, and tear it down with the map.
  useEffect(() => {
    const map = mapRef.current;
    if (!isReady || !map) {
      return;
    }

    const layer = new GraphicsLayer({ id: "breadcrumb-layer" });
    layerRef.current = layer;
    map.add(layer);
    map.reorder(layer, BREADCRUMB_DRAW_INDEX);

    return () => {
      map.remove(layer);
      layer.removeAll();
      layer.destroy();
      layerRef.current = null;
      graphicRef.current = null;
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

    const symbol = createBreadcrumbSymbol(isDarkTheme);
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
}
