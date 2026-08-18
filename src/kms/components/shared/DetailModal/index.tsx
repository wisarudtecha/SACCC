import type { ReactNode } from "react";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { FiAlertCircle, FiBell, FiCalendar, FiInfo } from "react-icons/fi";
import { useTranslation } from "@/core/hooks/useTranslation";
import { Modal } from "../Modal";

interface DetailModalMetaItem {
  label: string;
  value: string;
  variant?: "meta" | "content";
}

interface DetailModalData {
  title: string;
  badge?: string;
  eyebrow?: string;
  items?: DetailModalMetaItem[];
}

interface DetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  resourceId?: string | null;
  queryKey: readonly unknown[];
  loadDetail: (resourceId: string) => Promise<DetailModalData>;
  fallbackData?: Partial<DetailModalData>;
  loadingText?: string;
  errorText?: string;
  retryText?: string;
  showCloseButton?: boolean;
  footer?: ReactNode;
}

const DetailModal = ({
  isOpen,
  onClose,
  resourceId,
  queryKey,
  loadDetail,
  fallbackData,
  loadingText = "Loading details...",
  errorText = "Unable to load details.",
  retryText = "Retry",
  showCloseButton = true,
  footer,
}: DetailModalProps) => {
  const { t } = useTranslation();
  const detailQuery = useQuery({
    queryKey: [...queryKey, resourceId],
    queryFn: () => loadDetail(resourceId as string),
    enabled: isOpen && Boolean(resourceId),
    staleTime: 30_000,
  });

  const detail = useMemo(() => {
    if (detailQuery.data) {
      return detailQuery.data;
    }

    if (!fallbackData) {
      return null;
    }

    return {
      title: fallbackData.title ?? "",
      badge: fallbackData.badge,
      eyebrow: fallbackData.eyebrow,
      items: fallbackData.items ?? [],
    } satisfies DetailModalData;
  }, [detailQuery.data, fallbackData]);

  const metaItems = (detail?.items ?? []).filter(
    (item) => item.variant !== "content",
  );

  const contentItems = (detail?.items ?? []).filter(
    (item) => item.variant === "content",
  );

  const hasLongContentList = contentItems.length > 4;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      showCloseButton={showCloseButton}
      className="m-4 max-w-[780px] overflow-hidden rounded-[2rem] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(248,250,252,0.98)_100%)] p-0 shadow-[0_48px_140px_-52px_rgba(15,23,42,0.55)] dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(2,6,23,0.98)_0%,rgba(15,23,42,0.98)_100%)]"
    >
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.22),_transparent_34%),radial-gradient(circle_at_top_right,_rgba(52,211,153,0.18),_transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.82)_0%,rgba(248,250,252,0.96)_56%,rgba(241,245,249,0.98)_100%)] dark:bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.16),_transparent_34%),radial-gradient(circle_at_top_right,_rgba(52,211,153,0.12),_transparent_30%),linear-gradient(180deg,rgba(2,6,23,0.88)_0%,rgba(15,23,42,0.96)_56%,rgba(15,23,42,0.98)_100%)]" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent dark:via-white/20" />

        <div className="relative px-6 pb-6 pt-6 sm:px-8 sm:pb-8 sm:pt-8">
          <div className="rounded-[1.75rem] border border-white/80 bg-white/55 p-5 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.45)] backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.03] sm:p-6">
            <div className="flex items-start gap-4 sm:gap-5">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[1.35rem] border border-white/60 bg-gradient-to-br from-sky-100 via-cyan-50 to-emerald-50 text-sky-600 shadow-inner shadow-white/70 dark:border-white/10 dark:bg-gradient-to-br dark:from-sky-500/20 dark:via-sky-500/10 dark:to-emerald-500/10 dark:text-sky-300 dark:shadow-none">
                <FiBell className="text-[1.65rem]" />
              </div>
              <div className="min-w-0 flex-1 pt-1">
                {detail?.eyebrow ? (
                  <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-400 dark:text-slate-500">
                    {detail.eyebrow}
                  </p>
                ) : null}
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <h3 className="text-2xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-[2rem] sm:leading-[1.15]">
                    {detail?.title ?? ""}
                  </h3>
                  {detail?.badge ? (
                    <span className="rounded-full border border-sky-200 bg-sky-50/90 px-3 py-1 text-xs font-semibold text-sky-700 shadow-sm dark:border-sky-400/20 dark:bg-sky-400/10 dark:text-sky-300">
                      {detail.badge}
                    </span>
                  ) : null}
                </div>
                {/* <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">
                  Review this notice before continuing. Confirm only after the
                  content has been acknowledged.
                </p> */}
              </div>
            </div>
          </div>

          {metaItems.length ? (
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {metaItems.map((item) => (
                <div
                  key={`${item.label}-${item.value}`}
                  className="rounded-[1.35rem] border border-slate-200/80 bg-white/75 px-4 py-4 shadow-[0_20px_48px_-38px_rgba(15,23,42,0.35)] dark:border-white/10 dark:bg-white/[0.04]"
                >
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">
                    <FiCalendar className="text-sm" />
                    <span>{item.label}</span>
                  </div>
                  <p className="mt-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          ) : null}

          <div className="mt-6 rounded-[1.75rem] border border-slate-200/80 bg-white/82 p-5 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.35)] dark:border-white/10 dark:bg-slate-900/70 sm:p-6">
            {detailQuery.isLoading && !detailQuery.data ? (
              <div className="mt-4 space-y-3">
                <div className="h-4 w-40 animate-pulse rounded-full bg-slate-200 dark:bg-slate-800" />
                <div className="h-4 w-full animate-pulse rounded-full bg-slate-200 dark:bg-slate-800" />
                <div className="h-4 w-11/12 animate-pulse rounded-full bg-slate-200 dark:bg-slate-800" />
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {loadingText}
                </p>
              </div>
            ) : null}

            {detailQuery.isError ? (
              <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-4 text-sm text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-200">
                <div className="flex items-start gap-3">
                  <FiAlertCircle className="mt-0.5 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p>{errorText}</p>
                    <button
                      type="button"
                      onClick={() => {
                        void detailQuery.refetch();
                      }}
                      className="mt-3 inline-flex rounded-xl border border-rose-300 px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 dark:border-rose-400/30 dark:text-rose-200 dark:hover:bg-rose-500/10"
                    >
                      {retryText}
                    </button>
                  </div>
                </div>
              </div>
            ) : null}

            {!detailQuery.isLoading && !detailQuery.isError ? (
              <div className="space-y-4">
                {contentItems.length > 0 ? (
                  <div className="flex items-center justify-between gap-3 border-b border-slate-200/70 pb-4 dark:border-white/10">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400 dark:text-slate-500">
           
                           {t("knowledge.broadcast.labels.title")}
                      </p>
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        {contentItems.length}  {t("knowledge.broadcast.labels.topic")}
                        {contentItems.length > 1 ? "s" : ""}  {t("knowledge.broadcast.labels.continuing")}
                      </p>
                    </div>
                    {hasLongContentList ? (
                      <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-500 dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-300">
                        Scroll to read all
                      </span>
                    ) : null}
                  </div>
                ) : null}

                <div
                  className={
                    hasLongContentList
                      ? "max-h-[46vh] space-y-4 overflow-y-auto pr-2 sm:pr-3"
                      : "space-y-4"
                  }
                >
                  {contentItems.map((item, index) => (
                    <div
                      key={`${item.label}-${item.value}`}
                      className="rounded-[1.35rem] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.92)_0%,rgba(248,250,252,0.9)_100%)] px-5 py-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.86)_0%,rgba(15,23,42,0.72)_100%)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-sky-200 bg-sky-50 text-xs font-semibold text-sky-700 dark:border-sky-400/20 dark:bg-sky-400/10 dark:text-sky-300">
                          {index + 1}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400 dark:text-slate-500">
                            <FiInfo className="text-sm" />
                            <span>{item.label}</span>
                          </div>
                          <p className="mt-4 whitespace-pre-wrap break-words text-[15px] leading-8 text-slate-600 dark:text-slate-300">
                            {item.value}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          {footer ? (
            <div className="mt-6 border-t border-slate-200/80 pt-5 dark:border-white/10">
              {footer}
            </div>
          ) : null}
        </div>
      </div>
    </Modal>
  );
};

export type { DetailModalData, DetailModalMetaItem, DetailModalProps };
export default DetailModal;
