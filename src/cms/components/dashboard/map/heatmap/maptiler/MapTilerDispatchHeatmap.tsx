// src/cms/components/dashboard/map/heatmap/maptiler/MapTilerDispatchHeatmap.tsx
//
// Minimal, read-only MapLibre map: one GeoJSON source of case points rendered
// with MapLibre's native `heatmap` layer type. Mirrors
// MapTilerCaseAreaChoroplethMap.tsx's bootstrap, swapping the fill-paint
// choropleth layers for a heatmap layer. NOT built on MapTilerAddressMap.tsx
// (case-creation-only machinery this feature needs none of).
import { useEffect, useRef, useState } from "react";
import { Map as MlMap } from "maplibre-gl";
import type { GeoJSONSource } from "maplibre-gl";
import type { FeatureCollection } from "geojson";
import { ensureMapTilerWorker } from "@/cms/components/case/createCase/map/maptiler/maptilerSetup";
import { mapTilerStyleFor } from "@/cms/components/case/createCase/map/maptiler/maptilerBasemaps";
import { DEFAULT_BASEMAP_ID } from "@/cms/components/case/createCase/map/basemaps";
import { asLayer } from "@/cms/components/case/createCase/map/maptiler/mlTypes";
import {
  DISPATCH_HEATMAP_DEFAULT_CENTER,
  DISPATCH_HEATMAP_DEFAULT_ZOOM,
  type DispatchHeatmapProviderMapProps,
} from "@/cms/components/dashboard/map/heatmap/dispatchHeatmapTypes";

const MAP_HEIGHT = 520;
const SOURCE_ID = "dispatch-heatmap";
const LAYER_ID = "dispatch-heatmap-layer";

const toCollection = (points: DispatchHeatmapProviderMapProps["points"]): FeatureCollection => ({
  type: "FeatureCollection",
  features: points.map(point => ({
    type: "Feature",
    geometry: { type: "Point", coordinates: [point.lon, point.lat] },
    properties: { __weight: point.weight },
  })),
});

export const MapTilerDispatchHeatmap: React.FC<DispatchHeatmapProviderMapProps> = ({
  points,
  isDarkTheme,
  language,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MlMap | null>(null);
  const [isReady, setIsReady] = useState(false);

  // Build the map once on mount.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }
    let isCancelled = false;
    let map: MlMap | null = null;

    ensureMapTilerWorker()
      .then(() => {
        if (isCancelled || !containerRef.current) {
          return;
        }
        map = new MlMap({
          container: containerRef.current,
          style: mapTilerStyleFor(DEFAULT_BASEMAP_ID, isDarkTheme, language),
          center: DISPATCH_HEATMAP_DEFAULT_CENTER,
          zoom: DISPATCH_HEATMAP_DEFAULT_ZOOM,
          attributionControl: { compact: true },
        });
        mapRef.current = map;
        map.on("load", () => setIsReady(true));
        map.on("error", event => {
          console.error("MapTiler dispatch heatmap error", (event as { error?: unknown })?.error ?? event);
        });
      })
      .catch((error: unknown) => {
        if (!isCancelled) {
          console.error("Failed to initialise the MapTiler dispatch heatmap", error);
        }
      });

    return () => {
      isCancelled = true;
      map?.remove();
      mapRef.current = null;
    };
    // Build-once: theme/language changes are not re-applied to a live style
    // here since this map has no toggle for either while mounted.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Draw the case points.
  useEffect(() => {
    const map = mapRef.current;
    if (!isReady || !map) {
      return;
    }

    const data = toCollection(points);
    const existingSource = map.getSource(SOURCE_ID);
    if (existingSource && "setData" in existingSource) {
      (existingSource as GeoJSONSource).setData(data);
    }
    else {
      map.addSource(SOURCE_ID, { type: "geojson", data });
      map.addLayer(
        asLayer({
          id: LAYER_ID,
          type: "heatmap",
          source: SOURCE_ID,
          paint: {
            "heatmap-weight": ["get", "__weight"],
            "heatmap-intensity": 1,
            "heatmap-radius": 20,
            "heatmap-opacity": 0.8,
            "heatmap-color": [
              "interpolate",
              ["linear"],
              ["heatmap-density"],
              0, "rgba(0,0,255,0)",
              0.5, "rgba(255,255,0,0.7)",
              1, "rgba(255,0,0,0.9)",
            ],
          },
        })
      );
    }
  }, [points, isReady]);

  return <div ref={containerRef} style={{ height: MAP_HEIGHT }} className="w-full rounded-lg" />;
};

export default MapTilerDispatchHeatmap;
