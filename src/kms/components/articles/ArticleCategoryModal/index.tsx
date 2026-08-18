import React from "react";
import { App as AntApp } from "antd";
import { useTranslation } from "@/core/hooks/useTranslation";
import CategoryManager from "../CategoryManager";

interface ArticleCategoryModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (key: string, path: string) => void;
}

const ArticleCategoryModal: React.FC<ArticleCategoryModalProps> = ({
  open,
  onClose,
  onSelect,
}) => {
  const { t } = useTranslation();

  if (!open) return null;

  const handleSelect = (key: string, path: string) => {
    onSelect(key, path);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative flex h-[80vh] w-full max-w-xl flex-col overflow-hidden rounded-[28px] bg-white shadow-2xl dark:bg-slate-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 dark:border-slate-700/60">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-100 dark:bg-violet-900/40">
              <svg
                className="h-4 w-4 text-violet-600 dark:text-violet-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                />
              </svg>
            </span>
            <div>
              <h2 className="text-sm font-semibold text-gray-900 dark:text-slate-100">
                {t("knowledge.articles.category.modalTitle")}
              </h2>
              <p className="text-xs text-gray-400 dark:text-slate-500">
                {t("knowledge.articles.category.modalSubtitle")}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-slate-700"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="min-h-0 flex-1 overflow-hidden p-5">
          <AntApp>
            <CategoryManager onSelect={handleSelect} selectOnly compact />
          </AntApp>
        </div>
      </div>
    </div>
  );
};

export default ArticleCategoryModal;
