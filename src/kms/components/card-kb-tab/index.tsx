import { useState } from "react";
import {
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import {
  FiStar 
} from "react-icons/fi";
import { useTranslation } from "@/core/hooks/useTranslation";
import type { KbTabCard, KbTabCardFilter } from "@/kms/components/card-kb-tab/dtos/kb-tab-card.dto";
import { useKbTabCards } from "@/kms/components/card-kb-tab/hook/useKbTabCards";

export type { KbTabCard, KbTabCardFilter };
export type { KbTabCardTab, KbTabCardListResult } from "@/kms/components/card-kb-tab/dtos/kb-tab-card.dto";
const queryClient = new QueryClient();
// ─── Category badge colours ───────────────────────────────────────────────────

const CATEGORY_STYLES: Record<string, string> = {
  Returns:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  Shipping:
    "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300",
  Payment:
    "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
  Products:
    "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
};

const getCategoryStyle = (category: string) =>
  CATEGORY_STYLES[category] ??
  "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300";

const numFmt = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});

// ─── Single card ──────────────────────────────────────────────────────────────

interface KbTabCardProps {
  article: KbTabCard;
  onOpen?: (article: KbTabCard) => void;
  onCopy?: (article: KbTabCard) => void;
}

const KbTabCardItem = ({ article, onOpen }: KbTabCardProps) => {
  const { t } = useTranslation();
  const handleOpen = () => {
    const url  = article.url ?? window.location.href;
     window.open(url, "_blank", "noopener,noreferrer");
    onOpen?.(article);
  };

  return (
    <div className="relative rounded-2xl border border-slate-200/80 bg-white px-4 py-3.5 shadow-sm transition hover:border-sky-200 hover:shadow-md dark:border-white/10 dark:bg-slate-900 dark:hover:border-sky-500/30">
      {/* Category badge */}
      <span
        className={`absolute right-4 top-3.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${getCategoryStyle(article.category)}`}
      >
        {article.category}
      </span>

      {/* Title */}
      <h3 className="pr-24 text-sm font-semibold leading-snug text-slate-900 dark:text-white">
        {article.title}
      </h3>

      {/* Description */}
      <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
        {article.description}
      </p>

      {/* Tags */}
      <div className="mt-2.5 flex flex-wrap gap-1.5">
        {article.tags.map((tag) => (
          <span
            key={tag}
            className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500 dark:bg-slate-800 dark:text-slate-400"
          >
            {tag}
          </span>
        ))}
      </div>

      {/* Stats row */}
      <div className="mt-3 flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
        {/* Views */}
        <span className="flex items-center gap-1">
          <svg
            className="h-3.5 w-3.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.8}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          {numFmt.format(article.views)}
        </span>

        {/* Likes */}
        <span className="flex items-center gap-1">
          {/* <svg
            className="h-3.5 w-3.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.8}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6.633 10.5c.806 0 1.533-.446 2.031-1.08a9.041 9.041 0 012.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 00.322-1.672V3a.75.75 0 01.75-.75A2.25 2.25 0 0116.5 4.5c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 01-2.649 7.521c-.388.482-.987.729-1.605.729H13.48c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 00-1.423-.23H5.904M14.25 9h2.25M5.904 18.669A1.989 1.989 0 013.9 18.75H2.25a.75.75 0 010-1.5H3.9a.489.489 0 00.487-.435 7.501 7.501 0 010-.83.489.489 0 00-.487-.435H2.25a.75.75 0 010-1.5h1.65c.604 0 1.077.483 1.19 1.07.043.217.086.438.13.66"
            />
          </svg>
          {numFmt.format(article.likes)} */}


           <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                              <FiStar size={12} className="text-amber-400" /> {article?.score?.value}
                            </div>
        </span>

        <div className="flex-1" />

        {/* Open button */}
        <button
          type="button"
          onClick={handleOpen}
          className="flex items-center gap-1 font-medium text-sky-600 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300"
        >
          <svg
            className="h-3.5 w-3.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
            />
          </svg>
          {t("knowledge.case.panel.open")}
        </button>

        {/* Copy button */}
        {/* <button
          type="button"
          onClick={handleCopy}
          title={copied ? t("knowledge.case.panel.copied") : t("knowledge.case.panel.copy")}
          className="text-slate-400 transition hover:text-slate-600 dark:hover:text-slate-200"
        >
          {copied ? (
            <svg
              className="h-3.5 w-3.5 text-emerald-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4.5 12.75l6 6 9-13.5"
              />
            </svg>
          ) : (
            <svg
              className="h-3.5 w-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.8}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75"
              />
            </svg>
          )}
        </button> */}
      </div>

      {/* Last updated */}
      <p className="mt-2 text-[11px] text-slate-400 dark:text-slate-600">
        {t("knowledge.case.panel.lastupdate")}: {article.updatedAt}
      </p>
    </div>
  );
};

