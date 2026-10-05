// KPI cards for the call-center dashboard — remaining-scope plan E3.
// Renders the four top metric cards from `summary`. Optional fields
// (`satisfactionPct`, `totalCallsDeltaPct`) are omitted-not-null by contract
// §4.1 — "—" distinguishes "no data yet" from a real 0.
import { useTranslation } from "@/core/hooks/useTranslation";
import { Card } from "@/core/components/ui/card/Card";
import { formatCallDuration } from "@/cc/components/softphone/softphoneCallState";
import type { CallCenterDashboardSummary } from "@/cc/types/callCenterDashboard";

/** Renders a "—" placeholder for metrics the backend has no data for yet. */
const NO_DATA = "—";

function formatDelta(deltaPct: number): string {
  const sign = deltaPct > 0 ? "+" : "";
  return `${sign}${deltaPct}%`;
}

function KpiCard({
  label,
  value,
  hint,
  valueClassName,
}: {
  label: string;
  value: string;
  hint: string;
  valueClassName?: string;
}) {
  return (
    <Card className="bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800">
      <div className="pb-2">
        <div className="text-sm text-gray-500 dark:text-gray-400 font-medium">
          {label}
        </div>
      </div>
      <div>
        <div
          className={`text-3xl font-bold text-black dark:text-white ${valueClassName ?? ""}`}
        >
          {value}
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{hint}</p>
      </div>
    </Card>
  );
}

export function DashboardKpiCards({
  summary,
}: {
  summary: CallCenterDashboardSummary;
}) {
  const { t } = useTranslation();

  return (
    <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
      <KpiCard
        label={t("cc.dashboard.kpi_total_calls")}
        value={String(summary.totalCalls)}
        hint={
          summary.totalCallsDeltaPct === undefined
            ? t("cc.dashboard.kpi_no_comparison")
            : t("cc.dashboard.kpi_delta_vs_previous", {
                value: formatDelta(summary.totalCallsDeltaPct),
              })
        }
        valueClassName={
          (summary.totalCallsDeltaPct ?? 0) > 0
            ? "text-green-600 dark:text-green-400"
            : undefined
        }
      />
      <KpiCard
        label={t("cc.dashboard.kpi_answered")}
        value={String(summary.answeredCalls)}
        hint={t("cc.dashboard.kpi_answer_rate", {
          value: summary.answeredRatePct,
        })}
        valueClassName="text-green-500 dark:text-green-400"
      />
      <KpiCard
        label={t("cc.dashboard.kpi_avg_duration")}
        value={formatCallDuration(summary.avgDurationSeconds)}
        hint={t("cc.dashboard.kpi_avg_duration_hint")}
      />
      <KpiCard
        label={t("cc.dashboard.kpi_satisfaction")}
        value={
          summary.satisfactionPct === undefined
            ? NO_DATA
            : `${summary.satisfactionPct}%`
        }
        hint={
          summary.satisfactionPct === undefined
            ? t("cc.dashboard.kpi_no_data_hint")
            : t("cc.dashboard.kpi_satisfaction_hint")
        }
        valueClassName="text-blue-500 dark:text-blue-400"
      />
    </div>
  );
}
