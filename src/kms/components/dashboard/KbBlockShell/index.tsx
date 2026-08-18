import type { ReactNode } from "react";
// import { useTranslation } from "react-i18next";
import { useTranslation } from "@/core/hooks/useTranslation";
type BlockShellNamespace = "dashboard" | "broadcast";

interface KbBlockShellProps {
  title: string;
  description: string;
  endpoint?: string;
  source?: string;
  children: ReactNode;
  className?: string;
  aside?: ReactNode;
  subHeader?: ReactNode;
  onRefresh?: () => void;
  isFetching?: boolean;
  isError?: boolean;
  translationNamespace?: BlockShellNamespace;
}

const KbBlockShell = ({
  title,
  description,
  children,
  className = "",
  aside,
  subHeader,
  onRefresh,
  isFetching = false,
  isError = false,
  translationNamespace = "dashboard",
}: KbBlockShellProps) => {
  translationNamespace=translationNamespace??"";
  // const { t } = useTranslation(translationNamespace);
 const { t } = useTranslation();
  return (
    <section
      className={`flex flex-col rounded-[24px] border border-slate-200/70 bg-white/95 p-4 shadow-[0_20px_60px_-36px_rgba(15,23,42,0.45)] backdrop-blur dark:border-white/10 dark:bg-slate-950/70 sm:rounded-[28px] sm:p-5 ${className}`}
    >
      <div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            {title}
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {description}
          </p>
          {subHeader && <div className="mt-3">{subHeader}</div>}
          {isError && (
            <div className="mt-3">
              <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-1 text-xs font-medium text-rose-600 dark:bg-rose-500/10 dark:text-rose-400">
                <span className="h-1.5 w-1.5 rounded-full bg-rose-500 dark:bg-rose-400" />
                {t("knowledge.dashboard.labels.loadFailed")}
              </span>
            </div>
          )}
        </div>
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
          {aside}
          {onRefresh ? (
            <button
              type="button"
              onClick={onRefresh}
              className="w-full rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-sky-300 hover:text-sky-700 dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-200 dark:hover:border-sky-400/30 dark:hover:text-sky-300 sm:w-auto"
            >
              {isFetching ? t("knowledge.dashboard.buttons.refreshing") : t("knowledge.dashboard.buttons.refresh")}
            </button>
          ) : null}
        </div>
      </div>
      <div className="flex-1 min-h-0">{children}</div>
    </section>
  );
};

export default KbBlockShell;
