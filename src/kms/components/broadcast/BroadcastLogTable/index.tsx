import { Fragment, useMemo, useState } from "react";
import { useTranslation } from "@/core/hooks/useTranslation";
import { useQuery } from "@tanstack/react-query";
import { FiChevronDown, FiChevronUp, FiSearch, FiCalendar } from "react-icons/fi";

import type { BroadcastStatus } from "@/kms/broadcast/dtos/broadcast.dto";
import { useBroadcastHistoryList } from "@/kms/broadcast/hook/useBroadcastList";
import { getBroadcastStatusOverview } from "@/kms/broadcast/service/broadcast.service";
import { GraphQL } from "@/kms/constant";
import KbBlockShell from "@/kms/components/dashboard/KbBlockShell";
import KbPaginator from "@/kms/components/shared/KbPaginator";

const statusClassMap: Record<Exclude<BroadcastStatus, "all">, string> = {
  scheduled:
    "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-200",
  published:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200",
  expired: "bg-pink-100 text-pink-700 dark:bg-pink-500/15 dark:text-pink-200",
  draft: "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-200",
};

const truncate = (text: string, max = 90) =>
  text.length > max ? `${text.slice(0, max)}…` : text;

const BroadcastLogTable = () => {
  const { t } = useTranslation();
  const [statusFilter, setStatusFilter] = useState<BroadcastStatus>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const statusOverviewQuery = useQuery({
    queryKey: ["kb-broadcast-status-overview-history"],
    queryFn: getBroadcastStatusOverview,
    staleTime: 1000 * 60 * 10,
  });

  const statusTabs = useMemo(() => {
    const seen = new Set<string>();
    return (statusOverviewQuery.data ?? []).filter((s) => {
      if (s.id === "all" || s.id === "draft") return false;
      if (seen.has(s.id)) return false;
      seen.add(s.id);
      return true;
    });
  }, [statusOverviewQuery.data]);

  const { data, isLoading, isError, isFetching, refetch, page, setPage } =
    useBroadcastHistoryList(statusFilter);

  const items = useMemo(() => {
    const raw = data?.items ?? [];
    if (!searchQuery.trim()) return raw;
    const q = searchQuery.toLowerCase();
    return raw.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.message.toLowerCase().includes(q),
    );
  }, [data?.items, searchQuery]);

  const pagination = data?.pagination;

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const handleTabChange = (s: BroadcastStatus) => {
    setStatusFilter(s);
    setExpandedId(null);
    setSearchQuery("");
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="space-y-3 py-2">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="flex h-11 items-center gap-4 rounded-xl bg-slate-100 px-4 dark:bg-white/5"
            >
              <div className="h-3 w-6 animate-pulse rounded-full bg-slate-200 dark:bg-white/10" />
              <div className="h-3 w-48 animate-pulse rounded-full bg-slate-200 dark:bg-white/10" />
              <div className="ml-auto h-5 w-20 animate-pulse rounded-full bg-slate-200 dark:bg-white/10" />
            </div>
          ))}
        </div>
      );
    }

    if (isError) {
      return (
        <p className="py-6 text-center text-sm text-rose-500 dark:text-rose-400">
          {t("knowledge.broadcast.labels.loadFailed")}
        </p>
      );
    }

    if (items.length === 0) {
      return (
        <div className="flex flex-col items-center gap-2 py-10 text-slate-400 dark:text-slate-500">
          <FiSearch size={28} />
          <p className="text-sm">
            {searchQuery.trim() ? t("knowledge.broadcast.labels.noResults") : t("knowledge.broadcast.labels.empty")}
          </p>
        </div>
      );
    }

    return (
      <div className="overflow-x-auto">
        <table className="w-full min-w-[600px] text-sm">
          <thead>
            <tr className="border-b border-slate-200 dark:border-white/[0.07]">
              {[
                "#",
                t("knowledge.broadcast.form.title"),
                t("knowledge.broadcast.labels.status"),
                t("knowledge.broadcast.labels.message"),
                t("knowledge.broadcast.log.startDate"),
                t("knowledge.broadcast.log.endDate"),
              ].map((col, i) => (
                <th
                  key={i}
                  className={[
                    "pb-3 pt-1 text-left font-medium text-slate-500 dark:text-slate-400",
                    i === 0 ? "w-10 pr-3" : "px-3",
                  ].join(" ")}
                >
                  {col}
                </th>
              ))}
              <th className="w-8 pb-3 pt-1" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-white/[0.05]">
            {items.map((item, idx) => {
              const isExpanded = expandedId === item.id;
              const cls = statusClassMap[item.status as Exclude<BroadcastStatus, "all">] ?? "";

              return (
                <Fragment key={`${item.id}-${idx}`}>
                  <tr
                    onClick={() => toggleExpand(item.id)}
                    className={[
                      "cursor-pointer transition-colors",
                      isExpanded
                        ? "bg-sky-50/60 dark:bg-sky-500/[0.06]"
                        : "hover:bg-slate-50 dark:hover:bg-white/[0.03]",
                    ].join(" ")}
                  >
                    <td className="py-3 pr-3 text-right text-xs text-slate-400 dark:text-slate-500">
                      {(page - 1) * (pagination?.limit ?? 10) + idx + 1}
                    </td>
                    <td className="max-w-[220px] px-3 py-3">
                      <span className="block truncate font-medium text-slate-800 dark:text-slate-100">
                        {item.title}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${cls}`}>
                        {t(`knowledge.broadcast.status.${item.status}`)}
                      </span>
                    </td>
                    <td className="max-w-[280px] px-3 py-3 text-slate-500 dark:text-slate-400">
                      {truncate(item.message)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-slate-500 dark:text-slate-400">
                      {item.startDate || "—"}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-slate-500 dark:text-slate-400">
                      {item.endDate || "—"}
                    </td>
                    <td className="py-3 pl-2 text-slate-400 dark:text-slate-500">
                      {isExpanded ? <FiChevronUp size={14} /> : <FiChevronDown size={14} />}
                    </td>
                  </tr>

                  {isExpanded && (
                    <tr className="bg-sky-50/50 dark:bg-sky-500/[0.04]">
                      <td colSpan={7} className="px-4 pb-4 pt-0">
                        <div className="ml-10 rounded-xl border border-sky-100 bg-white p-4 dark:border-white/[0.06] dark:bg-slate-900/80">
                          <p className="mb-3 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                            {item.message}
                          </p>
                          <div className="flex flex-wrap gap-x-6 gap-y-2 border-t border-slate-100 pt-3 dark:border-white/[0.06]">
                            <span className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                              <FiCalendar size={12} />
                              {item.startDate || "—"} – {item.endDate || "—"}
                            </span>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>

        {pagination ? (
          <div className="border-t border-slate-200 pt-3 dark:border-white/10">
            <KbPaginator
              showingLabel={t("knowledge.broadcast.pagination.showing")}
              toLabel={t("knowledge.broadcast.pagination.to")}
              ofLabel={t("knowledge.broadcast.pagination.of")}
              itemsLabel={t("knowledge.broadcast.pagination.items")}
              page={page}
              totalPage={pagination.totalPage}
              totalCount={pagination.totalCount}
              limit={pagination.limit}
              onPageChange={setPage}
            />
          </div>
        ) : null}
      </div>
    );
  };

  return (
    <KbBlockShell
      title={t("knowledge.broadcast.sections.log.title")}
      description={t("knowledge.broadcast.sections.log.description", {
        total: pagination?.totalCount ?? 0,
      })}
      endpoint={data?.meta.endpoint ?? GraphQL.URL}
      source={data?.meta.source ?? "api"}
      translationNamespace="broadcast"
      onRefresh={() => void refetch()}
      isFetching={isFetching}
    >
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Status filter tabs from API (no draft, no counts) */}
        <div className="flex flex-wrap gap-2">
          {(["all", ...statusTabs.map((s) => s.id)] as BroadcastStatus[]).map((id) => {
            const active = statusFilter === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => handleTabChange(id)}
                className={[
                  "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                  active
                    ? "bg-sky-500 text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-white/[0.07] dark:text-slate-300 dark:hover:bg-white/[0.12]",
                ].join(" ")}
              >
                {t(`knowledge.broadcast.status.${id}`)}
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative w-full max-w-64 sm:w-auto">
          <FiSearch
            size={13}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setExpandedId(null);
            }}
            placeholder={t("knowledge.broadcast.log.searchPlaceholder")}
            className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-8 pr-3 text-sm text-slate-700 placeholder-slate-400 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20 dark:border-white/[0.08] dark:bg-slate-900 dark:text-slate-200 dark:placeholder-slate-500 dark:focus:border-sky-500 dark:focus:ring-sky-500/20"
          />
        </div>
      </div>

      {renderContent()}
    </KbBlockShell>
  );
};

export default BroadcastLogTable;