// ─── List with search + tab filter ───────────────────────────────────────────

export const KbTabCardList = (props: KbTabCardListProps) => {
  return (
    <QueryClientProvider client={queryClient}>
      <KbTabCardListContent {...props} />
    </QueryClientProvider>
  );
};

interface KbTabCardListProps {
  onOpen?: (article: KbTabCard) => void;
  onCopy?: (article: KbTabCard) => void;
}

// export const KbTabCardList = ({ onOpen, onCopy }: KbTabCardListProps) => {
const KbTabCardListContent = ({
  onOpen,
  onCopy,
}: KbTabCardListProps) => {
  const [filter, setFilter] = useState<KbTabCardFilter>({
    category: "All",
    page: 1,
    pageSize: 50,
  });
  const { t, language } = useTranslation();
  const { data, isLoading, isError } = useKbTabCards(filter);
  const setSearch = (search: string) =>
    setFilter((f) => ({ ...f, search, page: 1 }));

  const setCategory = (category: string) =>
    setFilter((f) => ({ ...f, category, page: 1 }));

  const tabs = data?.data.tabs ?? [];

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
          />
        </svg>
        <input
          type="text"
          placeholder={t("knowledge.case.panel.search")}
          value={filter.search ?? ""}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-4 text-sm text-slate-700 placeholder-slate-400 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 dark:border-white/10 dark:bg-slate-900 dark:text-slate-200 dark:focus:ring-sky-500/20"
        />
      </div>

      {/* Tab filters */}
      {tabs.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setCategory(tab.key)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition ${(filter.category ?? "All") === tab.key
                ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                : "border border-slate-200 bg-white text-slate-600 hover:border-sky-300 hover:text-sky-700 dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-300"
                }`}
            >
              {
                language == 'th' ? tab.label_th : tab.label_en}
              <span className="ml-1 opacity-60">({tab.count})</span>
            </button>
          ))}
        </div>
      )}

      {/* Cards — scrollable */}
      <div className="max-h-[480px] overflow-y-auto pr-1 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-200 dark:[&::-webkit-scrollbar-thumb]:bg-slate-700 [&::-webkit-scrollbar-track]:bg-transparent">
        {isLoading && (
          <div className="space-y-3">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="h-28 animate-pulse rounded-2xl border border-slate-200/70 bg-slate-100 dark:border-white/10 dark:bg-slate-800"
              />
            ))}
          </div>
        )}

        {isError && (
          <p className="py-6 text-center text-sm text-red-400">
            Failed to load articles. Please try again.
          </p>
        )}

        {!isLoading && !isError && (
          <div className="space-y-3">
            {(data?.data.items ?? []).length === 0 ? (
              <p className="py-6 text-center text-sm text-slate-400">
                {t("knowledge.case.panel.notfound")}
              </p>
            ) : (
              (data?.data.items ?? []).map((article) => (
                <KbTabCardItem
                  key={article.id}
                  article={article}
                  onOpen={onOpen}
                  onCopy={onCopy}
                />
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default KbTabCardItem;
