// src/cms/components/admin/system-configuration/skill/SkillManagement.tsx
import React, { useCallback, useState } from "react";
import { CloseIcon, CheckLineIcon, CloseLineIcon, TimeIcon } from "@/core/icons";
import { EnhancedCrudContainer } from "@/core/components/crud/EnhancedCrudContainer";
import { ToastContainer } from "@/core/components/crud/ToastContainer";
import { Modal } from "@/core/components/ui/modal";
import { usePermissions } from "@/core/hooks/usePermissions";
import { useIsSystemAdmin } from "@/core/hooks/useIsSystemAdmin";
import { useToast } from "@/core/hooks/useToast";
import { useTranslation } from "@/core/hooks/useTranslation";
import { useCreateSkillMutation, useUpdateSkillMutation } from "@/cms/store/api/skillApi";
// import { AuthService } from "@/cms/utils/authService";
import { capitalizeWords } from "@/core/utils/stringFormatters";
import type { PreviewConfig } from "@/core/types/enhanced-crud";
import type { Skill, SkillCreateData, SkillManagementProps, SkillUpdateData } from "@/cms/types/skill";
import Input from "@/core/components/form/input/InputField";
import Button from "@/core/components/ui/button/Button";

const SkillManagementComponent: React.FC<SkillManagementProps> = ({ skills }) => {
  // const isSystemAdmin = AuthService.isSystemAdmin();
  const isSystemAdmin = useIsSystemAdmin();

  const permissions = usePermissions();
  const { language, t } = useTranslation();
  const { toasts, addToast, removeToast } = useToast();

  const [createSkill] = useCreateSkillMutation();
  const [updateSkill] = useUpdateSkillMutation();

  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [skillId, setSkillId] = useState("");
  const [active, setActive] = useState(true);
  const [th, setTh] = useState("");
  const [en, setEn] = useState("");
  const [validationErrors, setValidationErrors] = useState({ th: "", en: "" });

  const handleSkillReset = () => {
    setActive(true);
    setSkillId("");
    setTh("");
    setEn("");
    setIsOpen(false);
  }

  const validateError = useCallback((): string[] => {
    const errors: string[] = [];
    if (!th.trim()) {
      errors.push(t("crud.skill.form.th.required"));
      setValidationErrors(prev => ({ ...prev, th: t("crud.skill.form.th.required") }));
    }
    if (!en.trim()) {
      errors.push(t("crud.skill.form.en.required"));
      setValidationErrors(prev => ({ ...prev, en: t("crud.skill.form.en.required") }));
    }
    return errors;
  }, [th, en, t]);

  const handleSkillSave = useCallback(async () => {
    const errors = validateError();
    if (errors.length > 0) {
      return; // Don"t save if there are validation errors
    }
    const data: SkillCreateData | SkillUpdateData = {
      active: active,
      th: th,
      en: en
    };
    try {
      // console.log("🚀 ~ SkillManagementComponent ~ handleSkillSave - id:", skillId, "data:", data);
      // throw new Error("");

      setLoading(true);
      let response;
      if (permissions.hasAnyPermission(["unit.create", "unit.update"])) {
        if (skillId) {
          response = await updateSkill({
            id: skillId, data: data
          }).unwrap();
        }
        else {
          response = await createSkill(data).unwrap();
        }
      }
      else {
        throw new Error(t("crud.common.permission_denied"));
      }
      if (response?.status) {
        // addToast("success", `Skill Management: ${response?.desc || response?.msg || "Save successfully"}`);
        addToast("success", response?.message || response?.desc || response?.msg || (skillId && t("crud.skill.action.update.success")) || t("crud.skill.action.create.success"));
        setTimeout(() => {
          window.location.replace(`/cms/skill`);
        }, 1000);
      }
      else {
        throw new Error(response?.desc || response?.msg || t("errors.unknownApi"));
      }
    }
    catch (error) {
      // addToast("error", `Skill Management: ${error}`);
      addToast("error", `${(error as { data?: { message?: string } })?.data?.message
        || (error as { data?: { desc?: string } })?.data?.desc
        || (error as { data?: { msg?: string } })?.data?.msg
        || skillId && t("crud.skill.action.update.error") || t("crud.skill.action.create.error")}: ${error}`);
    }
    finally {
      setIsOpen(false);
      setIsConfirmOpen(false);
      setLoading(false);
    }
  }, [
    active, addToast, createSkill, en, permissions, skillId, th, t, updateSkill, validateError
  ]);

  const isDeleteAvailable = () => {
    // const canDelete = permissions.hasPermission("settings.delete");
    const canDelete = permissions.hasPermission("unit.delete");
    // console.log("🚀 ~ isDeleteAvailable ~ canDelete:", canDelete);
    return canDelete || isSystemAdmin;
  }

  const isEditAvailable = () => {
    // const canEdit = permissions.hasPermission("settings.update");
    const canEdit = permissions.hasPermission("unit.update");
    // console.log("🚀 ~ isEditAvailable ~ canEdit:", canEdit);
    return canEdit || isSystemAdmin;
  }

  const isViewAvailable = () => {
    // const canView = permissions.hasPermission("settings.view");
    const canView = permissions.hasPermission("unit.view");
    // console.log("🚀 ~ isDeleteAvailable ~ canView:", canView);
    return canView || isSystemAdmin;
  }

  // ===================================================================
  // Mock Data
  // ===================================================================

  // ===================================================================
  // Real Functionality Data
  // ===================================================================

  const data: (Skill & { id: string })[] = skills?.map(s => ({
    ...s,
    id: typeof s.skillId === "string" ? s.skillId : s.skillId ?? s.id?.toString?.() ?? "",
  })) ?? [];

  // ===================================================================
  // CRUD Configuration
  // ===================================================================

  const config = {
    entityName: t("crud.skill.name"),
    entityNamePlural: t("crud.skill.name"),
    apiEndpoints: {
      list: "/api/skill",
      create: "/api/skill",
      read: "/api/skill/:id",
      update: "/api/skill/:id",
      delete: "/api/skill/:id",
      bulkDelete: "/api/skill/bulk",
      export: "/api/skill/export"
    },
    columns: [
      {
        key: language === "th" && "th" || "en",
        label: t("crud.skill.list.header.name"),
        sortable: true,
        render: (skillItem: Skill) => 
          <span className="text-gray-900 dark:text-white">
            {language === "th" && skillItem.th || capitalizeWords(skillItem.en || "")} ({language === "th" && capitalizeWords(skillItem.en || "") || skillItem.th})
          </span>,
      },
      {
        key: "status",
        label: t("crud.skill.list.header.status"),
        sortable: true,
        render: (skillItem: Skill) => {
          const statusConfig = skillItem.active
            ? { color: "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100", icon: CheckLineIcon }
            : { color: "bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100", icon: TimeIcon };
          const Icon = statusConfig.icon;
          return (
            <span className={`items-center px-2 py-1 rounded-full text-xs font-medium capitalize ${statusConfig.color}`}>
              <Icon className="w-4 h-4 inline mr-1" />
              {skillItem.active ? t("common.active") : t("common.inactive")}
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
        onClick: (skillItem: Skill) => {
          setSkillId(skillItem.skillId);
          setActive(skillItem.active);
          setTh(skillItem.th);
          setEn(skillItem.en);
          setIsOpen(true);
        },
        condition: () => isEditAvailable()
      },
      {
        key: "delete",
        label: t("crud.common.delete"),
        variant: "outline" as const,
        onClick: (skillItem: Skill) => {
          console.log("Delete skill:", skillItem.skillId);
        },
        condition: () => isDeleteAvailable()
      }
    ]
  };

  // ===================================================================
  // Preview Configuration
  // ===================================================================

  const previewConfig: PreviewConfig<
    Skill
  > = {
    title: () => t("crud.skill.list.preview.header"),
    size: "xl",
    enableNavigation: true,
    tabs: [
      {
        key: "overview",
        label: "",
        // icon: InfoIcon,
        fields: [
          {
            key: language === "th" && "th" || "en",
            label: t("crud.skill.list.header.name"),
            type: "custom" as const,
            render: (_, skillItem: Skill) => 
              <span className="text-gray-900 dark:text-white">
                {language === "th" && skillItem.th || capitalizeWords(skillItem.en || "")} ({language === "th" && capitalizeWords(skillItem.en || "") || skillItem.th})
              </span>,
          },
          {
            key: "active",
            label: t("crud.skill.list.header.status"),
            type: "custom",
            render: value => {
              const statusConfig = value
                ? { color: "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100", icon: CheckLineIcon }
                : { color: "bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100", icon: TimeIcon };
              const Icon = statusConfig.icon;
              return (
                <span className={`items-center px-2 py-1 rounded-full text-xs font-medium capitalize ${statusConfig.color}`}>
                  <Icon className="w-4 h-4 inline mr-1" />
                  {/* {value ? "Active" : "Inactive"} */}
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
        // icon: PencilIcon,
        variant: "warning",
        onClick: (skillItem: Skill) => {
          setSkillId(skillItem.skillId);
          setActive(skillItem.active);
          setTh(skillItem.th);
          setEn(skillItem.en);
          setIsOpen(true);
        },
        condition: () => isEditAvailable()
      },
      // {
      //   key: "delete",
      //   label: "Delete",
      //   // icon: CheckLineIcon,
      //   variant: "outline",
      //   onClick: (skillItem: Skill, closePreview: () => void) => {
      //     console.log("🚀 ~ SkillManagementComponent ~ skillItem:", skillItem);
      //     closePreview();
      //     // console.log("Delete skill:", skillItem.skillId);
      //   },
      //   condition: () => isDeleteAvailable()
      // }
    ]
  };

  // ===================================================================
  // Advanced Filters
  // ===================================================================

  // const advancedFilters = [{}];

  // ===================================================================
  // Bulk Actions
  // ===================================================================

  // ===================================================================
  // Export Options
  // ===================================================================

  // ===================================================================
  // Custom Card Rendering
  // ===================================================================

  const renderCard = (skillItem: Skill) => {
    const statusConfig = skillItem.active
        ? { color: "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100", icon: CheckLineIcon }
        : { color: "bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100", icon: CloseLineIcon };
      const Icon = statusConfig.icon;

    return (
      <div className={`xl:flex items-start justify-between mb-4`}>
        <div className="xl:flex items-center gap-3 min-w-0 xl:flex-1">
          <div className="min-w-0 flex-1">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate capitalize">
              {/* {skillItem.th.trim()} ({skillItem.en.trim()}) */}
              {language === "th" && skillItem.th || capitalizeWords(skillItem.en || "")} ({language === "th" && capitalizeWords(skillItem.en || "") || skillItem.th})
            </h3>
            <span className={`items-center px-2 py-1 rounded-full text-xs font-medium capitalize ${statusConfig.color}`}>
              <Icon className="w-4 h-4 inline mr-1" />
              {/* {skillItem.active ? "Active" : "Inactive"} */}
              {skillItem.active ? t("common.active") : t("common.inactive")}
            </span>
          </div>
        </div>
      </div>
    );
  };

  // ===================================================================
  // Event Handlers
  // ===================================================================

  // Handle deletion and other actions
  const handleAction = (actionKey: string, skillItem: Skill) => {
    // Add custom skill-specific action handling
    console.log(`Action ${actionKey} triggered for skill:`, skillItem.skillId);

  };

  // Handle deletion
  const handleDelete = (skillId: string) => {
    // Handle skill delete
    console.log("Skill deleted:", skillId);
    setTimeout(() => {
      window.location.replace(`/cms/skill`);
    }, 1000);
  };

  // ===================================================================
  // Render Component
  // ===================================================================

  return (
    <>
      <EnhancedCrudContainer
        advancedFilters={[]}
        apiConfig={{
          baseUrl: "/api",
          endpoints: {
            create: "/skill",
            read: "/skill/:id",
            list: "/skill",
            update: "/skill/:id",
            delete: "/skill/:id",
            bulkDelete: "/skill/bulk",
            export: "/skill/export"
          }
        }}
        // bulkActions={bulkActions}
        // config={config as unknown as CrudConfig<{ id: string; }>}
        config={config}
        // data={skills as unknown as { id: string }[]}
        data={data}
        displayModes={["card", "table"]}
        enableDebug={true} // Enable debug mode to troubleshoot
        // error={null}
        // exportOptions={exportOptions}
        features={{
          bulkActions: false,
          export: false,
          filtering: true,
          keyboardShortcuts: true,
          pagination: true,
          realTimeUpdates: false, // Disabled for demo
          search: true,
          sorting: true,
        }}
        // keyboardShortcuts={[]}
        loading={!skills}
        // module="skill"
        // module="settings"
        module="unit"
        // previewConfig={previewConfig as unknown as PreviewConfig<{ id: string }>}
        previewConfig={previewConfig as PreviewConfig<Skill & { id: string }>}
        searchFields={["th", "en"]}
        // customFilterFunction={() => true}
        onCreate={() => {
          handleSkillReset();
          setIsOpen(true);
        }}
        onDelete={handleDelete}
        onItemAction={handleAction as unknown as (action: string, item: { id: string }) => void}
        // onItemClick={(item) => navigate(`/cms/skill/${item.id}`)}
        onRefresh={() => window.location.reload()}
        // onUpdate={() => {}}
        renderCard={renderCard as unknown as (item: { id: string }) => React.ReactNode}
      />

      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <Modal
        isOpen={isOpen}
        onClose={() => {
          setIsOpen(false);
          handleSkillReset();
        }}
        className="max-w-4xl p-6 max-h-[80vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white cursor-default">
            {skillId && t("crud.skill.form.header.update") || t("crud.skill.form.header.create")}
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
              {t("crud.skill.form.th.label")}
            </label>
            <Input
              id="th"
              placeholder={t("crud.skill.form.th.placeholder")}
              value={th}
              onChange={(e) => setTh && setTh(e.target.value)}
            />
            <span className="text-red-500 dark:text-red-400 text-xs">{validationErrors.th}</span>
          </div>
          <div>
            <label htmlFor="en" className="text-sm font-medium text-gray-700 dark:text-gray-200">
              {t("crud.skill.form.en.label")}
            </label>
            <Input
              id="en"
              placeholder={t("crud.skill.form.en.placeholder")}
              value={en}
              onChange={(e) => setEn && setEn(e.target.value)}
            />
            <span className="text-red-500 dark:text-red-400 text-xs">{validationErrors.en}</span>
          </div>
        </div>
        <div className="flex items-center justify-end mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex gap-3">
            <Button onClick={handleSkillReset} variant="outline">
              {t("crud.skill.action.button.reset")}
            </Button>
            <Button
              onClick={() => {
                setIsConfirmOpen(true);
                setIsOpen(false);
              }}
              variant="primary"
            >
              {t("crud.skill.action.button.save")}
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
            {skillId && t("crud.skill.confirm.update.title") || t("crud.skill.confirm.create.title")}
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
          {skillId
            && t("crud.skill.confirm.update.message").replace("_SKILL_", language === "th" && th || en)
            || t("crud.skill.confirm.create.message").replace("_SKILL_", language === "th" && th || en)
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
              {t("crud.skill.confirm.button.cancel")}
            </Button>
            <Button onClick={handleSkillSave} variant="success">
              {loading && t("crud.skill.confirm.button.saving") || t("crud.skill.confirm.button.confirm")}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default SkillManagementComponent;
