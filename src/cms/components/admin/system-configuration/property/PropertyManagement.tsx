// /src/components/admin/system-configuration/property/PropertyManagement.tsx
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
  useCreatePropertyMutation, useDeletePropertyMutation, useUpdatePropertyMutation
} from "@/cms/store/api/propertyApi";
import { capitalizeWords } from "@/core/utils/stringFormatters";
import type { PreviewConfig } from "@/core/types/enhanced-crud";
import type {
  Property, PropertyCreateData, PropertyManagementProps, PropertyMetrics, PropertyUpdateData
} from "@/cms/types/unit";
import Input from "@/core/components/form/input/InputField";
import Switch from "@/core/components/form/switch/Switch";
import Button from "@/core/components/ui/button/Button";

const PropertyManagementComponent: React.FC<PropertyManagementProps> = ({ properties }) => {
  const isSystemAdmin = useIsSystemAdmin();

  const permissions = usePermissions();
  const { language, t } = useTranslation();
  const { toasts, addToast, removeToast } = useToast();

  const [createProperty] = useCreatePropertyMutation();
  const [updateProperty] = useUpdatePropertyMutation();
  const [deleteProperty] = useDeletePropertyMutation();

  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [propertyId, setPropertyId] = useState("");
  const [active, setActive] = useState(true);
  const [th, setTh] = useState("");
  const [en, setEn] = useState("");
  const [validationErrors, setValidationErrors] = useState({ th: "", en: "" });

  const handlePropertyReset = () => {
    setActive(true);
    setPropertyId("");
    setTh("");
    setEn("");
    setIsOpen(false);
  }

  const validateError = useCallback((): string[] => {
    const errors: string[] = [];
    if (!th.trim()) {
      errors.push(t("crud.property.form.th.required"));
      setValidationErrors(prev => ({ ...prev, th: t("crud.property.form.th.required") }));
    }
    if (!en.trim()) {
      errors.push(t("crud.property.form.en.required"));
      setValidationErrors(prev => ({ ...prev, en: t("crud.property.form.en.required") }));
    }
    return errors;
  }, [th, en, t]);

  const handlePropertySave = useCallback(async () => {
    const errors = validateError();
    if (errors.length > 0) {
      return; // Don"t save if there are validation errors
    }
    const data: PropertyCreateData | PropertyUpdateData = {
      active: active,
      th: th,
      en: en
    };
    try {
      setLoading(true);
      let response;
      if (permissions.hasAnyPermission(["unit.create", "unit.update"])) {
        if (propertyId) {
          response = await updateProperty({
            id: propertyId, data: data
          }).unwrap();
        }
        else {
          response = await createProperty(data).unwrap();
        }
      }
      else {
        throw new Error(t("crud.common.permission_denied"));
      }
      if (response?.status) {
        addToast("success", response?.message || response?.desc || response?.msg || (propertyId && t("crud.property.action.update.success")) || t("crud.property.action.create.success"));
        setTimeout(() => {
          window.location.replace(`/cms/property`);
        }, 1000);
      }
      else {
        throw new Error(response?.desc || response?.msg || t("errors.unknownApi"));
      }
    }
    catch (error) {
      addToast("error", `${(error as { data?: { message?: string } })?.data?.message
        || (error as { data?: { desc?: string } })?.data?.desc
        || (error as { data?: { msg?: string } })?.data?.msg
        || propertyId && t("crud.property.action.update.error") || t("crud.property.action.create.error")}: ${error}`);
    }
    finally {
      setIsOpen(false);
      setIsConfirmOpen(false);
      setLoading(false);
    }
  }, [
    active, addToast, createProperty, en, permissions, propertyId, th, t, updateProperty, validateError
  ]);

  const handlePropertyDelete = () => {
    setTimeout(() => {
      window.location.replace(`/cms/property`);
    }, 1000);
  };

  const isDeleteAvailable = () => {
    const canDelete = permissions.hasPermission("unit.delete");
    return canDelete || isSystemAdmin;
  }

  const isEditAvailable = () => {
    const canEdit = permissions.hasPermission("unit.update");
    return canEdit || isSystemAdmin;
  }

  const isViewAvailable = () => {
    const canView = permissions.hasPermission("unit.view");
    return canView || isSystemAdmin;
  }

  // ===================================================================
  // Real Functionality Data
  // ===================================================================

  const data: (Property & { id: string; name: string })[] = properties?.map(p => ({
    ...p,
    id: p.id ?? "",
    name: (language === "th" ? p.th : p.en) || p.th || p.en || "",
  })) ?? [];

  // ===================================================================
  // Metrics
  // ===================================================================

  const propertyMetrics: PropertyMetrics = useMemo(() => ({
    totalProperties: data.length,
    activeProperties: data.filter(p => p.active).length,
    inactiveProperties: data.filter(p => !p.active).length,
  }), [data]);

  const attrMetrics = [
    { key: "totalProperties", title: t("crud.property.metrics.total"), icon: GroupIcon, color: "blue", className: "text-blue-600" },
    { key: "activeProperties", title: t("crud.property.metrics.active"), icon: CheckLineIcon, color: "green", className: "text-green-600" },
    { key: "inactiveProperties", title: t("crud.property.metrics.inactive"), icon: TimeIcon, color: "red", className: "text-red-600" },
  ];

  // ===================================================================
  // CRUD Configuration
  // ===================================================================

  const config = {
    entityName: t("crud.property.name"),
    entityNamePlural: t("crud.property.name"),
    apiEndpoints: {
      list: "/mdm/properties",
      create: "/mdm/properties/add",
      read: "/mdm/properties/:id",
      update: "/mdm/properties/:id",
      delete: "/mdm/properties/:id"
    },
    columns: [
      {
        key: language === "th" && "th" || "en",
        label: t("crud.property.list.header.name"),
        sortable: true,
        render: (propertyItem: Property) =>
          <span className="text-gray-900 dark:text-white">
            {language === "th" && propertyItem.th || capitalizeWords(propertyItem.en || "")} ({language === "th" && capitalizeWords(propertyItem.en || "") || propertyItem.th})
          </span>,
      },
      {
        key: "status",
        label: t("crud.property.list.header.status"),
        sortable: true,
        render: (propertyItem: Property) => {
          const statusConfig = propertyItem.active
            ? { color: "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100", icon: CheckLineIcon }
            : { color: "bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100", icon: TimeIcon };
          const Icon = statusConfig.icon;
          return (
            <span className={`items-center px-2 py-1 rounded-full text-xs font-medium capitalize ${statusConfig.color}`}>
              <Icon className="w-4 h-4 inline mr-1" />
              {propertyItem.active ? t("common.active") : t("common.inactive")}
            </span>
          );
        }
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
        onClick: (propertyItem: Property) => {
          setPropertyId(propertyItem.id);
          setActive(propertyItem.active);
          setTh(propertyItem.th);
          setEn(propertyItem.en);
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
  // Preview Configuration
  // ===================================================================

  const previewConfig: PreviewConfig<
    Property
  > = {
    title: () => t("crud.property.list.preview.header"),
    size: "xl",
    enableNavigation: true,
    tabs: [
      {
        key: "overview",
        label: "",
        fields: [
          {
            key: language === "th" && "th" || "en",
            label: t("crud.property.list.header.name"),
            type: "custom" as const,
            render: (_, propertyItem: Property) =>
              <span className="text-gray-900 dark:text-white">
                {language === "th" && propertyItem.th || capitalizeWords(propertyItem.en || "")} ({language === "th" && capitalizeWords(propertyItem.en || "") || propertyItem.th})
              </span>,
          },
          {
            key: "active",
            label: t("crud.property.list.header.status"),
            type: "custom",
            render: value => {
              const statusConfig = value
                ? { color: "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100", icon: CheckLineIcon }
                : { color: "bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100", icon: TimeIcon };
              const Icon = statusConfig.icon;
              return (
                <span className={`items-center px-2 py-1 rounded-full text-xs font-medium capitalize ${statusConfig.color}`}>
                  <Icon className="w-4 h-4 inline mr-1" />
                  {value ? t("common.active") : t("common.inactive")}
                </span>
              );
            }
          },
        ]
      }
    ],
    actions: [
      {
        key: "update",
        label: t("crud.common.update"),
        variant: "warning",
        onClick: (propertyItem: Property) => {
          setPropertyId(propertyItem.id);
          setActive(propertyItem.active);
          setTh(propertyItem.th);
          setEn(propertyItem.en);
          setIsOpen(true);
        },
        condition: () => isEditAvailable()
      },
    ]
  };

  // ===================================================================
  // Custom Card Rendering
  // ===================================================================

  const renderCard = (propertyItem: Property) => {
    const statusConfig = propertyItem.active
      ? { color: "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100", icon: CheckLineIcon }
      : { color: "bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100", icon: TimeIcon };
    const Icon = statusConfig.icon;

    return (
      <div className={`xl:flex items-start justify-between mb-4`}>
        <div className="xl:flex items-center gap-3 min-w-0 xl:flex-1">
          <div className="min-w-0 flex-1">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate capitalize">
              {language === "th" && propertyItem.th || capitalizeWords(propertyItem.en || "")} ({language === "th" && capitalizeWords(propertyItem.en || "") || propertyItem.th})
            </h3>
            <span className={`items-center px-2 py-1 rounded-full text-xs font-medium capitalize ${statusConfig.color}`}>
              <Icon className="w-4 h-4 inline mr-1" />
              {propertyItem.active ? t("common.active") : t("common.inactive")}
            </span>
          </div>
        </div>
      </div>
    );
  };

  // ===================================================================
  // Render Component
  // ===================================================================

  return (
    <>
      <MetricsView metrics={propertyMetrics} attrMetrics={attrMetrics} />

      <EnhancedCrudContainer
        apiConfig={{
          baseUrl: "/api",
          endpoints: {
            create: "/mdm/properties/add",
            read: "/mdm/properties/:id",
            list: "/mdm/properties",
            update: "/mdm/properties/:id",
            delete: "/mdm/properties/:id"
          }
        }}
        config={config}
        data={data}
        // Goes through RTK Query -> createHybridBaseQuery, so DELETE /mdm/properties/:id becomes
        // the DeleteMdmProperty mutation under GraphQL. The container's apiService fallback is a
        // raw fetch that would always speak REST.
        deleteItem={(id: string) => deleteProperty(id).unwrap()}
        displayModes={["card", "table"]}
        enableDebug={true} // Enable debug mode to troubleshoot
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
        loading={!properties}
        module="unit"
        previewConfig={previewConfig as PreviewConfig<Property & { id: string }>}
        searchFields={["th", "en"]}
        onCreate={() => {
          handlePropertyReset();
          setIsOpen(true);
        }}
        onDelete={handlePropertyDelete}
        onRefresh={() => window.location.reload()}
        renderCard={renderCard as unknown as (item: { id: string }) => React.ReactNode}
      />

      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <Modal
        isOpen={isOpen}
        onClose={() => {
          setIsOpen(false);
          handlePropertyReset();
        }}
        className="max-w-4xl p-6 max-h-[80vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white cursor-default">
            {propertyId && t("crud.property.form.header.update") || t("crud.property.form.header.create")}
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
              {t("crud.property.form.th.label")}
            </label>
            <Input
              id="th"
              placeholder={t("crud.property.form.th.placeholder")}
              value={th}
              onChange={(e) => setTh && setTh(e.target.value)}
            />
            <span className="text-red-500 dark:text-red-400 text-xs">{validationErrors.th}</span>
          </div>
          <div>
            <label htmlFor="en" className="text-sm font-medium text-gray-700 dark:text-gray-200">
              {t("crud.property.form.en.label")}
            </label>
            <Input
              id="en"
              placeholder={t("crud.property.form.en.placeholder")}
              value={en}
              onChange={(e) => setEn && setEn(e.target.value)}
            />
            <span className="text-red-500 dark:text-red-400 text-xs">{validationErrors.en}</span>
          </div>
          <div>
            <Switch
              key={propertyId || "new"}
              label={t("crud.property.form.active.label")}
              defaultChecked={active}
              onChange={setActive}
            />
          </div>
        </div>
        <div className="flex items-center justify-end mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex gap-3">
            <Button onClick={handlePropertyReset} variant="outline">
              {t("crud.property.action.button.reset")}
            </Button>
            <Button
              onClick={() => {
                setIsConfirmOpen(true);
                setIsOpen(false);
              }}
              variant="primary"
            >
              {t("crud.property.action.button.save")}
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
            {propertyId && t("crud.property.confirm.update.title") || t("crud.property.confirm.create.title")}
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
          {propertyId
            && t("crud.property.confirm.update.message").replace("_PROPERTY_", language === "th" && th || en)
            || t("crud.property.confirm.create.message").replace("_PROPERTY_", language === "th" && th || en)
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
              {t("crud.property.confirm.button.cancel")}
            </Button>
            <Button onClick={handlePropertySave} variant="success">
              {loading && t("crud.property.confirm.button.saving") || t("crud.property.confirm.button.confirm")}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default PropertyManagementComponent;
