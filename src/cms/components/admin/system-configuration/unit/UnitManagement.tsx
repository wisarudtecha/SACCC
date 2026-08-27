// src/cms/components/admin/system-configuration/unit/UnitManagement.tsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
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
import { useSyncPreviewedIdentity } from "@/core/hooks/useSyncPreviewedIdentity";
import { useToast } from "@/core/hooks/useToast";
import { useTranslation } from "@/core/hooks/useTranslation";
import { useGetUserSkillsByUsernameQuery } from "@/core/store/api/userApi";
import { useBulkAssignUnitPropertiesMutation, useGetUnitPropertiesQuery } from "@/cms/store/api/unitApi";
import { isApiSuccess, resolveApiError, resolveApiMessage } from "@/cms/utils/apiResponse";
import { AuthService } from "@/core/utils/authService";
import { formatDate } from "@/core/utils/crud";
import type { PreviewConfig } from "@/core/types/enhanced-crud";
import type { Property, Unit, UnitProperty } from "@/cms/types/unit";
import type { UserSkill } from "@/core/types/user";
import PropertyMatrixContent from "@/cms/components/admin/system-configuration/unit/PropertyMatrixView";
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

// Both preview tabs MUST stay at module scope. Declared inside UnitManagementComponent they
// would be a new function object on every render, and React compares element.type by
// reference - so each parent state change (e.g. toggling a property) would unmount and
// remount the whole tab instead of updating it, visibly flickering and discarding the
// child's state. Everything they need is passed in explicitly.

// Read-only: skills belong to the USER assigned to the unit and are edited in User
// Management. The shared query is repointed through useSyncPreviewedIdentity rather than a
// bare effect, so a remount with an unchanged user stays a no-op.
const UnitSkillTab: React.FC<{
  isFetching: boolean;
  skills: UserSkill[];
  trackedUsername: string;
  unitItem: Unit;
  onUsernameChange: (username: string) => void;
}> = ({
  isFetching,
  skills,
  trackedUsername,
  unitItem,
  onUsernameChange
}) => {
  const { language, t } = useTranslation();

  useSyncPreviewedIdentity(unitItem.username, trackedUsername, onUsernameChange);

  // Until the shared query has actually been pointed at this unit user, skills still holds
  // the previously previewed unit skills - treat that as "still loading". A unit with no
  // user at all simply has none.
  const hasUser = Boolean(unitItem.username);
  const isReady = hasUser && unitItem.username === trackedUsername;
  const isLoading = hasUser && (!isReady || isFetching);
  const visibleSkills = (isReady && !isFetching) ? skills : [];

  return (
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
        {isLoading && (
          <span className="text-gray-500 dark:text-gray-400">
            {t("crud.common.loading_records")}
          </span>
        )}
        {!isLoading && visibleSkills.length === 0 && (
          <span className="text-gray-500 dark:text-gray-400">
            {t("crud.common.empty_table")}
          </span>
        )}
        {!isLoading && visibleSkills.map(item => (
          <Badge key={item.skillId} className="mr-2">
            {language === "th" && item.th || item.en || item.skillId}
          </Badge>
        ))}
      </div>
    </div>
  );
};

// The unit-property relationship IS editable: BulkAssignUnitProperties replaces the whole
// set. Both the read and the write key on the unitId business code (e.g. "UNIT-001").
const UnitPropertyTab: React.FC<{
  canEdit: boolean;
  isFetching: boolean;
  loading: boolean;
  properties: Property[];
  propertyList: string[];
  trackedUnitId: string;
  unitItem: Unit;
  unitProperties: UnitProperty[];
  onSave: () => void;
  onToggle: (propId: string) => void;
  onUnitChange: (unitId: string) => void;
}> = ({
  canEdit,
  isFetching,
  loading,
  properties,
  propertyList,
  trackedUnitId,
  unitItem,
  unitProperties,
  onSave,
  onToggle,
  onUnitChange
}) => {
  const { t } = useTranslation();

  // Same staleness guard as the Skills tab: unitProperties belongs to whichever unit the
  // shared query is currently pointed at, which lags one render behind on navigation.
  const hasUnitId = Boolean(unitItem.unitId);
  const isReady = hasUnitId && unitItem.unitId === trackedUnitId;
  const isLoading = hasUnitId && (!isReady || isFetching);
  // Gated on isReady, not on !isLoading: a unit with a blank unitId is never "loading"
  // (nothing will ever be fetched for it), and must show nothing rather than whatever the
  // shared query happens to hold for another unit.
  const visibleProperties = (isReady && !isFetching) ? unitProperties : [];

  return (
    <div className="grid grid-cols-1 gap-4">
      <div className="flex items-start justify-start gap-2">
        <label className="text-sm font-medium text-gray-600 dark:text-gray-300">
          {t("crud.unit.list.preview.tab.current_user")}:
        </label>
        <div className="font-mono text-gray-900 dark:text-white text-sm">
          {unitItem.username}
        </div>
      </div>
      <PropertyMatrixContent
        assigned={visibleProperties}
        canEdit={canEdit}
        isFetching={isLoading}
        loading={loading}
        properties={properties}
        propertyList={propertyList}
        trackedUnitId={trackedUnitId}
        unitId={unitItem.unitId}
        handleUnitPropertiesSave={onSave}
        onUnitChange={onUnitChange}
        onUnitPropertiesToggle={onToggle}
      />
    </div>
  );
};

