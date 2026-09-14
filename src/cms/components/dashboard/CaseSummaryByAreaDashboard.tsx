// src/cms/components/dashboard/CaseSummaryByAreaDashboard.tsx
import React from "react";
import { DashboardSourceProvider } from "@/core/components/custom-dashboard/sources/DashboardSourceProvider";
import { useWidgetSource } from "@/core/components/custom-dashboard/sources/useWidgetSource";
import { SOURCE_IDS } from "@/core/components/custom-dashboard/sources/registry";
import { Skeleton } from "@/core/components/ui/loading/LoadingSystem";
import { CaseSummaryByAreaTable } from "@/cms/components/dashboard/CaseSummaryByAreaTable";

const CaseSummaryByAreaContent: React.FC = () => {
  const { data, hasData } = useWidgetSource(SOURCE_IDS.caseSummaryByArea);

  if (!hasData || data?.kind !== "case-summary-by-area") {
    return (
      <div className="space-y-4">
        <Skeleton height={80} />
        <Skeleton height={400} />
      </div>
    );
  }

  return <CaseSummaryByAreaTable rows={data.rows} total={data.total} />;
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
