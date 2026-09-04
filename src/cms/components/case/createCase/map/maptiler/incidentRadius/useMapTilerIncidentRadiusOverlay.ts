// Draws the no-match fallback radius circle on a MapTiler (MapLibre GL) map.
//
// Mirrors useMapTilerBoundaryOverlays' structure - a GeoJSON source plus
// fill/line layers that re-add themselves after every style swap (`styleEpoch`,
// because `map.setStyle` drops app-added sources and layers) - but reduced to
// one feature and no fetch. MapLibre has no buffer primitive, so the ring comes
// from the shared SDK-free haversine generator (generateIncidentCircleRing).
//
// It renders ONLY while `incidentRadius` is set, which the owner does only when
// the incident point matched no single Service Center polygon. Both layers are
// non-interactive - nothing binds a click handler to them.
import { useEffect } from "react";
import type { Map as MlMap, GeoJSONSource } from "maplibre-gl";
import type { FeatureCollection } from "geojson";
import type { IncidentRadiusOverlay } from "../../mapTypes";
import { generateIncidentCircleRing } from "@/cms/utils/incidentRadius";
import { asLayer } from "../mlTypes";
import {
  INCIDENT_RADIUS_OUTLINE_WIDTH,
  incidentRadiusFillCss,
  incidentRadiusStrokeCss
} from "../../incidentRadius/incidentRadiusSymbols";

const SOURCE_ID = "maptiler-incident-radius";
const FILL_ID = "maptiler-incident-radius-fill";
const LINE_ID = "maptiler-incident-radius-line";

interface UseMapTilerIncidentRadiusOverlayOptions {
  mapRef: React.MutableRefObject<MlMap | null>;
  isReady: boolean;
  /** Bumped on every completed style load - the source/layers are gone by then. */
  styleEpoch: number;
  incidentRadius?: IncidentRadiusOverlay | null;
  isDarkTheme: boolean;
}

function removeLayers(map: MlMap): void {
  [FILL_ID, LINE_ID].forEach(id => {
    if (map.getLayer(id)) {
      map.removeLayer(id);
    }
  });
  if (map.getSource(SOURCE_ID)) {
    map.removeSource(SOURCE_ID);
  }
}

function circleCollection(incidentRadius: IncidentRadiusOverlay): FeatureCollection {
  const ring = generateIncidentCircleRing(incidentRadius.center, incidentRadius.radiusMeters);
  return {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        properties: {},
        geometry: { type: "Polygon", coordinates: [ring.map(point => [point[0], point[1]])] }
      }
    ]
  };
}

export function useMapTilerIncidentRadiusOverlay({
  mapRef,
  isReady,
  styleEpoch,
  incidentRadius,
  isDarkTheme
}: UseMapTilerIncidentRadiusOverlayOptions): void {
  useEffect(() => {
    const map = mapRef.current;
    if (!isReady || !map) {
      return;
    }

    if (!incidentRadius) {
      removeLayers(map);
      return;
    }

    const data = circleCollection(incidentRadius);
    const existing = map.getSource(SOURCE_ID);
    if (existing && "setData" in existing) {
      (existing as GeoJSONSource).setData(data);
    } else {
      map.addSource(SOURCE_ID, { type: "geojson", data });
    }

    if (!map.getLayer(FILL_ID)) {
      map.addLayer(
        asLayer({
          id: FILL_ID,
          type: "fill",
          source: SOURCE_ID,
          paint: { "fill-color": incidentRadiusFillCss(isDarkTheme) }
        })
      );
    }
    if (!map.getLayer(LINE_ID)) {
      map.addLayer(
        asLayer({
          id: LINE_ID,
          type: "line",
          source: SOURCE_ID,
          layout: { "line-join": "round" },
          paint: {
            "line-color": incidentRadiusStrokeCss(isDarkTheme),
            "line-width": INCIDENT_RADIUS_OUTLINE_WIDTH,
            "line-dasharray": [3, 2]
          }
        })
      );
    }

    map.setPaintProperty(FILL_ID, "fill-color", incidentRadiusFillCss(isDarkTheme));
    map.setPaintProperty(LINE_ID, "line-color", incidentRadiusStrokeCss(isDarkTheme));
  }, [mapRef, isReady, styleEpoch, incidentRadius, isDarkTheme]);

  // Drop the source/layers when the hook goes away. The ref is read in the
  // cleanup because the map is built asynchronously.
  useEffect(() => {
    return () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      const map = mapRef.current;
      if (map) {
        removeLayers(map);
      }
    };
  }, [mapRef]);
}
