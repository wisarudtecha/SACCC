// src/core/components/custom-dashboard/widgets/GrowthMetricsWidget.tsx
import React from "react";
import { formatNumberWithComma } from "@/cms/utils/productHelper";
import { useTranslation } from "@/core/hooks/useTranslation";
import { getMetricIcon, translateOrHumanize } from "@/core/components/custom-dashboard/widgets/productShared";
import type { WidgetRenderProps } from "@/core/components/custom-dashboard/widgets/types";

/** Product/spare-part/ordering/pending totals with month-over-month growth. */
export const GrowthMetricsWidget: React.FC<WidgetRenderProps> = ({ data }) => {
  const { t } = useTranslation();

  if (data.kind !== "growth-metrics") {
    return null;
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {data.metrics.map(metric => {
        const Icon = getMetricIcon(metric.key);
        const isPositive = metric.growthRate >= 0;

        return (
          <div
            key={metric.key}
            className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {translateOrHumanize(t, metric.key, `productDashboard.metrics.titles.${metric.key}`)}
                </p>
                <h2 className="mt-2 text-3xl font-bold text-gray-600 dark:text-gray-300">
                  {formatNumberWithComma(metric.total)}
                </h2>
                <div className="mt-3 flex items-center gap-2">
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-medium ${
                      isPositive
                        ? "bg-green-100 text-green-600 dark:bg-green-800 dark:text-green-300"
                        : "bg-red-100 text-red-600 dark:bg-red-800 dark:text-red-300"
                    }`}
                  >
                    {isPositive ? "+" : ""}{metric.growthRate}%
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {t("productDashboard.metrics.fromLastMonth")}
                  </span>
                </div>
              </div>
              <div className="rounded-2xl bg-blue-100 p-3 dark:bg-blue-800">
                <Icon className="h-6 w-6 text-blue-600 dark:text-blue-300" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
