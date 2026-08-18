//import { useTranslation } from "react-i18next";
import { useTranslation } from "@/core/hooks/useTranslation";
import { General, GraphQL } from "@/kms/constant";
import { useDashboardBlockData } from "@/kms/dashboard/hook/useDashboardData";
import KbBlockShell from "@/kms/components/dashboard/KbBlockShell";
import KbMetricCard from "@/kms/components/dashboard/KbMetricCard";

const metricValueFormatter = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});

const decimalFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

const KbMetricsBlock = () => {
   const { t } = useTranslation();
  const { data, isLoading, isError, isFetching, refetch } =
    useDashboardBlockData("metrics");

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div
            key={index}
            className="h-52 animate-pulse rounded-[24px] border border-slate-200/70 bg-white/90 dark:border-white/10 dark:bg-slate-950/70"
          />
        ))}
      </div>
    );
  }

  if (isError || !data) {
    return (
      <KbBlockShell
        title={t("knowledge.dashboard.sections.metrics.title")}
        description={t("knowledge.dashboard.sections.metrics.description")}
        endpoint={GraphQL.URL}
        source={General.DASHBOARD_DATA_SOURCE}
        onRefresh={() => { void refetch(); }}
        isFetching={isFetching}
        isError
      >
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div
              key={index}
              className="h-52 rounded-[24px] border border-slate-200/70 bg-slate-50/60 dark:border-white/10 dark:bg-white/[0.02]"
            />
          ))}
        </div>
      </KbBlockShell>
    );
  }

  return (
    <KbBlockShell
      title={t("knowledge.dashboard.sections.metrics.title")}
      description={t("knowledge.dashboard.sections.metrics.description")}
      endpoint={data.meta.endpoint}
      source={data.meta.source}
      onRefresh={() => {
        void refetch();
      }}
      isFetching={isFetching}
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {data.data.map((metric) => {
          const isRating = metric.id === "avgRating";
          const formattedValue = isRating
            ? decimalFormatter.format(metric.value)
            : metricValueFormatter.format(metric.value);
          const formattedChange = `${metric.change > 0 ? "+" : ""}${decimalFormatter.format(metric.change)}% ${t("knowledge.dashboard.labels.vsLastPeriod")}`;
          const translatedDescription = t(`knowledge.dashboard.metrics.${metric.id}.description`);
          const metricDescription =
            data.meta.source === "mock"
              ? translatedDescription
              : metric.description || translatedDescription;

          return (
            <KbMetricCard
              key={metric.id}
              title={t(`knowledge.dashboard.metrics.${metric.id}.title`)}
              value={formattedValue}
              changeLabel={formattedChange}
              description={metricDescription}
              tone={metric.tone}
            />
          );
        })}
      </div>
    </KbBlockShell>
  );
};

export default KbMetricsBlock;
