import React, { useState } from "react";
import { useTranslation } from "@/core/hooks/useTranslation";
import { FiClock, FiCheck, FiX } from "react-icons/fi";
import type { ArticleLogEntry } from "@/kms/articles/dtos/articles.dto";

const scrollbarStyles = `
  .activity-log-modal-content::-webkit-scrollbar {
    width: 8px;
  }
  .activity-log-modal-content::-webkit-scrollbar-track {
    background: transparent;
  }
  .activity-log-modal-content::-webkit-scrollbar-thumb {
    background: rgba(71, 85, 105, 0.5);
    border-radius: 4px;
  }
  .activity-log-modal-content::-webkit-scrollbar-thumb:hover {
    background: rgba(71, 85, 105, 0.7);
  }
  .dark .activity-log-modal-content::-webkit-scrollbar-thumb {
    background: rgba(148, 163, 184, 0.3);
  }
  .dark .activity-log-modal-content::-webkit-scrollbar-thumb:hover {
    background: rgba(148, 163, 184, 0.5);
  }
`;

interface Props {
  logs?: ArticleLogEntry[];
  isLoading?: boolean;
}

const getActivityLogColor = (
  action: string,
): { text: string; icon: string; line: string } => {
  switch (action) {
    case "approve":
      return {
        text: "text-emerald-600 dark:text-emerald-400",
        icon: "bg-emerald-100 dark:bg-emerald-500/20",
        line: "bg-emerald-300 dark:bg-emerald-600",
      };
    case "publish":
      return {
        text: "text-emerald-600 dark:text-emerald-400",
        icon: "bg-emerald-100 dark:bg-emerald-500/20",
        line: "bg-emerald-300 dark:bg-emerald-600",
      };
    case "submit":
      return {
        text: "text-blue-600 dark:text-blue-400",
        icon: "bg-blue-100 dark:bg-blue-500/20",
        line: "bg-blue-300 dark:bg-blue-600",
      };
    case "edit":
      return {
        text: "text-amber-600 dark:text-amber-400",
        icon: "bg-amber-100 dark:bg-amber-500/20",
        line: "bg-amber-300 dark:bg-amber-600",
      };
    case "create":
      return {
        text: "text-slate-600 dark:text-slate-400",
        icon: "bg-slate-100 dark:bg-slate-500/20",
        line: "bg-slate-300 dark:bg-slate-600",
      };
    case "draft":
      return {
        text: "text-slate-600 dark:text-slate-400",
        icon: "bg-slate-100 dark:bg-slate-500/20",
        line: "bg-slate-300 dark:bg-slate-600",
      };
    default:
      return {
        text: "text-slate-600 dark:text-slate-400",
        icon: "bg-slate-100 dark:bg-slate-500/20",
        line: "bg-slate-300 dark:bg-slate-600",
      };
  }
};

const getActionLabel = (action: string, t: any): string => {
  action = action.toLocaleLowerCase()
  const labels: Record<string, string> = {
    create: t("knowledge.articles.activityLog.create"),
    edit: t("knowledge.articles.activityLog.edit"),
    submit: t("knowledge.articles.activityLog.submit"),
    approve: t("knowledge.articles.activityLog.approve"),
    publish: t("knowledge.articles.activityLog.publish"),
    archive: t("knowledge.articles.activityLog.archive"),
    draft: t("knowledge.articles.activityLog.draft"),
    reject: t("knowledge.articles.activityLog.reject"),
    "to draft": t("knowledge.articles.activityLog.to_draf"),
    unpublish: t("knowledge.articles.activityLog.unpublish"),
    "change version": t("knowledge.articles.activityLog.change_version"),
  };
  return labels[action] || `${action.charAt(0).toUpperCase() + action.slice(1)} Article ${action}`;
};