const UnitManagementComponent: React.FC<{
  unit: Unit[];
  properties: Property[];
}> = ({ unit, properties }) => {
  const isSystemAdmin = AuthService.isSystemAdmin();
  
  // language now lives with the hoisted tabs, which call useTranslation themselves.
  const { t } = useTranslation();
  const navigate = useNavigate();
  const permissions = usePermissions();
  const { toasts, addToast, removeToast } = useToast();

  // Identity of the record the preview modal is currently showing. PreviewDialog unmounts a
  // tab body on every tab switch, so this baseline has to live here rather than in the tab
  // (see useSyncPreviewedIdentity) - local state there could not tell a genuine record change
  // from a same-record remount.
  const [selectedUsername, setSelectedUsername] = useState<string>("");
  const [selectedUnitId, setSelectedUnitId] = useState<string>("");
  const [propertyIds, setPropertyIds] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // ===================================================================
  // Real Functionality Data
  // ===================================================================

  // Both of these read `currentData`, NOT `data`. RTK Query defines `data` as the latest
  // result *regardless of hook arg*: when the previewed record changes, `data` keeps serving
  // the PREVIOUS record's payload until the new arg yields a successful one - and if it never
  // does (the BFF answers an empty set with a failure envelope, which hybridBaseQuery turns
  // into an RTK error) it keeps serving it forever. That is how a unit with no properties
  // ended up showing the previously viewed unit's. `currentData` is scoped to the current
  // arg and is undefined until that arg itself resolves, which is the semantics wanted here.
  const { currentData: usersSkills, isFetching: isFetchingUnitSkills } = useGetUserSkillsByUsernameQuery(
    selectedUsername, { skip: !selectedUsername }
  );
  const unitSkills = useMemo(
    () => (usersSkills?.data as unknown as UserSkill[]) || [],
    [usersSkills?.data]
  );

  const { currentData: unitPropertiesData, isFetching: isFetchingUnitProperties } = useGetUnitPropertiesQuery(
    { id: selectedUnitId }, { skip: !selectedUnitId }
  );
  const unitProperties = useMemo(
    () => (unitPropertiesData?.data as unknown as UnitProperty[]) || [],
    [unitPropertiesData?.data]
  );

  const [bulkAssignUnitProperties] = useBulkAssignUnitPropertiesMutation();

  // Seed the editable selection from whatever the server currently has assigned.
  useEffect(() => {
    setPropertyIds(unitProperties.map(item => item.propId));
  }, [unitProperties]);

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
  // Unit Property Assignment
  // ===================================================================

  const canAssignProperties = (permissions.hasPermission("unit.update") || isSystemAdmin) as boolean;

  // Fires once when the previewed unit genuinely changes: repoint the unit-scoped query and
  // drop the previous selection until the seed effect above catches up.
  const handleUnitPropertiesUnitChange = useCallback((unitId: string) => {
    setSelectedUnitId(unitId);
    setPropertyIds([]);
  }, []);

  const handleUnitPropertiesToggle = useCallback((propId: string) => {
    setPropertyIds(prev =>
      prev.includes(propId)
        ? prev.filter(id => id !== propId)
        : [...prev, propId]
    );
  }, []);

  const handleUnitPropertiesSave = async () => {
    try {
      if (!canAssignProperties) {
        throw new Error(t("crud.common.permission_denied"));
      }
      setLoading(true);
      // BulkAssignUnitProperties replaces the whole set, keyed on the same unitId business
      // code the read uses - so it invalidates exactly the tag that query provides.
      const response = await bulkAssignUnitProperties({
        id: selectedUnitId,
        propIds: propertyIds
      }).unwrap();
      if (!isApiSuccess(response)) {
        throw new Error(resolveApiError(response, t("errors.unknownApi")));
      }
      addToast("success", resolveApiMessage(response, t("crud.unit.list.property.update.success")));
    }
    catch (error) {
      addToast("error", resolveApiError(error, t("crud.unit.list.property.update.error")));
    }
    finally {
      setLoading(false);
    }
  };

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
        render: (unitItem: Unit) => (
          <UnitSkillTab
            isFetching={isFetchingUnitSkills}
            skills={unitSkills}
            trackedUsername={selectedUsername}
            unitItem={unitItem}
            onUsernameChange={setSelectedUsername}
          />
        )
      },
      {
        key: "property",
        label: t("crud.unit.list.preview.tab.header.property"),
        render: (unitItem: Unit) => (
          <UnitPropertyTab
            canEdit={canAssignProperties}
            isFetching={isFetchingUnitProperties}
            loading={loading}
            properties={properties}
            propertyList={propertyIds}
            trackedUnitId={selectedUnitId}
            unitItem={unitItem}
            unitProperties={unitProperties}
            onSave={handleUnitPropertiesSave}
            onToggle={handleUnitPropertiesToggle}
            onUnitChange={handleUnitPropertiesUnitChange}
          />
        )
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
