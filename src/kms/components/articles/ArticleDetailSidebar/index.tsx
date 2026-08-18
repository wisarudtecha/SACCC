import React from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "@/core/hooks/useTranslation";
import {
  FiCalendar, FiClock, FiEye, FiFolder,
  FiGlobe, FiStar, FiTag, FiUsers,
} from "react-icons/fi";
import type { /*ArticleDetail,*/ ArticleDetailInfo } from "@/kms/articles/dtos/articles.dto";
//import { formatISODateTime } from "@/kms/common/common.transform.service";

interface Props {
  isLoading: boolean;
  info?: ArticleDetailInfo | null;
  headerVersion?: string;
  headerCategoryPath?: string;
  headerSourceName?: string;
  headerCreatedDate?: string;
  headerUpdatedDate?: string;
  headerViewCount?: number;
  headerAvgScore?: number;
  headerRatingMax?: number;
  headerTotalScore?: number;
}

const card = "overflow-hidden rounded-[20px] border border-slate-200/70 bg-white shadow-sm dark:border-white/[0.08] dark:bg-slate-900/80";
const cardHeader = "border-b border-slate-100 px-4 py-3 dark:border-white/[0.06]";
const sectionLabel = "text-[10px] font-bold uppercase tracking-widest text-slate-400";

const Row: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({ icon, label, value }) => (
  <div className="flex items-start gap-2.5 py-2">
    <span className="mt-0.5 shrink-0 text-slate-400">{icon}</span>
    <div className="min-w-0">
      <p className="text-[10px] uppercase tracking-wide text-slate-400">{label}</p>
      <p className="truncate text-xs font-medium text-slate-700 dark:text-slate-200">{value || "—"}</p>
    </div>
  </div>
);

const Chip: React.FC<{ label: string; color?: string }> = ({ label, color = "bg-slate-100 text-slate-600 dark:bg-white/[0.07] dark:text-slate-300" }) => (
  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium ${color}`}>
    {label}
  </span>
);


const ArticleDetailSidebar: React.FC<Props> = ({ isLoading, info, headerVersion,
  headerCategoryPath, headerSourceName, headerCreatedDate, headerUpdatedDate,
  headerViewCount, headerAvgScore, headerRatingMax, headerTotalScore,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className={`${card} p-4`}>
            <div className="mb-3 h-3 w-24 animate-pulse rounded bg-slate-100 dark:bg-white/[0.06]" />
            {[...Array(4)].map((_, j) => (
              <div key={j} className="my-2 h-3 animate-pulse rounded bg-slate-100 dark:bg-white/[0.05]" />
            ))}
          </div>
        ))}
      </div>
    );
  }

  if (  !info) return null;

  const relatedArticles = info?.relatedArticles ??  [];
  const keywords = info?.keywords ??   [];
  const viewableGroups = info?.viewableGroups ?? [];


  return (
    <div className="space-y-4">
      {/* Metadata */}
      <div className={card}>
        <div className={cardHeader}>
          <p className={sectionLabel}>{t("knowledge.articles.detail.metadata")}</p>
        </div>
        <div className="divide-y divide-slate-50 px-4 dark:divide-white/[0.04]">
          <Row icon={<FiFolder size={13} />} label={t("knowledge.articles.detail.category")}  value={headerCategoryPath ?? ""} />
          <Row icon={<FiGlobe size={13} />}  label={t("knowledge.articles.detail.source")}    value={headerSourceName ?? info?.sourceName ?? ""} />
          {(() => {
            const viewCount = headerViewCount ?? 0;
            const avgScore  = headerAvgScore  ?? 0;
            const ratingMax = headerRatingMax  ??0;
            const score     = headerTotalScore ?? 0;
            if (viewCount == null && avgScore == null && score == null) return null;
            return (
              <div className="flex items-center gap-4 py-2">
                {viewCount != null && (
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                    <FiEye size={12} /> {viewCount.toLocaleString()}
                  </div>
                )}
                {avgScore != null && ratingMax != null && (
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                    <FiStar size={12} className="text-amber-400" /> {avgScore}/{ratingMax}
                  </div>
                )}
                {score != null && (
                  <div className="ml-auto text-xs font-semibold text-indigo-500">
                    {t("knowledge.articles.detail.score")}: {score}
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      </div>

      {/* Dates */}
      <div className={card}>
        <div className={cardHeader}>
          <p className={sectionLabel}>{t("knowledge.articles.detail.version")}</p>
        </div>
        <div className="divide-y divide-slate-50 px-4 dark:divide-white/[0.04]">
          <Row icon={<FiClock size={13} />}    label={t("knowledge.articles.detail.version")}    value={headerVersion ? `v${headerVersion}`  : ""} />
          <Row icon={<FiCalendar size={13} />} label={t("knowledge.articles.detail.startDate")}  value={info?.startDate ?? ""} />
          <Row icon={<FiCalendar size={13} />} label={t("knowledge.articles.detail.endDate")}    value={info?.expirationDate ?? ""} />
          <Row icon={<FiClock size={13} />}    label={t("knowledge.articles.detail.createdAt")}  value={headerCreatedDate ? headerCreatedDate: ""} />
          <Row icon={<FiClock size={13} />}    label={t("knowledge.articles.detail.updatedAt")}  value={headerUpdatedDate ? headerUpdatedDate : ""} />
        </div>
      </div>

      {/* Access & Keywords */}
      <div className={card}>
        <div className={cardHeader}>
          <p className={sectionLabel}>{t("knowledge.articles.detail.accessAndKeywords")}</p>
        </div>
        <div className="p-4 space-y-3">
          {/* Viewable Groups */}
          <div>
            <p className={`${sectionLabel} mb-1.5`}>
              <FiUsers size={10} className="inline mr-1" />{t("knowledge.articles.detail.viewableGroups")}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {viewableGroups.length > 0
                ? viewableGroups.map((g, i) => (
                    <Chip key={`${g}-${i}`} label={g} color="bg-sky-50 text-sky-600 dark:bg-sky-500/15 dark:text-sky-400" />
                  ))
                : <span className="text-xs text-slate-400">—</span>}
            </div>
          </div>
          {/* Keywords */}
          {keywords.length > 0 && (
            <div>
              <p className={`${sectionLabel} mb-1.5`}>
                <FiTag size={10} className="inline mr-1" />{t("knowledge.articles.detail.keywords")}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {keywords.map((k, i) => (
                  <Chip key={`${k}-${i}`} label={k} color="bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400" />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Related articles */}
      {relatedArticles.length > 0 && (
        <div className={card}>
          <div className={cardHeader}>
            <p className={sectionLabel}>{t("knowledge.articles.detail.relatedArticles")}</p>
          </div>
          <div className="max-h-64 overflow-y-auto divide-y divide-slate-50 dark:divide-white/[0.04]">
            {relatedArticles.map((r, i) => (
              <button
                key={`${r.id}-${i}`}
                type="button"
                onClick={() => navigate(`/kms/articles/${r.id}`)}
                className="w-full px-4 py-2.5 text-left text-xs text-slate-600 transition hover:bg-slate-50 hover:text-indigo-600 dark:text-slate-300 dark:hover:bg-white/[0.04] dark:hover:text-indigo-400 line-clamp-2"
              >
                {r.title}
              </button>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};

export default ArticleDetailSidebar;
