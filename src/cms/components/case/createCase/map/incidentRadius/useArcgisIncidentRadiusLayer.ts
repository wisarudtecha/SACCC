// Draws the no-match fallback radius circle on the ArcGIS map.
//
// Same discipline as useRouteGraphicsLayer: one GraphicsLayer added to the
// EXISTING map, one graphic updated in place, non-interactive by construction
// (no popup, no hitTest), and never moves the camera - the pin placement that
// triggered it already centred the view.
//
// The circle is drawn with `geometryEngine.geodesicBuffer`, the SDK's own
// client-side buffer, rather than a hand-rolled ring: it is already a
// dependency, and a geodesic buffer stays true-to-scale at any latitude. It is
// rendered ONLY while `incidentRadius` is set, which the owner does only when
// the incident point matched no single Service Center polygon.
import { useEffect, useMemo, useRef } from "react";
import Graphic from "@arcgis/core/Graphic.js";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer.js";
import Point from "@arcgis/core/geometry/Point.js";
import * as geometryEngine from "@arcgis/core/geometry/geometryEngine.js";
import type Polygon from "@arcgis/core/geometry/Polygon.js";
import type esriMap from "@arcgis/core/Map.js";
import type { IncidentRadiusOverlay } from "../mapTypes";
import { incidentRadiusArcgisSymbol } from "./incidentRadiusSymbols";

/**
 * Sits alongside the route layer (see ROUTE_DRAW_INDEX in useRouteGraphicsLayer):
 * above the three boundary layers, below the case marker / staff layers that
 * ArcgisAddressMap adds after the layer hooks run.
 */
const INCIDENT_RADIUS_DRAW_INDEX = 3;

interface UseArcgisIncidentRadiusLayerOptions {
  mapRef: React.MutableRefObject<esriMap | null>;
  /** True once the MapView has resolved; refs are only safe to touch after this. */
  isReady: boolean;
  /** The circle to draw, or null on the match path (nothing drawn). */
  incidentRadius?: IncidentRadiusOverlay | null;
  isDarkTheme: boolean;
}

export function useArcgisIncidentRadiusLayer({
  mapRef,
  isReady,
  incidentRadius,
  isDarkTheme
}: UseArcgisIncidentRadiusLayerOptions): void {
  const layerRef = useRef<GraphicsLayer | null>(null);
  const graphicRef = useRef<Graphic | null>(null);

  // Buffer the incident point into a circle polygon. Rebuilt only when the
  // centre or the radius actually changes, not on every render.
  const geometry = useMemo<Polygon | null>(() => {
    if (!incidentRadius) {
      return null;
    }
    const { center, radiusMeters } = incidentRadius;
    if (
      !Number.isFinite(center.latitude) ||
      !Number.isFinite(center.longitude) ||
      !Number.isFinite(radiusMeters) ||
      radiusMeters <= 0
    ) {
      return null;
    }
    const point = new Point({
      latitude: center.latitude,
      longitude: center.longitude,
      spatialReference: { wkid: 4326 }
    });
    const buffered = geometryEngine.geodesicBuffer(point, radiusMeters, "meters");
    return Array.isArray(buffered) ? (buffered[0] ?? null) : buffered;
  }, [incidentRadius]);

  // Create the layer once the map exists; tear it down with the map.
  useEffect(() => {
    const map = mapRef.current;
    if (!isReady || !map) {
      return;
    }
    const layer = new GraphicsLayer({ id: "incident-radius-layer" });
    layerRef.current = layer;
    map.add(layer);
    map.reorder(layer, INCIDENT_RADIUS_DRAW_INDEX);

    return () => {
      map.remove(layer);
      layer.removeAll();
      layer.destroy();
      layerRef.current = null;
      graphicRef.current = null;
    };
  }, [isReady, mapRef]);

  // Data-driven redraw: reassign the single graphic, or drop it when there is
  // no circle to show.
  useEffect(() => {
    const layer = layerRef.current;
    if (!isReady || !layer) {
      return;
    }
    if (!geometry) {
      if (graphicRef.current) {
        layer.remove(graphicRef.current);
        graphicRef.current = null;
      }
      return;
    }

    const symbol = incidentRadiusArcgisSymbol(isDarkTheme);
    const existing = graphicRef.current;
    if (existing) {
      existing.geometry = geometry;
      existing.symbol = symbol;
      return;
    }
    const graphic = new Graphic({ geometry, symbol });
    graphicRef.current = graphic;
    layer.add(graphic);
  }, [isReady, geometry, isDarkTheme]);
}
