// src/cms/components/admin/system-configuration/unit/UnitManagement.tsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { EnhancedCrudContainer } from "@/core/components/crud/EnhancedCrudContainer";
import {
  CircleCheck,
  CircleX,
  // MapPinCheck,
  // MapPinX
} from "lucide-react";
import { ToastContainer } from "@/core/components/crud/ToastContainer";
import { usePermissions } from "@/core/hooks/usePermissions";
import { useToast } from "@/core/hooks/useToast";
import { useTranslation } from "@/core/hooks/useTranslation";
import { useGetUserSkillsByUsernameQuery } from "@/core/store/api/userApi";
import { AuthService } from "@/core/utils/authService";
import { formatDate } from "@/core/utils/crud";
import type { PreviewConfig } from "@/core/types/enhanced-crud";
import type { Unit } from "@/cms/types/unit";
import type { UserSkill } from "@/core/types/user";
import UnitCardContent from "@/cms/components/admin/system-configuration/unit/UnitCard";
import Badge from "@/core/components/ui/badge/Badge";

const UnitLocation: React.FC<{
  isOutArea: boolean;
  isLogin: boolean;
}> = ({
  // isOutArea,
  isLogin
}) => {
  // const isOutAreaIcon = isOutArea ? <MapPinX className="w-4 h-4" /> : <MapPinCheck className="w-4 h-4" />;
  // const isOutAreaLabel = isOutArea ? " Out of Area " : " In Area ";
  const isOnlineIcon = isLogin ? <CircleCheck className="w-4 h-4" /> : <CircleX className="w-4 h-4" />;
  const isOnlineLabel = isLogin ? " Online " : " Offline ";
  return (
    <div className="xl:flex items-center justify-start gap-2 text-gray-900 dark:text-white text-sm">
      {/* <span className="flex items-center justify-start gap-1">{isOutAreaIcon} {isOutAreaLabel}</span> */}
      {/* <span className="flex items-center justify-start gap-1">{isOnlineIcon} {isOnlineLabel}</span> */}
      <span className={`flex items-center justify-start gap-1 ${isLogin && "text-green-500 dark:text-green-400" || "text-gray-400 dark:text-gray-500"}`}>
        {isOnlineIcon} {isOnlineLabel}
      </span>
    </div>
  );
}

const UnitStatus: React.FC<{ status: "active" | "inactive" | "online" | "offline" }> = ({ status }) => {
  const { t } = useTranslation();
  return (
    <Badge className={`capitalize text-xs ${status === "active" || status === "online"
      ? "bg-green-200 dark:bg-green-700 text-green-700 dark:text-green-200"
      : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200"
    }`}>
      {status === "active" && t("common.active") || t("common.inactive")}
    </Badge>
  );
}

