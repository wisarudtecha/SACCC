import React, { useEffect, useState } from "react";
import { useTranslation } from "@/core/hooks/useTranslation";
import { ConfigProvider } from "antd";
import { FiSave, FiCheck, FiChevronLeft, FiChevronRight, FiCheckCircle, FiAlertCircle, FiX } from "react-icons/fi";
import type {
  ArticleFormInput,
  ArticleFormStep,
  ArticleFormTab,
} from "@/kms/articles-create-update/dtos/article-form.dto";
import {
  useArticleFormDetail,
  useSaveArticleForm,
} from "@/kms/articles-create-update/hook/useArticleForm";
import BasicInfoTab from "./BasicInfoTab";
import ContentTab from "./ContentTab";
import VisibilityTab from "./VisibilityTab";

import { usePermissions } from "@/core/hooks/usePermissions";
import { KbPermission } from "@/kms/common/utils/enumHelper"
import NotFound from "@/core/pages/OtherPage/NotFound";
// ─── static keys & icons ─────────────────────────────────────────────────────

const STEP_ORDER: ArticleFormStep[] = ["create", "submit", "approve", "publish"];

const TAB_ICONS: Record<ArticleFormTab, React.ReactNode> = {
  basic: (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  content: (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 6h16M4 12h16M4 18h7" />
    </svg>
  ),
  visibility: (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  ),
};

const TAB_KEYS: ArticleFormTab[] = ["basic", "content", "visibility"];

// ─── Toast ────────────────────────────────────────────────────────────────────

interface FormToast { id: number; tone: "success" | "error"; message: string }

let _toastSeq = 0;

const FormToastStack: React.FC<{ toasts: FormToast[]; onDismiss: (id: number) => void }> = ({ toasts, onDismiss }) => (
  <div className="pointer-events-none fixed bottom-6 right-6 z-[9999] flex flex-col items-end gap-2.5">
    {toasts.map((t) => (
      <div
        key={t.id}
        className={`pointer-events-auto flex items-start gap-3 rounded-2xl border px-4 py-3.5 shadow-xl transition-all ${t.tone === "success"
          ? "border-emerald-200/80 bg-white text-gray-700 dark:border-emerald-500/20 dark:bg-gray-800 dark:text-gray-200"
          : "border-rose-200/80 bg-white text-gray-700 dark:border-rose-500/20 dark:bg-gray-800 dark:text-gray-200"
          }`}
      >
        <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-xl text-sm ${t.tone === "success"
          ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300"
          : "bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300"
          }`}>
          {t.tone === "success" ? <FiCheckCircle size={15} /> : <FiAlertCircle size={15} />}
        </span>
        <span className="text-sm font-medium">{t.message}</span>
        <button onClick={() => onDismiss(t.id)} className="ml-2 mt-0.5 shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
          <FiX size={14} />
        </button>
      </div>
    ))}
  </div>
);

const emptyForm: ArticleFormInput = {
  title: "",
  version: "1",
  description: "",
  priority: null,
  source: null,
  reserveDate: "",
  ownership: null,
  relatedArticles: [],
  categoryKey: "",
  attachments: [],
  content: "",
  startDate: "",
  endDate: "",
  viewableGroups: [],
  keywords: [],
};

// ─── StepperBar ───────────────────────────────────────────────────────────────

interface StepperBarProps {
  currentStep: ArticleFormStep;
  stepLabels: Record<ArticleFormStep, string>;
}

const StepperBar: React.FC<StepperBarProps> = ({ currentStep, stepLabels }) => {
  const currentIdx = STEP_ORDER.indexOf(currentStep);
  return (
    <div className="flex items-center gap-0">
      {STEP_ORDER.map((key, idx) => {
        const isDone = idx < currentIdx;
        const isActive = idx === currentIdx;
        return (
          <React.Fragment key={key}>
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={`relative flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold shadow-sm transition-all duration-300 ${isActive
                  ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-[0_4px_14px_-3px_rgba(59,130,246,0.55)]"
                  : isDone
                    ? "bg-gradient-to-br from-emerald-400 to-teal-500 text-white shadow-[0_4px_10px_-3px_rgba(16,185,129,0.45)]"
                    : "bg-white/80 text-gray-400 ring-1 ring-gray-200 dark:bg-gray-800 dark:ring-gray-700"
                  }`}
              >
                {isDone ? <FiCheck size={14} strokeWidth={2.5} /> : <span>{idx + 1}</span>}
              </div>
              <span
                className={`text-[10px] font-semibold tracking-wide ${isActive
                  ? "text-blue-600 dark:text-blue-400"
                  : isDone
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-gray-400 dark:text-gray-500"
                  }`}
              >
                {stepLabels[key]}
              </span>
            </div>
            {idx < STEP_ORDER.length - 1 && (
              <div
                className={`mb-5 h-px w-8 transition-colors duration-300 ${idx < currentIdx
                  ? "bg-gradient-to-r from-emerald-300 to-teal-300 dark:from-emerald-600 dark:to-teal-600"
                  : "bg-gray-200 dark:bg-gray-700"
                  }`}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

// ─── ArticleCreateForm ────────────────────────────────────────────────────────

interface ArticleCreateFormProps {
  editId?: string;
  onSuccess?: (id: string) => void;
}

// ─── antd theme (light + dark) for form controls ────────────────────────────
const formThemeLight = {
  token: {
    colorPrimary: "#3b82f6", // blue-500
    borderRadius: 8,
    controlHeight: 38,
    fontSize: 13,
  },
  components: {
    Input: { activeBorderColor: "#3b82f6", hoverBorderColor: "#60a5fa" },
    Select: {
      colorPrimary: "#3b82f6",
      optionSelectedBg: "#eff6ff", // blue-50
      optionSelectedColor: "#1d4ed8", // blue-700
    },
  },
};

const formThemeDark = {
  token: {
    colorPrimary: "#3b82f6",
    borderRadius: 8,
    controlHeight: 38,
    fontSize: 13,
    colorBgContainer: "#1f2937", // gray-800
    colorText: "#f3f4f6",        // gray-100
    colorTextPlaceholder: "#9ca3af", // gray-400
    colorBorder: "#374151",      // gray-700
    colorBgElevated: "#374151",  // gray-700 — dropdown popup bg
  },
  components: {
    Input: {
      colorBgContainer: "#1f2937",
      colorText: "#f3f4f6",
      colorTextPlaceholder: "#9ca3af",
      colorBorder: "#374151",
    },
    Select: {
      colorBgContainer: "#1f2937",
      colorText: "#f3f4f6",
      colorTextPlaceholder: "#9ca3af",
      colorBorder: "#374151",
      optionSelectedBg: "#1e40af", // blue-800
      optionSelectedColor: "#ffffff",
      optionActiveBg: "#374151",   // gray-700 hover
    },
    DatePicker: {
      colorBgContainer: "#1f2937",
      colorText: "#f3f4f6",
      colorTextPlaceholder: "#9ca3af",
      colorBorder: "#374151",
    },
  },
};

const ArticleCreateForm: React.FC<ArticleCreateFormProps> = ({ editId, onSuccess }) => {
  const permissions = usePermissions();
  if (!permissions.hasAnyPermission([KbPermission.KB_ARTICLE_VIEW, KbPermission.KB_ARTICLE_MGMT_VIEW])) {
    return <NotFound />;
  }
  // const isCreate = permissions.hasPermission(KbPermission.KB_ARTICLE_MGMT_CREATE)
  const isUpdate = permissions.hasPermission(KbPermission.KB_ARTICLE_MGMT_UPDATE)

  const { t } = useTranslation();
  const [form, setForm] = useState<ArticleFormInput>(emptyForm);
  const [activeTab, setActiveTab] = useState<ArticleFormTab>("basic");
  const [currentStep, setCurrentStep] = useState<ArticleFormStep>("create");
  const [initRelatedOptions, setInitRelatedOptions] = useState<{ id: number; title: string }[]>([]);
  const [initViewGroupOptions, setInitVewiGroupOptions] = useState<{ id: number; title: string }[]>([]);
  const [toasts, setToasts] = useState<FormToast[]>([]);
  const [validationError, setValidationError] = useState<string | null>(null);

  const addToast = (tone: FormToast["tone"], message: string) => {
    const id = ++_toastSeq;
    setToasts((prev) => [...prev, { id, tone, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  };

  const dismissToast = (id: number) => setToasts((prev) => prev.filter((t) => t.id !== id));

  const isEditMode = !!editId;
  const artId = editId ? Number(editId.replace(/\D+/g, "")) || 0 : 0;
  const { data: detailData, isLoading: isLoadingDetail } = useArticleFormDetail(editId);

  useEffect(() => {
    if (!detailData) return;
    const { id: _id, step, createdAt: _c, updatedAt: _u, relatedArticleOptions: initOpts, viewGroupArticleOptions: initviewGroupOpts, ...input } = detailData;
    console.log('input',input)
    setForm(input);
    setCurrentStep(step);
    if (initOpts?.length) setInitRelatedOptions(initOpts);
    if (initviewGroupOpts?.length) setInitVewiGroupOptions(initviewGroupOpts)
  }, [detailData]);

  const { mutate, isPending, isError, error } = useSaveArticleForm();

  const handleChange = <K extends keyof ArticleFormInput>(key: K, value: ArticleFormInput[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setValidationError(null);
  };

  const handleSave = () => {
    if (!form.title.trim()) {
      setValidationError(t("knowledge.articles.form.validation.titleRequired"));
      setActiveTab("basic");
      return;
    }
    mutate(
      { input: form, editId },
      {
        onSuccess: (res) => {
          addToast("success", t("knowledge.articles.form.success"));
          if (!isEditMode) onSuccess?.(res.data.id);
        },
        onError: (err) => {
          addToast("error", err instanceof Error ? err.message : t("knowledge.articles.form.errorGeneric"));
        },
      },
    );
  };

  const activeTabIdx = TAB_KEYS.indexOf(activeTab);

  // Labels derived from t() — rebuilt on language change
  const stepLabels: Record<ArticleFormStep, string> = {
    create: t("knowledge.articles.form.steps.create"),
    submit: t("knowledge.articles.form.steps.submit"),
    approve: t("knowledge.articles.form.steps.approve"),
    publish: t("knowledge.articles.form.steps.publish"),
  };

  const tabLabel = (key: ArticleFormTab) => t(`knowledge.articles.form.tabs.${key}` as const);
  const tabSub = (key: ArticleFormTab) => t(`knowledge.articles.form.tabs.${key}Sub` as const);

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

  const activeTheme = isDark ? formThemeDark : formThemeLight;

  if (isLoadingDetail) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24 text-sm text-gray-400 dark:text-gray-500">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
        <span>{t("knowledge.articles.form.loading")}</span>
      </div>
    );
  }

  if (editId && isLoadingDetail) {
    return <NotFound />;
  }


  return (
    <ConfigProvider theme={activeTheme}>
      <div className="space-y-5 pb-8">
        {/* ── Hero Header ──────────────────────────────────────────────────── */}
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">

          <div className="h-1 w-full bg-gradient-to-r from-blue-500 to-blue-600" />

          <div className="px-6 py-5 sm:px-8 sm:py-6">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.18em] text-blue-500 dark:text-blue-400">
                  {t("knowledge.articles.form.eyebrow")}
                </p>
                <h1 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white sm:text-3xl">
                  {isEditMode ? t("knowledge.articles.form.editTitle") : t("knowledge.articles.form.createTitle")}
                </h1>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {isEditMode ? t("knowledge.articles.form.editSub") : t("knowledge.articles.form.createSub")}
                </p>
              </div>

              {(editId && isUpdate) && (
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isPending}
                  className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-blue-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-blue-600 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <FiSave size={15} strokeWidth={2.2} />
                  {isPending ? t("knowledge.articles.form.saving") : t("knowledge.articles.form.saveBtn")}
                </button>
              )}

              {(!editId && isUpdate) && (
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isPending}
                  className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-blue-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-blue-600 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <FiSave size={15} strokeWidth={2.2} />
                  {isPending ? t("knowledge.articles.form.saving") : t("knowledge.articles.form.saveBtn")}
                </button>
              )}

            </div>

            <div className="flex items-center">
              <StepperBar currentStep={currentStep} stepLabels={stepLabels} />
            </div>
          </div>

          {/* ── Tab Bar ─────────────────────────────────────────────────────── */}
          <div className="flex border-t border-gray-200 dark:border-gray-700">
            {TAB_KEYS.map((key, idx) => {
              const isActive = activeTab === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setActiveTab(key)}
                  className={`group relative flex flex-1 items-center justify-center gap-2 px-4 py-3.5 text-sm font-medium transition-all duration-200 ${isActive
                    ? "text-blue-700 dark:text-blue-300"
                    : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    }`}
                >
                  {isActive && (
                    <span className="absolute bottom-0 left-4 right-4 h-0.5 rounded-full bg-blue-500" />
                  )}
                  {isActive && (
                    <span className="absolute inset-0 bg-gradient-to-b from-blue-50/60 to-transparent dark:from-blue-500/10 dark:to-transparent" />
                  )}
                  <span className={`relative transition-colors ${isActive ? "text-blue-600 dark:text-blue-400" : "text-gray-400 group-hover:text-gray-500 dark:text-gray-500"}`}>
                    {TAB_ICONS[key]}
                  </span>
                  <span className="relative hidden sm:inline">{tabLabel(key)}</span>
                  <span className="relative inline sm:hidden text-xs">{tabSub(key)}</span>
                  <span className="relative hidden text-xs font-normal opacity-50 lg:inline">
                    ({tabSub(key)})
                  </span>
                  <span
                    className={`relative ml-0.5 hidden h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold sm:inline-flex ${isActive
                      ? "bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400"
                      : "bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500"
                      }`}
                  >
                    {idx + 1}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Form Body ────────────────────────────────────────────────────── */}
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="h-px w-full bg-gradient-to-r from-transparent via-blue-300/50 to-transparent dark:via-blue-500/30" />

          <div className="p-5 sm:p-6">
            {/* Section header */}
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-sm">
                {TAB_ICONS[activeTab]}
              </div>
              <div>
                <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                  {tabLabel(activeTab)}
                </h2>
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  {tabSub(activeTab)}
                </p>
              </div>
              <div className="ml-auto text-xs font-medium text-gray-400 dark:text-gray-500">
                {activeTabIdx + 1} / {TAB_KEYS.length}
              </div>
            </div>

            {/* Tab content */}
            {activeTab === "basic" && <BasicInfoTab form={form} onChange={handleChange} artId={artId} initRelatedOptions={initRelatedOptions} />}
            {activeTab === "content" && <ContentTab form={form} onChange={handleChange} />}
            {activeTab === "visibility" && <VisibilityTab form={form} onChange={handleChange} initViewGroupdOptions={initViewGroupOptions} />}

            {/* Error banner */}
            {(validationError ?? (isError && error instanceof Error ? error.message : null)) && (
              <div className="mt-5 flex items-start gap-3 rounded-2xl border border-rose-200 bg-gradient-to-r from-rose-50 to-red-50/60 px-4 py-3.5 text-sm text-rose-700 dark:border-rose-500/20 dark:from-rose-500/10 dark:to-red-500/5 dark:text-rose-300">
                <span className="mt-0.5 shrink-0 text-base">⚠</span>
                <span>{validationError ?? (error instanceof Error ? error.message : t("knowledge.articles.form.errorGeneric"))}</span>
              </div>
            )}


            {/* Tab navigation */}
            <div className="mt-7 flex items-center justify-between border-t border-gray-100 pt-5 dark:border-gray-700">
              <button
                type="button"
                onClick={() => { if (activeTabIdx > 0) setActiveTab(TAB_KEYS[activeTabIdx - 1]); }}
                disabled={activeTab === "basic"}
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-600 shadow-sm transition-all hover:border-gray-300 hover:bg-gray-50 hover:text-gray-800 disabled:cursor-not-allowed disabled:opacity-35 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                <FiChevronLeft size={15} />
                {t("knowledge.articles.form.nav.prev")}
              </button>

              <div className="flex items-center gap-1.5">
                {TAB_KEYS.map((key, idx) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setActiveTab(key)}
                    className={`h-1.5 rounded-full transition-all duration-300 ${idx === activeTabIdx
                      ? "w-6 bg-blue-500"
                      : "w-1.5 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600"
                      }`}
                  />
                ))}
              </div>

              <button
                type="button"
                onClick={() => { if (activeTabIdx < TAB_KEYS.length - 1) setActiveTab(TAB_KEYS[activeTabIdx + 1]); }}
                disabled={activeTab === "visibility"}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-500 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-blue-600 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-35"
              >
                {t("knowledge.articles.form.nav.next")}
                <FiChevronRight size={15} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <FormToastStack toasts={toasts} onDismiss={dismissToast} />
    </ConfigProvider>
  );
};

export default ArticleCreateForm;
