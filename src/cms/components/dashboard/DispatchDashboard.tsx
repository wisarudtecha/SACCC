// src/cms/components/dashboard/DispatchDashboard.tsx
import React from "react";
import { DashboardSourceProvider } from "@/core/components/custom-dashboard/sources/DashboardSourceProvider";
import { useTranslation } from "@/core/hooks/useTranslation";
import { Skeleton } from "@/core/components/ui/loading/LoadingSystem";
import { DispatchKpiRow } from "@/cms/components/dashboard/dispatch/DispatchKpiRow";
import { DispatchEventsList } from "@/cms/components/dashboard/dispatch/DispatchEventsList";
import { OfficerStatusPanel } from "@/cms/components/dashboard/dispatch/OfficerStatusPanel";
import { useDispatchEventsFeed } from "@/cms/components/dashboard/dispatch/useDispatchEventsFeed";
import { useDispatchHeatmapCases } from "@/cms/components/dashboard/dispatch/useDispatchHeatmapCases";
import { DispatchHeatmap } from "@/cms/components/dashboard/map/heatmap/DispatchHeatmap";

const DispatchDashboardContent: React.FC = () => {
  const { t } = useTranslation();
  const { events, isLoading: isEventsLoading } = useDispatchEventsFeed();
  const { cases: heatmapCases, isLoading: isHeatmapLoading } = useDispatchHeatmapCases();

  return (
    <div className="space-y-4">
      <DispatchKpiRow />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="space-y-2 xl:col-span-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">
              {t("dashboard.dispatch.heatmap_title")}
            </h3>
            {/* Officer-density plotting needs an org-wide live position feed the backend
                doesn't expose yet (position tracking today is scoped to one open case at a
                time) - see the FE-BE dependency request. The toggle is shown, disabled, so
                the layout doesn't need rework once that feed exists. */}
            <label
              className="flex cursor-not-allowed items-center gap-2 text-xs text-gray-400 dark:text-gray-500"
              title={t("dashboard.dispatch.officer_density_toggle_disabled_tooltip")}
            >
              <input type="checkbox" disabled className="cursor-not-allowed" />
              {t("dashboard.dispatch.officer_density_toggle")}
            </label>
          </div>
          {isHeatmapLoading ? <Skeleton height={520} /> : <DispatchHeatmap cases={heatmapCases} />}
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">
            {t("dashboard.dispatch.officer_status_title")}
          </h3>
          <OfficerStatusPanel />
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">
          {t("dashboard.dispatch.events_title")}
        </h3>
        <DispatchEventsList events={events} isLoading={isEventsLoading} />
      </div>
    </div>
  );
};

/**
 * Mounts its own `DashboardSourceProvider` since this page lives outside
 * `CustomDashboardPage`, following the same pattern as CaseSummaryByAreaDashboard.tsx.
 */
export const DispatchDashboard: React.FC = () => (
  <DashboardSourceProvider>
    <DispatchDashboardContent />
  </DashboardSourceProvider>
);

export default DispatchDashboard;
