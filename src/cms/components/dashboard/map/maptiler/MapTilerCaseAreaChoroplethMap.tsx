// src/cms/components/dashboard/map/maptiler/MapTilerCaseAreaChoroplethMap.tsx
//
// Minimal, read-only MapLibre map: one GeoJSON source + fill/line layers,
// colour-by-bucket. NOT built on MapTilerAddressMap.tsx (case-creation-only
// machinery this feature needs none of). Bootstrap mirrors its mount effect
// (ensureMapTilerWorker -> MlMap) at a much smaller scale.
import { useEffect, useRef, useState } from "react";
import { Map as MlMap, Popup, type GeoJSONSource, type MapMouseEvent } from "maplibre-gl";
import type { FeatureCollection } from "geojson";
import { ensureMapTilerWorker } from "@/cms/components/case/createCase/map/maptiler/maptilerSetup";
import { mapTilerStyleFor } from "@/cms/components/case/createCase/map/maptiler/maptilerBasemaps";
import { DEFAULT_BASEMAP_ID } from "@/cms/components/case/createCase/map/basemaps";
import { asLayer } from "@/cms/components/case/createCase/map/maptiler/mlTypes";
import { caseAreaFillColorExpression } from "@/cms/components/dashboard/map/maptiler/caseAreaChoroplethPaint";
import { CASE_AREA_MAP_DEFAULT_CENTER, CASE_AREA_MAP_DEFAULT_HEIGHT, CASE_AREA_MAP_DEFAULT_ZOOM, type CaseAreaChoroplethProviderMapProps } from "@/cms/components/dashboard/map/caseAreaMapTypes";

const SOURCE_ID = "case-area-choropleth";
const FILL_LAYER_ID = "case-area-choropleth-fill";
const LINE_LAYER_ID = "case-area-choropleth-line";
const FILL_ALPHA = 0.6;
const OUTLINE_ALPHA = 0.9;

const toCollection = (features: CaseAreaChoroplethProviderMapProps["features"]): FeatureCollection => ({
  type: "FeatureCollection",
  features: features.map(feature => ({
    type: "Feature",
    geometry: feature.geometry,
    properties: {
      __nameEn: feature.nameEn,
      __nameTh: feature.nameTh,
      __value: feature.value,
      __bucket: feature.bucket,
    },
  })),
});

export const MapTilerCaseAreaChoroplethMap: React.FC<CaseAreaChoroplethProviderMapProps> = ({
  features,
  isDarkTheme,
  language,
  height = CASE_AREA_MAP_DEFAULT_HEIGHT,
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
          center: CASE_AREA_MAP_DEFAULT_CENTER,
          zoom: CASE_AREA_MAP_DEFAULT_ZOOM,
          attributionControl: { compact: true },
        });
        mapRef.current = map;
        map.on("load", () => setIsReady(true));
        map.on("error", event => {
          console.error("MapTiler choropleth map error", (event as { error?: unknown })?.error ?? event);
        });
      })
      .catch((error: unknown) => {
        if (!isCancelled) {
          console.error("Failed to initialise the MapTiler choropleth map", error);
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

  // Draw the joined features.
  useEffect(() => {
    const map = mapRef.current;
    if (!isReady || !map) {
      return;
    }

    const data = toCollection(features);
    const existingSource = map.getSource(SOURCE_ID);
    if (existingSource && "setData" in existingSource) {
      (existingSource as GeoJSONSource).setData(data);
    }
    else {
      map.addSource(SOURCE_ID, { type: "geojson", data });
      map.addLayer(
        asLayer({
          id: FILL_LAYER_ID,
          type: "fill",
          source: SOURCE_ID,
          paint: { "fill-color": caseAreaFillColorExpression(isDarkTheme, FILL_ALPHA) },
        })
      );
      map.addLayer(
        asLayer({
          id: LINE_LAYER_ID,
          type: "line",
          source: SOURCE_ID,
          paint: {
            "line-color": caseAreaFillColorExpression(isDarkTheme, OUTLINE_ALPHA),
            "line-width": 1,
          },
        })
      );

      const popup = new Popup({ closeButton: false });
      map.on("click", FILL_LAYER_ID, (event: MapMouseEvent) => {
        const feature = map.queryRenderedFeatures(event.point, { layers: [FILL_LAYER_ID] })[0];
        if (!feature) {
          return;
        }
        const name = language === "th" ? feature.properties?.__nameTh : feature.properties?.__nameEn;
        popup
          .setLngLat(event.lngLat)
          .setHTML(`<strong>${name ?? ""}</strong><br/>${feature.properties?.__value ?? ""}`)
          .addTo(map);
      });
      map.on("mouseenter", FILL_LAYER_ID, () => {
        map.getCanvas().style.cursor = "pointer";
      });
      map.on("mouseleave", FILL_LAYER_ID, () => {
        map.getCanvas().style.cursor = "";
      });
    }
  }, [features, isReady, isDarkTheme, language]);

  return <div ref={containerRef} style={{ height }} className="w-full rounded-lg" />;
};

export default MapTilerCaseAreaChoroplethMap;
