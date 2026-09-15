// src/core/components/custom-dashboard/widgets/CaseSummaryByAreaTopDistrictsWidget.tsx
import React from "react";
import { useTranslation } from "@/core/hooks/useTranslation";
import { pickText } from "@/core/components/custom-dashboard/widgets/chartTheme";
import type { WidgetRenderProps } from "@/core/components/custom-dashboard/widgets/types";
import type { CaseAreaRow } from "@/core/components/custom-dashboard/sources/types";

const DEFAULT_TOP_N = 5;

const rowTotalOf = (row: CaseAreaRow): number => row.total.complete + row.total.inprogress + row.total.new;

/** Ranked list of the districts with the most cases. Renders instantly from already-parsed data. */
export const CaseSummaryByAreaTopDistrictsWidget: React.FC<WidgetRenderProps> = ({ widget, data }) => {
  const { language } = useTranslation();

  if (data.kind !== "case-summary-by-area") {
    return null;
  }

  const topN = widget.config.topN ?? DEFAULT_TOP_N;
  const ranked = [...data.rows]
    .sort((a, b) => rowTotalOf(b) - rowTotalOf(a))
    .slice(0, topN);
  const maxTotal = Math.max(1, ...ranked.map(rowTotalOf));

  return (
    <div className="space-y-2">
      {ranked.map((row, index) => {
        const total = rowTotalOf(row);
        return (
          <div key={row.areaId} className="flex items-center gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-semibold text-white">
              {index + 1}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-sm font-medium text-gray-700 dark:text-gray-300">
                  {pickText(row.area, language)}
                </p>
                <p className="shrink-0 text-sm font-semibold text-gray-900 dark:text-white">
                  {total}
                </p>
              </div>
              <div className="mt-1 h-1.5 w-full rounded-full bg-gray-200 dark:bg-gray-700">
                <div
                  className="h-1.5 rounded-full bg-blue-500"
                  style={{ width: `${(total / maxTotal) * 100}%` }}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default CaseSummaryByAreaTopDistrictsWidget;
