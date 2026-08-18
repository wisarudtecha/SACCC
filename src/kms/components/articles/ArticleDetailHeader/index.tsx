import React from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { FiArrowLeft, FiEdit2, FiEye, FiStar } from "react-icons/fi";
import type { ArticleDetail } from "../../../articles/dtos/articles.dto";

const STATUS_STYLE: Record<string, string> = {
  published: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400",
  review:    "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
  draft:     "bg-slate-100 text-slate-600 dark:bg-white/[0.08] dark:text-slate-400",
  archived:  "bg-slate-100 text-slate-500 dark:bg-white/[0.06] dark:text-slate-500",
};

const PRIORITY_STYLE: Record<string, string> = {
  high:   "bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400",
  medium: "bg-sky-100 text-sky-600 dark:bg-sky-500/15 dark:text-sky-400",
  low:    "bg-slate-100 text-slate-500 dark:bg-white/[0.07] dark:text-slate-400",
};

interface Props {
  article: ArticleDetail | null | undefined;
  isLoading: boolean;
  mode?: "view" | "review";
}

const ArticleDetailHeader: React.FC<Props> = ({ article, isLoading, mode = "view" }) => {
  const { t } = useTranslation("articles");
  const navigate = useNavigate();

  const isReview = mode === "review";
  const gradientLight = isReview
    ? "bg-[radial-gradient(circle_at_top_left,_rgba(245,158,11,0.18),_transparent_30%),linear-gradient(135deg,_rgba(255,255,255,0.98),_rgba(255,251,235,0.96),_rgba(248,250,252,0.98))]"
    : "bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.18),_transparent_30%),linear-gradient(135deg,_rgba(255,255,255,0.98),_rgba(245,245,255,0.96),_rgba(248,250,252,0.98))]";
  const gradientDark = isReview
    ? "dark:bg-[radial-gradient(circle_at_top_left,_rgba(245,158,11,0.20),_transparent_28%),linear-gradient(135deg,_rgba(2,6,23,0.97),_rgba(15,23,42,0.96),_rgba(30,41,59,0.93))]"
    : "dark:bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.22),_transparent_28%),linear-gradient(135deg,_rgba(2,6,23,0.97),_rgba(15,23,42,0.96),_rgba(30,41,59,0.93))]";
  const glowColor = isReview
    ? "bg-[radial-gradient(circle_at_center,_rgba(245,158,11,0.15),_transparent_60%)]"
    : "bg-[radial-gradient(circle_at_center,_rgba(139,92,246,0.15),_transparent_60%)]";
  const accentColor = isReview ? "text-amber-500 dark:text-amber-400" : "text-indigo-500 dark:text-indigo-400";

  return (
    <section className={`relative overflow-hidden rounded-[28px] border border-slate-200/70 p-5 shadow-[0_28px_80px_-42px_rgba(15,23,42,0.38)] dark:border-white/10 sm:rounded-[32px] sm:p-8 ${gradientLight} ${gradientDark}`}>
      {/* Glow orb */}
      <div className={`pointer-events-none absolute inset-y-0 right-0 hidden w-1/3 lg:block ${glowColor}`} />
      <div className="pointer-events-none absolute bottom-0 left-1/2 h-px w-2/3 -translate-x-1/2 bg-gradient-to-r from-transparent via-indigo-400/30 to-transparent" />

      <div className="relative">
        {/* Back + action row */}
        <div className="mb-5 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200/70 bg-white/80 px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm backdrop-blur transition hover:bg-white dark:border-white/[0.10] dark:bg-white/[0.06] dark:text-slate-300 dark:hover:bg-white/[0.10]"
          >
            <FiArrowLeft size={13} /> {isReview ? t("review.back") : t("detail.back")}
          </button>
          {article && !isReview && (
            <button
              type="button"
              onClick={() => navigate(`/Kb/articles/edit/${article.id}`)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-[0_4px_12px_-4px_rgba(99,102,241,0.55)] transition hover:from-violet-500 hover:to-indigo-500"
            >
              <FiEdit2 size={12} /> {t("detail.edit")}
            </button>
          )}
          {isReview && (
            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold uppercase tracking-widest text-amber-600 dark:bg-amber-500/20 dark:text-amber-400">
              {t("review.eyebrow")}
            </span>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-3">
            <div className="h-4 w-36 animate-pulse rounded-lg bg-slate-200/60 dark:bg-white/[0.08]" />
            <div className="h-8 w-3/4 animate-pulse rounded-xl bg-slate-200/60 dark:bg-white/[0.08]" />
            <div className="h-4 w-full max-w-xl animate-pulse rounded-lg bg-slate-200/60 dark:bg-white/[0.08]" />
          </div>
        ) : article ? (
          <>
            {/* Eyebrow */}
            <p className={`mb-2 text-xs font-semibold uppercase tracking-widest ${accentColor}`}>
              {isReview ? t("review.eyebrow") : (article.category.path || t("detail.eyebrow"))}
            </p>

            {/* Title */}
            <h1 className="max-w-3xl text-2xl font-semibold leading-snug tracking-tight text-slate-900 dark:text-white sm:text-3xl">
              {article.title}
            </h1>

            {/* Description */}
            {article.description && (
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
                {article.description}
              </p>
            )}

            {/* Meta row */}
            <div className="mt-5 flex flex-wrap items-center gap-2.5 text-xs">
              {/* Status */}
              <span className={`rounded-full px-2.5 py-1 font-semibold ${STATUS_STYLE[article.status] ?? STATUS_STYLE.draft}`}>
                {t(`statusBadge.${article.status}`)}
              </span>

              {/* Priority */}
              <span className={`rounded-full px-2.5 py-1 font-medium ${PRIORITY_STYLE[article.priority] ?? PRIORITY_STYLE.medium}`}>
                {t(`priority.${article.priority}`)}
              </span>

              {/* Version */}
              <span className="rounded-full border border-slate-200/70 bg-white/70 px-2.5 py-1 font-mono font-medium text-slate-600 dark:border-white/[0.08] dark:bg-white/[0.05] dark:text-slate-300">
                v{article.version}
              </span>

              <span className="h-4 w-px bg-slate-200 dark:bg-white/[0.10]" />

              {/* Views */}
              <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                <FiEye size={12} /> {article.viewCount.toLocaleString()}
              </span>

              {/* Rating */}
              <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                <FiStar size={12} className="text-amber-400" />
                {article.rating}/{article.ratingMax}
              </span>

              <span className="h-4 w-px bg-slate-200 dark:bg-white/[0.10]" />

              {/* Dates */}
              <span className="text-slate-400 dark:text-slate-500">
                {t("detail.updatedAt")}: <span className="text-slate-600 dark:text-slate-300">{article.updatedAt}</span>
              </span>
            </div>
          </>
        ) : null}
      </div>
    </section>
  );
};

export default ArticleDetailHeader;
