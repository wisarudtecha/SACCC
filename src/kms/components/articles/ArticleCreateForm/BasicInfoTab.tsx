import React, { useState, useEffect, useRef,useMemo } from "react";
import { useTranslation } from "@/core/hooks/useTranslation";
import { Select, DatePicker } from "antd";
import { parseDateValue } from "@/kms/common/common.transform.service"; // "../../../common/common.transform.service";
import { FiChevronDown, FiChevronRight, FiSearch, FiX } from "react-icons/fi";
import type { ArticleFormInput } from "@/kms/articles-create-update/dtos/article-form.dto";// "../../../articles-create-update/dtos/article-form.dto";
import { getCategoryTree, buildPath } from "@/kms/articles/service/category.service";// "../../../articles/service/category.service";
import type { CategoryNode } from "@/kms/articles/dtos/category.dto";// "../../../articles/dtos/category.dto";
import {
  useArticlePriorityData,
  useArticleUserData,
  useArticleRelations,
  useArticleSources 
} from "@/kms/articles/hook/useArticlesData";// "../../../articles/hook/useArticlesData";

// ─── shared styles ────────────────────────────────────────────────────────────

const inputCls =
  "h-10 w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2 text-sm text-gray-900 placeholder:text-gray-400 transition-all duration-200 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:border-blue-500 dark:focus:bg-gray-800 dark:focus:ring-blue-500/20";

const labelCls = "mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400";

// ─── Related Article Search Input ────────────────────────────────────────────

interface RelatedArticleInputProps {
  value: number[];
  options: { value: number; label: string }[];
  placeholder?: string;
  onChange: (val: number[]) => void;
}

