// Dashboard charts for the call-center dashboard — remaining-scope plan E3.
//
// Three charts fed from the KPI snapshot (`docs/CC-Dashboard-KPI-Contract.md`
// §4): Daily Call Volume (gap between series = abandoned, arch-doc §06), Call
// Type Distribution, and Agent Performance. Styling preserved from the
// original hardcoded shell so the wired page renders identically on the
// contract §10 fixture.
import { useTranslation } from "@/core/hooks/useTranslation";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card } from "@/core/components/ui/card/Card";
import type {
  CallCenterAgentPerformance,
  CallCenterCallTypeSlice,
  CallCenterDailyVolumePoint,
} from "@/cc/types/callCenterDashboard";

const DARK_TOOLTIP_STYLE = {
  backgroundColor: "#111827",
  border: "1px solid #374151",
} as const;

const TOTAL_CALLS_COLOR = "#3b82f6";
const ANSWERED_COLOR = "#10b981";
const EFFICIENCY_COLOR = "#f59e0b";
const PIE_COLORS = [TOTAL_CALLS_COLOR, ANSWERED_COLOR, EFFICIENCY_COLOR, "#ef4444"];

export function DailyVolumeChart({
  data,
}: {
  data: CallCenterDailyVolumePoint[];
}) {
  const { t } = useTranslation();

  return (
    <Card className="bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800">
      <div>
        <div className="text-black dark:text-white">
          {t("cc.dashboard.chart_daily_volume")}
        </div>
      </div>
      <div>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="date" stroke="#9ca3af" />
            <YAxis stroke="#9ca3af" />
            <Tooltip contentStyle={DARK_TOOLTIP_STYLE} />
            <Legend />
            <Line
              type="monotone"
              dataKey="totalCalls"
              stroke={TOTAL_CALLS_COLOR}
              name={t("cc.dashboard.legend_total_calls")}
            />
            <Line
              type="monotone"
              dataKey="answeredCalls"
              stroke={ANSWERED_COLOR}
              name={t("cc.dashboard.legend_answered")}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

export function CallTypeChart({ data }: { data: CallCenterCallTypeSlice[] }) {
  const { t } = useTranslation();
  // Recharts needs a stable display-name field for slice labels; fall back to
  // the machine key when the backend omitted `label` (contract §4.1).
  const chartData = data.map((slice) => ({
    ...slice,
    displayName: slice.label ?? slice.typeKey,
  }));

  return (
    <Card className="bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800">
      <div>
        <div className="text-black dark:text-white">
          {t("cc.dashboard.chart_call_type")}
        </div>
      </div>
      <div>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={{ fill: "#fff" }}
              outerRadius={80}
              dataKey="count"
              nameKey="displayName"
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={entry.typeKey}
                  fill={PIE_COLORS[index % PIE_COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip contentStyle={DARK_TOOLTIP_STYLE} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

export function AgentPerformanceChart({
  data,
}: {
  data: CallCenterAgentPerformance[];
}) {
  const { t } = useTranslation();

  return (
    <Card className="bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800">
      <div>
        <div className="text-black dark:text-white">
          {t("cc.dashboard.chart_agent_performance")}
        </div>
      </div>
      <div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="agentName" stroke="#9ca3af" />
            <YAxis stroke="#9ca3af" />
            <Tooltip contentStyle={DARK_TOOLTIP_STYLE} />
            <Legend />
            <Bar
              dataKey="callsHandled"
              fill={TOTAL_CALLS_COLOR}
              name={t("cc.dashboard.legend_calls_handled")}
            />
            <Bar
              dataKey="satisfactionPct"
              fill={ANSWERED_COLOR}
              name={t("cc.dashboard.legend_satisfaction")}
            />
            <Bar
              dataKey="efficiencyPct"
              fill={EFFICIENCY_COLOR}
              name={t("cc.dashboard.legend_efficiency")}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
