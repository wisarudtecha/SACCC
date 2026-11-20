// src/cms/components/dashboard/CaseSummaryByAreaHeatmapWidget.tsx
import React from "react";
import { CaseAreaChoroplethMap } from "@/cms/components/dashboard/map/CaseAreaChoroplethMap";
import { useEntitlements } from "@/core/hooks/useEntitlements";
import type { WidgetRenderProps } from "@/core/components/custom-dashboard/widgets/types";

/** Widget-tile height: fits a rowSpan:2 grid card alongside its header, legend, and notices. */
const WIDGET_MAP_HEIGHT = 320;

export const CaseSummaryByAreaHeatmapWidget: React.FC<WidgetRenderProps> = ({ data }) => {
  // The widget is a GIS map: the registry hides it from the widget library for an
  // unentitled tenant, and this keeps a layout saved while entitled from rendering an
  // empty card after a downgrade.
  const { hasFeature } = useEntitlements();
  if (!hasFeature("entitlement.gis")) {
    return null;
  }

  if (data.kind !== "case-summary-by-area") {
    return null;
  }

  return <CaseAreaChoroplethMap rows={data.rows} height={WIDGET_MAP_HEIGHT} />;
};

export default CaseSummaryByAreaHeatmapWidget;
