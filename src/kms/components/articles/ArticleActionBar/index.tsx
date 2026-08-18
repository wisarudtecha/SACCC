import React, { useState } from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "@/core/hooks/useTranslation";
import {
  FiTrash2,
  FiCopy,
  FiEdit3,
  FiCheckCircle,
  FiLoader,
} from "react-icons/fi";
import type { ArticleDetail } from "@/kms/articles/dtos/articles.dto";
import {
  deleteArticle,
  duplicateArticle,
  //certifyArticle,
  getArticleNewVersion,
} from "@/kms/articles/service/articles.service";

interface Props {
  article?: ArticleDetail | null;
  articleId?: string;
  isLoading?: boolean;
  onActionComplete?: (action: ArticleActionType, success: boolean) => void;
  isDelete?: boolean;
  isCopy?: boolean;
  isVersion?: boolean;
  isUpdate?: boolean;

}

export type ArticleActionType =
  | "delete"
  | "duplicate"
  | "editContent"
  | "certify";

const ArticleActionBar: React.FC<Props> = ({
  article,
  articleId,
  isLoading,
  onActionComplete,
  isDelete = true,
  isCopy = true,
  isVersion = true,
  isUpdate = true

}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loadingAction, setLoadingAction] = useState<ArticleActionType | null>(
    null,
  );
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (isLoading) {
    return (
      <div className="flex flex-wrap items-center gap-1.5">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="h-7 w-20 animate-pulse rounded-lg bg-slate-200 dark:bg-white/[0.08]"
          />
        ))}
      </div>
    );
  }

  const effectiveId = article?.id ?? articleId ?? "";
  if (!effectiveId) return null;

  const isActing = loadingAction !== null;

  const runAction = async (
    action: ArticleActionType,
    fn: () => Promise<{ success: boolean }>,
  ) => {
    setLoadingAction(action);
    try {
      const res = await fn();
      onActionComplete?.(action, res.success);
    } catch {
      onActionComplete?.(action, false);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleDelete = async () => {
    setConfirmDelete(false);
    await runAction("delete", () => deleteArticle(effectiveId));
    navigate(`/kms/articles`);
  };

  const handleDuplicate = async () => {
    const article = await duplicateArticle(effectiveId) // await runAction("duplicate", () => duplicateArticle(effectiveId));
    navigate(`/kms/articles/edit/${article?.data?.id}`);
  }
  const handleNewverstion = async () => {
    const article = await getArticleNewVersion(effectiveId)
    navigate(`/kms/articles/edit/${article?.data?.id}`);
  };
  const handleCertify = async () => {
   // await runAction("certify", () => certifyArticle(effectiveId));
    navigate(`/kms/articles/edit/${effectiveId}`);
  }

  const btnBase =
    "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-white shadow transition disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <>
      <div className="flex flex-wrap items-center gap-1.5">
        {isDelete && (
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            disabled={isActing}
            className={`${btnBase} bg-red-600 hover:bg-red-700`}
            title={t("knowledge.articles.actions.delete")}
          >
            <FiTrash2 size={13} />
            {t("knowledge.articles.actions.delete")}
          </button>

        )}

        {isCopy && (
          <button
            type="button"
            onClick={handleDuplicate}
            disabled={isActing}
            className={`${btnBase} bg-indigo-600 hover:bg-indigo-700`}
            title={t("knowledge.articles.actions.duplicate")}
          >
            {loadingAction === "duplicate" ? (
              <FiLoader size={13} className="animate-spin" />
            ) : (
              <FiCopy size={13} />
            )}
            {t("knowledge.articles.actions.duplicate")}
          </button>
        )}

        {isVersion && (
          <button
            type="button"
            onClick={handleNewverstion}
            disabled={isActing}
            className={`${btnBase} bg-cyan-600 hover:bg-cyan-700`}
            title={t("knowledge.articles.actions.editContent")}
          >
            <FiEdit3 size={13} />
            {t("knowledge.articles.actions.editContent")}
          </button>

        )}

        {isUpdate && (
          <button
            type="button"
            onClick={handleCertify}
            disabled={isActing}
            className={`${btnBase} bg-amber-500 hover:bg-amber-600`}
            title={t("knowledge.articles.actions.certify")}
          >
            {loadingAction === "certify" ? (
              <FiLoader size={13} className="animate-spin" />
            ) : (
              <FiCheckCircle size={13} />
            )}
            {t("knowledge.articles.actions.certify")}
          </button>
        )}

      </div>

      {/* Delete confirmation modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm overflow-hidden rounded-[20px] border border-slate-200/70 bg-white shadow-xl dark:border-white/[0.08] dark:bg-slate-900/80">
            <div className="px-6 py-5">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {t("knowledge.articles.actions.deleteConfirmTitle")}
              </h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                {t("knowledge.articles.actions.deleteConfirmDesc")}
              </p>
            </div>
            <div className="flex gap-3 border-t border-slate-200/70 bg-slate-50 px-6 py-4 dark:border-white/[0.08] dark:bg-slate-800/50">
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="flex-1 rounded-lg border border-slate-300 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                {t("knowledge.articles.actions.cancel")}
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="flex-1 rounded-lg bg-red-600 py-2 text-sm font-medium text-white transition hover:bg-red-700"
              >
                {t("knowledge.articles.actions.confirmDelete")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ArticleActionBar;
