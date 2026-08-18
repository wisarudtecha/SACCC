// src/core/components/custom-dashboard/widgets/TopOrderedWidget.tsx
import React from "react";
import { formatNumberWithComma, formatPrice } from "@/cms/utils/productHelper";
import { useTranslation } from "@/core/hooks/useTranslation";
import { pickText } from "@/core/components/custom-dashboard/widgets/chartTheme";
import type { WidgetRenderProps } from "@/core/components/custom-dashboard/widgets/types";

/** Ranked list of the most-ordered spare parts. */
export const TopOrderedWidget: React.FC<WidgetRenderProps> = ({ data }) => {
  const { t, language } = useTranslation();

  if (data.kind !== "top-ordered") {
    return null;
  }

  return (
    <div className="space-y-4">
      {data.items.map((item, index) => (
        <div
          key={`${item.rank}-${index}`}
          className="flex items-center justify-between rounded-2xl border border-gray-200 p-4 dark:border-gray-700"
        >
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white">
                {index + 1}
              </span>
              <p className="font-semibold text-gray-600 dark:text-gray-300">
                {pickText(item.name, language)}
              </p>
            </div>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              {t("productDashboard.topOrdered.orderedTimes", {
                count: formatNumberWithComma(item.quantity),
              })}
            </p>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-gray-600 dark:text-gray-300">
              {formatPrice(item.price, "THB", "th-TH", 0)}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              {t("productDashboard.topOrdered.unitPrice")}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};
