// src/cc/components/dashboard/CallCenterDashboard.tsx
// Composition only — data loading lives in `useCallCenterDashboard`, KPI
// cards in `DashboardKpiCards`, charts in `DashboardCharts`, export capture
// in `useDashboardExport`.
//
// Remaining-scope plan E3+E4
// (`docs/3CX-FE-Development-Plan-Remaining-Scope.md`): the dashboard renders
// the KPI snapshot for a selectable month (arch-doc §06 "Data Filter:
// Monthly") and exports the visible area to PDF/PNG (arch-doc §06 "Export
// format", FE-only per contract §11 — no backend involvement).
import { useState } from "react";
import { AlertCircle, FileDown, Inbox, RefreshCw } from "lucide-react";
import { useTranslation } from "@/core/hooks/useTranslation";
import { useDashboardExport } from "@/core/hooks/useDashboardExport";
import { Card } from "@/core/components/ui/card/Card";
import ExportReportModal from "@/cms/components/crm/products/ExportReportModal";
import {
  formatDashboardPeriod,
  normalizeDashboardPeriod,
} from "@/cc/types/callCenterDashboard";
import { useCallCenterDashboard } from "./useCallCenterDashboard";
import { DashboardKpiCards } from "./DashboardKpiCards";
import {
  AgentPerformanceChart,
  CallTypeChart,
  DailyVolumeChart,
} from "./DashboardCharts";

function StatePanel({
  icon,
  title,
  body,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  action?: React.ReactNode;
}) {
  return (
    <Card className="bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800">
      <div className="flex flex-col items-center gap-2 py-16 text-center">
        {icon}
        <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
          {title}
        </p>
        <p className="max-w-md text-xs text-gray-400 dark:text-gray-500">
          {body}
        </p>
        {action}
      </div>
    </Card>
  );
}

const CallCenterDashboard = () => {
  const { t } = useTranslation();
  const [period, setPeriod] = useState(() => formatDashboardPeriod(new Date()));
  const { snapshot, status, isFetching, isMock, refetch } =
    useCallCenterDashboard(period);

  const [showExportModal, setShowExportModal] = useState(false);
  const { captureRef, hideDuringCaptureRef, isExporting, exportDashboard } =
    useDashboardExport({ filename: `call-center-dashboard-${period}` });

  if (status === "loading") {
    return (
      <div className="flex-1 dark:bg-black overflow-y-auto cursor-default">
        <div className="w-full space-y-6">
          <StatePanel
            icon={<RefreshCw className="h-8 w-8 animate-spin text-gray-300 dark:text-gray-600" aria-hidden="true" />}
            title={t("common.loading")}
            body={t("cc.dashboard.state_loading_body")}
          />
        </div>
      </div>
    );
  }

  if (status === "error" || status === "invalid") {
    return (
      <div className="flex-1 dark:bg-black overflow-y-auto cursor-default">
        <div className="w-full space-y-6">
          <StatePanel
            icon={<AlertCircle className="h-8 w-8 text-red-400" aria-hidden="true" />}
            title={t("cc.dashboard.state_error_title")}
            body={t("cc.dashboard.state_error_body")}
            action={
              <button
                type="button"
                className="mt-2 rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                onClick={refetch}
              >
                {t("cc.dashboard.state_retry")}
              </button>
            }
          />
        </div>
      </div>
    );
  }

  if (snapshot === null) {
    // Defensive: status says ready/empty but no snapshot accompanied it —
    // unreachable by the hook's state machine, kept for exhaustiveness.
    return null;
  }

  const isEmpty = status === "empty";

  return (
    <div
      ref={captureRef}
      className="flex-1 dark:bg-black overflow-y-auto cursor-default"
    >
      <div className="w-full">
        <div className="space-y-6">
          {/* Header + controls. Controls (and the hints below them) are hidden
              during an export capture so the exported image shows data only. */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h1 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
              {t("cc.dashboard.title")}
            </h1>
            <div ref={hideDuringCaptureRef} className="space-y-1">
              <div className="flex items-center gap-2">
                <input
                  type="month"
                  value={period}
                  max={formatDashboardPeriod(new Date())}
                  onChange={(event) =>
                    setPeriod(normalizeDashboardPeriod(event.target.value))
                  }
                  aria-label={t("cc.dashboard.month_label")}
                  className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-1.5 text-sm text-gray-700 dark:text-gray-200"
                />
                <button
                  type="button"
                  disabled={isExporting}
                  onClick={() => setShowExportModal(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-3 py-1.5 text-xs font-medium text-white transition-colors"
                >
                  <FileDown className="h-4 w-4" aria-hidden="true" />
                  {t("cc.dashboard.export")}
                </button>
              </div>
              {(isMock || isFetching) && (
                <p className="text-right text-xs text-gray-400 dark:text-gray-500">
                  {isMock ? t("cc.dashboard.mock_hint") : ""}{" "}
                  {isFetching ? t("cc.dashboard.refreshing") : ""}
                </p>
              )}
            </div>
          </div>

          {/* Key Metrics */}
          <DashboardKpiCards summary={snapshot.summary} />

          {/* Charts */}
          {isEmpty ? (
            <StatePanel
              icon={<Inbox className="h-8 w-8 text-gray-300 dark:text-gray-600" aria-hidden="true" />}
              title={t("cc.dashboard.state_empty_title")}
              body={t("cc.dashboard.state_empty_body")}
            />
          ) : (
            <>
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <DailyVolumeChart data={snapshot.dailyVolume} />
                <CallTypeChart data={snapshot.callTypeDistribution} />
              </div>

              <AgentPerformanceChart data={snapshot.agentPerformance} />
            </>
          )}
        </div>
      </div>

      <ExportReportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        onExport={exportDashboard}
      />
    </div>
  );
};

export default CallCenterDashboard;
