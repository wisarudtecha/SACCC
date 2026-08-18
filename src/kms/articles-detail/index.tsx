import { useParams } from "react-router";
import { useTranslation } from "@/core/hooks/useTranslation";
import PageMeta from "@/kms/components/common/PageMeta";
import {
  useArticleDetailHeader,
  useArticleDetailContent,
  useArticleDetailInfo,
  useArticleCountView,
  refreshArticleDetail
} from "@/kms/articles/hook/useArticlesData";
import ArticleDetailContent from "@/kms/components/articles/ArticleDetailContent";
import ArticleDetailSidebar from "@/kms/components/articles/ArticleDetailSidebar";
import ArticleCoverImage from "@/kms/components/articles/ArticleCoverImage";
import { usePermissions } from "@/core/hooks/usePermissions";
import { KbPermission } from "@/kms/common/utils/enumHelper"
import NotFound from "@/core/pages/OtherPage/NotFound";
import { useQueryClient } from "@tanstack/react-query";
import { ArticleStatus } from "@/kms/common/utils/enumArticleStatus"
const ArticleDetailPage = () => {
  const queryClient = useQueryClient();
  const permissions = usePermissions();
  const isView = permissions.hasAnyPermission([KbPermission.KB_ARTICLE_VIEW, KbPermission.KB_ARTICLE_MGMT_VIEW]);
  const isComment = permissions.hasPermission(KbPermission.KB_ARTICLE_COMMENT);
  let isModeView = true;
  const maxRate: number[] = [];
  if (!isView) {
    return <NotFound />;
  }
  const { id = "" } = useParams<{ id: string }>();
  const { t, language } = useTranslation();
  const i18n = {
    language: language
  }
  const artId = Number(id.replace(/\D+/g, "")) || 0;
  const isTh = i18n.language.startsWith("th");

  const { isSuccess: isCountViewSuccess } = useArticleCountView(artId);
  const { data: header, isLoading: isHeaderLoading, isSuccess: isHeaderSuccess } = useArticleDetailHeader(artId, isCountViewSuccess);
  const { data: apiContent, isLoading: isContentLoading } = useArticleDetailContent(artId, isCountViewSuccess);
  const { data: info, isLoading: isInfoLoading } = useArticleDetailInfo(artId, isCountViewSuccess);
  if (isHeaderSuccess) {
    
    isModeView = !(header?.status == ArticleStatus.PUBLISH)
    for (let i = 1; i <= (header?.ratingMax ?? 0); i++) {
      maxRate.push(i);
    }
  }

  const headerSourceName = header?.source
    ? (isTh ? header.source.name_th : header.source.name_en)
    : undefined;
  const headerVersionStr = header?.version != null ? String(header.version) : undefined;

  if (isHeaderLoading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24 text-sm text-slate-400 dark:text-slate-500">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
        <span>{t("knowledge.articles.form.loading")}</span>
      </div>
    );
  }

  if (!header && isHeaderSuccess) {
    return <NotFound />;
  }
  return (
    <>
      <PageMeta
        title={header?.title ?? t("knowledge.articles.detail.loading")}
        description={header?.description ?? ""}
      />
      <div className="space-y-5 pb-8">
        {/* Header — loads independently */}
        <ArticleCoverImage
          mode="review"
          coverImage={header?.coverImgUrl}
          title={header?.title ?? ''}
          description={header?.description ?? ''}
          version={headerVersionStr ?? ''}
          category={header?.category?.fullPath}
          status={header?.priority ? t(`knowledge.articles.priority.${header.priority}`) : undefined}
          reviewLabel={t("knowledge.articles.review.eyebrow")}
          isLoading={isHeaderLoading}
          backLabel={t("knowledge.articles.detail.back")}
        />

        {isHeaderLoading && (
          <p className="rounded-2xl border border-rose-100 bg-rose-50 p-6 text-center text-sm text-rose-500 dark:border-rose-500/20 dark:bg-rose-500/10">
            {t("knowledge.articles.detail.notFound")}
          </p>
        )}

        {!isHeaderLoading && (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_300px] xl:grid-cols-[1fr_320px]">
            {/* Content + Attachments — loads independently */}
            <ArticleDetailContent
              isView={isView}
              isComment={isComment}
              isLoading={isContentLoading || isInfoLoading}
              apiContent={apiContent}
              apiAttachments={info?.attachments}
              isModeView={isModeView}
              artId={artId}
              onRateSubmit={async () => {
                await refreshArticleDetail(queryClient, artId);
              }}
              rateRang={maxRate}
            />
            {/* Sidebar — loads independently */}
            <ArticleDetailSidebar
              isLoading={isHeaderLoading || isInfoLoading}
              info={info}
              headerVersion={headerVersionStr}
              headerCategoryPath={header?.category?.fullPath}
              headerSourceName={headerSourceName}
              headerCreatedDate={header?.createdDate}
              headerUpdatedDate={header?.updatedDate}
              headerViewCount={header?.viewCount}
              headerAvgScore={header?.avgScore}
              headerRatingMax={header?.ratingMax}
              headerTotalScore={header?.totalScore}
            />
          </div>
        )}
      </div>
    </>
  );
};

export default ArticleDetailPage;
