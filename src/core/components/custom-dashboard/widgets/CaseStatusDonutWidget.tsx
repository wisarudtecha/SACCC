// src/core/components/custom-dashboard/widgets/CaseStatusDonutWidget.tsx
import React from "react";
import Chart from "react-apexcharts";
import type { ApexOptions } from "apexcharts";
import { useTranslation } from "@/core/hooks/useTranslation";
import {
  CHART_FONT_FAMILY,
  SERIES_COLORS,
  statusLabels,
} from "@/core/components/custom-dashboard/widgets/chartTheme";
import type { WidgetRenderProps } from "@/core/components/custom-dashboard/widgets/types";

/** Status split for the most recent period of the series. */
export const CaseStatusDonutWidget: React.FC<WidgetRenderProps> = ({ widget, data }) => {
  const { language } = useTranslation();

  if (data.kind !== "case-series") {
    return null;
  }

  const labels = statusLabels(language);

  const options: ApexOptions = {
    colors: SERIES_COLORS,
    chart: {
      fontFamily: CHART_FONT_FAMILY,
      sparkline: { enabled: true },
    },
    fill: { colors: SERIES_COLORS, type: "solid" },
    labels: [labels.complete, labels.inProgress, labels.new],
    legend: { show: true },
    plotOptions: {
      pie: {
        donut: {
          size: "75%",
          labels: {
            show: true,
            total: { label: language === "th" ? "รวม" : "Total", show: true },
          },
        },
      },
    },
    stroke: { lineCap: "round", show: false },
    tooltip: { enabled: false },
  };

  return (
    <div className="flex h-full items-center justify-center">
      <Chart
        key={`${widget.id}-${widget.position.colSpan}-${widget.position.rowSpan}`}
        options={options}
        series={data.latest}
        type="donut"
        height={180}
      />
    </div>
  );
};