const ArticleActivityLog: React.FC<Props> = ({
  logs = [],
  isLoading = false,
}) => {
  const { t } = useTranslation();
  const [showModal, setShowModal] = useState(false);

  if (isLoading) {
    return (
      <div className="overflow-hidden rounded-[20px] border border-slate-200/70 bg-white p-4 dark:border-white/[0.08] dark:bg-slate-900/80">
        <div className="mb-3 h-3 w-48 animate-pulse rounded bg-slate-100 dark:bg-white/[0.06]" />
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="my-2.5 h-12 animate-pulse rounded-xl bg-slate-100 dark:bg-white/[0.05]"
          />
        ))}
      </div>
    );
  }

  if (!logs || logs.length === 0) {
    return (
      <div className="overflow-hidden rounded-[20px] border border-slate-200/70 bg-white shadow-sm dark:border-white/[0.08] dark:bg-slate-900/80">
        <div className="border-b border-slate-100 px-4 py-4 dark:border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-700">
              <FiClock size={16} className="text-slate-600 dark:text-slate-300" />
            </div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
              {t("knowledge.articles.activityLog.title")}
            </p>
          </div>
        </div>
        <div className="px-4 py-8 text-center">
          <p className="text-sm text-slate-400">{t("knowledge.articles.activityLog.empty")}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{scrollbarStyles}</style>
      <div className="pr-1 overflow-hidden rounded-[20px] border border-slate-200/70 bg-white shadow-sm dark:border-white/[0.08] dark:bg-slate-900/80">
        {/* Header */}
        <div className="border-b border-slate-100 px-4 py-4 dark:border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-700">
              <FiClock size={16} className="text-slate-600 dark:text-slate-300" />
            </div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
              {t("knowledge.articles.activityLog.title")}
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <div className="max-h-100 overflow-y-auto  relative space-y-4">
            {logs.map((log, idx) => {
              const colors = getActivityLogColor(log.action);
              const isLast = idx === logs.length - 1;

              return (
                <div key={log.id} className="relative flex gap-4 pb-2">
                  {/* Timeline */}
                  <div className="flex flex-col items-center">
                    {/* Dot */}
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-full ${colors.icon} ring-2 ring-white dark:ring-slate-900`}
                    >
                      <FiCheck size={14} className={colors.text} />
                    </div>
                    {/* Line */}
                    {!isLast && (
                      <div className={`mt-1 w-0.5 h-12 ${colors.line}`} />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 pt-0.5">
                    <div className="space-y-0.5">
                      <p className={`text-sm font-semibold ${colors.text}`}>
                        {getActionLabel(log.action, t)}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {log.actor}
                      </p>
                      <p className="text-xs text-slate-400 dark:text-slate-500">
                        {log.at}
                      </p>
                      {log.note && (
                        <div className="mt-2 rounded-lg bg-slate-50 px-2.5 py-1.5 dark:bg-slate-800/50">
                          <p className="text-xs text-slate-600 dark:text-slate-300">
                            {log.note}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* View All Link */}
          {logs.length > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-white/[0.06]">
              <button
                onClick={() => setShowModal(true)}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 transition"
              >
                {t("knowledge.articles.activityLog.viewAll")} →
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Activity Log Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl max-h-[80vh] overflow-hidden rounded-[20px] border border-slate-200/70 bg-white shadow-xl dark:border-white/[0.08] dark:bg-slate-900/80 flex flex-col">
            {/* Modal Header */}
            <div className="border-b border-slate-100 px-6 py-4 dark:border-white/[0.06] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-700">
                  <FiClock size={16} className="text-slate-600 dark:text-slate-300" />
                </div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  {t("knowledge.articles.activityLog.title")}
                </h2>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                title="Close"
              >
                <FiX size={20} className="text-slate-600 dark:text-slate-400" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="overflow-y-auto flex-1 p-6 activity-log-modal-content">
              <div className="relative space-y-4">
                {logs.map((log, idx) => {
                  const colors = getActivityLogColor(log.action);
                  const isLast = idx === logs.length - 1;

                  return (
                    <div key={log.id} className="relative flex gap-4 pb-2">
                      {/* Timeline */}
                      <div className="flex flex-col items-center">
                        {/* Dot */}
                        <div
                          className={`flex h-8 w-8 items-center justify-center rounded-full ${colors.icon} ring-2 ring-white dark:ring-slate-900`}
                        >
                          <FiCheck size={14} className={colors.text} />
                        </div>
                        {/* Line */}
                        {!isLast && (
                          <div className={`mt-1 w-0.5 h-16 ${colors.line}`} />
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 pt-0.5">
                        <div className="space-y-2">
                          <div className="flex items-start justify-between">
                            <p className={`text-sm font-semibold ${colors.text}`}>
                              {getActionLabel(log.action, t)}
                            </p>
                            <p className="text-xs text-slate-400 dark:text-slate-500 flex-shrink-0 ml-4">
                              {log.at}
                            </p>
                          </div>
                          <p className="text-sm text-slate-600 dark:text-slate-300 font-medium">
                            {log.actor}
                          </p>
                          {log.note && (
                            <div className="mt-3 rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-800/50 border border-slate-200 dark:border-white/[0.05]">
                              <p className="text-sm text-slate-600 dark:text-slate-300">
                                {log.note}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="border-t border-slate-100 bg-slate-50 px-6 py-4 dark:border-white/[0.06] dark:bg-slate-800/50">
              <button
                onClick={() => setShowModal(false)}
                className="w-full rounded-lg border border-slate-300 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                {t("knowledge.articles.coverImage.cancel")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ArticleActivityLog;
