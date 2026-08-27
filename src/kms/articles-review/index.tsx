import { useParams } from "react-router";
import { useTranslation } from "@/core/hooks/useTranslation";
import { useState } from "react";
import PageMeta from "@/kms/components/common/PageMeta";
import { useQueryClient } from "@tanstack/react-query";
import {
  useArticleDetailHeader,
  useArticleDetailContent,
  useArticleDetailInfo,
  useArticleDetailStatusActivityData,
  refreshArticleDetail
} from "@/kms/articles/hook/useArticlesData";
import { changeHeaderImage } from "@/kms/articles/service/articles.service";
import ArticleDetailContent from "@/kms/components/articles/ArticleDetailContent";
import ArticleDetailSidebar from "@/kms/components/articles/ArticleDetailSidebar";
import ArticleCoverImage from "@/kms/components/articles/ArticleCoverImage";
import ArticleActivityLog from "@/kms/components/articles/ArticleActivityLog";
import ArticleReviewActions from "@/kms/components/articles/ArticleReviewActions";
import ArticleActionBar from "@/kms/components/articles/ArticleActionBar";
import { usePermissions } from "@/core/hooks/usePermissions";
import { KbPermission } from "@/kms/common/utils/enumHelper"
import NotFound from "@/core/pages/OtherPage/NotFound";
import ToastStack from "@/kms/components/common/ToastStack";
import { ArticleStatus } from "@/kms/common/utils/enumArticleStatus"
export type ArticleActionType =
  | "delete"
  | "duplicate"
  | "editContent"
  | "certify";
type ToastTone = "success" | "error";

interface ToastItems {
  id: number;
  tone: ToastTone;
  message: string;
}

