// src/core/components/custom-dashboard/widgets/CaseDailyChartWidget.tsx
import React from "react";
import { CaseSeriesChart } from "@/core/components/custom-dashboard/widgets/CaseSeriesChart";
import type { WidgetRenderProps } from "@/core/components/custom-dashboard/widgets/types";

export const CaseDailyChartWidget: React.FC<WidgetRenderProps> = ({ widget, data }) => {
  if (data.kind !== "case-series") {
    return null;
  }

  return <CaseSeriesChart widget={widget} data={data} />;
};
