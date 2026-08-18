import { useTranslation } from "react-i18next";

import { useDashboardBlockData } from "../../../dashboard/hook/useDashboardData";
import KbBlockShell from "../KbBlockShell";

const KbSearchesBlock = () => {
  const { t } = useTranslation("dashboard");
  const { data, isLoading, isError, isFetching, refetch } =
    useDashboardBlockData("searches");

  if (isLoading) {
    return (
      <div className="h-[320px] animate-pulse rounded-[28px] border border-slate-200/70 bg-white/90 dark:border-white/10 dark:bg-slate-950/70" />
    );
  }

  if (isError || !data) {
    return (
      <div className="rounded-[24px] border border-rose-200 bg-rose-50/80 p-4 text-sm text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-200">
        {t("labels.loadFailed")}
      </div>
    );
  }

  return (
    <KbBlockShell
      title={t("sections.searches.title")}
      description={t("sections.searches.description")}
      endpoint={data.meta.endpoint}
      source={data.meta.source}
      onRefresh={() => {
        void refetch();
      }}
      isFetching={isFetching}
    >
      <div className="space-y-4">
        {data.data.map((search) => (
          <div key={search.id}>
            <div className="mb-2 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
              <span className="min-w-0 truncate text-sm font-medium text-slate-700 dark:text-slate-200">
                {t(`content.searches.${search.id}.label`, {
                  defaultValue: search.label,
                })}
              </span>
              <span className="text-sm text-slate-500 dark:text-slate-400">
                {search.hits} {t("labels.hits")}
              </span>
            </div>
            <div className="h-2.5 rounded-full bg-slate-200 dark:bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-sky-500"
                style={{ width: `${Math.min(search.share, 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </KbBlockShell>
  );
};

export default KbSearchesBlock;