const ArticleReviewPage = () => {
  const [toasts, setToasts] = useState<ToastItems[]>([]);
  const pushToast = (tone: ToastTone, message: string) => {
    const nextToast: ToastItems = {
      id: Date.now() + Math.floor(Math.random() * 1000),
      tone,
      message,
    };

    setToasts((current) => [...current, nextToast]);

    window.setTimeout(() => {
      setToasts((current) =>
        current.filter((toast) => toast.id !== nextToast.id),
      );
    }, 3200);
  };

  const dismissToast = (id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  };


  const permissions = usePermissions();
  const isView = permissions.hasPermission(KbPermission.KB_ARTICLE_MGMT_VIEW);
  const isCopy = permissions.hasPermission(KbPermission.KB_ARTICLE_MGMT_COPY)
  const isVersion = permissions.hasPermission(KbPermission.KB_ARTICLE_MGMT_NEW_VERSION)
  const isChangeStatus = permissions.hasPermission(KbPermission.KB_ARTICLE_MGMT_CHANGE_STATUS)
  const isComment = permissions.hasPermission(KbPermission.KB_ARTICLE_COMMENT)
  const queryClient = useQueryClient();
  const { id = "" } = useParams<{ id: string }>();
  const { t, language, } = useTranslation();
  const i18n = {
    language: language
  };
  const artId = Number(id.replace(/\D+/g, "")) || 0;
  const isTh = i18n.language.startsWith("th");
  const { data: header, isLoading: isHeaderLoading, isSuccess: isHeaderSuccess, isError: isHeaderError } = useArticleDetailHeader(artId);
  const { data: apiContent, isLoading: isContentLoading } = useArticleDetailContent(artId);
  const { data: info, isLoading: isInfoLoading } = useArticleDetailInfo(artId);
  const { data: article, isLoading: isMockLoading, isError } = useArticleDetailStatusActivityData(artId);
  const [coverImage, setCoverImage] = useState<string | undefined>(undefined);
  const [pendingImagePath, setPendingImagePath] = useState<string | undefined>(undefined);
  const [savingImage, setSavingImage] = useState(false);
  const isDelete = article?.status_value == ArticleStatus.DRAFT && permissions.hasPermission(KbPermission.KB_ARTICLE_MGMT_DELETE);
  const isUpdate = permissions.hasPermission(KbPermission.KB_ARTICLE_MGMT_UPDATE) && ArticleStatus.DRAFT == article?.status_value;
  const maxRate: number[] = [];

  if (isHeaderSuccess) {
    for (let i = 1; i <= (header?.ratingMax ?? 0); i++) {
      maxRate.push(i);
    }
  }
  const headerSourceName = header?.source
    ? (isTh ? header.source.name_th : header.source.name_en)
    : undefined;
  const headerVersionStr = header?.version != null ? String(header.version) : undefined;
  if (!isView) {
    return <NotFound />;
  }

  if (isHeaderLoading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24 text-sm text-slate-400 dark:text-slate-500">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
        <span>{t("knowledge.articles.form.loading")}</span>
      </div>
    );
  }




  if (isHeaderError || !header) {
    return <NotFound />;
  }

  const handleChangeCoverImage = (previewUrl: string, minioPath: string) => {
    setCoverImage(previewUrl);
    setPendingImagePath(minioPath);
  };

  const handleSaveCoverImage = async () => {
    if (!pendingImagePath || !artId) return;
    setSavingImage(true);
    try {
      const result = await changeHeaderImage(artId, pendingImagePath);
      if (result.success) {
        setPendingImagePath(undefined);
      }
    } catch (error) {
      console.error("Failed to save cover image:", error);
    } finally {
      setSavingImage(false);
    }
  };


  const handleAction = async (action: ArticleActionType, success: boolean) => {
    if (action == 'delete') {
      pushToast("success", t("knowledge.broadcast.toast.deleteSuccess"));
    }
    success = true;
    return success;
  }

  return (
    <>
      <PageMeta
        title={
          header
            ? `${t("knowledge.articles.review.title")} — ${header.title}`
            : t("knowledge.articles.review.title")
        }
        description={header?.description ?? article?.description ?? ""}
      />
      <div className="space-y-5 pb-8">

        {/* Cover card — loads independently */}
        <ArticleCoverImage
          mode="review"
          coverImage={coverImage ?? header?.coverImgUrl}
          title={header?.title ?? article?.title}
          description={header?.description ?? article?.description}
          category={header?.category?.fullPath}
          status={header?.priority ? t(`knowledge.articles.priority.${header.priority}`) : undefined}
          version={headerVersionStr ?? article?.version}
          isLoading={isHeaderLoading}
          backLabel={t("knowledge.articles.review.back")}
          reviewLabel={t("knowledge.articles.review.eyebrow")}
          changeLabel={t("knowledge.articles.review.changeLabel")}
          changeTitle={t("knowledge.articles.review.changeTitle")}
          notFoundimg={t("knowledge.articles.review.notFoundimg")}
          onChangeCoverImage={handleChangeCoverImage}
          isUpdate={isUpdate}
        />

        {/* Pending cover image save bar */}
        {pendingImagePath && (
          <div className="flex items-center justify-between rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-500/30 dark:bg-amber-500/10">
            <p className="text-sm text-amber-700 dark:text-amber-400">
              {/* {t("knowledge.articles.review.coverImage.unsaved")} */}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => { setCoverImage(undefined); setPendingImagePath(undefined); }}
                className="rounded-xl border border-amber-300 bg-white px-3 py-1.5 text-xs font-medium text-amber-700 transition hover:bg-amber-50 dark:border-amber-500/30 dark:bg-transparent dark:text-amber-400"
              >
                {t("knowledge.articles.coverImage.cancel")}
              </button>
              <button
                type="button"
                onClick={handleSaveCoverImage}
                disabled={savingImage}
                className="rounded-xl bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-amber-600 disabled:opacity-50"
              >
                {t("knowledge.articles.coverImage.save") /* {savingImage ? t("knowledge.articles.coverImage.saving") : t("knowledge.articles.coverImage.save")} */}
              </button>
            </div>
          </div>
        )}

        {/* Action bar — separate row, aligned right */}
        <div className="flex justify-end">
          <ArticleActionBar
            article={article}
            articleId={id}
            isLoading={isMockLoading}
            isCopy={isCopy}
            isDelete={isDelete}
            isUpdate={isUpdate}
            isVersion={isVersion}
            onActionComplete={handleAction}

          />
        </div>

        {isError && (
          <p className="rounded-2xl border border-rose-100 bg-rose-50 p-6 text-center text-sm text-rose-500 dark:border-rose-500/20 dark:bg-rose-500/10">
            {t("detail.notFound")}
          </p>
        )}

        {!isError && (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_300px] xl:grid-cols-[1fr_320px]">
            {/* Content + Attachments — loads independently */}
            <ArticleDetailContent
              isLoading={isContentLoading || isInfoLoading}
              apiContent={apiContent}
              apiAttachments={info?.attachments}
              artId={artId}
              isUpdate={isUpdate}
              isComment={isComment}
              isView={isView}
              isModeView={true}
              rateRang={maxRate}
            />
            <div className="space-y-4">
              <ArticleReviewActions
                article={article}
                currentStatus={header?.status ?? article?.status}
                isLoading={isMockLoading && isHeaderLoading}
                onSubmit={async (/*data*/) => {
                  await refreshArticleDetail(queryClient, artId);
                }}
                isChangeStatus={isChangeStatus}
              />
              <ArticleActivityLog
                logs={article?.activityLog}
                isLoading={false}
              />
              {/* Sidebar — loads independently */}
              <ArticleDetailSidebar
                isLoading={isMockLoading || isInfoLoading}
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
          </div>
        )}
      </div>

      <ToastStack toasts={toasts} onDismiss={dismissToast} />
    </>
  );
};

export default ArticleReviewPage;
