// Keeps an ArcGIS GraphicsLayer of straight dashed lines in sync with the staff
// members to connect to the incident pin.
//
// Copies the discipline of useRouteGraphicsLayer.ts, not its content:
//
//   1. The layer is added to the EXISTING map, never a rebuilt MapView.
//   2. Graphics update in place, keyed by unitId - a position refresh reassigns a
//      geometry rather than removing and re-adding, so nothing flickers.
//   3. Non-interactive by construction: no popup, no hitTest registration, and
//      the click handler in ArcgisAddressMap never asks this layer anything, so
//      it can never intercept a click.
//
// The lines are NOT routes. They are straight in the map's projection - a
// two-vertex polyline, no densifying and no road network - which is what
// "how far is everyone from the incident" wants and what a route must not be
// mistaken for.
import { useEffect, useRef } from "react";
import Graphic from "@arcgis/core/Graphic.js";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer.js";
import Polyline from "@arcgis/core/geometry/Polyline.js";
import type esriMap from "@arcgis/core/Map.js";
import type { MapLatLon, StaffConnector } from "../mapTypes";
import { createConnectorSymbol } from "./connectorSymbols";

/**
 * Just above the boundary layers (draw indices 0-2), the same slot the route
 * takes. Whichever of the two hooks runs LAST ends up lower, so ArcgisAddressMap
 * calls this one after useRouteGraphicsLayer to keep a solved route on top.
 */
const CONNECTOR_DRAW_INDEX = 3;

interface UseStaffConnectorLayerOptions {
  mapRef: React.MutableRefObject<esriMap | null>;
  /** True once the MapView has resolved; refs are only safe to use after this. */
  isReady: boolean;
  connectors: readonly StaffConnector[];
  /** The incident pin every line ends at. Nothing is drawn without it. */
  incident: MapLatLon | null | undefined;
  visible: boolean;
  isDarkTheme: boolean;
}

function buildLine(connector: StaffConnector, incident: MapLatLon): Polyline {
  // Longitude first, WGS84 stated outright - same as the route and breadcrumb.
  return new Polyline({
    paths: [
      [
        [connector.longitude, connector.latitude],
        [incident.longitude, incident.latitude]
      ]
    ],
    spatialReference: { wkid: 4326 }
  });
}

export function useStaffConnectorLayer({
  mapRef,
  isReady,
  connectors,
  incident,
  visible,
  isDarkTheme
}: UseStaffConnectorLayerOptions): void {
  const layerRef = useRef<GraphicsLayer | null>(null);
  const graphicsRef = useRef<Map<string, Graphic>>(new Map());

  // Create the layer once the view exists, and tear it down with the map.
  useEffect(() => {
    const map = mapRef.current;
    if (!isReady || !map) {
      return;
    }

    const layer = new GraphicsLayer({ id: "staff-connector-layer" });
    layerRef.current = layer;
    const graphics = graphicsRef.current;
    map.add(layer);
    map.reorder(layer, CONNECTOR_DRAW_INDEX);

    return () => {
      map.remove(layer);
      layer.removeAll();
      layer.destroy();
      layerRef.current = null;
      graphics.clear();
    };
  }, [isReady, mapRef]);

  // Data-driven redraw: update lines in place, add new ones, drop the departed.
  useEffect(() => {
    const layer = layerRef.current;
    if (!isReady || !layer) {
      return;
    }

    layer.visible = visible;
    const graphics = graphicsRef.current;
    const wanted = visible && incident ? connectors : [];
    const wantedIds = new Set(wanted.map((connector) => connector.unitId));

    graphics.forEach((graphic, unitId) => {
      if (!wantedIds.has(unitId)) {
        layer.remove(graphic);
        graphics.delete(unitId);
      }
    });

    if (!incident) {
      return;
    }
    const symbol = createConnectorSymbol(isDarkTheme);
    wanted.forEach((connector) => {
      const geometry = buildLine(connector, incident);
      const existing = graphics.get(connector.unitId);
      if (existing) {
        existing.geometry = geometry;
        existing.symbol = symbol;
        return;
      }
      const graphic = new Graphic({ geometry, symbol });
      graphics.set(connector.unitId, graphic);
      layer.add(graphic);
    });
  }, [isReady, connectors, incident, visible, isDarkTheme]);
}
