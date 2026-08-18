// src/core/components/custom-dashboard/widgets/CaseSeriesChart.tsx
import React, { useMemo } from "react";
import Chart from "react-apexcharts";
import type { ApexOptions } from "apexcharts";
import { useTranslation } from "@/core/hooks/useTranslation";
import {
  CHART_FONT_FAMILY,
  SERIES_COLORS,
  statusLabels,
} from "@/core/components/custom-dashboard/widgets/chartTheme";
import type { CaseSeriesData } from "@/core/components/custom-dashboard/sources/types";
import type { DashboardWidget } from "@/core/types/dashboardLayout";

interface CaseSeriesChartProps {
  widget: DashboardWidget;
  data: CaseSeriesData;
  /** Show only the trailing N periods. Undefined shows the whole series. */
  periodLimit?: number;
}

/**
 * Stacked bar shared by the daily and monthly widgets — both sources parse to the same
 * `case-series` shape, so they differ only in how many trailing periods they show.
 */
export const CaseSeriesChart: React.FC<CaseSeriesChartProps> = ({ widget, data, periodLimit }) => {
  const { language } = useTranslation();
  const labels = statusLabels(language);

  const { categories, series } = useMemo(() => {
    const allCategories = language === "th" ? data.categories.th : data.categories.en;
    const start =
      periodLimit && periodLimit > 0 ? Math.max(0, allCategories.length - periodLimit) : 0;

    return {
      categories: allCategories.slice(start),
      series: [
        { name: labels.complete, data: data.series.complete.slice(start) },
        { name: labels.inProgress, data: data.series.inprogress.slice(start) },
        { name: labels.new, data: data.series.new.slice(start) },
      ],
    };
  }, [data, language, periodLimit, labels.complete, labels.inProgress, labels.new]);

  const options: ApexOptions = {
    colors: SERIES_COLORS,
    chart: {
      fontFamily: CHART_FONT_FAMILY,
      stacked: true,
      toolbar: { show: false },
    },
    dataLabels: { enabled: true },
    fill: { opacity: 0.6 },
    grid: { yaxis: { lines: { show: false } } },
    legend: {
      fontFamily: CHART_FONT_FAMILY,
      horizontalAlign: "right",
      position: "top",
      show: true,
    },
    plotOptions: {
      bar: {
        columnWidth: "39%",
        borderRadius: 0,
        borderRadiusApplication: "end",
        horizontal: false,
        dataLabels: { total: { enabled: true, offsetY: -2 } },
      },
    },
    stroke: { colors: ["transparent"], show: true, width: 0 },
    xaxis: {
      categories,
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: {
        formatter: value => (typeof value === "string" ? value.split(" ").join("\n") : ""),
      },
    },
    yaxis: { title: { text: undefined } },
    tooltip: {
      x: { show: false },
      y: { formatter: (value: number) => `${value}` },
    },
  };

  return (
    <Chart
      // ApexCharts does not reliably re-measure when its grid cell resizes, so a span
      // change must remount it rather than just re-render it.
      key={`${widget.id}-${widget.position.colSpan}-${widget.position.rowSpan}`}
      options={options}
      series={series}
      type="bar"
      height="100%"
    />
  );
};
