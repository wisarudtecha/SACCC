import { useTranslation } from "@/core/hooks/useTranslation";
import { FiChevronLeft, FiChevronRight, FiEdit2, FiPlus, FiTrash2 } from "react-icons/fi";

import type { SourceItem } from "@/kms/source/dtos/source.dto";
import { useSourceData } from "@/kms/source/hook/useSourceData";

interface SourceTableProps {
  onCreate: () => void;
  onEdit: (item: SourceItem) => void;
  onDelete: (item: SourceItem) => void;
  isDeleting?: boolean;
  isCreate?: boolean;
  isUpdate?: boolean;
  isDelete?: boolean
}

const SourceTable = ({
  onCreate,
  onEdit,
  onDelete,
  isDeleting = false,
  isCreate = true,
  isUpdate = true,
  isDelete = true
}: SourceTableProps) => {
  const { t } = useTranslation();
  const { data, isLoading, isError, isFetching, refetch, page, setPage } =
    useSourceData();

  const items = data?.items ?? [];
  const totalPage = data?.pagination.totalPage ?? 1;
  const count = data?.pagination.count ?? 0;
  const limit = data?.pagination.limit ?? 10;
  const from = (page - 1) * limit;

  return (
    <section className="rounded-[24px] border border-slate-200/70 bg-white/95 p-4 shadow-[0_20px_60px_-36px_rgba(15,23,42,0.45)] backdrop-blur dark:border-white/10 dark:bg-slate-950/70 sm:rounded-[28px] sm:p-5">
      <div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            {t("knowledge.source.sections.list.title")}
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {t("knowledge.source.sections.list.description")}
          </p>
        </div>
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
          {isCreate && (
            <button
              type="button"
              onClick={onCreate}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-600"
            >
              <FiPlus />
              <span>{t("knowledge.source.buttons.add")}</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => { void refetch(); }}
            className="w-full rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-sky-300 hover:text-sky-700 dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-200 dark:hover:border-sky-400/30 dark:hover:text-sky-300 sm:w-auto"
          >
            {isFetching ? t("knowledge.source.buttons.refreshing") : t("knowledge.source.buttons.refresh")}
          </button>
        </div>
      </div>

      {isLoading ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">{t("knowledge.source.labels.loading")}</p>
      ) : null}

      {isError ? (
        <p className="text-sm text-rose-500">{t("knowledge.source.labels.loadFailed")}</p>
      ) : null}

      {!isLoading && !isError ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-white/[0.06]">
                <th className="py-3 pr-4 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-400 dark:text-slate-500 w-12">
                  {t("knowledge.source.labels.no")}
                </th>
                <th className="py-3 pr-4 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-400 dark:text-slate-500">
                  {t("knowledge.source.labels.nameTh")}
                </th>
                <th className="py-3 pr-4 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-400 dark:text-slate-500">
                  {t("knowledge.source.labels.nameEn")}
                </th>
                <th className="py-3 pr-4 text-center text-xs font-semibold uppercase tracking-[0.12em] text-slate-400 dark:text-slate-500 w-20">
                  {t("knowledge.source.labels.seq")}
                </th>
                <th className="py-3 text-right text-xs font-semibold uppercase tracking-[0.12em] text-slate-400 dark:text-slate-500 w-24">
                  {t("knowledge.source.labels.actions")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04]">
              {items.map((item, index) => (
                <tr
                  key={item.id}
                  className="group transition hover:bg-slate-50/70 dark:hover:bg-white/[0.025]"
                >
                  <td className="py-3.5 pr-4 text-slate-400 dark:text-slate-500">
                    {from + index + 1}
                  </td>
                  <td className="py-3.5 pr-4 font-medium text-slate-700 dark:text-slate-200">
                    {item.name_th || <span className="text-slate-400">—</span>}
                  </td>
                  <td className="py-3.5 pr-4 text-slate-600 dark:text-slate-300">
                    {item.name_en || <span className="text-slate-400">—</span>}
                  </td>
                  <td className="py-3.5 pr-4 text-center text-slate-500 dark:text-slate-400">
                    {item.seq}
                  </td>
                  <td className="py-3.5 text-right">
                    <div className="flex items-center justify-end gap-3 text-slate-400 dark:text-slate-500">
                      {isUpdate && (
                        <button
                          type="button"
                          onClick={() => onEdit(item)}
                          className="transition hover:text-violet-600 dark:hover:text-violet-300"
                          aria-label={t("knowledge.source.buttons.edit")}
                        >
                          <FiEdit2 />
                        </button>
                      )}
                      {isDelete && (
                        <button
                          type="button"
                          onClick={() => onDelete(item)}
                          disabled={isDeleting}
                          className="transition hover:text-rose-500 dark:hover:text-rose-300"
                          aria-label={t("knowledge.source.buttons.delete")}
                        >
                          <FiTrash2 />
                        </button>

                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {count === 0 ? (
            <div className="mt-4 rounded-2xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500 dark:border-white/10 dark:text-slate-400">
              {t("knowledge.source.labels.empty")}
            </div>
          ) : null}

          {count > 0 ? (
            <div className="mt-5 flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
              <p className="text-xs text-slate-400 dark:text-slate-500">
                {t("knowledge.source.pagination.showing", {
                  from: from + 1,
                  to: Math.min(from + limit, count),
                  total: count,
                })}
              </p>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-sky-300 hover:text-sky-600 disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-400 dark:hover:border-sky-400/30 dark:hover:text-sky-300"
                  aria-label={t("knowledge.source.pagination.prev")}
                >
                  <FiChevronLeft className="text-sm" />
                </button>

                {Array.from({ length: totalPage }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPage(p)}
                    className={`h-8 min-w-[2rem] rounded-lg border px-2 text-xs font-medium transition ${p === page
                      ? "border-sky-500 bg-sky-500 text-white"
                      : "border-slate-200 bg-white text-slate-600 hover:border-sky-300 hover:text-sky-600 dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-300 dark:hover:border-sky-400/30 dark:hover:text-sky-300"
                      }`}
                  >
                    {p}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPage, p + 1))}
                  disabled={page === totalPage}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-sky-300 hover:text-sky-600 disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-400 dark:hover:border-sky-400/30 dark:hover:text-sky-300"
                  aria-label={t("knowledge.source.pagination.next")}
                >
                  <FiChevronRight className="text-sm" />
                </button>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
};

export default SourceTable;
