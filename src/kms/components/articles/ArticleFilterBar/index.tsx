import React, { useEffect, useState } from "react";
import { useTranslation } from "@/core/hooks/useTranslation";
import { ConfigProvider, DatePicker, Input, Select } from "antd";
import { FiSearch, FiX, FiFolder } from "react-icons/fi";

import dayjs, { Dayjs } from "dayjs";
import {
  ArticleFilter,
  ArticlePriority,
  ArticleSortBy,
  ArticleStatus,
} from "@/kms/articles/dtos/articles.dto";
import ArticleCategoryModal from "@/kms/components/articles/ArticleCategoryModal";
import {
  useArticleStatusData,
  useArticlePriorityData,
  useArticleUserData,
  useArticleMasterData,
  useArticleViewGroup
} from "@/kms/articles/hook/useArticlesData";

interface ArticleFilterBarProps {
  initial?: ArticleFilter;
  onChange: (filter: ArticleFilter) => void;
  onAddArticle?: () => void;
  showAddButton?: boolean
}

const LabelText: React.FC<{ text: string }> = ({ text }) => (
  <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
    {text}
  </label>
);

// Shared style for antd inputs/selects — match CMS control height
const sharedStyle: React.CSSProperties = {
  width: "100%",
  height: 38,
};

const popupStyle = { root: { zIndex: 999999 } } as const;

// Local ConfigProvider token to align antd components with CMS UI (light + dark mode)
const filterTheme = {
  token: {
    colorPrimary: "#3b82f6", // blue-500 — CMS primary accent
    borderRadius: 8,
    controlHeight: 38,
    fontSize: 13,
  },
  components: {
    Input: {
      activeBorderColor: "#3b82f6",
      hoverBorderColor: "#60a5fa",
    },
    Select: {
      colorPrimary: "#3b82f6",
      optionSelectedBg: "#eff6ff", // blue-50
      optionSelectedColor: "#1d4ed8", // blue-700
    },
  },
};

// Dark mode token overrides — applied via ConfigProvider when html has `dark` class
const filterThemeDark = {
  token: {
    colorBgContainer: "#1f2937", // gray-800
    colorText: "#f3f4f6",        // gray-100
    colorTextPlaceholder: "#9ca3af", // gray-400 — dimmer than text
    colorBorder: "#374151",      // gray-700
    colorBgElevated: "#374151",  // gray-700 for dropdowns (darker than option hover)
  },
  components: {
    Input: {
      colorBgContainer: "#1f2937",
      colorText: "#f3f4f6",
      colorTextPlaceholder: "#9ca3af", // gray-400
      colorBorder: "#374151",
    },
    Select: {
      colorBgContainer: "#1f2937",
      colorText: "#f3f4f6",
      colorTextPlaceholder: "#9ca3af", // gray-400
      colorBorder: "#374151",
      optionSelectedBg: "#1e40af", // blue-800
      optionSelectedColor: "#ffffff", // white — ensure selected option is readable
      optionActiveBg: "#374151",   // gray-700 hover bg
      optionFontSize: 13,
    },
    DatePicker: {
      colorBgContainer: "#1f2937",
      colorText: "#f3f4f6",
      colorTextPlaceholder: "#9ca3af", // gray-400
      colorBorder: "#374151",
    },
  },
};

