// src/core/components/custom-dashboard/widgets/CaseMonthlyChartWidget.tsx
import React from "react";
import { CaseSeriesChart } from "@/core/components/custom-dashboard/widgets/CaseSeriesChart";
import type { WidgetRenderProps } from "@/core/components/custom-dashboard/widgets/types";

const DEFAULT_MONTH_RANGE = 6;

export const CaseMonthlyChartWidget: React.FC<WidgetRenderProps> = ({ widget, data }) => {
  if (data.kind !== "case-series") {
    return null;
  }

  return (
    <CaseSeriesChart
      widget={widget}
      data={data}
      periodLimit={widget.config.monthRange ?? DEFAULT_MONTH_RANGE}
    />
  );
};
