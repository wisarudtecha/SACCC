import React, { useState } from "react";
import { useTranslation } from "@/core/hooks/useTranslation";
import { Link } from "react-router-dom";
import {
  FiStar
} from "react-icons/fi";
import {
  FiChevronDown, FiChevronRight,
  FiFolder,
  FiSearch,
} from "react-icons/fi";
import type { FileTreeNode } from "@/kms/files/dtos/files.dto";
import { useCategoryTreeBlockData, useCategoryArticleBlockData } from "@/kms/categorys/hook/useCategory-articleData";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CategorysArticlePanelProps {
  /** select mode: shows checkboxes + confirm footer */
  selectable?: boolean;
  initialSelected?: string[];
  /** limit number of selectable files; 1 = single-select (replaces previous) */
  maxSelect?: number;
  /** filter files by extension, e.g. ["jpg","jpeg","png","webp","gif","svg"] */
  accept?: string[];
  onConfirm?: (items: { name: string; sizeLabel: string; path: string }[]) => void;
  onCancel?: () => void;
  /** height class applied to the outer wrapper; default: "min-h-[540px]" */
  heightCls?: string;
}


// ─── Sidebar tree node ────────────────────────────────────────────────────────

const SidebarNode: React.FC<{
  node: FileTreeNode; depth: number;
  active: string;
  onSelect: (p: string) => void;
  onSelectCategory: (c: FileTreeNode) => void;
}> = ({ node, depth, active, onSelect, onSelectCategory }) => {
  const [open, setOpen] = useState(depth === 0);
  const has = !!node.children?.length;
  const isActive = active === node.path;
  return (
    <div>

      <button
        type="button"
        onClick={() => { if (has) setOpen((p) => !p); onSelect(node.path); onSelectCategory(node) }}
        style={{ paddingLeft: `${8 + depth * 12}px` }}
        className={`flex w-full items-center gap-1.5 rounded-lg py-1.5 pr-2 text-left transition-colors ${isActive ? "bg-indigo-50 font-medium text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-400"
          : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/[0.05]"}`}
      >
        <span className="w-3.5 shrink-0 text-slate-400">
          {has ? (open ? <FiChevronDown size={11} /> : <FiChevronRight size={11} />) : null}
        </span>
        <FiFolder size={12} className={isActive ? "text-indigo-500" : "text-amber-400 dark:text-amber-300"} />
        <span className="min-w-0 truncate text-xs">{node.name}</span>
      </button>
      {open && has && node.children!.map((c) => (
        <SidebarNode key={c.id} node={c} depth={depth + 1} active={active} onSelect={onSelect} onSelectCategory={onSelectCategory} />
      ))}
    </div>
  );
};






// ─── FileManagerPanel ─────────────────────────────────────────────────────────

//const IMAGE_EXTS = ["jpg", "jpeg", "png", "webp", "gif", "svg", "bmp", "tiff"];

