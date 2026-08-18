import { useState } from "react";
import { useTranslation } from "@/core/hooks/useTranslation";
import { DashboardEndpoints, General, GraphQL } from "@/kms/constant";
import type { ArticleListType } from "@/kms/dashboard/dtos/dashboard-graphql.dto";
import { useDashboardArticles } from "@/kms/dashboard/hook/useDashboardArticles";
import KbBlockShell from "@/kms/components/dashboard/KbBlockShell";

const metricValueFormatter = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});

const decimalFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});
 

const KbArticlesBlock = () => {
   const { t } = useTranslation();
  const [filter, setFilter] = useState<ArticleListType>("top");
  const { data, isLoading, isError, isFetching, refetch } = useDashboardArticles(filter);

  const FILTERS: Array<{ key: ArticleListType; label: string }> = [
    {
      key: "top",
      label: t("knowledge.dashboard.sections.articles.top"),
    },
    {
      key: "latest",
      label: t("knowledge.dashboard.sections.articles.latest"),
    },
    {
      key: "popular",
      label: t("knowledge.dashboard.sections.articles.popular"),
    },
  ];

  const filterButtons = (
    <div className="flex gap-1.5">
      {FILTERS.map((f) => (
        <button
          key={f.key}
          type="button"
          onClick={() => setFilter(f.key)}
          className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
            filter === f.key
              ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
              : "border border-slate-200 bg-white text-slate-600 hover:border-sky-300 hover:text-sky-700 dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-300 dark:hover:border-sky-400/30 dark:hover:text-sky-300"
          }`}
        >
          {f.label}
        
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
        title={t("knowledge.dashboard.sections.articles.title")}
        description={t("knowledge.dashboard.sections.articles.description")}
        endpoint={DashboardEndpoints.articles}
        source={General.DASHBOARD_DATA_SOURCE}
        subHeader={filterButtons}
        // hideEndpoint
        onRefresh={() => { void refetch(); }}
        isFetching={isFetching}
        isError
      >
        <div className="h-[260px] rounded-[24px] border border-slate-200/70 bg-slate-50/60 dark:border-white/10 dark:bg-white/[0.02]" />
      </KbBlockShell>
    );
  }

  return (
    <KbBlockShell
      title={t("knowledge.dashboard.sections.articles.title")}
      description={t("knowledge.dashboard.sections.articles.description")}
      endpoint={General.DASHBOARD_DATA_SOURCE === "api" ? GraphQL.URL : data.meta.endpoint}
      source={data.meta.source}
      subHeader={filterButtons}
      // hideEndpoint
      onRefresh={() => { void refetch(); }}
      isFetching={isFetching}
    >
      <div className="max-h-[420px] space-y-3 overflow-y-auto pr-1">
        {data.data.map((article) => (
          <article
            key={article.id}
            className="rounded-[24px] border border-slate-200/70 bg-slate-50/80 p-4 transition hover:border-sky-300/70 hover:bg-sky-50/60 dark:border-white/10 dark:bg-white/[0.03] dark:hover:border-sky-400/30 dark:hover:bg-sky-400/5"
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">
                <h3 className="break-words text-base font-semibold text-slate-950 dark:text-white">
                          { article.title}
                </h3>
                <p className="mt-2 break-words text-sm text-slate-500 dark:text-slate-400">
                  {t("knowledge.dashboard.labels.updated")}: {article.updatedAt}
                </p>
              </div>
              <div className="grid w-full grid-cols-3 gap-3 text-left sm:w-auto sm:min-w-[220px] sm:text-right">
                <div>
                  <p className="text-xs uppercase tracking-[0.14em] text-slate-400">
                    {t("knowledge.dashboard.labels.views")}
                  </p>
                  <p className="mt-1 text-lg font-semibold text-slate-950 dark:text-white">
                    {metricValueFormatter.format(article.views)}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.14em] text-slate-400">
                    {t("knowledge.dashboard.labels.likes")}
                  </p>
                  <p className="mt-1 text-lg font-semibold text-slate-950 dark:text-white">
                    {metricValueFormatter.format(article.likes)}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.14em] text-slate-400">
                    {t("knowledge.dashboard.labels.avgScore", { defaultValue: "Avg Score" })}
                  </p>
                  <p className="mt-1 text-lg font-semibold text-slate-950 dark:text-white">
                    {decimalFormatter.format(article.avgScore)}
                  </p>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </KbBlockShell>
  );
};

export default KbArticlesBlock;
