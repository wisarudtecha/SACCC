// src/cms/components/dashboard/map/longdo/LongdoCaseAreaChoroplethMap.tsx
//
// Minimal, read-only Longdo map: one longdo.Polygon per joined district,
// colour-by-bucket, labelled with its case count (Longdo overlays have no
// well-established click/popup path outside the case-creation map's own
// pin-placement wiring - a permanent on-polygon label is the same, already
// proven, non-interactive mechanism useLongdoBoundaryOverlays.ts uses for
// district names). NOT built on LongdoAddressMap.tsx (case-creation-only
// machinery this feature needs none of).
import { useEffect, useRef, useState } from "react";
import { loadLongdo } from "@/cms/components/case/createCase/map/longdo/longdoSetup";
import { applyLongdoBasemap, toLongdoLanguage } from "@/cms/components/case/createCase/map/longdo/longdoBasemaps";
import { DEFAULT_BASEMAP_ID } from "@/cms/components/case/createCase/map/basemaps";
import { toLongdoLocations } from "@/cms/components/case/createCase/map/longdo/longdoGeometry";
import type { LongdoGlobal, LongdoMap, LongdoOverlay } from "@/cms/components/case/createCase/map/longdo/longdoApi";
import { caseAreaPolygonStyle } from "@/cms/components/dashboard/map/longdo/caseAreaChoroplethStyle";
import { CASE_AREA_MAP_DEFAULT_CENTER, CASE_AREA_MAP_DEFAULT_HEIGHT, CASE_AREA_MAP_DEFAULT_ZOOM, type CaseAreaChoroplethProviderMapProps } from "@/cms/components/dashboard/map/caseAreaMapTypes";

export const LongdoCaseAreaChoroplethMap: React.FC<CaseAreaChoroplethProviderMapProps> = ({
  features,
  isDarkTheme,
  language,
  height = CASE_AREA_MAP_DEFAULT_HEIGHT,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const longdoRef = useRef<LongdoGlobal | null>(null);
  const mapRef = useRef<LongdoMap | null>(null);
  const overlaysRef = useRef<LongdoOverlay[]>([]);
  const [isReady, setIsReady] = useState(false);

  // Build the map once on mount.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }
    let isCancelled = false;

    loadLongdo()
      .then(longdo => {
        if (isCancelled) {
          return;
        }
        longdoRef.current = longdo;
        const map = new longdo.Map({
          placeholder: container,
          location: { lon: CASE_AREA_MAP_DEFAULT_CENTER[0], lat: CASE_AREA_MAP_DEFAULT_CENTER[1] },
          zoom: CASE_AREA_MAP_DEFAULT_ZOOM,
          language: toLongdoLanguage(language),
        });
        mapRef.current = map;
        applyLongdoBasemap(longdo, map, DEFAULT_BASEMAP_ID, isDarkTheme);
        setIsReady(true);
      })
      .catch((error: unknown) => {
        if (!isCancelled) {
          console.error("Failed to initialise the Longdo choropleth map", error);
        }
      });

    return () => {
      isCancelled = true;
      const disposable = mapRef.current as unknown as { destroy?: () => void; remove?: () => void } | null;
      if (typeof disposable?.destroy === "function") {
        disposable.destroy();
      }
      else if (typeof disposable?.remove === "function") {
        disposable.remove();
      }
      container.innerHTML = "";
      mapRef.current = null;
      longdoRef.current = null;
    };
    // Build-once: theme/language changes are not re-applied to a live map
    // here since this map has no toggle for either while mounted.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Draw the joined features - rebuilt each time, per the SDK's "options are
  // fixed at construction" rule (see useLongdoBoundaryOverlays.ts's header).
  useEffect(() => {
    const longdo = longdoRef.current;
    const map = mapRef.current;
    if (!isReady || !longdo || !map) {
      return;
    }

    overlaysRef.current.forEach(overlay => map.Overlays.remove(overlay));
    overlaysRef.current = [];

    const created: LongdoOverlay[] = [];
    features.forEach(feature => {
      if (feature.geometry.type !== "Polygon") {
        return;
      }
      const outerRing = feature.geometry.coordinates[0];
      if (!outerRing || outerRing.length < 3) {
        return;
      }
      const name = language === "th" ? feature.nameTh : feature.nameEn;
      const overlay = new longdo.Polygon(
        toLongdoLocations(outerRing),
        caseAreaPolygonStyle(feature.bucket, isDarkTheme, `${name}: ${feature.value}`)
      );
      map.Overlays.add(overlay);
      created.push(overlay);
    });
    overlaysRef.current = created;
  }, [features, isReady, isDarkTheme, language]);

  return <div ref={containerRef} style={{ height }} className="w-full rounded-lg" />;
};

export default LongdoCaseAreaChoroplethMap;
