import React, { useMemo } from "react";
import { useTranslation } from "@/core/hooks/useTranslation";
import { DatePicker, Select } from "antd";

import { parseDateValue } from "@/kms/common/common.transform.service";
import { FiX } from "react-icons/fi";
import type { ArticleFormInput } from "@/kms/articles-create-update/dtos/article-form.dto";
import { useArticleViewGroup } from "@/kms/articles/hook/useArticlesData";


// ─── shared styles ────────────────────────────────────────────────────────────

const labelCls = "mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400";

// ─── Tag Input ────────────────────────────────────────────────────────────────

// interface TagInputProps {
//   tags: string[];
//   placeholder?: string;
//   addLabel?: string;
//   tagColor?: string;
//   onChange: (tags: string[]) => void;
// }

// const TagInput: React.FC<TagInputProps> = ({
//   tags,
//   placeholder,
//   addLabel = "Add",
//   tagColor = "indigo",
//   onChange,
// }) => {
//   const [input, setInput] = useState("");

//   const colorMap: Record<string, string> = {
//     indigo: "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300",
//     sky: "bg-sky-50 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300",
//     amber: "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
//   };

//   const tagCls = colorMap[tagColor] ?? colorMap.indigo;

//   const addTag = () => {
//     const trimmed = input.trim();
//     if (trimmed && !tags.includes(trimmed)) onChange([...tags, trimmed]);
//     setInput("");
//   };

//   const removeTag = (tag: string) => onChange(tags.filter((t) => t !== tag));

//   const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
//     if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addTag(); }
//   };

//   return (
//     <div className="rounded-xl border border-slate-200/80 bg-white p-3 dark:border-slate-700/80 dark:bg-slate-800/60">
//       <div className="flex flex-wrap gap-2 mb-2">
//         {tags.map((tag, i) => (
//           <span key={`${i}-${tag}`} className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${tagCls}`}>
//             {tag}
//             <button type="button" onClick={() => removeTag(tag)} className="ml-0.5 opacity-70 hover:opacity-100">
//               <FiX size={11} />
//             </button>
//           </span>
//         ))}
//       </div>
//       <div className="flex gap-2">
//         <input
//           type="text"
//           value={input}
//           onChange={(e) => setInput(e.target.value)}
//           onKeyDown={handleKeyDown}
//           placeholder={placeholder}
//           className="flex-1 rounded-lg border border-slate-200/80 bg-slate-50 px-3 py-1.5 text-sm text-slate-700 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/10 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200"
//         />
//         <button
//           type="button"
//           onClick={addTag}
//           className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-500 transition-colors"
//         >
//           <FiPlus size={12} /> {addLabel}
//         </button>
//       </div>
//     </div>
//   );
// };








// ─── VisibilityTab ────────────────────────────────────────────────────────────

interface VisibilityTabProps {
  form: ArticleFormInput;
  onChange: <K extends keyof ArticleFormInput>(key: K, value: ArticleFormInput[K]) => void;
  initViewGroupdOptions?: { id: number; title: string }[];
}

const VisibilityTab: React.FC<VisibilityTabProps> = ({ form, onChange, initViewGroupdOptions = [] }) => {

  const { t } = useTranslation();
  const { data: viewGroupData } = useArticleViewGroup();
  const viewGroupOptions = useMemo(() => {
    const map = new Map((viewGroupData?.data ?? []).map((a) => [a.id, { value: a.id, label: a.title }]));
    for (const g of initViewGroupdOptions) {
      if (!map.has(g.id)) map.set(g.id, { value: g.id, label: g.title });
    }
    return Array.from(map.values());
  }, [viewGroupData, initViewGroupdOptions]);

  const viewGroupOptionMap = useMemo(() => {
    const m = new Map<number, { value: number; label: string }>();
    for (const o of viewGroupOptions) m.set(o.value, o);
    return m;
  }, [viewGroupOptions]);


  const startDate = React.useMemo(
    () => parseDateValue(form.startDate),
    [form.startDate]
  );
  const endDate = React.useMemo(
    () => parseDateValue(form.endDate),
    [form.endDate]
  );

  return (

    <div className="space-y-5">
      {/* Dates */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelCls}>{t("knowledge.articles.form.visibility.startDateLabel")}</label>
          <DatePicker
            value={startDate}
            onChange={(date) => onChange("startDate", date ? date.format("DD/MM/YYYY") : "")}
            format="DD/MM/YYYY"
            style={{ width: "100%", height: "40px" }}
            styles={{ popup: { root: { zIndex: 999999 } } }}
          />
        </div>
        <div>
          <label className={labelCls}>{t("knowledge.articles.form.visibility.endDateLabel")}</label>
          <DatePicker
            value={endDate}
            onChange={(date) => onChange("endDate", date ? date.format("DD/MM/YYYY") : "")}
            format="DD/MM/YYYY"
            style={{ width: "100%", height: "40px" }}
            styles={{ popup: { root: { zIndex: 999999 } } }}
          />
        </div>
      </div>

      {/* Viewable Groups */}
      <div>
        <label className={labelCls}>{t("knowledge.articles.form.visibility.viewableGroupsLabel")}</label>
        <Select
          mode="multiple"
          value={form.viewableGroups}
          onChange={(val: number[]) => onChange("viewableGroups", val)}
          placeholder={t("knowledge.articles.form.basic.groupArticlesPlaceholder")}
          options={viewGroupOptions.map((o) => ({ value: o.value, label: o.label }))}
          optionFilterProp="label"
          showSearch
          tagRender={({ value, onClose }) => {
            const opt = viewGroupOptionMap.get(value as number);
            return (
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 dark:bg-blue-500/15 dark:text-blue-300 mr-1 my-0.5">
                {opt?.label ?? `#${value}`}
                <button type="button" onClick={onClose} className="ml-0.5 opacity-70 hover:opacity-100">
                  <FiX size={11} />
                </button>
              </span>
            );
          }}
          style={{ width: "100%" }}
        />
      </div>

      {/* Keywords */}
      <div>
        <label className={labelCls}>{t("knowledge.articles.form.visibility.keywordsLabel")}</label>
        <Select
          mode="tags"
          value={form.keywords.map((k) => k.title)}
          onChange={(titles: string[]) => {
            const updated = titles.map((title) => {
              const existing = form.keywords.find((k) => k.title === title);
              return existing ?? { title };
            });
            onChange("keywords", updated);
          }}
          placeholder={t("knowledge.articles.form.visibility.keywordsPlaceholder")}
          options={[]}
          notFoundContent={null}
          tagRender={({ label, onClose }) => (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700 dark:bg-amber-500/15 dark:text-amber-300 mr-1 my-0.5">
              {label}
              <button type="button" onClick={onClose} className="ml-0.5 opacity-70 hover:opacity-100">
                <FiX size={11} />
              </button>
            </span>
          )}
          style={{ width: "100%" }}
        />
      </div>
    </div>
  );
};

export default VisibilityTab;
