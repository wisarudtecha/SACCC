// src/cms/components/dashboard/CaseSummaryByAreaDashboard.tsx
import React from "react";
import { DashboardSourceProvider } from "@/core/components/custom-dashboard/sources/DashboardSourceProvider";
import { useWidgetSource } from "@/core/components/custom-dashboard/sources/useWidgetSource";
import { SOURCE_IDS } from "@/core/components/custom-dashboard/sources/registry";
import { Skeleton } from "@/core/components/ui/loading/LoadingSystem";
import Tabs from "@/core/components/ui/tab/Tab";
import { useTranslation } from "@/core/hooks/useTranslation";
import { CaseSummaryByAreaTable } from "@/cms/components/dashboard/CaseSummaryByAreaTable";
import { CaseAreaChoroplethMap } from "@/cms/components/dashboard/map/CaseAreaChoroplethMap";

const CaseSummaryByAreaContent: React.FC = () => {
  const { t } = useTranslation();
  const { data, hasData } = useWidgetSource(SOURCE_IDS.caseSummaryByArea);

  if (!hasData || data?.kind !== "case-summary-by-area") {
    return (
      <div className="space-y-4">
        <Skeleton height={80} />
        <Skeleton height={400} />
      </div>
    );
  }

  return (
    <Tabs
      variant="badge"
      defaultTab="table"
      items={[
        {
          id: "table",
          label: t("dashboard.case_summary_by_area.view_table"),
          content: <CaseSummaryByAreaTable rows={data.rows} total={data.total} />,
        },
        {
          id: "map",
          label: t("dashboard.case_summary_by_area.view_map"),
          content: <CaseAreaChoroplethMap rows={data.rows} />,
        },
      ]}
    />
  );
};

/**
 * Mounts its own `DashboardSourceProvider` since this page lives outside
 * `CustomDashboardPage` (the only other place the provider is mounted today).
 */
const CaseSummaryByAreaDashboard: React.FC = () => (
  <DashboardSourceProvider>
    <CaseSummaryByAreaContent />
  </DashboardSourceProvider>
);

export default CaseSummaryByAreaDashboard;
