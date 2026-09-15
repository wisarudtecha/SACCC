// src/cms/components/dashboard/CaseSummaryByAreaHeatmapWidget.tsx
import React from "react";
import { CaseAreaChoroplethMap } from "@/cms/components/dashboard/map/CaseAreaChoroplethMap";
import type { WidgetRenderProps } from "@/core/components/custom-dashboard/widgets/types";

/** Widget-tile height: fits a rowSpan:2 grid card alongside its header, legend, and notices. */
const WIDGET_MAP_HEIGHT = 320;

export const CaseSummaryByAreaHeatmapWidget: React.FC<WidgetRenderProps> = ({ data }) => {
  if (data.kind !== "case-summary-by-area") {
    return null;
  }

  return <CaseAreaChoroplethMap rows={data.rows} height={WIDGET_MAP_HEIGHT} />;
};

export default CaseSummaryByAreaHeatmapWidget;
