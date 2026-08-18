// src/core/components/custom-dashboard/widgets/ModuleOverviewWidget.tsx
import React from "react";
import { formatNumberWithComma } from "@/cms/utils/productHelper";
import { useTranslation } from "@/core/hooks/useTranslation";
import { getModuleIcon, translateOrHumanize } from "@/core/components/custom-dashboard/widgets/productShared";
import type { WidgetRenderProps } from "@/core/components/custom-dashboard/widgets/types";

/** Active-record counts across product stock, spare parts, customers, appointments. */
export const ModuleOverviewWidget: React.FC<WidgetRenderProps> = ({ data }) => {
  const { t } = useTranslation();

  if (data.kind !== "module-overview") {
    return null;
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {data.modules.map(module => {
        const Icon = getModuleIcon(module.key);

        return (
          <div
            key={module.key}
            className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
          >
            <div className="flex items-center gap-4">
              <div className="rounded-xl bg-blue-100 p-3 dark:bg-blue-800">
                <Icon className="h-5 w-5 text-blue-600 dark:text-blue-300" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {translateOrHumanize(t, module.key, `productDashboard.moduleOverview.titles.${module.key}`)}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  {t("productDashboard.moduleOverview.activeRecords")}
                </p>
              </div>
            </div>
            <div className="text-xl font-bold text-gray-600 dark:text-gray-300">
              {formatNumberWithComma(module.totalActive)}
            </div>
          </div>
        );
      })}
    </div>
  );
};
