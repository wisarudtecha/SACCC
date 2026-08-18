// src/core/components/custom-dashboard/widgets/CaseSummaryMetricsWidget.tsx
import React from "react";
import { LayoutGrid } from "lucide-react";
import { AnimatedNumber } from "@/core/components/ui/animation/AnimatedNumber";
import { useTranslation } from "@/core/hooks/useTranslation";
import { pickText } from "@/core/components/custom-dashboard/widgets/chartTheme";
import type { WidgetRenderProps } from "@/core/components/custom-dashboard/widgets/types";

/**
 * Total case count plus a card per group. Groups are whatever the payload sends
 * (`g1`, `g2`, …) — this widget does not assume how many there are.
 */
export const CaseSummaryMetricsWidget: React.FC<WidgetRenderProps> = ({ data }) => {
  const { language } = useTranslation();

  if (data.kind !== "case-summary") {
    return null;
  }

  return (
    <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
      <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
        <LayoutGrid className="text-green-500 dark:text-green-400" size={24} />
        <div>
          <div className="text-sm text-green-500 dark:text-green-400">
            {language === "th" ? "ทั้งหมด" : "Total"}
          </div>
          <AnimatedNumber
            value={data.total}
            duration={1.2}
            className="text-3xl font-bold text-green-500 dark:text-green-400"
          />
        </div>
      </div>

      {data.groups.map(group => (
        <div
          key={group.label.en || group.label.th}
          className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
        >
          <div>
            <div className="text-sm text-gray-900 dark:text-white">
              {pickText(group.label, language)}
            </div>
            <AnimatedNumber
              value={group.value}
              duration={1.2}
              className="text-3xl font-bold text-gray-900 dark:text-white"
            />
          </div>
        </div>
      ))}
    </div>
  );
};
