// src/cms/components/admin/system-configuration/case-result/CaseResultManagement.tsx
//
// Cloned from ../place/PlaceManagement.tsx, simplified to a bilingual name + active
// entity (no category / coordinate). Two things carried over from Place:
//   1. relies on the "CaseResult" RTK cache tag (caseResultApi) to refresh the
//      list after a mutation, instead of window.location.replace;
//   2. every in-screen permission check uses the `settings.*` family (route is
//      gated by `settings.view`).
import React, { useCallback, useMemo, useState } from "react";
import { CheckLineIcon, CloseIcon, GroupIcon, TimeIcon } from "@/core/icons";
import { EnhancedCrudContainer } from "@/core/components/crud/EnhancedCrudContainer";
import { ToastContainer } from "@/core/components/crud/ToastContainer";
import MetricsView from "@/core/components/admin/MetricsView";
import { Modal } from "@/core/components/ui/modal";
import { usePermissions } from "@/core/hooks/usePermissions";
import { useIsSystemAdmin } from "@/core/hooks/useIsSystemAdmin";
import { useToast } from "@/core/hooks/useToast";
import { useTranslation } from "@/core/hooks/useTranslation";
import {
  useCreateCaseResultMutation, useDeleteCaseResultMutation, useUpdateCaseResultMutation
} from "@/cms/store/api/caseResultApi";
import { capitalizeWords } from "@/core/utils/stringFormatters";
import type {
  CaseResult, CaseResultCreateData, CaseResultManagementProps, CaseResultMetrics, CaseResultUpdateData
} from "@/cms/types/caseResult";
import Input from "@/core/components/form/input/InputField";
import Switch from "@/core/components/form/switch/Switch";
import Button from "@/core/components/ui/button/Button";

const CREATE_PERMISSION = "settings.create";
const UPDATE_PERMISSION = "settings.update";
const DELETE_PERMISSION = "settings.delete";

