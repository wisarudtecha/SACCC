import React, { useState } from "react";
import { useTranslation } from "@/core/hooks/useTranslation";
import { FiStar, FiEye, FiLoader } from "react-icons/fi";
import type {
  ArticleFilter,
  ArticleItem,
} from "@/kms/banner/dtos/banner.dto";
import { useArticleListData } from "@/kms/banner/hook/useBannerData";

// ─── Star Rating ──────────────────────────────────────────────────────────────

const StarRating: React.FC<{ rating: number; max: number }> = ({
  rating,
  max,
}) => (
  <span className="inline-flex items-center gap-0.5">
    {Array.from({ length: max }).map((_, i) => (
      <FiStar
        key={i}
        size={12}
        className={
          i < rating
            ? "fill-amber-400 text-amber-400"
            : "fill-none text-slate-200 dark:text-slate-700"
        }
      />
    ))}
  </span>
);

// ─── Status Badge ─────────────────────────────────────────────────────────────

// const STATUS_COLORS: Record<string, string> = {
//   published:
//     "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
//   review:
//     "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
//   draft: "bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-slate-400",
//   archived: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-500",
// };

const STATUS_COLORS: Record<string, string> = {
  publish:
    "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
  wait_publish:
    "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
  draft: "bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-slate-400",
  unpublished:
    "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-500",
};

// ─── Quick filter tabs ────────────────────────────────────────────────────────

const TABS: Array<{
  key: string;
  labelKey: string;
  filter: Partial<ArticleFilter>;
}> = [
  { key: "latest", labelKey: "tab.newest", filter: { sortBy: "latest" } },
  {
    key: "popular",
    labelKey: "tab.popular",
    filter: { sortBy: "most_viewed" },
  },
  {
    key: "high",
    labelKey: "tab.high",
    filter: { priority: "high", sortBy: "high_priority" },
  },
  {
    key: "published",
    labelKey: "tab.published",
    filter: { status: "publish", sortBy: "latest" },
  },
  {
    key: "review",
    labelKey: "tab.review",
    filter: { status: "wait_approve", sortBy: "latest" },
  },
];

// ─── Article Row ──────────────────────────────────────────────────────────────

interface ArticleRowProps {
  article: ArticleItem;
  isSelected: boolean;
  isAdding: boolean;
  onSelect: (article: ArticleItem) => void;
  isCreate?:boolean;
}

// ─── Priority Dot ─────────────────────────────────────────────────────────────

const PRIORITY_COLORS: Record<string, string> = {
  high: "bg-rose-500",
  medium: "bg-amber-400",
  low: "bg-gray-300 dark:bg-slate-600",
};

const PriorityDot: React.FC<{ priority: ArticleItem["priority"] }> = ({
  priority,
}) => (
  <span
    className={`inline-block h-2 w-2 rounded-full ${PRIORITY_COLORS[priority] ?? PRIORITY_COLORS.low}`}
  />
);

