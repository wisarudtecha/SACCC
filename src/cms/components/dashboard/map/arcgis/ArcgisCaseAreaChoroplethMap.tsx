// src/cms/components/dashboard/map/arcgis/ArcgisCaseAreaChoroplethMap.tsx
//
// Minimal, read-only ArcGIS map: draws one GeoJSONLayer of already-joined
// district polygons, colour-by-bucket. NOT built on ArcgisAddressMap.tsx -
// that component carries case-creation-only machinery (Search, staff, sketch,
// routing) this feature needs none of. Bootstrap sequence mirrors its mount
// effect (initArcgis -> esriMap -> MapView) at a much smaller scale.
import { useEffect, useRef, useState } from "react";
import esriMap from "@arcgis/core/Map.js";
import MapView from "@arcgis/core/views/MapView.js";
import GeoJSONLayer from "@arcgis/core/layers/GeoJSONLayer.js";
import PopupTemplate from "@arcgis/core/PopupTemplate.js";
import "@arcgis/core/assets/esri/themes/light/main.css";
import { initArcgis } from "@/cms/components/case/createCase/map/arcgisSetup";
import { createBasemap, toEsriLanguage } from "@/cms/components/case/createCase/map/arcgisBasemaps";
import { DEFAULT_BASEMAP_ID } from "@/cms/components/case/createCase/map/basemaps";
import { createCaseAreaChoroplethRenderer } from "@/cms/components/dashboard/map/arcgis/caseAreaChoroplethRenderer";
import { CASE_AREA_MAP_DEFAULT_CENTER, CASE_AREA_MAP_DEFAULT_HEIGHT, CASE_AREA_MAP_DEFAULT_ZOOM, type CaseAreaChoroplethProviderMapProps } from "@/cms/components/dashboard/map/caseAreaMapTypes";

export const ArcgisCaseAreaChoroplethMap: React.FC<CaseAreaChoroplethProviderMapProps> = ({
  features,
  isDarkTheme,
  language,
  height = CASE_AREA_MAP_DEFAULT_HEIGHT,
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
      center: CASE_AREA_MAP_DEFAULT_CENTER,
      zoom: CASE_AREA_MAP_DEFAULT_ZOOM,
    });
    view.ui.components = ["zoom"];
    viewRef.current = view;

    view.when(() => setIsReady(true), (error: unknown) => {
      console.error("Failed to initialise the ArcGIS choropleth map", error);
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

  // Draw the joined features. Rebuilt whenever the data or theme changes -
  // cheap, since this is a small, single-purpose layer (unlike the boundary
  // layers, which stay mounted and update in place).
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
      features: features.map((feature, index) => ({
        type: "Feature" as const,
        properties: {
          OBJECTID: index + 1,
          NAME_EN: feature.nameEn,
          NAME_TH: feature.nameTh,
          VALUE: feature.value,
          BUCKET: feature.bucket,
        },
        geometry: feature.geometry,
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
      geometryType: "polygon",
      outFields: ["NAME_EN", "NAME_TH", "VALUE", "BUCKET"],
      popupEnabled: true,
      popupTemplate: new PopupTemplate({
        title: language === "th" ? "{NAME_TH}" : "{NAME_EN}",
        content: "{VALUE}",
      }),
      renderer: createCaseAreaChoroplethRenderer(isDarkTheme),
    });

    layer.load().catch((error: unknown) => {
      console.error("Failed to load the case-area choropleth layer", error);
    });

    view.map.add(layer);
    layerRef.current = layer;
  }, [features, isReady, isDarkTheme, language]);

  return <div ref={containerRef} style={{ height }} className="w-full rounded-lg" />;
};

export default ArcgisCaseAreaChoroplethMap;
