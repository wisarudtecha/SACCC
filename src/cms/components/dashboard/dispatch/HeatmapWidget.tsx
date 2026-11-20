// src/cms/components/dashboard/dispatch/HeatmapWidget.tsx
import React from "react";
import type { SelfFetchingWidgetRenderProps } from "@/core/components/custom-dashboard/widgets/types";
import { Skeleton } from "@/core/components/ui/loading/LoadingSystem";
import { CompactWidgetTile } from "@/core/components/custom-dashboard/widgets/CompactWidgetTile";
import { useTranslation } from "@/core/hooks/useTranslation";
import { useEntitlements } from "@/core/hooks/useEntitlements";
import { useDispatchHeatmapCases } from "@/cms/components/dashboard/dispatch/useDispatchHeatmapCases";
import { DispatchHeatmap } from "@/cms/components/dashboard/map/heatmap/DispatchHeatmap";

const MAP_PLACEHOLDER_HEIGHT = 460;

export const HeatmapWidget: React.FC<SelfFetchingWidgetRenderProps> = ({ compact, icon }) => {
  const { t } = useTranslation();
  // The widget IS a GIS map (its compact tile counts the same heatmap sample), so an
  // unentitled tenant gets nothing - not an empty card, and not the fetch either. The
  // registry also hides this widget from the library; this is the belt to that brace.
  const { hasFeature } = useEntitlements();
  const hasGis = hasFeature("entitlement.gis");
  const { cases, isLoading } = useDispatchHeatmapCases({ enabled: hasGis });

  if (!hasGis) {
    return null;
  }

  if (isLoading) {
    return <Skeleton height={compact ? 88 : MAP_PLACEHOLDER_HEIGHT} />;
  }

  if (compact) {
    return (
      <CompactWidgetTile
        icon={icon}
        label={t("dashboard.custom.widgets.incident_heatmap.compact_label")}
        value={cases.length}
      />
    );
  }

  return <DispatchHeatmap cases={cases} />;
};

export default HeatmapWidget;