const ArticleRow: React.FC<ArticleRowProps> = ({
  article,
  isSelected,
  isAdding,
  onSelect,
  isCreate= true
}) => {
  const { t } = useTranslation();

  return (
    <div className="flex items-start gap-4 px-5 py-4 transition-colors hover:bg-slate-50/60 dark:hover:bg-white/[0.02]">
      {/* Select button */}
      <button
        type="button"
        onClick={() => onSelect(article)}
         disabled={ !isCreate? true  : (isSelected || isAdding )}
        className={`mt-0.5 shrink-0 inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold shadow transition disabled:cursor-not-allowed ${
          isSelected
            ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
            : "bg-violet-600 text-white hover:bg-violet-700"
        }`}
      >
        
        {isAdding ? (
          <FiLoader size={11} className="animate-spin" />
        ) : isSelected ? (
          "✓"
        ) : null}
        {isSelected
          ? t("knowledge.banner.articleList.added")
          : t("knowledge.banner.articleList.selectBtn")}
      </button>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex flex-col gap-1.5 sm:flex-row sm:items-start sm:justify-between">
          <span className="line-clamp-2 text-sm font-semibold leading-snug text-amber-600 dark:text-amber-400">
            {article.title}
          </span>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <StarRating rating={article.rating} max={article.ratingMax} />
            <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500 dark:bg-slate-800 dark:text-slate-400">
              <FiEye size={10} />
              {article.viewCount.toLocaleString()}
            </span>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[article.status_value] ?? STATUS_COLORS.draft}`}
            >
              {t(`knowledge.articles.statusBadge.${article.status_value}`)}
            </span>
          </div>
        </div>

        <p className="mt-1 line-clamp-1 text-xs text-slate-400 dark:text-slate-500">
          {article.description}
        </p>

        <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-slate-400 dark:text-slate-500">
          <span>
            {t("knowledge.articles.meta.version")} {article.version}
          </span>
          <span>
            {t("knowledge.articles.meta.lastEdited")} {article.updatedAt}
          </span>
          <span className="flex items-center gap-1">
            <FiEye size={10} />
            {article.viewCount.toLocaleString()}
          </span>
          {/* <span>Priority: {article.priority}</span> */}
          <span className="flex items-center gap-1">
            <PriorityDot priority={article.priority} />
            {t("knowledge.articles.meta.priority")} {article.priority}
          </span>

          <span className="ml-auto text-right">
            {t("knowledge.articles.meta.category")}: {article.category?.path ?? "-"}
            {/* {article.cat_full_path} */}
          </span>
        </div>
      </div>
    </div>
  );
};

// ─── Skeleton ─────────────────────────────────────────────────────────────────

const RowSkeleton: React.FC = () => (
  <div className="flex items-start gap-4 px-5 py-4 animate-pulse">
    <div className="mt-1 h-7 w-24 shrink-0 rounded-lg bg-slate-100 dark:bg-slate-700" />
    <div className="flex-1 space-y-2">
      <div className="h-4 w-3/4 rounded bg-slate-100 dark:bg-slate-700" />
      <div className="h-3 w-full rounded bg-slate-100 dark:bg-slate-700" />
      <div className="flex gap-3">
        <div className="h-3 w-20 rounded bg-slate-100 dark:bg-slate-700" />
        <div className="h-3 w-20 rounded bg-slate-100 dark:bg-slate-700" />
      </div>
    </div>
  </div>
);

// ─── Main component ───────────────────────────────────────────────────────────

interface Props {
  selectedArticleIds: string[];
  addingArticleId?: string | null;
  onSelect: (article: ArticleItem) => void;
  isCreate?:boolean;
}

const PAGE_SIZE = 10;

const BannerArticleList: React.FC<Props> = ({
  selectedArticleIds,
  addingArticleId,
  onSelect,
  isCreate = true
}) => {
    const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("latest");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const tabFilter = TABS.find((tab) => tab.key === activeTab)?.filter ?? {};
  const filter: ArticleFilter = {
    pageSize: PAGE_SIZE,
    page,
    search: search || undefined,
    ...tabFilter,
  };

  // const { data, isLoading, isFetching } = useArticleListData(filter);
  // const articles = data?.data?.items ?? [];
  // const total = data?.data?.total ?? 0;
  // const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const { data, isLoading, isFetching } = useArticleListData(filter);
  const articles = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const handleTabChange = (key: string) => {
    setActiveTab(key);
    setPage(1);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1);
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-sm dark:border-white/[0.08] dark:bg-slate-900">
      {/* Header */}
      <div className="border-b border-slate-100 px-5 py-4 dark:border-white/[0.06]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
            {t("knowledge.banner.articleList.title")}
          </h3>
          {/* Search */}
          <div className="relative w-full sm:max-w-xs">
            <svg
              className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              value={search}
              onChange={handleSearch}
              placeholder={t("knowledge.articles.filter.searchPlaceholder")}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-8 pr-3 text-xs text-slate-700 outline-none transition focus:border-violet-400 focus:bg-white focus:ring-1 focus:ring-violet-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-3 flex flex-wrap gap-1">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => handleTabChange(tab.key)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                activeTab === tab.key
                  ? "bg-violet-600 text-white shadow"
                  : "text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/[0.05]"
              }`}
            >
              {t(`knowledge.banner.${tab.labelKey}`)}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="divide-y divide-slate-100 dark:divide-white/[0.05]">
        {isLoading ? (
          Array.from({ length: PAGE_SIZE }).map((_, i) => (
            <RowSkeleton key={i} />
          ))
        ) : articles.length === 0 ? (
          <p className="py-10 text-center text-sm text-slate-400 dark:text-slate-500">
            {t("knowledge.articles.noData")}
          </p>
        ) : (
          articles.map((article) => (
            <ArticleRow
              key={article.articleId}
              article={article}
              isSelected={selectedArticleIds.includes(String(article.articleId))}
              isAdding={addingArticleId === String(article.articleId)}
              onSelect={onSelect}
              isCreate={isCreate}
            />
          ))
        )}
      </div>

      {/* Pagination */}
      {!isLoading && articles.length > 0 && (
        <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3 dark:border-white/[0.06]">
          <p className="text-xs text-slate-400 dark:text-slate-500">
            {total.toLocaleString()} {t("knowledge.articles.total")}
            {isFetching && (
              <FiLoader size={11} className="ml-2 inline animate-spin" />
            )}
          </p>
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="rounded-lg px-2 py-1 text-xs text-slate-500 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-white/[0.05]"
            >
              {t("knowledge.articles.pagination.prev")}
            </button>
            <span className="rounded-lg bg-violet-600 px-2.5 py-1 text-xs font-semibold text-white">
              {page}
            </span>
            <span className="text-xs text-slate-400">/ {totalPages}</span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-lg px-2 py-1 text-xs text-slate-500 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-white/[0.05]"
            >
              {t("knowledge.articles.pagination.next")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BannerArticleList;
