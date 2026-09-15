// src/cms/components/dashboard/map/CaseAreaChoroplethMap.tsx
//
// The provider switch: mirrors src/cms/components/case/createCase/map/
// AddressMap.tsx exactly - a module-scope `lazy(() => import(...))` chosen
// once from `API_CONFIG.MAP_PROVIDER`, so an environment configured for one
// map SDK never downloads the other two.
//
// Guards `API_CONFIG.BOUNDARY_SOURCE === "local"` BEFORE evaluating the lazy
// import at all: in that mode the boundary geometry is keyed by government
// AMP_CODE, not `distId`, and there is no crosswalk between the two anywhere
// in this codebase - so choosing "local" costs no chunk download and draws
// no silently-wrong map.
import React, { Suspense, lazy, useEffect, useState } from "react";
import { API_CONFIG } from "@/core/config/api";
import { useTheme } from "@/core/context/ThemeContext";
import { useTranslation } from "@/core/hooks/useTranslation";
import { Skeleton } from "@/core/components/ui/loading/LoadingSystem";
import type { CaseAreaRow } from "@/core/components/custom-dashboard/sources/types";
import { fetchCaseAreaDistrictFeatures } from "@/cms/components/dashboard/map/caseAreaGeometry";
import { joinCaseAreaRows, rowTotalOf } from "@/cms/components/dashboard/map/caseAreaMapJoin";
import { computeCaseAreaBuckets, type CaseAreaBuckets } from "@/cms/components/dashboard/map/caseAreaChoroplethColors";
import { CaseAreaChoroplethLegend } from "@/cms/components/dashboard/map/CaseAreaChoroplethLegend";
import { CaseAreaMapUnavailableNotice } from "@/cms/components/dashboard/map/CaseAreaMapUnavailableNotice";
import { CASE_AREA_MAP_DEFAULT_HEIGHT, type CaseAreaChoroplethProviderMapProps } from "@/cms/components/dashboard/map/caseAreaMapTypes";
import type { CaseAreaMapFeature } from "@/cms/components/dashboard/map/caseAreaMapJoin";

const isLocalBoundarySource = API_CONFIG.BOUNDARY_SOURCE === "local";

const ProviderMap: React.LazyExoticComponent<React.FC<CaseAreaChoroplethProviderMapProps>> | null =
  isLocalBoundarySource
    ? null
    : API_CONFIG.MAP_PROVIDER === "longdo"
      ? lazy(() => import("@/cms/components/dashboard/map/longdo/LongdoCaseAreaChoroplethMap"))
      : API_CONFIG.MAP_PROVIDER === "maptiler"
        ? lazy(() => import("@/cms/components/dashboard/map/maptiler/MapTilerCaseAreaChoroplethMap"))
        : lazy(() => import("@/cms/components/dashboard/map/arcgis/ArcgisCaseAreaChoroplethMap"));

interface CaseAreaChoroplethMapProps {
  rows: CaseAreaRow[];
  height?: number;
}

export const CaseAreaChoroplethMap: React.FC<CaseAreaChoroplethMapProps> = ({ rows, height = CASE_AREA_MAP_DEFAULT_HEIGHT }) => {
  const { t, language } = useTranslation();
  const { theme } = useTheme();
  const isDarkTheme = theme === "dark";

  const [isLoading, setIsLoading] = useState(true);
  const [joined, setJoined] = useState<CaseAreaMapFeature[]>([]);
  const [unmatchedCount, setUnmatchedCount] = useState(0);
  const [buckets, setBuckets] = useState<CaseAreaBuckets>({ thresholds: [] });

  useEffect(() => {
    if (isLocalBoundarySource) {
      setIsLoading(false);
      return;
    }
    let isCancelled = false;
    setIsLoading(true);

    fetchCaseAreaDistrictFeatures()
      .then(features => {
        if (isCancelled) {
          return;
        }
        const computedBuckets = computeCaseAreaBuckets(rows.map(rowTotalOf));
        const result = joinCaseAreaRows(features, rows, computedBuckets);
        setBuckets(computedBuckets);
        setJoined(result.joined);
        setUnmatchedCount(result.unmatchedRows.length);
      })
      .catch((error: unknown) => {
        if (!isCancelled) {
          console.error("Failed to load case-area choropleth geometry", error);
        }
      })
      .finally(() => {
        if (!isCancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [rows]);

  if (isLocalBoundarySource) {
    return <CaseAreaMapUnavailableNotice />;
  }

  if (isLoading) {
    return <Skeleton height={height} />;
  }

  return (
    <div className="space-y-3">
      <CaseAreaChoroplethLegend buckets={buckets} />
      {unmatchedCount > 0 && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-700 dark:bg-amber-900/30 dark:text-amber-200">
          {t("dashboard.case_summary_by_area.map_missing_boundaries", { count: unmatchedCount })}
        </div>
      )}
      {ProviderMap && (
        <Suspense fallback={<Skeleton height={height} />}>
          <ProviderMap features={joined} buckets={buckets} isDarkTheme={isDarkTheme} language={language} height={height} />
        </Suspense>
      )}
    </div>
  );
};

export default CaseAreaChoroplethMap;
