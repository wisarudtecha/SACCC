// src/cms/components/dashboard/dispatch/DispatchKpiRow.tsx
//
// Reuses the same live `case-summary`/`sla` sources ServiceDashboard.tsx already
// computes from the shared `{ EVENT: "DASHBOARD" }` websocket push - not the
// registry's CaseSummaryMetricsWidget/SlaPerformanceWidget components, which
// require a `widget: DashboardWidget` grid-cell wrapper this standalone page
// doesn't have (CaseSummaryByAreaDashboard.tsx bypasses the registry the same
// way for its own map/table tabs, for the same reason).
import React from "react";
import { AnimatedNumber, AnimatedPercentage } from "@/core/components/ui/animation/AnimatedNumber";
import { useWidgetSource } from "@/core/components/custom-dashboard/sources/useWidgetSource";
import { SOURCE_IDS } from "@/core/components/custom-dashboard/sources/registry";
import { Skeleton } from "@/core/components/ui/loading/LoadingSystem";
import { useTranslation } from "@/core/hooks/useTranslation";

const KPI_TILE_CLASS = "rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800";

export const DispatchKpiRow: React.FC = () => {
  const { language } = useTranslation();
  const { data: caseSummary, hasData: hasCaseSummary } = useWidgetSource(SOURCE_IDS.caseSummary);
  const { data: sla, hasData: hasSla } = useWidgetSource(SOURCE_IDS.sla);

  if (!hasCaseSummary || !hasSla || caseSummary?.kind !== "case-summary" || sla?.kind !== "sla") {
    return (
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Skeleton height={88} />
        <Skeleton height={88} />
        <Skeleton height={88} />
        <Skeleton height={88} />
      </div>
    );
  }

  const activeLabel = language === "th" ? "เคสทั้งหมด" : "Active Cases";
  const slaLabel = language === "th" ? "ปฏิบัติตาม SLA" : "SLA Compliance";
  const overdueLabel = language === "th" ? "เกินกำหนด SLA" : "Overdue";
  const avgResponseLabel = language === "th" ? "เวลาตอบสนองเฉลี่ย" : "Avg Response Time";

  return (
    <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
      <div className={KPI_TILE_CLASS}>
        <div className="text-sm text-gray-500 dark:text-gray-400">{activeLabel}</div>
        <AnimatedNumber
          value={caseSummary.total}
          duration={1.2}
          className="text-3xl font-bold text-gray-900 dark:text-white"
        />
      </div>
      <div className={KPI_TILE_CLASS}>
        <div className="text-sm text-gray-500 dark:text-gray-400">{slaLabel}</div>
        <AnimatedPercentage
          value={sla.inSlaRate}
          duration={1.2}
          className="text-3xl font-bold text-green-600 dark:text-green-400"
        />
      </div>
      <div className={KPI_TILE_CLASS}>
        <div className="text-sm text-gray-500 dark:text-gray-400">{overdueLabel}</div>
        <AnimatedNumber
          value={sla.overSla}
          duration={1.2}
          className="text-3xl font-bold text-red-600 dark:text-red-400"
        />
      </div>
      <div className={KPI_TILE_CLASS}>
        <div className="text-sm text-gray-500 dark:text-gray-400">{avgResponseLabel}</div>
        <AnimatedNumber
          value={sla.avgResponse}
          duration={1.2}
          className="text-3xl font-bold text-gray-900 dark:text-white"
        />
      </div>
    </div>
  );
};

export default DispatchKpiRow;