const UnitManagementComponent: React.FC<{ unit: Unit[] }> = ({ unit }) => {
  const isSystemAdmin = AuthService.isSystemAdmin();
  
  const { language, t } = useTranslation();
  const navigate = useNavigate();
  const permissions = usePermissions();
  const { toasts, addToast, removeToast } = useToast();

  const [selectedUsername, setSelectedUsername] = useState<string | null>(null);
  const [unitsSkills, setUnitsSkills] = useState<UserSkill[] | null>(null);

  // ===================================================================
  // Real Functionality Data
  // ===================================================================

  const { data: usersSkills } = useGetUserSkillsByUsernameQuery(selectedUsername ?? "", { skip: !selectedUsername });

  const data: (Unit & { id: string })[] = unit.map(u => ({
    ...u,
    id: typeof u.id === "string" ? u.id : u.id?.toString?.() ?? u.id?.toString?.() ?? "",
  }));

  useEffect(() => {
    const storage = localStorage || sessionStorage;
    const toastStatus = JSON.parse(storage.getItem("toast") || "{}");
    storage.removeItem("toast");

    if (toastStatus?.status) {
      addToast(toastStatus?.status, toastStatus?.msg || toastStatus?.status);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ===================================================================
  // CRUD Configuration
  // ===================================================================

  const config = {
    entityName: t("crud.unit.name"),
    entityNamePlural: t("crud.unit.name"),
    apiEndpoints: {
      list: "/api/mdm/units",
      create: "/api/mdm/units",
      read: "/api/mdm/units/:id",
      update: "/api/mdm/units/:id",
      delete: "/api/mdm/units/:id"
    },
    columns: [
      {
        key: "unitName",
        label: t("crud.unit.list.header.unit"),
        sortable: true,
        render: (unitItem: Unit) => {
          return (
            <div className={`flex items-center gap-3`}>
              <div>
                <div className="font-medium text-gray-900 dark:text-white">
                  {unitItem?.unitName.trim()}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">
                  {/* {unitItem?.unitId && unitItem?.unitId.trim()}{unitItem?.plateNo && ` • ${unitItem?.plateNo.trim()}`} */}
                  {unitItem?.unitId && unitItem?.unitId.trim()}
                </div>
              </div>
            </div>
          )
        }
      },
      {
        key: "active",
        label: t("crud.unit.list.header.status"),
        sortable: true,
        render: (unitItem: Unit) => <UnitStatus status={unitItem.active ? "active" : "inactive"} />
      },
      {
        key: "location",
        label: t("crud.unit.list.header.location"),
        sortable: true,
        render: (unitItem: Unit) => <UnitLocation isOutArea={unitItem?.isOutArea} isLogin={unitItem?.isLogin} />
      },
      {
        key: "createdAt",
        label: t("common.createAt"),
        sortable: true,
        render: (unitItem: Unit) => <span className="text-gray-800 dark:text-gray-100">{formatDate(unitItem.createdAt || "")}</span>
      },
      {
        key: "createdBy",
        label: t("common.createBy"),
        sortable: true,
        render: (unitItem: Unit) => <span className="text-gray-800 dark:text-gray-100">{unitItem.createdBy}</span>
      }
    ],
    actions: [
      {
        key: "view",
        label: t("crud.common.read"),
        variant: "primary" as const,
        // icon: EyeIcon,
        onClick: (unitItem: Unit) => navigate(`/cms/unit/${unitItem.id}`),
        condition: () => (permissions.hasPermission("unit.view") || isSystemAdmin) as boolean
      },
      {
        key: "update",
        label: t("crud.common.update"),
        variant: "warning" as const,
        // icon: PencilIcon,
        onClick: (unitItem: Unit) => navigate(`/cms/unit/${unitItem.id}/edit`),
        condition: () => (permissions.hasPermission("unit.update") || isSystemAdmin) as boolean
      },
      {
        key: "delete",
        label: t("crud.common.delete"),
        variant: "outline" as const,
        // icon: TrashBinIcon,
        onClick: (unitItem: Unit) => {
          console.log("Delete unit:", unitItem.id);
        },
        condition: () => (permissions.hasPermission("unit.delete") || isSystemAdmin) as boolean
      }
    ]
  };

  // ===================================================================
  // Preview Configuration
  // ===================================================================

  const SkillTab: React.FC<{ unitItem: Unit }> = ({ unitItem }) => {
    useEffect(() => {
      setSelectedUsername(unitItem.username);
    }, [unitItem.username]);

    useEffect(() => {
      setUnitsSkills(usersSkills?.data as unknown as UserSkill[]);
    });

    return (
      <>
        <div className="grid grid-cols-1 gap-4">
          <div className="flex items-start justify-start gap-2">
            <label className="text-sm font-medium text-gray-600 dark:text-gray-300">
              {t("crud.unit.list.preview.tab.current_user")}:
            </label>
            <div className="font-mono text-gray-900 dark:text-white text-sm">
              {unitItem.username}
            </div>
          </div>
          <div className="text-sm">
            {unitsSkills?.length && unitsSkills.map(item => {
              return (
                <Badge key={item.skillId} className="mr-2">{language === "th" && item.th || item.en || item.skillId}</Badge>
              )
            })}
          </div>
        </div>
      </>
    );
  };

  const previewConfig: PreviewConfig<Unit> = {
    title: () => t("crud.unit.list.preview.header"),
    size: "xl",
    enableNavigation: true,
    tabs: [
      {
        key: "basicInfo",
        label: t("crud.unit.list.preview.tab.header.overview"),
        // icon: InfoIcon,
        render: (unitItem: Unit) => {
          return (
            <div className="grid grid-cols-1 gap-4">
              <div className="flex items-start justify-start gap-2">
                <label className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  {t("crud.unit.list.preview.tab.unitId")}:
                </label>
                <div className="font-mono text-gray-900 dark:text-white text-sm">
                  {unitItem.unitId}
                </div>
              </div>
              <div className="flex items-start justify-start gap-2">
                <label className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  {t("crud.unit.list.preview.tab.unitName")}:
                </label>
                <div className="font-mono text-gray-900 dark:text-white text-sm">
                  {unitItem.unitName}
                </div>
              </div>
              {/*
              <div className="flex items-start justify-start gap-2">
                <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Priority:</label>
                <div className="font-mono text-gray-900 dark:text-white text-sm">
                  {unitItem.priority}
                </div>
              </div>
              */}
              <div className="flex items-start justify-start gap-2">
                <label className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  {t("crud.unit.list.preview.tab.active")}:
                </label>
                <UnitStatus status={unitItem.active ? "active" : "inactive"} />
                <UnitLocation isOutArea={unitItem?.isOutArea} isLogin={unitItem?.isLogin} />
              </div>
            </div>
          )
        }
      },
      {
        key: "skill",
        label: t("crud.unit.list.preview.tab.header.skill"),
        // icon: InfoIcon,
        render: (unitItem: Unit) => {
          return (<SkillTab unitItem={unitItem} />)
        }
      },
      {
        key: "location",
        label: t("crud.unit.list.preview.tab.header.location"),
        // icon: MapPin,
        render: (unitItem: Unit) => {
          return (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-300">
                    {t("crud.unit.list.preview.tab.locLat")}:
                  </label>
                  <div className="mt-1 text-sm text-gray-900 dark:text-white font-mono">
                    {unitItem?.locLat?.toFixed(6)}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-300">
                    {t("crud.unit.list.preview.tab.locLon")}:
                  </label>
                  <div className="mt-1 text-sm text-gray-900 dark:text-white font-mono">
                    {unitItem?.locLon?.toFixed(6)}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-300">
                    {t("crud.unit.list.preview.tab.locAccuracy")}:
                  </label>
                  <div className="mt-1 text-sm text-gray-900 dark:text-white font-mono">{unitItem.locAccuracy}{t("crud.unit.unit.accuracy")}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-300">
                    {t("crud.unit.list.preview.tab.locSatellites")}:
                  </label>
                  <div className="mt-1 text-sm text-gray-900 dark:text-white font-mono">{unitItem.locSatellites}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-300">
                    {t("crud.unit.list.preview.tab.locProvider")}:
                  </label>
                  <div className="mt-1 text-sm text-gray-900 dark:text-white font-mono">{unitItem.locProvider}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-300">
                    {t("crud.unit.list.preview.tab.locLastUpdateTime")}:
                  </label>
                  <div className="mt-1 text-sm text-gray-900 dark:text-white font-mono">
                    {/* {unitItem.locLastUpdateTime && new Date(unitItem.locLastUpdateTime).toLocaleString()} */}
                    {unitItem.locLastUpdateTime && formatDate(unitItem.locLastUpdateTime) || ""}
                  </div>
                </div>
              </div>

              <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white">{t("crud.unit.list.preview.tab.locStatus")}</h4>
                  <UnitLocation isOutArea={unitItem?.isOutArea} isLogin={unitItem?.isLogin} />
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  {t("crud.unit.list.preview.tab.locSpeed")}: {unitItem.locSpeed} {t("crud.unit.unit.speed")} • {t("crud.unit.list.preview.tab.locBearing")}: {unitItem.locBearing}°
                </div>
              </div>
            </div>
          )
        }
      }
    ],
    actions: [
      {
        key: "update",
        label: t("crud.common.update"),
        // icon: PencilIcon,
        variant: "warning",
        onClick: (unitItem: Unit, closePreview: () => void) => {
          closePreview();
          navigate(`/cms/unit/${unitItem.id}/edit`);
        },
        condition: () => (permissions.hasPermission("unit.update") || isSystemAdmin) as boolean
      },
      {
        key: "delete",
        label: t("crud.common.delete"),
        // icon: CheckLineIcon,
        variant: "outline",
        onClick: (unitItem: Unit, closePreview: () => void) => {
          closePreview();
          console.log("Delete unit:", unitItem.id);
        },
        condition: () => (permissions.hasPermission("unit.delete") || isSystemAdmin) as boolean
      }
    ]
  };

  // ===================================================================
  // Advanced Filters
  // ===================================================================

  // ===================================================================
  // Bulk Actions
  // ===================================================================

  // ===================================================================
  // Export Options
  // ===================================================================

  // ===================================================================
  // Custom Card Rendering
  // ===================================================================

  const renderCard = (unitItem: Unit) => {
    return <UnitCardContent unit={unitItem as Unit} UnitLocation={UnitLocation} UnitStatus={UnitStatus} />;
  };

  // ===================================================================
  // Event Handlers
  // ===================================================================

  // Handle deletion and other actions
  const handleAction = (actionKey: string, unitItem: Unit) => {
    // Add custom unit-specific action handling
    console.log(`Action ${actionKey} triggered for unit:`, unitItem.id);
  };

  // Handle deletion
  const handleDelete = (id: string) => {
    // Handle unit delete
    console.log("Unit deleted:", id);
    window.location.replace("/cms/unit");
  };

  // ===================================================================
  // Render Component
  // ===================================================================

  return (
    <>
      <EnhancedCrudContainer
        apiConfig={{
          baseUrl: "/api",
          endpoints: {
            create: "/mdm/units",
            read: "/mdm/units/:id",
            list: "/mdm/units",
            update: "/mdm/units/:id",
            delete: "/mdm/units/:id"
          }
        }}
        config={config}
        data={data}
        displayModes={["card", "table"]}
        displayModeDefault="table"
        enableDebug={true} // Enable debug mode to troubleshoot
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
        loading={!unit}
        module="unit"
        previewConfig={previewConfig as PreviewConfig<Unit & { id: string }>}
        searchFields={["unitName", "active", "isOutArea", "isLogin"]}
        onCreate={() => navigate("/cms/unit/create")}
        onDelete={handleDelete}
        onItemAction={handleAction as unknown as (action: string, item: { id: string }) => void}
        onRefresh={() => window.location.reload()}
        renderCard={renderCard as unknown as (item: { id: string }) => React.ReactNode}
      />

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </>
  );
};

export default UnitManagementComponent;
