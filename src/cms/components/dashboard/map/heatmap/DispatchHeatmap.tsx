// src/cms/components/dashboard/map/heatmap/DispatchHeatmap.tsx
//
// The provider switch: mirrors CaseAreaChoroplethMap.tsx's lazy-per-provider
// shell, but plots raw case coordinates directly - there is no polygon geometry
// to fetch or join here, so (unlike the choropleth map) this has no
// BOUNDARY_SOURCE guard and no loading state of its own beyond the provider
// chunk's own Suspense fallback.
//
// The provider comes from `mapRuntimeConfig` (an org may override the deployment
// default), resolved once per session - see AddressMap.tsx for why it must not be
// swapped live. All three implementations stay lazy, so a tenant still downloads
// only the SDK it draws with.
import React, { Suspense, lazy, useEffect } from "react";
import type { MapProviderId } from "@/core/config/api";
import { EntitlementGate } from "@/core/components/entitlements/EntitlementGate";
import { useTheme } from "@/core/context/ThemeContext";
import { useTranslation } from "@/core/hooks/useTranslation";
import { Skeleton } from "@/core/components/ui/loading/LoadingSystem";
import type { Case } from "@/cms/store/api/caseApi";
import { toHeatmapPoints } from "@/cms/components/dashboard/map/heatmap/caseHeatmapPoints";
import type { DispatchHeatmapProviderMapProps } from "@/cms/components/dashboard/map/heatmap/dispatchHeatmapTypes";
import { useMapRuntimeConfig } from "@/cms/components/case/createCase/map/useMapRuntimeConfig";
import { registerMountedMap } from "@/cms/components/case/createCase/map/mapRuntimeConfig";

const ArcgisHeatmap = lazy(
  () => import("@/cms/components/dashboard/map/heatmap/arcgis/ArcgisDispatchHeatmap")
);
const LongdoHeatmap = lazy(
  () => import("@/cms/components/dashboard/map/heatmap/longdo/LongdoDispatchHeatmap")
);
const MapTilerHeatmap = lazy(
  () => import("@/cms/components/dashboard/map/heatmap/maptiler/MapTilerDispatchHeatmap")
);

/** A plain function, not a component: see renderAddressMapFor in AddressMap.tsx. */
function renderHeatmapFor(provider: MapProviderId, props: DispatchHeatmapProviderMapProps) {
  switch (provider) {
    case "longdo":
      return <LongdoHeatmap {...props} />;
    case "maptiler":
      return <MapTilerHeatmap {...props} />;
    case "arcgis":
    default:
      return <ArcgisHeatmap {...props} />;
  }
}

const MAP_PLACEHOLDER_HEIGHT = 520;

interface DispatchHeatmapProps {
  cases: Case[];
}

/** The map itself - not exported, so it can never be mounted without the gate below. */
const DispatchHeatmapContent: React.FC<DispatchHeatmapProps> = ({ cases }) => {
  const { language } = useTranslation();
  const { theme } = useTheme();
  const { provider, settled } = useMapRuntimeConfig();
  const isDarkTheme = theme === "dark";
  const points = toHeatmapPoints(cases);

  // A provider switch is on screen: see registerMountedMap.
  useEffect(() => registerMountedMap(), []);

  // Placeholder until the session's provider is known: drawing with the
  // deployment default first would remount the map when the org's choice lands.
  if (!settled) {
    return <Skeleton height={MAP_PLACEHOLDER_HEIGHT} />;
  }

  return (
    <Suspense fallback={<Skeleton height={MAP_PLACEHOLDER_HEIGHT} />}>
      {renderHeatmapFor(provider, { points, isDarkTheme, language })}
    </Suspense>
  );
};

/**
 * The GIS add-on gate at the PROVIDER SWITCH, mirroring `AddressMap` and
 * `CaseAreaChoroplethMap`: an unentitled tenant never downloads the map SDK chunk and
 * every caller is gated by construction. Consumers that would leave a hole when the gate
 * renders nothing (a dashboard section) hide their own container.
 */
export const DispatchHeatmap: React.FC<DispatchHeatmapProps> = (props) => (
  <EntitlementGate feature="entitlement.gis">
    <DispatchHeatmapContent {...props} />
  </EntitlementGate>
);

export default DispatchHeatmap;
