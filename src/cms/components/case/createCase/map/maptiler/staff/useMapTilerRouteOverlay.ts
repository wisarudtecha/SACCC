// Draws the officer -> case route on a MapTiler map.
//
// Unlike the Longdo route overlay, this one DOES draw a line it was handed:
// OpenRouteService returns geometry (see services/maptilerRoute.ts), so this
// behaves like useRouteGraphicsLayer on the ArcGIS side - a single line layer
// fed the solved path, framed once when the route first resolves, and entirely
// non-interactive.
//
// It is a source + layer, so `map.setStyle` drops it; the effect re-runs on
// `styleEpoch` and re-adds it from the path it is currently holding.
//
// A SIGNATURE guards the redraw: the parent recomputes `route` every render
// while a route is shown (see routeOverlay in CaseStaffMapField), so without
// this the layer would be torn down and rebuilt on every unrelated re-render.
// The redraw only actually runs when the endpoints, the visibility or the theme
// change - or when a style swap wiped the layer.
import { useEffect, useRef } from "react";
import { LngLatBounds, type Map as MlMap, type GeoJSONSource } from "maplibre-gl";
import type { Feature, FeatureCollection, MultiLineString } from "geojson";
import type { RouteOverlay } from "../../mapTypes";
import { ROUTE_TOKENS } from "../../staff/routeSymbols";
import { asLayer } from "../mlTypes";

const SOURCE_ID = "maptiler-route";
const LAYER_ID = "maptiler-route-line";

interface UseMapTilerRouteOverlayOptions {
  mapRef: React.MutableRefObject<MlMap | null>;
  isReady: boolean;
  styleEpoch: number;
  route: RouteOverlay | null;
  visible: boolean;
  isDarkTheme: boolean;
}

function pathSignature(route: RouteOverlay | null): string {
  if (!route?.path?.paths.length) {
    return "";
  }
  const first = route.path.paths[0]?.[0];
  const lastPath = route.path.paths[route.path.paths.length - 1];
  const last = lastPath?.[lastPath.length - 1];
  return `${route.path.paths.length}:${first?.join(",")}:${last?.join(",")}`;
}

function toLineFeature(route: RouteOverlay): Feature<MultiLineString> {
  return {
    type: "Feature",
    properties: {},
    geometry: {
      type: "MultiLineString",
      coordinates: route.path?.paths.map((path) => path.map((point) => [point[0], point[1]])) ?? []
    }
  };
}

function lineColor(isDarkTheme: boolean): string {
  const rgb = isDarkTheme ? ROUTE_TOKENS.darkRgb : ROUTE_TOKENS.lightRgb;
  return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${ROUTE_TOKENS.alpha})`;
}

export function useMapTilerRouteOverlay({
  mapRef,
  isReady,
  styleEpoch,
  route,
  visible,
  isDarkTheme
}: UseMapTilerRouteOverlayOptions): void {
  // What is currently drawn (endpoints + theme), so an unrelated re-render does
  // not rebuild the layer.
  const renderedRef = useRef<string>("");
  // The path last framed, so the same result does not re-fly the camera.
  const framedRef = useRef<string>("");

  useEffect(() => {
    const map = mapRef.current;
    if (!isReady || !map) {
      return;
    }

    const hasPath = Boolean(visible && route?.path?.paths.length);
    const signature = hasPath ? `${pathSignature(route)}:${isDarkTheme ? "d" : "l"}` : "";

    // Nothing changed, and the layer is where the last run left it. `styleEpoch`
    // is a dependency, so a style swap still gets here with the layer gone and
    // the `getSource` check below forces the re-add.
    if (signature === renderedRef.current && (signature === "" || map.getSource(SOURCE_ID))) {
      return;
    }
    renderedRef.current = signature;

    if (!hasPath || !route) {
      if (map.getLayer(LAYER_ID)) {
        map.removeLayer(LAYER_ID);
      }
      if (map.getSource(SOURCE_ID)) {
        map.removeSource(SOURCE_ID);
      }
      return;
    }

    const data: FeatureCollection = { type: "FeatureCollection", features: [toLineFeature(route)] };
    const existing = map.getSource(SOURCE_ID);
    if (existing && "setData" in existing) {
      (existing as GeoJSONSource).setData(data);
      map.setPaintProperty(LAYER_ID, "line-color", lineColor(isDarkTheme));
    } else {
      map.addSource(SOURCE_ID, { type: "geojson", data });
      map.addLayer(
        asLayer({
          id: LAYER_ID,
          type: "line",
          source: SOURCE_ID,
          layout: { "line-cap": "round", "line-join": "round" },
          paint: { "line-color": lineColor(isDarkTheme), "line-width": ROUTE_TOKENS.width }
        })
      );
    }

    // Frame the route once, when its geometry first appears.
    const frameKey = pathSignature(route);
    if (frameKey && frameKey !== framedRef.current) {
      framedRef.current = frameKey;
      const bounds = new LngLatBounds();
      route.path?.paths.forEach((path) =>
        path.forEach((point) => bounds.extend([point[0], point[1]]))
      );
      if (!bounds.isEmpty()) {
        map.fitBounds(bounds, { padding: 48, maxZoom: 16 });
      }
    }
  }, [mapRef, isReady, styleEpoch, route, visible, isDarkTheme]);

  // Remove the layer only when the hook goes away. The ref is read in the
  // cleanup because the map is built asynchronously.
  useEffect(() => {
    return () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      const map = mapRef.current;
      if (map?.getLayer(LAYER_ID)) {
        map.removeLayer(LAYER_ID);
      }
      if (map?.getSource(SOURCE_ID)) {
        map.removeSource(SOURCE_ID);
      }
      renderedRef.current = "";
      framedRef.current = "";
    };
  }, [mapRef]);
}
