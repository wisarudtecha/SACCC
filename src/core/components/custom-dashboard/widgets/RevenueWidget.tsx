// src/core/components/custom-dashboard/widgets/RevenueWidget.tsx
import React from "react";
import { formatPriceWithCompact } from "@/cms/utils/productHelper";
import { useTranslation } from "@/core/hooks/useTranslation";
import type { WidgetRenderProps } from "@/core/components/custom-dashboard/widgets/types";

const clampPercent = (value: number): number => Math.min(100, Math.max(0, value));

/** Estimated monthly revenue with a parts/products split. */
export const RevenueWidget: React.FC<WidgetRenderProps> = ({ data }) => {
  const { t } = useTranslation();

  if (data.kind !== "revenue") {
    return null;
  }

  const hasTarget = data.target > 0;

  return (
    <div>
      <div className="flex items-center justify-center py-3">
        <div
          className={`flex h-48 w-48 rotate-45 items-center justify-center rounded-full border-14 border-blue-200 ${
            hasTarget ? "border-t-blue-600" : ""
          }`}
        >
          <div className="-rotate-45 text-center">
            <p className="text-sm text-gray-400 dark:text-gray-500">
              {t("productDashboard.revenue.thisMonth")}
            </p>
            <h2 className="text-4xl font-bold text-gray-500 dark:text-gray-300">
              {formatPriceWithCompact(data.target, "THB", "th-TH", 0)}
            </h2>
          </div>
        </div>
      </div>

      <div className="mt-0 space-y-4">
        <div>
          <div className="mb-1 flex items-center justify-between text-sm">
            <span className="text-gray-500 dark:text-gray-400">Parts</span>
            <span className="text-gray-600 dark:text-gray-300">{data.partsPercent}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-gray-300 dark:bg-gray-600">
            <div
              className="h-full rounded-full bg-blue-600 dark:bg-blue-400"
              style={{ width: `${clampPercent(data.partsPercent)}%` }}
            />
          </div>
        </div>

        <div>
          <div className="mb-1 flex items-center justify-between text-sm">
            <span className="text-gray-500 dark:text-gray-400">
              {t("productDashboard.revenue.products")}
            </span>
            <span className="text-gray-600 dark:text-gray-300">{data.productsPercent}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-gray-300 dark:bg-gray-600">
            <div
              className="h-full rounded-full bg-green-500 dark:bg-green-400"
              style={{ width: `${clampPercent(data.productsPercent)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