const CategorysArticlePanel: React.FC<CategorysArticlePanelProps> = ({

  heightCls = "min-h-[540px]",
}) => {
  const { t, language } = useTranslation();


  const [path, setPath] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<FileTreeNode | null>(null);

  // ── data ──────────────────────────────────────────────────────────────────
  //const { data, isLoading, isError, isFetching, refetch } = useCategoryTreeBlockData();
  const { data, isLoading, isError } = useCategoryTreeBlockData();

  const articleQuery = useCategoryArticleBlockData({
    search,
    categoryId: category?.id ? Number(category.id) : undefined,
    limit: 10,
  });
  const isArticleLoading = articleQuery.isLoading;
  const isArticleError = articleQuery.isError;


  const hasNextPage = articleQuery.hasNextPage;
  const fetchNextPage = () => {
    return articleQuery.fetchNextPage();
  };

  const articles =
    articleQuery.data?.pages?.flatMap(
      (page) => page.data?.items ?? []
    ) ?? [];
  const treeNodes = (data?.data ?? []) as FileTreeNode[];
  const filterByAccept = (search: string) => {
    setSearch(search);
  }


  // breadcrumbs
  const crumbs = path ? path.replace(/\/$/, "").split("/") : [];

  const numFmt = new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  });

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <div className={`flex ${heightCls} overflow-hidden divide-x divide-slate-200/60 dark:divide-white/[0.07]`}>
      {/* ── Sidebar ──────────────────────────────────────────────────────── */}
      <div className="flex w-80 shrink-0 flex-col bg-slate-50/60 dark:bg-white/[0.015]">
        <div className="border-b border-slate-200/60 px-4 py-3 dark:border-white/[0.07]">
          <p className="text-[12px] font-bold   tracking-widest text-slate-400">{t("knowledge.category-article.category")}</p>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {/* <button type="button" onClick={() => setPath("")}
            className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-sm transition-colors ${
              path === "" ? "bg-indigo-50 font-medium text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-400"
                         : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/[0.05]"}`}>
            <FiFolder size={13} className={path === "" ? "text-indigo-500" : "text-amber-400 dark:text-amber-300"} />
            <span className="truncate text-xs">{t("knowledge.files.sections.recent.title")}</span>
          </button> */}
          {treeNodes.map((n) => (
            <SidebarNode key={n.id} node={n} depth={0} active={path} onSelect={setPath} onSelectCategory={setCategory} />
          ))}
        </div>
      </div>

      {/* ── Main ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col overflow-hidden">

        {/* Breadcrumb + toolbar */}
        <div className="border-b border-slate-200/60 px-4 py-2.5 dark:border-white/[0.07]">
          {/* Breadcrumb */}
          <div className="mb-2 flex items-center gap-1 text-xs text-slate-400">
            <button type="button" onClick={() => setPath("")} className="hover:text-indigo-500 transition-colors">
              {t("knowledge.category-article.category")}
            </button>
            {crumbs.map((seg, i) => {
              const target = crumbs.slice(0, i + 1).join("/") + "/";
              return (
                <React.Fragment key={i}>
                  <span className="opacity-40">/</span>
                  <button type="button" onClick={() => setPath(target)} className="hover:text-indigo-500 transition-colors">{seg}</button>
                </React.Fragment>
              );
            })}
          </div>

          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative min-w-0 flex-1">
              <FiSearch size={12} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="text" value={search} onChange={(e) => {
                setSearch(e.target.value);
                filterByAccept(e.target.value)
              }
              }
                placeholder={t("knowledge.category-article.search-label")}
                className="w-full rounded-xl border border-slate-200 bg-white py-1.5 pl-7 pr-2.5 text-sm text-slate-700 placeholder-slate-400 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20 dark:border-white/[0.08] dark:bg-slate-900 dark:text-slate-200" />
            </div>

          </div>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          {isError && (
            <p className="py-8 text-center text-sm text-rose-500">{t("knowledge.category-article.noresult")}</p>
          )}

          {!isError && isLoading && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-36 animate-pulse rounded-[18px] bg-slate-100 dark:bg-white/[0.05]" />
              ))}
            </div>
          )}

          {!isArticleError && !isArticleLoading && (
            <div className="space-y-6">
              {articles.length > 0 ? (
                <>
                  {/* Article List */}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {articles.map((article) => (
                      <Link
                        key={article.artId}
                        className="group m-2 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-shadow hover:shadow-md"
                        to={article.url}
                        target="_blank"
                        state={{ hideBack: true }}
                        data-discover="true"
                      >
                        <div className="aspect-[4/3] overflow-hidden bg-gray-100">
                          {article.coverImgUrl ? (
                            <img
                              alt={article.title ?? ''}
                              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                              src={article.coverImgUrl}
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-sm text-gray-400">
                              No Image
                            </div>
                          )}
                        </div>

                        <div className="p-4">
                          <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-blue-600 group-hover:text-blue-700">
                            {article.title}
                          </h3>

                          <p className="mt-2 line-clamp-3 text-xs leading-5 text-gray-500">
                            {language === 'th'
                              ? article.description
                              : article.descriptionEn}

                          </p>

                          <div className="mt-2.5 flex flex-wrap gap-1.5">
                            {article.keyWord.map((k) => (
                              <span
                                key={k}
                                className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                              >
                                {k}
                              </span>
                            ))}
                          </div>

                          <div className="mt-3 flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
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

                            <span className="flex items-center gap-1.5">
                              <FiStar
                                size={12}
                                className="text-amber-400"
                              />

                              {article?.score?.value}
                            </span>

                            <div className="flex-1" />
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>

                  {/* Load More */}
                  {hasNextPage && (
                    <div className="mt-6 flex justify-center">
                      <button
                        onClick={fetchNextPage}
                        disabled={articleQuery.isFetchingNextPage}
                        className="rounded-lg border px-6 py-2 text-sm font-medium hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {articleQuery.isFetchingNextPage
                          ? t("knowledge.category-article.loading")
                          : t("knowledge.category-article.load-more")}
                      </button>
                    </div>
                  )}
                </>
              ) : (
                // ไม่มีข้อมูล
                <div className="flex min-h-[250px] items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50">
                  <div className="text-center">
                    <div className="mb-2 text-4xl">📭</div>

                    <p className="text-sm font-medium text-gray-500">
                      {t("knowledge.category-article.noresult")}
                    </p>

                    <p className="mt-1 text-xs text-gray-400">
                      {t("knowledge.category-article.noresult-des")}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>



      </div>





    </div>
  );
};

export default CategorysArticlePanel;
