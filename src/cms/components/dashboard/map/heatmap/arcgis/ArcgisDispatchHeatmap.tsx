// src/cms/components/dashboard/map/heatmap/arcgis/ArcgisDispatchHeatmap.tsx
//
// Minimal, read-only ArcGIS map: draws one GeoJSONLayer of case points with a
// HeatmapRenderer. Mirrors ArcgisCaseAreaChoroplethMap.tsx's bootstrap sequence,
// swapping the polygon UniqueValueRenderer for a point HeatmapRenderer. NOT built
// on ArcgisAddressMap.tsx - that component carries case-creation-only machinery
// (Search, staff, sketch, routing) this feature needs none of.
import { useEffect, useRef, useState } from "react";
import esriMap from "@arcgis/core/Map.js";
import MapView from "@arcgis/core/views/MapView.js";
import GeoJSONLayer from "@arcgis/core/layers/GeoJSONLayer.js";
import HeatmapRenderer from "@arcgis/core/renderers/HeatmapRenderer.js";
import "@arcgis/core/assets/esri/themes/light/main.css";
import { initArcgis } from "@/cms/components/case/createCase/map/arcgisSetup";
import { createBasemap, toEsriLanguage } from "@/cms/components/case/createCase/map/arcgisBasemaps";
import { DEFAULT_BASEMAP_ID } from "@/cms/components/case/createCase/map/basemaps";
import {
  DISPATCH_HEATMAP_DEFAULT_CENTER,
  DISPATCH_HEATMAP_DEFAULT_ZOOM,
  type DispatchHeatmapProviderMapProps,
} from "@/cms/components/dashboard/map/heatmap/dispatchHeatmapTypes";

const MAP_HEIGHT = 520;

const createDispatchHeatmapRenderer = () =>
  new HeatmapRenderer({
    field: "WEIGHT",
    colorStops: [
      { ratio: 0, color: [0, 0, 255, 0] },
      { ratio: 0.5, color: [255, 255, 0, 0.7] },
      { ratio: 1, color: [255, 0, 0, 0.9] },
    ],
    radius: 20,
    maxDensity: 0.05,
    minDensity: 0,
  });

export const ArcgisDispatchHeatmap: React.FC<DispatchHeatmapProviderMapProps> = ({
  points,
  isDarkTheme,
  language,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<MapView | null>(null);
  const layerRef = useRef<GeoJSONLayer | null>(null);
  const blobUrlRef = useRef<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  // Build the map once on mount.
  useEffect(() => {
    if (!containerRef.current) {
      return;
    }
    initArcgis();

    const map = new esriMap({
      basemap: createBasemap(DEFAULT_BASEMAP_ID, toEsriLanguage(language), isDarkTheme),
    });

    const view = new MapView({
      container: containerRef.current,
      map,
      center: DISPATCH_HEATMAP_DEFAULT_CENTER,
      zoom: DISPATCH_HEATMAP_DEFAULT_ZOOM,
    });
    view.ui.components = ["zoom"];
    viewRef.current = view;

    view.when(() => setIsReady(true), (error: unknown) => {
      console.error("Failed to initialise the ArcGIS dispatch heatmap", error);
    });

    return () => {
      view.destroy();
      viewRef.current = null;
      layerRef.current = null;
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
    };
    // Build-once: theme/language changes are not re-applied to a live basemap
    // here since this map has no toggle for either while mounted.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Draw the case points. Rebuilt whenever the data changes - cheap, since this
  // is a small, single-purpose layer.
  useEffect(() => {
    const view = viewRef.current;
    if (!isReady || !view?.map) {
      return;
    }

    if (layerRef.current) {
      view.map.remove(layerRef.current);
      layerRef.current.destroy();
    }

    const collection = {
      type: "FeatureCollection" as const,
      features: points.map((point, index) => ({
        type: "Feature" as const,
        properties: { OBJECTID: index + 1, WEIGHT: point.weight },
        geometry: { type: "Point" as const, coordinates: [point.lon, point.lat] },
      })),
    };

    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
    }
    const blob = new Blob([JSON.stringify(collection)], { type: "application/geo+json" });
    const url = URL.createObjectURL(blob);
    blobUrlRef.current = url;

    const layer = new GeoJSONLayer({
      url,
      objectIdField: "OBJECTID",
      geometryType: "point",
      outFields: ["WEIGHT"],
      renderer: createDispatchHeatmapRenderer(),
    });

    layer.load().catch((error: unknown) => {
      console.error("Failed to load the dispatch heatmap layer", error);
    });

    view.map.add(layer);
    layerRef.current = layer;
  }, [points, isReady]);

  return <div ref={containerRef} style={{ height: MAP_HEIGHT }} className="w-full rounded-lg" />;
};

export default ArcgisDispatchHeatmap;
