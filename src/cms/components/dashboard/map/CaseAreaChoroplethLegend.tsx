// src/cms/components/dashboard/map/CaseAreaChoroplethLegend.tsx
import React from "react";
import { useTranslation } from "@/core/hooks/useTranslation";
import { useTheme } from "@/core/context/ThemeContext";
import { CHOROPLETH_BUCKET_COUNT, choroplethRgbaCss, type CaseAreaBuckets } from "@/cms/components/dashboard/map/caseAreaChoroplethColors";

interface CaseAreaChoroplethLegendProps {
  buckets: CaseAreaBuckets;
}

/** Swatch legend for the choropleth, provider-neutral (pure CSS, no map SDK). */
export const CaseAreaChoroplethLegend: React.FC<CaseAreaChoroplethLegendProps> = ({ buckets }) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const isDarkTheme = theme === "dark";

  const ranges = Array.from({ length: CHOROPLETH_BUCKET_COUNT }, (_, bucket) => {
    const lower = bucket === 0 ? 0 : buckets.thresholds[bucket - 1];
    const upper = buckets.thresholds[bucket];
    return { bucket, lower, upper };
  });

  return (
    <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
      <span className="font-medium text-gray-700 dark:text-gray-300">
        {t("dashboard.case_summary_by_area.row_total")}
      </span>
      {ranges.map(({ bucket, lower, upper }) => (
        <span key={bucket} className="flex items-center gap-1.5">
          <span
            className="h-3 w-3 rounded-sm"
            style={{ backgroundColor: choroplethRgbaCss(bucket, isDarkTheme, 0.85) }}
          />
          {upper !== undefined ? `${lower}–${upper}` : `${lower}+`}
        </span>
      ))}
    </div>
  );
};

export default CaseAreaChoroplethLegend;
