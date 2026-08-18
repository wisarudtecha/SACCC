// src/core/components/custom-dashboard/widgets/SlaPerformanceWidget.tsx
import React from "react";
import { AnimatedNumber, AnimatedPercentage } from "@/core/components/ui/animation/AnimatedNumber";
import { useTranslation } from "@/core/hooks/useTranslation";
import { pickText } from "@/core/components/custom-dashboard/widgets/chartTheme";
import type { WidgetRenderProps } from "@/core/components/custom-dashboard/widgets/types";

/** Progress bar widths are clamped — the server can report an inSLA count above total. */
const clampPercent = (value: number): number => Math.min(100, Math.max(0, value));

export const SlaPerformanceWidget: React.FC<WidgetRenderProps> = ({ data }) => {
  const { language } = useTranslation();

  if (data.kind !== "sla") {
    return null;
  }

  const metLabel = language === "th" ? "ปฏิบัติตาม SLA" : "In SLA";
  const overdueLabel = language === "th" ? "เกินกำหนด SLA" : "Over SLA";

  return (
    <div className="space-y-4">
      <div className="text-center">
        <AnimatedNumber
          value={data.inSla}
          duration={1.5}
          className="text-2xl font-bold text-green-600 dark:text-green-300"
        />
        <div className="text-xs text-gray-500 dark:text-gray-400">{metLabel}</div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600 dark:text-gray-300">{metLabel}</span>
          <AnimatedPercentage
            value={data.inSlaRate}
            duration={1.5}
            className="text-sm font-medium text-green-600 dark:text-green-300"
          />
        </div>
        <div className="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700">
          <div
            className="h-2 rounded-full bg-green-500 dark:bg-green-400"
            style={{ width: `${clampPercent(data.inSlaRate)}%` }}
          />
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600 dark:text-gray-300">{overdueLabel}</span>
          <AnimatedPercentage
            value={data.overSlaRate}
            duration={1.5}
            className="text-sm font-medium text-red-600 dark:text-red-300"
          />
        </div>
        <div className="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700">
          <div
            className="h-2 rounded-full bg-red-500 dark:bg-red-400"
            style={{ width: `${clampPercent(data.overSlaRate)}%` }}
          />
        </div>
      </div>

      <div className="border-t border-gray-200 pt-2 text-center dark:border-gray-700">
        <div className="text-lg font-bold text-gray-900 dark:text-white">
          <AnimatedNumber value={data.avgResponse} duration={1.5} />
          {pickText(data.unit, language)}
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400">
          {pickText(data.avgResponseLabel, language)}
        </div>
      </div>
    </div>
  );
};
