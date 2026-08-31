import { useState } from "react";
import { useTranslation } from "@/core/hooks/useTranslation";
import {
  FiChevronDown,
  FiChevronUp,
  FiEdit2,
  FiPlus,
  FiTrash2,
} from "react-icons/fi";

import type {
  BroadcastItem,
  BroadcastStatus,
} from "@/kms/broadcast/dtos/broadcast.dto";
import { useBroadcastList } from "@/kms/broadcast/hook/useBroadcastList";
import KbBlockShell from "@/kms/components/dashboard/KbBlockShell";
import KbPaginator from "@/kms/components/shared/KbPaginator";

interface BroadcastListBlockProps {
  status: BroadcastStatus;
  onCreate: () => void;
  onEdit: (item: BroadcastItem) => void;
  onDelete: (item: BroadcastItem) => void;
  isDeleting?: boolean;
}

const statusClassMap: Record<Exclude<BroadcastStatus, "all">, string> = {
  scheduled: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-200',
  published:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200",
  expired: "bg-pink-100 text-pink-700 dark:bg-pink-500/15 dark:text-pink-200",
  draft: "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-200",
};

const BroadcastListBlock = ({
  status,
  onCreate,
  onEdit,
  onDelete,
  isDeleting = false,
}: BroadcastListBlockProps) => {
  const { t } = useTranslation();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const { data, isLoading, isError, isFetching, refetch, page, setPage } =
    useBroadcastList(status);

  const items = data?.items ?? [];
  const pagination = data?.pagination;

  const toggleExpanded = (itemId: string) => {
    setExpandedId((current) => (current === itemId ? null : itemId));
  };

  return (
    <KbBlockShell
      title={t("knowledge.broadcast.sections.list.title")}
      description={t("knowledge.broadcast.sections.list.description", {
        status: t(`knowledge.broadcast.status.${status}`),
      })}
      endpoint={data?.meta.endpoint ?? "/kms/broadcast/list"}
      source={data?.meta.source ?? "mock"}
      translationNamespace="broadcast"
      onRefresh={() => {
        void refetch();
      }}
      isFetching={isFetching}
      aside={
        <button
          type="button"
          onClick={onCreate}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-600"
        >
          <FiPlus />
          <span>{t("knowledge.broadcast.buttons.add")}</span>
        </button>
      }
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
        <div className="space-y-3">
          {items.map((item, idx) => (
            <article
              key={`${item.id}-${idx}`}
              className="rounded-2xl border border-slate-200/70 bg-slate-50/70 px-3 py-3 dark:border-white/10 dark:bg-white/[0.04] sm:px-4"
            >
              <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center">
                <div className="min-w-0">
                  <button
                    type="button"
                    onClick={() => toggleExpanded(item.id)}
                    className="flex w-full items-center gap-2 text-left text-sm font-medium text-slate-700 underline decoration-transparent underline-offset-4 transition hover:text-sky-600 hover:decoration-sky-400 dark:text-slate-200 dark:hover:text-sky-300 dark:hover:decoration-sky-300"
                  >
                    <span className="truncate">
                      {
                        item.title
                        // t(`knowledge.broadcast.content.items.${item.id}.title`, {
                        //   defaultValue: item.title,
                        // })
                      }
                    </span>
                    {expandedId === item.id ? (
                      <FiChevronUp className="shrink-0" />
                    ) : (
                      <FiChevronDown className="shrink-0" />
                    )}
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                  <span
                     className={`rounded-full px-2 py-1 font-medium ${statusClassMap[item.status]}`}
                  >
                    {t(`knowledge.broadcast.status.${item.status}`)}
                  </span>
                  <span className="whitespace-nowrap">
                    {item.startDate}
                    <span className="mx-2 text-slate-300 dark:text-slate-600">
                      →
                    </span>
                    {item.endDate}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-slate-400 dark:text-slate-500">
                  <button
                    type="button"
                    onClick={() => onEdit(item)}
                    className="transition hover:text-violet-600 dark:hover:text-violet-300"
                    aria-label={t("knowledge.broadcast.buttons.edit")}
                  >
                    <FiEdit2 />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(item)}
                    disabled={isDeleting}
                    className="transition hover:text-rose-500 dark:hover:text-rose-300"
                    aria-label={t("knowledge.broadcast.buttons.delete")}
                  >
                    <FiTrash2 />
                  </button>
                </div>
              </div>

              {expandedId === item.id ? (
                <div className="mt-3 space-y-3 rounded-2xl border border-slate-200/70 bg-white/80 px-4 py-3 text-sm leading-6 text-slate-600 dark:border-white/10 dark:bg-slate-950/50 dark:text-slate-300">
                  <div>
                    <p className="mb-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">
                      {t("labels.message")}
                    </p>
                    <p className="whitespace-pre-wrap break-words">
                      {
                        item.message
                      /* {t(`knowledge.broadcast.content.items.${item.id}.message`, {
                        defaultValue: item.message,
                      })} */}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-x-6 gap-y-1 border-t border-slate-100 pt-2 dark:border-white/[0.06]">
                    {item.createdDate ? (
                      <p className="text-xs text-slate-400 dark:text-slate-500">
                        <span className="font-medium text-slate-500 dark:text-slate-400">
                          Created:
                        </span>{" "}
                        {item.createdDate}
                      </p>
                    ) : null}
                    {item.updatedDate ? (
                      <p className="text-xs text-slate-400 dark:text-slate-500">
                        <span className="font-medium text-slate-500 dark:text-slate-400">
                          Last modified:
                        </span>{" "}
                        {item.updatedDate}
                      </p>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </article>
          ))}

          {items.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500 dark:border-white/10 dark:text-slate-400">
              {t("knowledge.broadcast.labels.empty")}
            </div>
          ) : null}

          {pagination ? (
            <div className="border-t border-slate-200 pt-3 dark:border-white/10">
              <KbPaginator
              showingLabel={t("knowledge.broadcast.pagination.showing")}
              toLabel = {t("knowledge.broadcast.pagination.to")}
              ofLabel = {t("knowledge.broadcast.pagination.of")}
              itemsLabel = {t("knowledge.broadcast.pagination.items")}
              page={page}
              totalPage={pagination.totalPage}
              totalCount={pagination.totalCount}
              limit={pagination.limit}
              onPageChange={setPage}
              />
            </div>
          ) : null}
        </div>
      ) : null}
    </KbBlockShell>
  );
};

export default BroadcastListBlock;
