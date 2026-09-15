// src/cms/components/dashboard/dispatch/HeatmapWidget.tsx
import React from "react";
import type { SelfFetchingWidgetRenderProps } from "@/core/components/custom-dashboard/widgets/types";
import { Skeleton } from "@/core/components/ui/loading/LoadingSystem";
import { CompactWidgetTile } from "@/core/components/custom-dashboard/widgets/CompactWidgetTile";
import { useTranslation } from "@/core/hooks/useTranslation";
import { useDispatchHeatmapCases } from "@/cms/components/dashboard/dispatch/useDispatchHeatmapCases";
import { DispatchHeatmap } from "@/cms/components/dashboard/map/heatmap/DispatchHeatmap";

const MAP_PLACEHOLDER_HEIGHT = 460;

export const HeatmapWidget: React.FC<SelfFetchingWidgetRenderProps> = ({ compact, icon }) => {
  const { t } = useTranslation();
  const { cases, isLoading } = useDispatchHeatmapCases();

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