const ArticleFilterBar: React.FC<ArticleFilterBarProps> = ({
  initial = {},
  onChange,
  onAddArticle,
  showAddButton
}) => {
  const { t } = useTranslation();

  // Detect dark mode by observing `dark` class on <html>
  const [isDark, setIsDark] = useState(
    typeof document !== "undefined" && document.documentElement.classList.contains("dark")
  );
  useEffect(() => {
    if (typeof document === "undefined") return;
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains("dark"));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  const activeTheme = isDark
    ? { ...filterTheme, token: { ...filterTheme.token, ...filterThemeDark.token }, components: { ...filterTheme.components, ...filterThemeDark.components } }
    : filterTheme;


 

  const [filter, setFilter] = useState<ArticleFilter>(initial);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [selectedCategoryPath, setSelectedCategoryPath] = useState<string>("");
  const update = (patch: Partial<ArticleFilter>) => {
    const next = { ...filter, ...patch, page: 1 };
    setFilter(next);
    onChange(next);
  };
  const articleStatusData = useArticleStatusData();
  const articleStatusItem = articleStatusData.data?.data?.map(m => {
    return {
      value: m.statusId,
      labelKey: m.value
    }
  });
  const articlePriorityData = useArticlePriorityData();
  const articlePriorityItem = articlePriorityData.data?.data?.map(m => {
    return {
      value: m.priorityId,
      labelKey: m.value
    }
  });
  const articleUserData = useArticleUserData();
  const articleUserItem = articleUserData.data?.data?.map(m => {
    return {
      value: m.id,
      labelKey: `${m.firstName} ${m.lastName}`,
      keylang: m.firstName
    }
  });

  const articleSortData = useArticleMasterData({
    item_key: 'SORTBY'
  })
  const articleSortItem = articleSortData.data?.data?.map(m => {
    return {
      value: m.item_value,
      labelKey: m.item_value,
    }
  });

  const articleViewGroupData = useArticleViewGroup();
  const articleViewGroupItem = articleViewGroupData.data?.data?.map(m => {
    return {
      value: String(m.id),
      labelKey: m.title,
    }
  });


  const { RangePicker } = DatePicker;
  const reset = () => {
    const cleared: ArticleFilter = {};
    setFilter(cleared);
    setSelectedCategoryPath("");
    onChange(cleared);
  };


  const datevalue = React.useMemo(() => {
    const value: [Dayjs | null, Dayjs | null] = [
      filter.dateFrom ? dayjs(filter.dateFrom) : null,
      filter.dateTo ? dayjs(filter.dateTo) : null,
    ];
    return value;
  }, [filter.dateFrom, filter.dateTo]);

  return (
    <ConfigProvider
      theme={activeTheme}
    >
      <div className="rounded-2xl bg-white p-5 shadow-sm dark:bg-gray-800 dark:shadow-none">
        {/* Header row with title + add-user button */}
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            {t("knowledge.articles.filter.searchTitle")}
          </h3>
          {showAddButton && (
            <button
              type="button"
              onClick={onAddArticle}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-500 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 dark:bg-blue-600 dark:hover:bg-blue-500"
            >
              {t("knowledge.articles.addArticle")}
            </button>
          )}

        </div>

        <div className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
          {/* ค้นหาหัวข้อ */}
          <div className="lg:col-span-2 xl:col-span-2">
            <LabelText text={t("knowledge.articles.filter.searchTitle")} />
            <Input
              prefix={<FiSearch className="text-gray-400 dark:text-gray-500" />}
              value={filter.search ?? ""}
              onChange={(e) => update({ search: e.target.value || undefined })}
              placeholder={t("knowledge.articles.filter.searchPlaceholder")}
              allowClear
              style={sharedStyle}
            />
          </div>

          {/* หมวดหมู่ — opens tree modal */}
          <div>
            <LabelText text={t("knowledge.articles.filter.category")} />
            <Input
              readOnly
              value={selectedCategoryPath}
              onClick={() => setCategoryModalOpen(true)}
              placeholder={t("knowledge.articles.filter.categoryPlaceholder")}
              allowClear
              onChange={() => { /* handled by clear button below */ }}
              suffix={
                <span className="flex shrink-0 items-center gap-1">
                  {selectedCategoryPath && (
                    <FiX
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedCategoryPath("");
                        update({ category: undefined });
                      }}
                    />
                  )}
                  <FiFolder className="text-gray-400 dark:text-gray-500" />
                </span>
              }
              style={sharedStyle}
            />
          </div>

          {/* วันที่สร้าง */}
          <div>
            <LabelText text={t("knowledge.articles.filter.createdDate")} />
            <RangePicker
              value={datevalue}
              onChange={(dates) => {
                update({
                  dateFrom: dates?.[0]
                    ? dates[0].startOf("day").format("YYYY-MM-DD HH:mm:ss")
                    : undefined,
                  dateTo: dates?.[1]
                    ? dates[1].endOf("day").format("YYYY-MM-DD HH:mm:ss")
                    : undefined,
                });
              }}
              format="DD/MM/YYYY"
              placeholder={[t("knowledge.articles.filter.startCreatedDatePlaceholder"), t("knowledge.articles.filter.endCreatedDatePlaceholder")]}
              allowClear
              styles={{ popup: popupStyle }}
            />
          </div>

          {/* ผู้สร้าง */}
          <div>
            <LabelText text={t("knowledge.articles.filter.createdBy")} />
            <Select
              showSearch
              allowClear
              value={filter.createdBy ? Number(filter.createdBy) : undefined}
              onChange={(val: number | undefined) =>
                update({ createdBy: val != null ? String(val) : undefined })
              }
              options={[
                ...(articleUserItem?.filter((o) => o.keylang !== "all") ?? []),
              ].map((o) => ({
                value: o.value,
                label: o.labelKey,
              }))}
              placeholder={t("knowledge.articles.user.all")}
              filterOption={(input, opt) =>
                (opt?.label as string ?? "").toLowerCase().includes(input.toLowerCase())
              }
              style={sharedStyle}
              styles={{ popup: popupStyle }}
            />
          </div>

          {/* สถานะบทความ */}
          <div>
            <LabelText text={t("knowledge.articles.filter.status")} />
            <Select
              showSearch
              allowClear
              value={filter.status ?? undefined}
              onChange={(val: string | undefined) =>
                update({ status: (val as ArticleStatus) || undefined })
              }
              options={[
                {
                  value: "",
                  label: t("knowledge.articles.status.all"),
                },
                ...(articleStatusItem?.filter((o) => o.labelKey !== "all").map((o) => ({
                  value: String(o.value),
                  label: t(`knowledge.articles.status.${o.labelKey}`),
                })) ?? []),
              ]}
              placeholder={t("knowledge.articles.status.all")}
              filterOption={(input, opt) =>
                (opt?.label as string ?? "").toLowerCase().includes(input.toLowerCase())
              }
              style={sharedStyle}
              styles={{ popup: popupStyle }}
            />
          </div>

          {/* Version */}
          <div>
            <LabelText text={t("knowledge.articles.filter.version")} />
            <Input
              value={filter.version ?? ""}
              onChange={(e) => update({ version: e.target.value || undefined })}
              placeholder={t("knowledge.articles.filter.versionPlaceholder")}
              allowClear
              style={sharedStyle}
            />
          </div>

          {/* Group */}
          <div>
            <LabelText text={t("knowledge.articles.filter.group")} />
            <Select
              showSearch
              allowClear
              value={filter.group ?? undefined}
              onChange={(val: string | undefined) =>
                update({ group: val ?? undefined })
              }
              options={[
                {
                  value: "",
                  label: t("knowledge.articles.group.all"),
                },
                ...(articleViewGroupItem?.map((o) => ({
                  value: o.value,
                  label: o.labelKey,
                })) ?? []),
              ]}
              placeholder={t("knowledge.articles.group.all")}
              filterOption={(input, opt) =>
                (opt?.label as string ?? "").toLowerCase().includes(input.toLowerCase())
              }
              style={sharedStyle}
              styles={{ popup: popupStyle }}
            />
          </div>

          {/* ระดับความสำคัญ */}
          <div>
            <LabelText text={t("knowledge.articles.filter.priority")} />
            <Select
              showSearch
              allowClear
              value={filter.priority ?? undefined}
              onChange={(val: string | undefined) =>
                update({
                  priority: (val as ArticlePriority) || undefined,
                })
              }
              options={[
                {
                  value: "",
                  label: t("knowledge.articles.priority.all"),
                },
                ...(articlePriorityItem?.filter((o) => o.labelKey !== "all").map((o) => ({
                  value: String(o.value),
                  label: t(`knowledge.articles.priority.${o.labelKey.toLowerCase()}`),
                })) ?? []),
              ]}
              placeholder={t("knowledge.articles.priority.all")}
              filterOption={(input, opt) =>
                (opt?.label as string ?? "").toLowerCase().includes(input.toLowerCase())
              }
              style={sharedStyle}
              styles={{ popup: popupStyle }}
            />
          </div>

          {/* เรียงลำดับ */}
          <div>
            <LabelText text={t("knowledge.articles.filter.sortBy")} />
            <Select
              showSearch
              value={filter.sortBy ?? "title_az"}
              onChange={(val: string) =>
                update({ sortBy: (val as ArticleSortBy) || undefined })
              }
              options={articleSortItem?.map((o) => ({
                value: o.value,
                label: t(`knowledge.articles.sortBy.${o.labelKey}`),
              }))}
              filterOption={(input, opt) =>
                (opt?.label as string ?? "").toLowerCase().includes(input.toLowerCase())
              }
              style={sharedStyle}
              styles={{ popup: popupStyle }}
            />
          </div>

          {/* Reset button — spans last cell */}
          <div className="flex items-end">
            <button
              type="button"
              onClick={reset}
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-700"
            >
              {t("knowledge.articles.filter.resetFilter")}
            </button>
          </div>
        </div>

        {/* Category tree modal */}
        <ArticleCategoryModal
          open={categoryModalOpen}
          onClose={() => setCategoryModalOpen(false)}
          onSelect={(key, path) => {
            setSelectedCategoryPath(path);
            update({ category: key });
          }}
        />
      </div>
    </ConfigProvider>
  );
};

export default ArticleFilterBar;
