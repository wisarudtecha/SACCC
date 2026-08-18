import { useMemo } from "react";

// import { useTranslation } from "react-i18next";
import { useTranslation } from "@/core/hooks/useTranslation";
import { HiOutlineDotsHorizontal } from "react-icons/hi";

import type { BroadcastStatus } from "@/kms/broadcast/dtos/broadcast.dto";
import { useBroadcastBlockData } from "@/kms/broadcast/hook/useBroadcastData";
import KbBlockShell from "@/kms/components/dashboard/KbBlockShell";

interface BroadcastStatusBlockProps {
  value: BroadcastStatus;
  onChange: (status: BroadcastStatus) => void;
}

const statusToneMap: Record<BroadcastStatus, string> = {
  all: "bg-violet-500",
  scheduled: "bg-amber-400",
  published: "bg-emerald-500",
  expired: "bg-pink-500",
  draft: "bg-sky-400",
};

const BroadcastStatusBlock = ({
  value,
  onChange,
}: BroadcastStatusBlockProps) => {
  const { t } = useTranslation();
  const { data, isLoading, isError, isFetching, refetch } =
    useBroadcastBlockData("summary");

  const items = useMemo(() => data?.data ?? [], [data]);

  return (
    <KbBlockShell
      title={t("knowledge.broadcast.sections.summary.title")}
      description={t("knowledge.broadcast.sections.summary.description")}
      endpoint={data?.meta.endpoint ?? "/kms/broadcast/summary"}
      source={data?.meta.source ?? "mock"}
      translationNamespace="broadcast"
      onRefresh={() => {
        void refetch();
      }}
      isFetching={isFetching}
      className="h-full"
    >
      {isLoading ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {t("knowledge.broadcast.labels.loading")}
        </p>
      ) : null}

      {isError ? (
        <p className="text-sm text-rose-500">{t("knowledge.broadcast.labels.loadFailed")}</p>
      ) : null}

      {!isLoading && !isError ? (
        <div className="space-y-2">
          {items.map((item) => {
            const isActive = item.id === value;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onChange(item.id)}
                className={`flex w-full items-center justify-between rounded-2xl border px-3 py-3 text-left transition sm:px-4 ${
                  isActive
                    ? "border-violet-200 bg-violet-50/90 shadow-sm dark:border-violet-500/30 dark:bg-violet-500/10"
                    : "border-transparent bg-slate-50 hover:border-slate-200 hover:bg-slate-100 dark:bg-white/[0.04] dark:hover:border-white/10 dark:hover:bg-white/[0.06]"
                }`}
              >
                <span className="flex min-w-0 items-center gap-3">
                  <span
                    className={`h-8 w-8 shrink-0 rounded-full ${statusToneMap[item.id]} bg-opacity-15 p-0.5`}
                  >
                    <span
                      className={`flex h-full w-full items-center justify-center rounded-full ${statusToneMap[item.id]} text-white`}
                    >
                      <HiOutlineDotsHorizontal className="text-xs" />
                    </span>
                  </span>
                  <span className="truncate text-sm font-medium text-slate-700 dark:text-slate-200">
                    {t(`knowledge.broadcast.status.${item.id}`)}
                  </span>
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                    isActive
                      ? "bg-white text-violet-600 dark:bg-violet-500/15 dark:text-violet-200"
                      : "bg-white text-slate-500 dark:bg-white/[0.06] dark:text-slate-300"
                  }`}
                >
                  {item.count}
                </span>
              </button>
            );
          })}
        </div>
      ) : null}
    </KbBlockShell>
  );
};

export default BroadcastStatusBlock;
