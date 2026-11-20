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
import { API_CONFIG, type MapProviderId } from "@/core/config/api";
import { EntitlementGate } from "@/core/components/entitlements/EntitlementGate";
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
import { useMapRuntimeConfig } from "@/cms/components/case/createCase/map/useMapRuntimeConfig";
import { registerMountedMap } from "@/cms/components/case/createCase/map/mapRuntimeConfig";

const isLocalBoundarySource = API_CONFIG.BOUNDARY_SOURCE === "local";

const ArcgisChoropleth = lazy(
  () => import("@/cms/components/dashboard/map/arcgis/ArcgisCaseAreaChoroplethMap")
);
const LongdoChoropleth = lazy(
  () => import("@/cms/components/dashboard/map/longdo/LongdoCaseAreaChoroplethMap")
);
const MapTilerChoropleth = lazy(
  () => import("@/cms/components/dashboard/map/maptiler/MapTilerCaseAreaChoroplethMap")
);

/** A plain function, not a component: see renderAddressMapFor in AddressMap.tsx. */
function renderChoroplethFor(
  provider: MapProviderId,
  props: CaseAreaChoroplethProviderMapProps
) {
  switch (provider) {
    case "longdo":
      return <LongdoChoropleth {...props} />;
    case "maptiler":
      return <MapTilerChoropleth {...props} />;
    case "arcgis":
    default:
      return <ArcgisChoropleth {...props} />;
  }
}

interface CaseAreaChoroplethMapProps {
  rows: CaseAreaRow[];
  height?: number;
}

/**
 * The map itself. Deliberately NOT exported: it must never be mounted without the
 * entitlement gate below, because the boundary geometry fetch in its effect runs on
 * mount and would pull district polygons out of object storage for a tenant that has
 * not bought the GIS add-on.
 */
const CaseAreaChoroplethMapContent: React.FC<CaseAreaChoroplethMapProps> = ({ rows, height = CASE_AREA_MAP_DEFAULT_HEIGHT }) => {
  const { t, language } = useTranslation();
  const { theme } = useTheme();
  const { provider, settled } = useMapRuntimeConfig();
  const isDarkTheme = theme === "dark";

  // A provider switch is on screen: see registerMountedMap.
  useEffect(() => registerMountedMap(), []);

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

  // Placeholder until the session's provider is known: drawing with the
  // deployment default first would remount the map when the org's choice lands.
  if (!settled) {
    return <Skeleton height={height} />;
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
      <Suspense fallback={<Skeleton height={height} />}>
        {renderChoroplethFor(provider, {
          features: joined,
          buckets,
          isDarkTheme,
          language,
          height
        })}
      </Suspense>
    </div>
  );
};

/**
 * The GIS add-on gate, hoisted to the PROVIDER SWITCH rather than left to each caller -
 * the same shape as `AddressMap`, and for the same reasons: an unentitled tenant never
 * downloads the map SDK chunk, never fetches boundary geometry, and every consumer (the
 * dashboard page, the custom-dashboard widget, anything added later) is gated by
 * construction instead of by remembering to check.
 *
 * The gate renders the standard lock block when the product is advertising the add-on
 * and nothing at all when `VITE_SHOW_ENTITLEMENT_UPSELL="false"` - callers that would
 * otherwise leave an empty hole (a dashboard card, a tab) hide the container themselves.
 */
export const CaseAreaChoroplethMap: React.FC<CaseAreaChoroplethMapProps> = (props) => (
  <EntitlementGate feature="entitlement.gis">
    <CaseAreaChoroplethMapContent {...props} />
  </EntitlementGate>
);

export default CaseAreaChoroplethMap;
