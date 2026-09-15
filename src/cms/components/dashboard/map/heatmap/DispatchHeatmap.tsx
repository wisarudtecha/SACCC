// src/cms/components/dashboard/map/heatmap/DispatchHeatmap.tsx
//
// The provider switch: mirrors CaseAreaChoroplethMap.tsx's lazy-per-provider
// shell, but plots raw case coordinates directly - there is no polygon geometry
// to fetch or join here, so (unlike the choropleth map) this has no
// BOUNDARY_SOURCE guard and no loading state of its own beyond the provider
// chunk's own Suspense fallback.
import React, { Suspense, lazy } from "react";
import { API_CONFIG } from "@/core/config/api";
import { useTheme } from "@/core/context/ThemeContext";
import { useTranslation } from "@/core/hooks/useTranslation";
import { Skeleton } from "@/core/components/ui/loading/LoadingSystem";
import type { Case } from "@/cms/store/api/caseApi";
import { toHeatmapPoints } from "@/cms/components/dashboard/map/heatmap/caseHeatmapPoints";
import type { DispatchHeatmapProviderMapProps } from "@/cms/components/dashboard/map/heatmap/dispatchHeatmapTypes";

const ProviderMap: React.LazyExoticComponent<React.FC<DispatchHeatmapProviderMapProps>> =
  API_CONFIG.MAP_PROVIDER === "longdo"
    ? lazy(() => import("@/cms/components/dashboard/map/heatmap/longdo/LongdoDispatchHeatmap"))
    : API_CONFIG.MAP_PROVIDER === "maptiler"
      ? lazy(() => import("@/cms/components/dashboard/map/heatmap/maptiler/MapTilerDispatchHeatmap"))
      : lazy(() => import("@/cms/components/dashboard/map/heatmap/arcgis/ArcgisDispatchHeatmap"));

const MAP_PLACEHOLDER_HEIGHT = 520;

interface DispatchHeatmapProps {
  cases: Case[];
}

export const DispatchHeatmap: React.FC<DispatchHeatmapProps> = ({ cases }) => {
  const { language } = useTranslation();
  const { theme } = useTheme();
  const isDarkTheme = theme === "dark";
  const points = toHeatmapPoints(cases);

  return (
    <Suspense fallback={<Skeleton height={MAP_PLACEHOLDER_HEIGHT} />}>
      <ProviderMap points={points} isDarkTheme={isDarkTheme} language={language} />
    </Suspense>
  );
};

export default DispatchHeatmap;