const CaseResultManagementComponent: React.FC<CaseResultManagementProps> = ({
  caseResults, isLoading, isError, onRefresh
}) => {
  const isSystemAdmin = useIsSystemAdmin();

  const permissions = usePermissions();
  const { language, t } = useTranslation();
  const { toasts, addToast, removeToast } = useToast();

  const [createCaseResult] = useCreateCaseResultMutation();
  const [updateCaseResult] = useUpdateCaseResultMutation();
  const [deleteCaseResult] = useDeleteCaseResultMutation();

  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [caseResultId, setCaseResultId] = useState("");
  const [active, setActive] = useState(true);
  const [th, setTh] = useState("");
  const [en, setEn] = useState("");
  const [validationErrors, setValidationErrors] = useState({ th: "", en: "" });

  const canManage = permissions.hasAnyPermission([CREATE_PERMISSION, UPDATE_PERMISSION]) || isSystemAdmin;
  const canDelete = permissions.hasPermission(DELETE_PERMISSION) || isSystemAdmin;

  const handleCaseResultReset = () => {
    setActive(true);
    setCaseResultId("");
    setTh("");
    setEn("");
    setValidationErrors({ th: "", en: "" });
    setIsOpen(false);
  };

  const validateError = useCallback((): string[] => {
    const errors: string[] = [];
    const next = { th: "", en: "" };

    if (!th.trim()) {
      next.th = t("crud.case_result.form.th.required");
      errors.push(next.th);
    }
    if (!en.trim()) {
      next.en = t("crud.case_result.form.en.required");
      errors.push(next.en);
    }

    setValidationErrors(next);
    return errors;
  }, [th, en, t]);

  const handleCaseResultSave = useCallback(async () => {
    const errors = validateError();
    if (errors.length > 0) {
      return;
    }
    const data: CaseResultCreateData | CaseResultUpdateData = {
      en,
      th,
      active
    };
    try {
      setLoading(true);
      let response;
      if (canManage) {
        if (caseResultId) {
          response = await updateCaseResult({ id: caseResultId, data }).unwrap();
        }
        else {
          response = await createCaseResult(data).unwrap();
        }
      }
      else {
        throw new Error(t("crud.common.permission_denied"));
      }
      if (response?.status) {
        addToast(
          "success",
          response?.message || response?.desc || response?.msg
          || (caseResultId && t("crud.case_result.action.update.success"))
          || t("crud.case_result.action.create.success")
        );
        // No window.location.replace: caseResultApi invalidates the "CaseResult"
        // tag, so the list query re-runs and the row appears/updates in place.
      }
      else {
        throw new Error(response?.desc || response?.msg || t("errors.unknownApi"));
      }
    }
    catch (error) {
      addToast("error", `${(error as { data?: { message?: string } })?.data?.message
        || (error as { data?: { desc?: string } })?.data?.desc
        || (error as { data?: { msg?: string } })?.data?.msg
        || caseResultId && t("crud.case_result.action.update.error") || t("crud.case_result.action.create.error")}: ${error}`);
    }
    finally {
      setIsOpen(false);
      setIsConfirmOpen(false);
      setLoading(false);
    }
  }, [
    active, addToast, canManage, caseResultId, createCaseResult, en, th, t,
    updateCaseResult, validateError
  ]);

  const isEditAvailable = () => canManage;
  const isDeleteAvailable = () => canDelete;

  // ===================================================================
  // Real Functionality Data
  // ===================================================================

  const data: (CaseResult & { id: string; name: string })[] = useMemo(
    () => caseResults?.map(r => ({
      ...r,
      // The close-case flow keys on `resId`; fall back to `id` when absent.
      id: r.resId ?? r.id ?? "",
      name: (language === "th" ? r.th : r.en) || r.th || r.en || "",
    })) ?? [],
    [caseResults, language]
  );

  // ===================================================================
  // Metrics
  // ===================================================================

  const caseResultMetrics: CaseResultMetrics = useMemo(() => ({
    totalCaseResults: data.length,
    activeCaseResults: data.filter(r => r.active).length,
    inactiveCaseResults: data.filter(r => !r.active).length,
  }), [data]);

  const attrMetrics = [
    { key: "totalCaseResults", title: t("crud.case_result.metrics.total"), icon: GroupIcon, color: "blue", className: "text-blue-600" },
    { key: "activeCaseResults", title: t("crud.case_result.metrics.active"), icon: CheckLineIcon, color: "green", className: "text-green-600" },
    { key: "inactiveCaseResults", title: t("crud.case_result.metrics.inactive"), icon: TimeIcon, color: "red", className: "text-red-600" },
  ];

  // ===================================================================
  // CRUD Configuration
  // ===================================================================

  const renderStatusBadge = (isActive: boolean) => {
    const statusConfig = isActive
      ? { color: "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100", icon: CheckLineIcon }
      : { color: "bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100", icon: TimeIcon };
    const Icon = statusConfig.icon;
    return (
      <span className={`items-center px-2 py-1 rounded-full text-xs font-medium capitalize ${statusConfig.color}`}>
        <Icon className="w-4 h-4 inline mr-1" />
        {isActive ? t("common.active") : t("common.inactive")}
      </span>
    );
  };

  const config = {
    entityName: t("crud.case_result.name"),
    entityNamePlural: t("crud.case_result.name"),
    apiEndpoints: {
      list: "/case/result/",
      create: "/case/result/add",
      read: "/case/result/:id",
      update: "/case/result/:id",
      delete: "/case/result/:id"
    },
    columns: [
      {
        key: language === "th" && "th" || "en",
        label: t("crud.case_result.list.header.name"),
        sortable: true,
        render: (item: CaseResult) =>
          <span className="text-gray-900 dark:text-white">
            {language === "th" && item.th || capitalizeWords(item.en || "")} ({language === "th" && capitalizeWords(item.en || "") || item.th})
          </span>,
      },
      {
        key: "status",
        label: t("crud.case_result.list.header.status"),
        sortable: true,
        render: (item: CaseResult) => renderStatusBadge(item.active)
      }
    ],
    actions: [
      {
        key: "update",
        label: t("crud.common.update"),
        variant: "warning" as const,
        onClick: (item: CaseResult) => {
          setCaseResultId(item.resId ?? item.id);
          setActive(item.active);
          setTh(item.th);
          setEn(item.en);
          setValidationErrors({ th: "", en: "" });
          setIsOpen(true);
        },
        condition: () => isEditAvailable()
      },
      {
        key: "delete",
        label: t("crud.common.delete"),
        variant: "outline" as const,
        onClick: () => {},
        condition: () => isDeleteAvailable()
      }
    ]
  };

  // ===================================================================
  // Custom Card Rendering
  // ===================================================================

  const renderCard = (item: CaseResult) => (
    <div className={`xl:flex items-start justify-between mb-4`}>
      <div className="xl:flex items-center gap-3 min-w-0 xl:flex-1">
        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate capitalize">
            {language === "th" && item.th || capitalizeWords(item.en || "")} ({language === "th" && capitalizeWords(item.en || "") || item.th})
          </h3>
          {renderStatusBadge(item.active)}
        </div>
      </div>
    </div>
  );

  // ===================================================================
  // Render Component
  // ===================================================================

  return (
    <>
      <MetricsView metrics={caseResultMetrics} attrMetrics={attrMetrics} />

      <EnhancedCrudContainer
        apiConfig={{
          baseUrl: "/api",
          endpoints: {
            create: "/case/result/add",
            read: "/case/result/:id",
            list: "/case/result/",
            update: "/case/result/:id",
            delete: "/case/result/:id"
          }
        }}
        config={config}
        data={data}
        // Routes DELETE through RTK Query (createHybridBaseQuery -> GraphQL) and,
        // because deleteCaseResult invalidates the "CaseResult" tag, refreshes the list.
        deleteItem={(id: string) => deleteCaseResult(id).unwrap()}
        displayModes={["card", "table"]}
        // Whole route is gated by settings.view; gate the create button and every
        // row action on settings.update.
        actionPermission={UPDATE_PERMISSION}
        features={{
          bulkActions: false,
          export: false,
          filtering: true,
          keyboardShortcuts: true,
          pagination: true,
          realTimeUpdates: false,
          search: true,
          sorting: true,
        }}
        loading={isLoading}
        error={isError ? t("errors.unknownApi") : null}
        searchFields={["th", "en"]}
        onCreate={() => {
          handleCaseResultReset();
          setIsOpen(true);
        }}
        onRefresh={onRefresh}
        renderCard={renderCard as unknown as (item: { id: string }) => React.ReactNode}
      />

      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <Modal
        isOpen={isOpen}
        onClose={() => {
          setIsOpen(false);
          handleCaseResultReset();
        }}
        className="max-w-4xl p-6 max-h-[80vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white cursor-default">
            {caseResultId && t("crud.case_result.form.header.update") || t("crud.case_result.form.header.create")}
          </h3>
          <Button
            onClick={() => setIsOpen(false)}
            variant="ghost"
            size="sm"
          >
            <CloseIcon className="w-4 h-4" />
          </Button>
        </div>
        <div className="space-y-4">
          <div>
            <label htmlFor="th" className="text-sm font-medium text-gray-700 dark:text-gray-200">
              {t("crud.case_result.form.th.label")}
            </label>
            <Input
              id="th"
              placeholder={t("crud.case_result.form.th.placeholder")}
              value={th}
              onChange={(e) => setTh(e.target.value)}
            />
            <span className="text-red-500 dark:text-red-400 text-xs">{validationErrors.th}</span>
          </div>
          <div>
            <label htmlFor="en" className="text-sm font-medium text-gray-700 dark:text-gray-200">
              {t("crud.case_result.form.en.label")}
            </label>
            <Input
              id="en"
              placeholder={t("crud.case_result.form.en.placeholder")}
              value={en}
              onChange={(e) => setEn(e.target.value)}
            />
            <span className="text-red-500 dark:text-red-400 text-xs">{validationErrors.en}</span>
          </div>
          <div>
            <Switch
              key={caseResultId || "new"}
              label={t("crud.case_result.form.active.label")}
              defaultChecked={active}
              onChange={setActive}
            />
          </div>
        </div>
        <div className="flex items-center justify-end mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex gap-3">
            <Button onClick={handleCaseResultReset} variant="outline">
              {t("crud.case_result.action.button.reset")}
            </Button>
            <Button
              onClick={() => {
                setIsConfirmOpen(true);
                setIsOpen(false);
              }}
              variant="primary"
            >
              {t("crud.case_result.action.button.save")}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isConfirmOpen}
        onClose={() => {
          setIsConfirmOpen(false);
          setIsOpen(true);
        }}
        className="max-w-4xl p-6 max-h-[80vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white cursor-default">
            {caseResultId && t("crud.case_result.confirm.update.title") || t("crud.case_result.confirm.create.title")}
          </h3>
          <Button
            onClick={() => {
              setIsConfirmOpen(false);
              setIsOpen(true);
            }}
            variant="ghost"
            size="sm"
          >
            <CloseIcon className="w-4 h-4" />
          </Button>
        </div>
        <div className="space-y-4">
          {caseResultId
            && t("crud.case_result.confirm.update.message").replace("_CASE_RESULT_", language === "th" && th || en)
            || t("crud.case_result.confirm.create.message").replace("_CASE_RESULT_", language === "th" && th || en)
          }
        </div>
        <div className="flex items-center justify-end mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex gap-3">
            <Button
              onClick={() => {
                setIsConfirmOpen(false);
                setIsOpen(true);
              }}
              variant="outline"
            >
              {t("crud.case_result.confirm.button.cancel")}
            </Button>
            <Button onClick={handleCaseResultSave} variant="success">
              {loading && t("crud.case_result.confirm.button.saving") || t("crud.case_result.confirm.button.confirm")}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default CaseResultManagementComponent;