const RelatedArticleInput: React.FC<RelatedArticleInputProps> = ({ value, options, placeholder, onChange }) => {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = search.trim()
    ? options.filter(
      (o) => o.label.toLowerCase().includes(search.toLowerCase()) && !value.includes(o.value)
    )
    : [];

  const add = (id: number) => {
    onChange([...value, id]);
    setSearch("");
    setOpen(false);
  };

  const remove = (id: number) => onChange(value.filter((v) => v !== id));


  return (
    <div ref={wrapRef} className="space-y-2">
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((id) => {
            const opt = options.find((o) => o.value === id);
            return (
              <span
                key={id}
                className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 dark:bg-blue-500/15 dark:text-blue-300"
              >
                {opt?.label ?? `#${id}`}
                <button type="button" onClick={() => remove(id)} className="ml-0.5 opacity-70 hover:opacity-100">
                  <FiX size={11} />
                </button>
              </span>
            );
          })}
        </div>
      )}
      <div className="relative">
        <input
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setOpen(true); }}
          onFocus={() => { if (search.trim()) setOpen(true); }}
          placeholder={placeholder}
          className={`${inputCls} pr-10`}
        />
        <FiSearch size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
        {open && filtered.length > 0 && (
          <div className="absolute z-50 mt-1 w-full rounded-xl border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800 max-h-48 overflow-y-auto">
            {filtered.map((o) => (
              <button
                key={o.value}
                type="button"
                onMouseDown={(e) => { e.preventDefault(); add(o.value); }}
                className="flex w-full items-center px-3.5 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 dark:text-gray-300 dark:hover:bg-blue-500/10 dark:hover:text-blue-300 transition-colors"
              >
                {o.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Category Tree Node ───────────────────────────────────────────────────────

const subtreeContains = (node: CategoryNode, key: string): boolean => {
  if (!key) return false;
  if (node.key === key) return true;
  return (node.children ?? []).some((c) => subtreeContains(c, key));
};

interface TreeNodeProps {
  node: CategoryNode;
  selectedKey: string;
  lang: string;
  onSelect: (key: string, path: string) => void;
  path: string;
}

const TreeNode: React.FC<TreeNodeProps> = ({ node, selectedKey, lang, onSelect, path }) => {
  const hasChildren = !!node.children?.length;
  const shouldBeOpen = hasChildren && (node.children ?? []).some((c) => subtreeContains(c, selectedKey));
  const [open, setOpen] = useState(shouldBeOpen);
  const rowRef = useRef<HTMLDivElement>(null);
  const isSelected = selectedKey === node.key;

  useEffect(() => {
    if (shouldBeOpen) setOpen(true);
  }, [shouldBeOpen]);

  useEffect(() => {
    if (isSelected && rowRef.current) {
      rowRef.current.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [isSelected]);

  const label = lang.startsWith("th")
    ? (node.nameTh || node.nameEn || node.title)
    : (node.nameEn || node.nameTh || node.title);
  const currentPath = path ? `${path} > ${label}` : label;

  return (
    <div>
      <div
        ref={rowRef}
        className={`flex cursor-pointer items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm transition-colors ${isSelected
            ? "bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300"
            : "text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
          }`}
        onClick={() => {
          if (hasChildren) setOpen((o) => !o);
          onSelect(node.key, currentPath);
        }}
      >
        {hasChildren ? (
          open
            ? <FiChevronDown size={13} className="shrink-0 text-gray-400 dark:text-gray-500" />
            : <FiChevronRight size={13} className="shrink-0 text-gray-400 dark:text-gray-500" />
        ) : (
          <span className="w-3.5 shrink-0" />
        )}
        <span className="flex-1 truncate">{label}</span>
        {node.articleCount != null && (
          <span className="text-xs text-gray-400 dark:text-gray-500">{node.articleCount}</span>
        )}
      </div>
      {open && hasChildren && (
        <div className="ml-4 border-l border-gray-100 pl-2 dark:border-gray-700">
          {node.children!.map((child) => (
            <TreeNode
              key={child.key}
              node={child}
              selectedKey={selectedKey}
              lang={lang}
              onSelect={onSelect}
              path={currentPath}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Category Picker ──────────────────────────────────────────────────────────

interface CategoryPickerProps {
  categoryKey: string;
  categoryPath: string;
  searchPlaceholder: string;
  emptyLabel: string;
  lang: string;
  onSelect: (key: string, path: string) => void;
  onNodesChange?: (nodes: CategoryNode[]) => void;
}

const CategoryPicker: React.FC<CategoryPickerProps> = ({
  categoryKey,
  categoryPath,
  searchPlaceholder,
  emptyLabel,
  lang,
  onSelect,
  onNodesChange,
}) => {
  const [treeNodes, setTreeNodes] = useState<CategoryNode[]>([]);
  const [search, setSearch] = useState("");
  const [loaded, setLoaded] = useState(false);

  const load = async () => {
    if (loaded) return;
    const result = await getCategoryTree();
    setTreeNodes(result.nodes);
    onNodesChange?.(result.nodes);
    setLoaded(true);
  };

  React.useEffect(() => { void load(); }, []);

  const filterNodes = (nodes: CategoryNode[], q: string): CategoryNode[] => {
    if (!q) return nodes;
    const lq = q.toLowerCase();
    const result: CategoryNode[] = [];
    for (const n of nodes) {
      const titleMatch =
        n.title.toLowerCase().includes(lq) ||
        (n.nameTh?.toLowerCase().includes(lq) ?? false) ||
        (n.nameEn?.toLowerCase().includes(lq) ?? false);
      const filteredChildren = n.children ? filterNodes(n.children, q) : [];
      if (titleMatch || filteredChildren.length > 0) {
        result.push({ ...n, children: filteredChildren.length > 0 ? filteredChildren : n.children });
      }
    }
    return result;
  };

  const visibleNodes = filterNodes(treeNodes, search);

  return (
    <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
      {categoryPath && (
        <div className="flex items-center gap-1.5 border-b border-gray-100 px-3 py-2 text-xs text-blue-600 dark:border-gray-700 dark:text-blue-400">
          <span className="font-medium">{categoryPath}</span>
        </div>
      )}
      <div className="p-3">
        <div className="relative mb-2">
          <FiSearch size={13} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full rounded-lg border border-gray-200 bg-gray-50 py-1.5 pl-8 pr-3 text-sm text-gray-700 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/10 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-200 dark:placeholder:text-gray-500"
          />
        </div>
        <div className="max-h-48 overflow-y-auto">
          {visibleNodes.length === 0 ? (
            <p className="py-4 text-center text-xs text-gray-400 dark:text-gray-500">{emptyLabel}</p>
          ) : (
            visibleNodes.map((node) => (
              <TreeNode
                key={node.key}
                node={node}
                selectedKey={categoryKey}
                lang={lang}
                onSelect={onSelect}
                path=""
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

// ─── BasicInfoTab ─────────────────────────────────────────────────────────────

interface BasicInfoTabProps {
  form: ArticleFormInput;
  onChange: <K extends keyof ArticleFormInput>(key: K, value: ArticleFormInput[K]) => void;
  artId?: number;
  initRelatedOptions?: { id: number; title: string }[];
}

const BasicInfoTab: React.FC<BasicInfoTabProps> = ({ form, onChange, artId = 0, initRelatedOptions = [] }) => {
  const { t, language } = useTranslation();
  const lang = language;
  const isTh = lang.startsWith("th");
  const { data: priorityData } = useArticlePriorityData();
  const priorityOptions = (priorityData?.data ?? [])
    .filter((p) => p.priorityId !== -1)
    .map((p) => ({ value: p.priorityId, label: isTh ? p.name_th : p.name_en }));

  const { data: userData } = useArticleUserData();
  const ownerOptions = (userData?.data ?? [])
    .filter((u) => u.id !== -1)
    .map((u) => ({ value: u.id, label: u.fullName ?? `${u.firstName} ${u.lastName}`.trim() }));

  const { data: relationsData } = useArticleRelations();
  const relationOptions = React.useMemo(() => {
    const map = new Map((relationsData?.data ?? []).map((a) => [a.id, { value: a.id, label: a.title }]));
    for (const r of initRelatedOptions) {
      if (!map.has(r.id)) map.set(r.id, { value: r.id, label: r.title });
    }
    return Array.from(map.values());
  }, [relationsData, initRelatedOptions]);

  const { data: sourcesData } = useArticleSources();
  const sourceOptions = (sourcesData?.data ?? [])
    .map((s) => ({ value: s.id, label: isTh ? s.title_th : s.title_en }));

  const [categoryPath, setCategoryPath] = useState(form.categoryKey ? form.categoryKey : "");
  const [treeNodes, setTreeNodes] = useState<CategoryNode[]>([]);

  useEffect(() => {
    if (!form.categoryKey || treeNodes.length === 0) return;
    const langCode = lang.startsWith("th") ? "th" : "en";
    const path = buildPath(treeNodes, form.categoryKey, [], langCode);
    if (path) setCategoryPath(path);
  }, [lang, treeNodes, form.categoryKey]);

  const handleCategorySelect = (key: string, path: string) => {
    onChange("categoryKey", key);
    setCategoryPath(path);
  };

  const reserveDate = useMemo( () => parseDateValue(form.reserveDate),  [form.reserveDate] );
   

  return (
    <div className="space-y-5">
      {/* Title + Version */}
      <div className="grid gap-4 sm:grid-cols-[1fr_140px]">
        <div>
          <label className={labelCls}>
            {t("knowledge.articles.form.basic.titleLabel")} <span className="text-rose-500 normal-case">*</span>
          </label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => onChange("title", e.target.value)}
            placeholder={t("knowledge.articles.form.basic.titlePlaceholder")}
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>{t("knowledge.articles.form.basic.versionLabel")}</label>
          <input
            type="text"
            value={form.version}
            onChange={(e) => { if (artId === 0) onChange("version", e.target.value); }}
            readOnly={artId > 0}
            placeholder="1"
            className={`${inputCls} ${artId > 0 ? "cursor-not-allowed opacity-60" : ""}`}
          />
        </div>
      </div>

      {/* Description */}
      <div>
        <label className={labelCls}>{t("knowledge.articles.form.basic.descriptionLabel")}</label>
        <textarea
          value={form.description}
          onChange={(e) => onChange("description", e.target.value)}
          rows={3}
          placeholder={t("knowledge.articles.form.basic.descriptionPlaceholder")}
          className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 transition-all duration-200 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:border-blue-500 dark:focus:bg-gray-800 dark:focus:ring-blue-500/20"
        />
      </div>

      {/* Priority + Source */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelCls}>{t("knowledge.articles.form.basic.priorityLabel")}</label>
          <Select
            showSearch
            value={form.priority != null && form.priority > 0 ? form.priority : undefined}
            onChange={(val: number | null) => onChange("priority", val ?? null)}
            options={priorityOptions}
            placeholder={t("knowledge.articles.form.basic.priorityPlaceholder")}
            filterOption={(input, opt) =>
              (opt?.label as string ?? "").toLowerCase().includes(input.toLowerCase())
            }
            style={{ width: "100%", height: "40px" }}
            styles={{ popup: { root: { zIndex: 999999 } } }}
          />
        </div>
        <div>
          <label className={labelCls}>{t("knowledge.articles.form.basic.sourceLabel")}</label>
          <Select
            showSearch
            allowClear
            value={form.source != null && form.source > 0 ? form.source : undefined}
            onChange={(val: number | undefined) => onChange("source", val ?? null)}
            options={sourceOptions}
            placeholder={t("knowledge.articles.form.basic.sourcePlaceholder")}
            filterOption={(input, opt) =>
              (opt?.label as string ?? "").toLowerCase().includes(input.toLowerCase())
            }
            style={{ width: "100%", height: "40px" }}
            styles={{ popup: { root: { zIndex: 999999 } } }}
          />
        </div>
      </div>

      {/* Reserve Date + Ownership */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelCls}>{t("knowledge.articles.form.basic.reserveDateLabel")}</label>
          {<DatePicker
          // value={parseDateValue(form.reserveDate)}
            value={reserveDate}
            onChange={(date) => {
              onChange("reserveDate", date ? date.format("DD/MM/YYYY") : "")
            }
          }
            format="DD/MM/YYYY"
            style={{ width: "100%", height: "40px" }}
            styles={{ popup: { root: { zIndex: 999999 } } }}
          /> }
        </div>
        <div>
          <label className={labelCls}>{t("knowledge.articles.form.basic.ownershipLabel")}</label>
          <Select
            showSearch
            allowClear
            value={form.ownership != null && form.ownership > 0 ? form.ownership : undefined}
            onChange={(val: number | undefined) => onChange("ownership", val ?? null)}
            options={ownerOptions}
            placeholder={t("knowledge.articles.form.basic.ownershipPlaceholder")}
            filterOption={(input, opt) =>
              (opt?.label as string ?? "").toLowerCase().includes(input.toLowerCase())
            }
            style={{ width: "100%", height: "40px" }}
            styles={{ popup: { root: { zIndex: 999999 } } }}
          />
        </div>
      </div>

      {/* Related Articles */}
      <div>
        <label className={labelCls}>{t("knowledge.articles.form.basic.relatedArticlesLabel")}</label>
        <RelatedArticleInput
          value={form.relatedArticles}
          options={relationOptions}
          placeholder={t("knowledge.articles.form.basic.relatedArticlesPlaceholder")}
          onChange={(val) => onChange("relatedArticles", val)}
        />
      </div>

      {/* Category */}
      <div>
        <label className={labelCls}>{t("knowledge.articles.form.basic.categoryLabel")}</label>
        <CategoryPicker
          categoryKey={form.categoryKey}
          categoryPath={categoryPath}
          searchPlaceholder={t("knowledge.articles.form.basic.categorySearch")}
          emptyLabel={t("knowledge.articles.form.basic.categoryEmpty")}
          lang={lang}
          onNodesChange={setTreeNodes}
          onSelect={handleCategorySelect}
        />
      </div>
    </div>
  );
};

export default BasicInfoTab;
