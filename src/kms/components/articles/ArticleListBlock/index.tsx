import React from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "@/core/hooks/useTranslation";
import {
  ArticleFilter,
  ArticleItem,
} from "@/kms/articles/dtos/articles.dto";
import {
  useArticleListData
} from "@/kms/articles/hook/useArticlesData";
import KbPaginator from "@/kms/components/shared/KbPaginator";
import ActionMenu from "@/kms/components/common/ActionMenu";
import { usePermissions } from "@/core/hooks/usePermissions";
import { KbPermission } from "@/kms/common/utils/enumHelper"
import { ArticleStatus } from "@/kms/common/utils/enumArticleStatus"


// ─── Star Rating ─────────────────────────────────────────────────────────────

const StarRating: React.FC<{ rating: number; max: number }> = ({
  rating,
  max,
}) => (
  <span className="inline-flex items-center gap-0.5">
    {Array.from({ length: max }).map((_, i) => (
      <svg
        key={i}
        className={`h-3.5 w-3.5 ${i < rating ? "text-amber-400" : "text-gray-200 dark:text-slate-700"}`}
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ))}
  </span>
);

// ─── Status Badge ─────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  publish:
    "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
  wait_publish:
    "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
  draft: "bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-slate-400",
  unpublished: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-500",
};


const StatusBadge: React.FC<{
  status: string;
  label: string;
}> = ({ status, label }) => (
  <span
    className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[status] ?? STATUS_COLORS.draft}`}
  >
    {label}
  </span>
);

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

// ─── Skeleton ─────────────────────────────────────────────────────────────────

const ArticleSkeleton: React.FC = () => (
  <div className="animate-pulse px-5 py-4">
    <div className="mb-3 h-4 w-2/3 rounded bg-gray-200 dark:bg-slate-700" />
    <div className="mb-2 h-3 w-full rounded bg-gray-200 dark:bg-slate-700" />
    <div className="h-3 w-4/5 rounded bg-gray-200 dark:bg-slate-700" />
    <div className="mt-3 flex gap-3">
      <div className="h-3 w-20 rounded bg-gray-200 dark:bg-slate-700" />
      <div className="h-3 w-20 rounded bg-gray-200 dark:bg-slate-700" />
    </div>
  </div>
);

// ─── Single Article Card ──────────────────────────────────────────────────────

const ArticleCard: React.FC<{ article: ArticleItem }> = ({ article }) => {
  const permissions = usePermissions();
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div
      className="group cursor-pointers px-5 py-4 transition-colors hover:bg-amber-50/40 dark:hover:bg-amber-900/10"

    >
      {/* Top row: title + badges */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        {/* Title */}
        <span className="line-clamp-2 cursor-pointer flex-1 text-sm font-semibold leading-snug text-amber-600 group-hover:text-amber-700 group-hover:underline dark:text-amber-400 dark:group-hover:text-amber-300"
          onClick={() => navigate(`/kms/articles/${article.articleId}`, {
            state: { hideBack: true },
          })}
        >
          {article.title}
        </span>

        {/* Rating + view count + status */}
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <StarRating rating={article.rating} max={article.ratingMax} />
          <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500 dark:bg-slate-800 dark:text-slate-400">
            <svg
              className="h-3 w-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
            </svg>
            {article.viewCount.toLocaleString()} {t("knowledge.articles.meta.viewCount")}
          </span>
          <StatusBadge
            status={article.status_value}
            label={t(`knowledge.articles.statusBadge.${article.status_value}`)}
          />
          {(permissions.hasAnyPermission([KbPermission.KB_ARTICLE_MGMT_UPDATE,
          KbPermission.KB_ARTICLE_MGMT_CHANGE_STATUS])) && (
              <ActionMenu
                showApproveButton={permissions.hasPermission(KbPermission.KB_ARTICLE_MGMT_CHANGE_STATUS)}
                showEditButton={permissions.hasPermission(KbPermission.KB_ARTICLE_MGMT_UPDATE) && ArticleStatus.DRAFT == article.status_value}
                onEdit={() => {
                  navigate(`/kms/articles/edit/${article.articleId}`)
                }}
                onApprove={() => {
                  navigate(`/kms/articles/review/${article.articleId}`)
                }}
              />
            )
          }
        </div>
      </div>

      {/* Description */}
      <p className="mt-2.5 line-clamp-2 text-xs leading-relaxed text-gray-500 dark:text-slate-400">
        {article.description}
      </p>

      {/* Bottom meta row */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400 dark:text-slate-500">
          <span className="flex items-center gap-1">
            <svg
              className="h-3.5 w-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            {t("knowledge.articles.meta.version")}: {article.version}
          </span>
          <span className="flex items-center gap-1">
            <svg
              className="h-3.5 w-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            {t("knowledge.articles.meta.createDate")}: {article.createdAt}
          </span>
          <span className="flex items-center gap-1">
            <svg
              className="h-3.5 w-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            {t("knowledge.articles.meta.lastEdited")}: {article.updatedAt}
          </span>
          <span className="flex items-center gap-1">
            <svg
              className="h-3.5 w-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
            </svg>
            {article.viewCount.toLocaleString()}
          </span>
          <span className="flex items-center gap-1">
            <PriorityDot priority={article.priority} />
            {t("knowledge.articles.meta.priority")} {article.priority}
          </span>
        </div>

        {/* Category breadcrumb */}
        <span className="text-right text-xs text-gray-400 dark:text-slate-500">
          <span className="font-medium text-gray-500 dark:text-slate-400">
            {t("knowledge.articles.meta.category")}:
          </span>{" "}
          {article.category?.path ?? "-"}
        </span>
      </div>
    </div>


  );
};

// ─── Main Block ───────────────────────────────────────────────────────────────

const PAGE_SIZE = 5;

interface ArticleListBlockProps {
  filter?: ArticleFilter;
  onPageChange: (page: number) => void;
}

const ArticleListBlock: React.FC<ArticleListBlockProps> = ({
  filter,
  onPageChange,
}) => {

  const { t } = useTranslation();
  const activeFilter = { pageSize: PAGE_SIZE, ...filter };

  const { data, isLoading, isError, isFetching, refetch } = useArticleListData(activeFilter);
  const articles = data?.data?.items ?? [];
  const total = data?.data?.total ?? 0;
  const page = activeFilter.page ?? 1;
  const pageSize = activeFilter.pageSize;

  if (isLoading) {
    return (
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm dark:bg-slate-900">
        <div className="divide-y divide-gray-100 dark:divide-slate-700/60">
          {Array.from({ length: PAGE_SIZE }).map((_, i) => (
            <ArticleSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-2xl bg-rose-50 p-6 text-center text-sm text-rose-600 dark:bg-rose-900/20 dark:text-rose-400">
        Failed to load articles.{" "}
        <button
          type="button"
          onClick={() => void refetch()}
          className="ml-2 underline hover:no-underline"
        >
          Retry
        </button>
      </div>
    );
  }

  if (articles.length === 0) {
    return (
      <div className="rounded-2xl bg-white p-10 text-center text-sm text-gray-400 shadow-sm dark:bg-slate-900 dark:text-slate-500">
        {t("knowledge.articles.noData")}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-sm dark:bg-slate-900">
      {/* Card header: count + refetch */}
      <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3 dark:border-slate-700/60">
        <p className="text-xs text-gray-400 dark:text-slate-500">
          {total.toLocaleString()} {t("knowledge.articles.total")}
        </p>
        <button
          type="button"
          onClick={() => void refetch()}
          disabled={isFetching}
          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
          aria-label="Refetch"
        >
          <svg
            className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          {isFetching ? "..." : "Refresh"}
        </button>
      </div>

      {/* Article rows */}
      <div className="divide-y divide-gray-100 dark:divide-slate-700/60">
        {articles.map((article) => (
          <ArticleCard
            key={article.id}
            article={article}

          />
        ))}
      </div>

      {/* Paginator inside card */}
      <div className="border-t border-gray-100 px-5 py-3 dark:border-slate-700/60">
        <KbPaginator
          showingLabel={t("knowledge.articles.pagination.showing")}
          toLabel={t("knowledge.articles.pagination.to")}
          ofLabel={t("knowledge.articles.pagination.of")}
          itemsLabel={t("knowledge.articles.pagination.items")}
          page={page}
          totalPage={Math.max(1, Math.ceil(total / pageSize))}
          totalCount={total}
          limit={pageSize}
          onPageChange={onPageChange}
        />
      </div>
    </div>
  );
};

export default ArticleListBlock;
