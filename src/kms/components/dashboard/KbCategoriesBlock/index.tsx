//import { useTranslation } from "react-i18next";
import { useTranslation } from "@/core/hooks/useTranslation";
import { DashboardEndpoints, General } from "@/kms/constant";
import { useDashboardBlockData } from "@/kms/dashboard/hook/useDashboardData";
import { buildCategoryDonut } from "@/kms/dashboard/service/dashboard.service";
import KbBlockShell from "@/kms/components/dashboard/KbBlockShell";

const KbCategoriesBlock = () => {
  //const { t } = useTranslation("dashboard");
  const { t } = useTranslation();
  const { data, isLoading, isError, isFetching, refetch } = useDashboardBlockData("categories");
  if (isLoading) {
    return (
      <div className="h-[360px] animate-pulse rounded-[28px] border border-slate-200/70 bg-white/90 dark:border-white/10 dark:bg-slate-950/70" />
    );
  }

  if (isError || !data) {
    return (
      <KbBlockShell
        title={t("knowledge.dashboard.sections.categories.title")}
        description={t("knowledge.dashboard.sections.categories.description")}
        endpoint={DashboardEndpoints.categories}
        source={General.DASHBOARD_DATA_SOURCE}
        onRefresh={() => { void refetch(); }}
        isFetching={isFetching}
        isError
      >
        <div className="h-[260px] rounded-[24px] border border-slate-200/70 bg-slate-50/60 dark:border-white/10 dark:bg-white/[0.02]" />
      </KbBlockShell>
    );
  }

  const donutBackground = buildCategoryDonut(data.data);
 

  return (
    <KbBlockShell
      title={t("knowledge.dashboard.sections.categories.title")}
      description={t("knowledge.dashboard.sections.categories.description")}
      endpoint={data.meta.endpoint}
      source={data.meta.source}
      onRefresh={() => {
        void refetch();
      }}
      isFetching={isFetching}
    >
      <div className="grid gap-6 md:grid-cols-[0.9fr_1.1fr] xl:grid-cols-1 2xl:grid-cols-[0.9fr_1.1fr]">
        <div className="flex items-center justify-center">
          <div
            className="relative h-36 w-36 rounded-full sm:h-44 sm:w-44"
            style={{ background: donutBackground }}
          >
            <div className="absolute inset-[14px] flex items-center justify-center rounded-full bg-white text-center dark:bg-slate-950 sm:inset-[18px]">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                  {t("knowledge.dashboard.summary.coverage")}
                </p>
                <p className="mt-2 text-2xl font-semibold text-slate-950 dark:text-white">
                  {data.data.reduce((sum, item) => sum + item.share, 0)}%
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="space-y-3">
          {data.data.map((category) => (
            <div
              key={category.id}
              className="flex items-start justify-between gap-4"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: category.color }}
                />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-700 dark:text-slate-200">
                    {category.label/* {t(`knowledge.dashboard.content.categories.${category.id}.label`, {
                      defaultValue: category.label,
                    })} */}
                  </p>
                  <p className="text-xs text-slate-400">
                    {category.value} {t("knowledge.dashboard.labels.articles")}
                  </p>
                </div>
              </div>
              <span className="text-sm font-semibold text-slate-950 dark:text-white">
                {category.share}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </KbBlockShell>
  );
};

export default KbCategoriesBlock;
