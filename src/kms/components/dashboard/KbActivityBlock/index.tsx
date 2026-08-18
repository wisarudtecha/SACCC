import { useState } from "react";
// import { useTranslation } from "react-i18next";
import { useTranslation } from "@/core/hooks/useTranslation";
import { DashboardEndpoints, General, GraphQL } from "@/kms/constant";
import type { DashboardLowArticleMode } from "@/kms/dashboard/dtos/dashboard.dto";
import { useDashboardLowArticles } from "@/kms/dashboard/hook/useDashboardLowArticles";
import KbBlockShell from "../KbBlockShell";

const decimalFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

const MODES: Array<{ key: DashboardLowArticleMode; labelKey: string }> = [
  { key: "lowScore", labelKey: "labels.avgScore" },
  { key: "lowView", labelKey: "labels.views" },
];

const KbActivityBlock = () => {
  //const { t } = useTranslation("dashboard");
  const { t } = useTranslation();
  const [mode, setMode] = useState<DashboardLowArticleMode>("lowScore");
  const { data, isLoading, isError, isFetching, refetch } =
    useDashboardLowArticles(mode);

  const title =
    mode === "lowScore"
      ? t("knowledge.dashboard.sections.lowScore.title", {
          defaultValue: "Low Average Score Articles",
        })
      : t("knowledge.dashboard.sections.lowView.title", { defaultValue: "Low Viewer Articles" });

  const description =
    mode === "lowScore"
      ? t("knowledge.dashboard.sections.lowScore.description", {
          defaultValue:
            "Articles with below-average reader ratings — flagged for content review and improvement.",
        })
      : t("knowledge.dashboard.sections.lowView.description", {
          defaultValue:
            "Articles with the fewest views — consider improving titles, links, or discoverability.",
        });

  const endpoint =
    General.DASHBOARD_DATA_SOURCE === "api"
      ? GraphQL.URL
      : DashboardEndpoints.activity;

  const toggleButtons = (
    <div className="flex gap-1.5">
      {MODES.map((m) => (
        <button
          key={m.key}
          type="button"
          onClick={() => setMode(m.key)}
          className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
            mode === m.key
              ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
              : "border border-slate-200 bg-white text-slate-600 hover:border-sky-300 hover:text-sky-700 dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-300 dark:hover:border-sky-400/30 dark:hover:text-sky-300"
          }`}
        >
          {t(`knowledge.dashboard.${m.labelKey}`)}
        </button>
      ))}
    </div>
  );

  if (isLoading) {
    return (
      <div className="h-[360px] animate-pulse rounded-[28px] border border-slate-200/70 bg-white/90 dark:border-white/10 dark:bg-slate-950/70" />
    );
  }

  if (isError || !data) {
    return (
      <KbBlockShell
        title={title}
        description={description}
        endpoint={endpoint}
        source={General.DASHBOARD_DATA_SOURCE}
        subHeader={toggleButtons}
        onRefresh={() => {
          void refetch();
        }}
        isFetching={isFetching}
        isError
      >
        <div className="h-[260px] rounded-[24px] border border-slate-200/70 bg-slate-50/60 dark:border-white/10 dark:bg-white/[0.02]" />
      </KbBlockShell>
    );
  }

  return (
    <KbBlockShell
      title={title}
      description={description}
      endpoint={data.meta.endpoint}
      source={data.meta.source}
      subHeader={toggleButtons}
      onRefresh={() => {
        void refetch();
      }}
      isFetching={isFetching}
    >
      <div
        className={`space-y-2 ${data.data.length > 6 ? "max-h-[380px] overflow-y-auto pr-1" : ""}`}
      >
        {data.data.map((article) => (
          <div
            key={article.id}
            className="flex items-center justify-between rounded-[18px] border border-slate-200/70 bg-slate-50/80 px-4 py-3 transition hover:border-sky-300/70 hover:bg-sky-50/60 dark:border-white/10 dark:bg-white/[0.03] dark:hover:border-sky-400/30 dark:hover:bg-sky-400/5"
          >
            <p className="min-w-0 truncate text-sm font-medium text-slate-700 dark:text-slate-200">
              {article.title}
            </p>
            <span className="ml-4 shrink-0 text-sm font-semibold text-slate-950 dark:text-white">
              {mode === "lowScore"
                ? decimalFormatter.format(article.score)
                : article.score.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    </KbBlockShell>
  );
};

export default KbActivityBlock;
