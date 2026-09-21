// Draws the straight dashed staff -> incident lines on a MapTiler map.
//
// The counterpart of useStaffConnectorLayer (ArcGIS), in the shape of
// useMapTilerBreadcrumbOverlay: one GeoJSON source and one `line` layer holding a
// two-point LineString per staff member. Like the breadcrumb it never touches the
// camera and is entirely non-interactive.
//
// The lines are NOT routes - straight in the map's projection, no road network,
// nothing solved - which is what "how far is everyone from the incident" wants and
// what a route must not be mistaken for.
//
// A source + layer, so `map.setStyle` drops it; the effect re-runs on `styleEpoch`
// and re-adds it. A SIGNATURE guards the redraw, because the parent hands over a
// fresh array on every position refresh whether or not anyone moved.
import { useEffect, useRef } from "react";
import type { Map as MlMap, GeoJSONSource } from "maplibre-gl";
import type { FeatureCollection } from "geojson";
import type { MapLatLon, StaffConnector } from "../../mapTypes";
import { CONNECTOR_TOKENS } from "../../staff/connectorSymbols";
import { asLayer } from "../mlTypes";

const SOURCE_ID = "maptiler-staff-connector";
const LAYER_ID = "maptiler-staff-connector-line";

/** In units of the line's width, so it reads as a dash at any thickness. */
const CONNECTOR_DASH_ARRAY = [3, 2];

interface UseMapTilerStaffConnectorOverlayOptions {
  mapRef: React.MutableRefObject<MlMap | null>;
  isReady: boolean;
  styleEpoch: number;
  connectors: readonly StaffConnector[];
  /** The incident pin every line ends at. Nothing is drawn without it. */
  incident: MapLatLon | null | undefined;
  visible: boolean;
  isDarkTheme: boolean;
}

function lineColor(isDarkTheme: boolean): string {
  const rgb = isDarkTheme ? CONNECTOR_TOKENS.darkRgb : CONNECTOR_TOKENS.lightRgb;
  return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${CONNECTOR_TOKENS.alpha})`;
}

function connectorSignature(
  connectors: readonly StaffConnector[],
  incident: MapLatLon,
  isDarkTheme: boolean
): string {
  const ends = connectors
    .map((connector) => `${connector.unitId}:${connector.longitude},${connector.latitude}`)
    .join("|");
  return `${ends}>${incident.longitude},${incident.latitude}:${isDarkTheme ? "d" : "l"}`;
}

function toFeatureCollection(
  connectors: readonly StaffConnector[],
  incident: MapLatLon
): FeatureCollection {
  return {
    type: "FeatureCollection",
    features: connectors.map((connector) => ({
      type: "Feature",
      properties: { unitId: connector.unitId },
      geometry: {
        type: "LineString",
        coordinates: [
          [connector.longitude, connector.latitude],
          [incident.longitude, incident.latitude]
        ]
      }
    }))
  };
}

export function useMapTilerStaffConnectorOverlay({
  mapRef,
  isReady,
  styleEpoch,
  connectors,
  incident,
  visible,
  isDarkTheme
}: UseMapTilerStaffConnectorOverlayOptions): void {
  // What is currently drawn, so an unrelated re-render does not rebuild the layer.
  const renderedRef = useRef<string>("");

  useEffect(() => {
    const map = mapRef.current;
    if (!isReady || !map) {
      return;
    }

    const hasLines = Boolean(visible && incident && connectors.length > 0);
    const signature =
      hasLines && incident ? connectorSignature(connectors, incident, isDarkTheme) : "";

    // Nothing changed, and the layer is where the last run left it. `styleEpoch`
    // is a dependency, so a style swap still gets here with the layer gone and the
    // `getSource` check forces the re-add.
    if (signature === renderedRef.current && (signature === "" || map.getSource(SOURCE_ID))) {
      return;
    }
    renderedRef.current = signature;

    if (!hasLines || !incident) {
      if (map.getLayer(LAYER_ID)) {
        map.removeLayer(LAYER_ID);
      }
      if (map.getSource(SOURCE_ID)) {
        map.removeSource(SOURCE_ID);
      }
      return;
    }

    const data = toFeatureCollection(connectors, incident);
    const existing = map.getSource(SOURCE_ID);
    if (existing && "setData" in existing) {
      (existing as GeoJSONSource).setData(data);
      map.setPaintProperty(LAYER_ID, "line-color", lineColor(isDarkTheme));
      return;
    }
    map.addSource(SOURCE_ID, { type: "geojson", data });
    map.addLayer(
      asLayer({
        id: LAYER_ID,
        type: "line",
        source: SOURCE_ID,
        layout: { "line-cap": "butt", "line-join": "round" },
        paint: {
          "line-color": lineColor(isDarkTheme),
          "line-width": CONNECTOR_TOKENS.width,
          "line-dasharray": CONNECTOR_DASH_ARRAY
        }
      })
    );
  }, [mapRef, isReady, styleEpoch, connectors, incident, visible, isDarkTheme]);

  // Remove the layer only when the hook goes away. The ref is read in the cleanup
  // because the map is built asynchronously.
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
    };
  }, [mapRef]);
}
