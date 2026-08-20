// /src/cms/components/admin/system-configuration/appointment-type/AppointmentTypeManagement.tsx
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
  useDeleteAppointmentTypeMutation, useInsertAppointmentTypeMutation, useUpdateAppointmentTypeMutation
} from "@/cms/store/api/appointmentType";
import { capitalizeWords } from "@/core/utils/stringFormatters";
import type { PreviewConfig } from "@/core/types/enhanced-crud";
import type {
  AppointmentType, AppointmentTypeManagementProps, AppointmentTypeMetrics
} from "@/cms/types/appointmentType";
import Input from "@/core/components/form/input/InputField";
import Switch from "@/core/components/form/switch/Switch";
import Button from "@/core/components/ui/button/Button";

/**
 * Row shape handed to EnhancedCrudContainer. The container keys every row (and its delete
 * handler) off `id`, but the API keys appointment types off `appointmentTypeId`, so the two
 * are aliased here.
 */
type AppointmentTypeRow = AppointmentType & { id: string; name: string };

const AppointmentTypeManagementComponent: React.FC<AppointmentTypeManagementProps> = ({ appointmentTypes, onRefresh }) => {
  const isSystemAdmin = useIsSystemAdmin();

  const permissions = usePermissions();
  const { language, t } = useTranslation();
  const { toasts, addToast, removeToast } = useToast();

  const [insertAppointmentType] = useInsertAppointmentTypeMutation();
  const [updateAppointmentType] = useUpdateAppointmentTypeMutation();
  const [deleteAppointmentType] = useDeleteAppointmentTypeMutation();

  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [appointmentTypeId, setAppointmentTypeId] = useState("");
  const [active, setActive] = useState(true);
  const [th, setTh] = useState("");
  const [en, setEn] = useState("");
  const [validationErrors, setValidationErrors] = useState({ th: "", en: "" });

  const handleAppointmentTypeReset = () => {
    setActive(true);
    setAppointmentTypeId("");
    setTh("");
    setEn("");
    setValidationErrors({ th: "", en: "" });
    setIsOpen(false);
  };

  const handleAppointmentTypeEdit = (appointmentType: AppointmentType) => {
    setAppointmentTypeId(appointmentType.appointmentTypeId);
    setActive(appointmentType.active);
    setTh(appointmentType.th || "");
    setEn(appointmentType.en || "");
    setValidationErrors({ th: "", en: "" });
    setIsOpen(true);
  };

  const validateError = useCallback((): string[] => {
    const errors: string[] = [];
    if (!th.trim()) {
      errors.push(t("crud.appointment_type.form.th.required"));
      setValidationErrors(prev => ({ ...prev, th: t("crud.appointment_type.form.th.required") }));
    }
    if (!en.trim()) {
      errors.push(t("crud.appointment_type.form.en.required"));
      setValidationErrors(prev => ({ ...prev, en: t("crud.appointment_type.form.en.required") }));
    }
    return errors;
  }, [th, en, t]);

  const handleAppointmentTypeSave = useCallback(async () => {
    const errors = validateError();
    if (errors.length > 0) {
      setIsConfirmOpen(false);
      setIsOpen(true);
      return; // Don"t save if there are validation errors
    }
    try {
      setLoading(true);
      if (!permissions.hasAnyPermission(["appointment.create", "appointment.update"]) && !isSystemAdmin) {
        throw new Error(t("crud.common.permission_denied"));
      }
      const response = appointmentTypeId
        ? await updateAppointmentType({ appointmentTypeId, active, th, en }).unwrap()
        : await insertAppointmentType({ active, th, en }).unwrap();

      if (response?.status) {
        addToast(
          "success",
          response?.message || response?.desc || response?.msg
            || (appointmentTypeId && t("crud.appointment_type.action.update.success"))
            || t("crud.appointment_type.action.create.success")
        );
        // The list refreshes itself: every mutation invalidates the "AppointmentType" tag.
        handleAppointmentTypeReset();
      }
      else {
        throw new Error(response?.desc || response?.msg || t("errors.unknownApi"));
      }
    }
    catch (error) {
      addToast("error", `${(error as { data?: { message?: string } })?.data?.message
        || (error as { data?: { desc?: string } })?.data?.desc
        || (error as { data?: { msg?: string } })?.data?.msg
        || appointmentTypeId && t("crud.appointment_type.action.update.error") || t("crud.appointment_type.action.create.error")}: ${error}`);
    }
    finally {
      setIsOpen(false);
      setIsConfirmOpen(false);
      setLoading(false);
    }
  }, [
    active, addToast, appointmentTypeId, en, insertAppointmentType, isSystemAdmin, permissions, th, t, updateAppointmentType, validateError
  ]);

  const isDeleteAvailable = () => permissions.hasPermission("appointment.delete") || isSystemAdmin;

  const isEditAvailable = () => permissions.hasPermission("appointment.update") || isSystemAdmin;

  const isViewAvailable = () => permissions.hasPermission("appointment.view") || isSystemAdmin;

  // ===================================================================
  // Real Functionality Data
  // ===================================================================

  const data: AppointmentTypeRow[] = useMemo(() => appointmentTypes?.map(appointmentType => ({
    ...appointmentType,
    id: appointmentType.appointmentTypeId ?? appointmentType.id ?? "",
    name: (language === "th" ? appointmentType.th : appointmentType.en) || appointmentType.th || appointmentType.en || "",
  })) ?? [], [appointmentTypes, language]);

  // ===================================================================
  // Metrics
  // ===================================================================

  const appointmentTypeMetrics: AppointmentTypeMetrics = useMemo(() => ({
    totalAppointmentTypes: data.length,
    activeAppointmentTypes: data.filter(appointmentType => appointmentType.active).length,
    inactiveAppointmentTypes: data.filter(appointmentType => !appointmentType.active).length,
  }), [data]);

  const attrMetrics = [
    { key: "totalAppointmentTypes", title: t("crud.appointment_type.metrics.total"), icon: GroupIcon, color: "blue", className: "text-blue-600" },
    { key: "activeAppointmentTypes", title: t("crud.appointment_type.metrics.active"), icon: CheckLineIcon, color: "green", className: "text-green-600" },
    { key: "inactiveAppointmentTypes", title: t("crud.appointment_type.metrics.inactive"), icon: TimeIcon, color: "red", className: "text-red-600" },
  ];

  // ===================================================================
  // Shared Renderers
  // ===================================================================

  const renderName = (appointmentType: AppointmentType) => (
    <span className="text-gray-900 dark:text-white">
      {language === "th" && appointmentType.th || capitalizeWords(appointmentType.en || "")} ({language === "th" && capitalizeWords(appointmentType.en || "") || appointmentType.th})
    </span>
  );

  const renderStatus = (isActive: boolean) => {
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

  // ===================================================================
  // CRUD Configuration
  // ===================================================================

  const config = {
    entityName: t("crud.appointment_type.name"),
    entityNamePlural: t("crud.appointment_type.name"),
    apiEndpoints: {
      list: "/appointment_types",
      create: "/appointment_types",
      read: "/appointment_types/:id",
      update: "/appointment_types/:id",
      delete: "/appointment_types/:id"
    },
    columns: [
      {
        key: language === "th" && "th" || "en",
        label: t("crud.appointment_type.list.header.name"),
        sortable: true,
        render: (appointmentType: AppointmentType) => renderName(appointmentType),
      },
      {
        key: "status",
        label: t("crud.appointment_type.list.header.status"),
        sortable: true,
        render: (appointmentType: AppointmentType) => renderStatus(appointmentType.active)
      }
    ],
    actions: [
      {
        key: "view",
        label: t("crud.common.read"),
        variant: "primary" as const,
        onClick: () => {},
        condition: () => isViewAvailable()
      },
      {
        key: "update",
        label: t("crud.common.update"),
        variant: "warning" as const,
        onClick: (appointmentType: AppointmentType) => handleAppointmentTypeEdit(appointmentType),
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
  // Preview Configuration
  // ===================================================================

  const previewConfig: PreviewConfig<AppointmentType> = {
    title: () => t("crud.appointment_type.list.preview.header"),
    size: "xl",
    enableNavigation: true,
    tabs: [
      {
        key: "overview",
        label: "",
        fields: [
          {
            key: language === "th" && "th" || "en",
            label: t("crud.appointment_type.list.header.name"),
            type: "custom" as const,
            render: (_, appointmentType: AppointmentType) => renderName(appointmentType),
          },
          {
            key: "active",
            label: t("crud.appointment_type.list.header.status"),
            type: "custom",
            render: value => renderStatus(Boolean(value))
          },
        ]
      }
    ],
    actions: [
      {
        key: "update",
        label: t("crud.common.update"),
        variant: "warning",
        onClick: (appointmentType: AppointmentType) => handleAppointmentTypeEdit(appointmentType),
        condition: () => isEditAvailable()
      },
    ]
  };

  // ===================================================================
  // Custom Card Rendering
  // ===================================================================

  const renderCard = (appointmentType: AppointmentType) => (
    <div className="xl:flex items-start justify-between mb-4">
      <div className="xl:flex items-center gap-3 min-w-0 xl:flex-1">
        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate capitalize">
            {language === "th" && appointmentType.th || capitalizeWords(appointmentType.en || "")} ({language === "th" && capitalizeWords(appointmentType.en || "") || appointmentType.th})
          </h3>
          {renderStatus(appointmentType.active)}
        </div>
      </div>
    </div>
  );

  // ===================================================================
  // Render Component
  // ===================================================================

  return (
    <>
      <MetricsView metrics={appointmentTypeMetrics} attrMetrics={attrMetrics} />

      <EnhancedCrudContainer
        apiConfig={{
          baseUrl: "/api",
          endpoints: {
            create: "/appointment_types",
            read: "/appointment_types/:id",
            list: "/appointment_types",
            update: "/appointment_types/:id",
            delete: "/appointment_types/:id"
          }
        }}
        config={config}
        data={data}
        // Goes through RTK Query -> createHybridBaseQuery, so the delete becomes the
        // DeleteAppointmentType mutation under GraphQL. The container's apiService fallback is
        // a raw fetch that would always speak REST.
        deleteItem={(id: string) => deleteAppointmentType({ appointmentTypeId: id }).unwrap()}
        displayModes={["card", "table"]}
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
        loading={!appointmentTypes}
        module="appointment"
        previewConfig={previewConfig as PreviewConfig<AppointmentType & { id: string }>}
        searchFields={["th", "en"]}
        onCreate={() => {
          handleAppointmentTypeReset();
          setIsOpen(true);
        }}
        onRefresh={onRefresh}
        renderCard={renderCard as unknown as (item: { id: string }) => React.ReactNode}
      />

      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <Modal
        isOpen={isOpen}
        onClose={handleAppointmentTypeReset}
        className="max-w-4xl p-6 max-h-[80vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white cursor-default">
            {appointmentTypeId && t("crud.appointment_type.form.header.update") || t("crud.appointment_type.form.header.create")}
          </h3>
          <Button onClick={() => setIsOpen(false)} variant="ghost" size="sm">
            <CloseIcon className="w-4 h-4" />
          </Button>
        </div>
        <div className="space-y-4">
          <div>
            <label htmlFor="th" className="text-sm font-medium text-gray-700 dark:text-gray-200">
              {t("crud.appointment_type.form.th.label")}
            </label>
            <Input
              id="th"
              placeholder={t("crud.appointment_type.form.th.placeholder")}
              value={th}
              onChange={(e) => setTh(e.target.value)}
            />
            <span className="text-red-500 dark:text-red-400 text-xs">{validationErrors.th}</span>
          </div>
          <div>
            <label htmlFor="en" className="text-sm font-medium text-gray-700 dark:text-gray-200">
              {t("crud.appointment_type.form.en.label")}
            </label>
            <Input
              id="en"
              placeholder={t("crud.appointment_type.form.en.placeholder")}
              value={en}
              onChange={(e) => setEn(e.target.value)}
            />
            <span className="text-red-500 dark:text-red-400 text-xs">{validationErrors.en}</span>
          </div>
          <div>
            <Switch
              key={appointmentTypeId || "new"}
              label={t("crud.appointment_type.form.active.label")}
              defaultChecked={active}
              onChange={setActive}
            />
          </div>
        </div>
        <div className="flex items-center justify-end mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex gap-3">
            <Button onClick={handleAppointmentTypeReset} variant="outline">
              {t("crud.appointment_type.action.button.reset")}
            </Button>
            <Button
              onClick={() => {
                setIsConfirmOpen(true);
                setIsOpen(false);
              }}
              variant="primary"
            >
              {t("crud.appointment_type.action.button.save")}
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
            {appointmentTypeId && t("crud.appointment_type.confirm.update.title") || t("crud.appointment_type.confirm.create.title")}
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
          {appointmentTypeId
            && t("crud.appointment_type.confirm.update.message").replace("_APPOINTMENT_TYPE_", language === "th" && th || en)
            || t("crud.appointment_type.confirm.create.message").replace("_APPOINTMENT_TYPE_", language === "th" && th || en)
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
              {t("crud.appointment_type.confirm.button.cancel")}
            </Button>
            <Button onClick={handleAppointmentTypeSave} variant="success">
              {loading && t("crud.appointment_type.confirm.button.saving") || t("crud.appointment_type.confirm.button.confirm")}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default AppointmentTypeManagementComponent;
