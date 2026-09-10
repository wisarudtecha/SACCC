// /src/cms/components/admin/system-configuration/device/DeviceManagement.tsx
//
// Cloned from ../place/PlaceManagement.tsx (CAD-FE-Device-Management). Same
// EnhancedCrudContainer scaffold, same embedded AddressMapField coordinate
// picker kept in two-way sync with lat/lon inputs, same two-modal save flow, and
// the same `organization_settings.manage` gate on every in-screen check.
//
// Departures from PlaceManagement:
//   1. `deviceType` is a FREE-TEXT input, not a fixed Select - the field has no
//      backend enum (stakeholder decision 3). The list shows the raw string plus
//      a resolved category badge via `resolveDeviceCategory`.
//   2. Extra hardware fields: model, firmwareVer, ipAddress, macAddress. IP / MAC
//      are optional but format-checked when filled (see ./deviceValidation).
//   3. "Delete" is a SOFT delete - it PATCHes `active: false` rather than issuing
//      a DELETE (there is no DELETE endpoint). `deleteItem` looks the row up in
//      the already-loaded `data` to build the PATCH body.
//   4. The entity key is `deviceId` (there is no separate `id`); it is what the
//      `/devices/:id` create/update path uses.
import React, { Suspense, lazy, useCallback, useMemo, useState } from "react";
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
  useCreateDeviceMutation, useUpdateDeviceMutation
} from "@/cms/store/api/deviceIoT";
import { capitalizeWords } from "@/core/utils/stringFormatters";
import type {
  Device, DeviceCreateData, DeviceManagementProps, DeviceMetrics, DeviceUpdateData
} from "@/cms/types/deviceIoT";
import {
  getDeviceCategoryLabelKey, resolveDeviceCategory
} from "@/cms/components/case/createCase/map/device/deviceSymbols";
import Input from "@/core/components/form/input/InputField";
import Switch from "@/core/components/form/switch/Switch";
import Button from "@/core/components/ui/button/Button";
import Loading from "@/core/components/common/Loading";
import type { AddressResult } from "@/cms/components/case/createCase/map/mapTypes";
import {
  LAT_MIN, LAT_MAX, LON_MIN, LON_MAX,
  isValidCoordinate, isValidIpv4, isValidMacAddress
} from "./deviceValidation";

// Heavy (pulls the map SDK); only loaded when the create/edit modal opens.
const AddressMapField = lazy(() => import("@/cms/components/case/createCase/map/AddressMapField"));

const MANAGE_PERMISSION = "organization_settings.manage";

const EMPTY_ERRORS = {
  th: "", en: "", deviceType: "", latitude: "", longitude: "", ipAddress: "", macAddress: ""
};

/** Build a `DeviceUpdateData` PATCH body from a loaded row, with optional overrides. */
const toDeviceUpdateData = (
  source: Device, overrides: Partial<DeviceUpdateData> = {}
): DeviceUpdateData => ({
  en: source.en ?? "",
  th: source.th ?? "",
  deviceType: source.deviceType ?? "",
  model: source.model ?? "",
  firmwareVer: source.firmwareVer ?? "",
  ipAddress: source.ipAddress ?? "",
  macAddress: source.macAddress ?? "",
  latitude: source.latitude ?? "",
  longitude: source.longitude ?? "",
  active: source.active !== false,
  ...overrides
});

const DeviceManagementComponent: React.FC<DeviceManagementProps> = ({
  devices, isLoading, isError, onRefresh
}) => {
  const isSystemAdmin = useIsSystemAdmin();

  const permissions = usePermissions();
  const { language, t } = useTranslation();
  const { toasts, addToast, removeToast } = useToast();

  const [createDevice] = useCreateDeviceMutation();
  const [updateDevice] = useUpdateDeviceMutation();

  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [deviceId, setDeviceId] = useState("");
  const [active, setActive] = useState(true);
  const [th, setTh] = useState("");
  const [en, setEn] = useState("");
  const [deviceType, setDeviceType] = useState("");
  const [model, setModel] = useState("");
  const [firmwareVer, setFirmwareVer] = useState("");
  const [ipAddress, setIpAddress] = useState("");
  const [macAddress, setMacAddress] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [validationErrors, setValidationErrors] = useState({ ...EMPTY_ERRORS });

  const canManage = permissions.hasPermission(MANAGE_PERMISSION) || isSystemAdmin;

  // The map picker and the two number inputs share `latitude` / `longitude`, so
  // they stay in sync in both directions: `mapValue` is derived from the strings
  // (typing re-pins the map), and `handleMapSelect` writes the strings back.
  const mapValue = useMemo(() => {
    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);
    return Number.isFinite(lat) && Number.isFinite(lon)
      ? { latitude: lat, longitude: lon }
      : null;
  }, [latitude, longitude]);

  const handleMapSelect = useCallback((result: AddressResult) => {
    setLatitude(String(result.latitude));
    setLongitude(String(result.longitude));
    setValidationErrors(prev => ({ ...prev, latitude: "", longitude: "" }));
  }, []);

  const handleMapError = useCallback(() => {
    addToast("error", t("case.display.geocode_failed"));
  }, [addToast, t]);

  const handleDeviceReset = () => {
    setActive(true);
    setDeviceId("");
    setTh("");
    setEn("");
    setDeviceType("");
    setModel("");
    setFirmwareVer("");
    setIpAddress("");
    setMacAddress("");
    setLatitude("");
    setLongitude("");
    setValidationErrors({ ...EMPTY_ERRORS });
    setIsOpen(false);
  };

  const validateError = useCallback((): string[] => {
    const errors: string[] = [];
    const next = { ...EMPTY_ERRORS };

    if (!th.trim()) {
      next.th = t("crud.device.form.th.required");
      errors.push(next.th);
    }
    if (!en.trim()) {
      next.en = t("crud.device.form.en.required");
      errors.push(next.en);
    }
    if (!deviceType.trim()) {
      next.deviceType = t("crud.device.form.deviceType.required");
      errors.push(next.deviceType);
    }
    if (!isValidCoordinate(latitude, LAT_MIN, LAT_MAX)) {
      next.latitude = t("crud.device.form.latitude.required");
      errors.push(next.latitude);
    }
    if (!isValidCoordinate(longitude, LON_MIN, LON_MAX)) {
      next.longitude = t("crud.device.form.longitude.required");
      errors.push(next.longitude);
    }
    if (ipAddress.trim() && !isValidIpv4(ipAddress)) {
      next.ipAddress = t("crud.device.form.ipAddress.invalid");
      errors.push(next.ipAddress);
    }
    if (macAddress.trim() && !isValidMacAddress(macAddress)) {
      next.macAddress = t("crud.device.form.macAddress.invalid");
      errors.push(next.macAddress);
    }

    setValidationErrors(next);
    return errors;
  }, [th, en, deviceType, latitude, longitude, ipAddress, macAddress, t]);

  const handleDeviceSave = useCallback(async () => {
    const errors = validateError();
    if (errors.length > 0) {
      return;
    }
    const data: DeviceCreateData | DeviceUpdateData = {
      en,
      th,
      deviceType,
      model,
      firmwareVer,
      ipAddress,
      macAddress,
      latitude,
      longitude,
      active
    };
    try {
      setLoading(true);
      let response;
      if (canManage) {
        if (deviceId) {
          response = await updateDevice({ id: deviceId, data }).unwrap();
        }
        else {
          response = await createDevice(data).unwrap();
        }
      }
      else {
        throw new Error(t("crud.common.permission_denied"));
      }
      if (response?.status) {
        addToast(
          "success",
          response?.message || response?.desc || response?.msg
          || (deviceId && t("crud.device.action.update.success"))
          || t("crud.device.action.create.success")
        );
        // No window.location.replace: createDevice / updateDevice invalidate the
        // "Device Iot" tag, so the list query re-runs and the row appears/updates
        // in place.
      }
      else {
        throw new Error(response?.desc || response?.msg || t("errors.unknownApi"));
      }
    }
    catch (error) {
      addToast("error", `${(error as { data?: { message?: string } })?.data?.message
        || (error as { data?: { desc?: string } })?.data?.desc
        || (error as { data?: { msg?: string } })?.data?.msg
        || deviceId && t("crud.device.action.update.error") || t("crud.device.action.create.error")}: ${error}`);
    }
    finally {
      setIsOpen(false);
      setIsConfirmOpen(false);
      setLoading(false);
    }
  }, [
    active, addToast, canManage, createDevice, deviceId, deviceType, en, firmwareVer,
    ipAddress, latitude, longitude, macAddress, model, th, t, updateDevice, validateError
  ]);

  const isEditAvailable = () => canManage;
  const isDeleteAvailable = () => canManage;

  // ===================================================================
  // Real Functionality Data
  // ===================================================================

  const data: (Device & { id: string; name: string })[] = useMemo(
    () => devices?.map(d => ({
      ...d,
      id: d.deviceId ?? "",
      name: (language === "th" ? d.th : d.en) || d.th || d.en || d.deviceId || "",
    })) ?? [],
    [devices, language]
  );

  // Soft delete: no DELETE endpoint - look the row up in the loaded data and
  // PATCH `active: false`. EnhancedCrudContainer's deleteItem only passes the id.
  const softDeleteDevice = useCallback((id: string) => {
    const row = data.find(d => d.id === id);
    if (!row) {
      return Promise.reject(new Error(t("errors.unknownApi")));
    }
    return updateDevice({ id, data: toDeviceUpdateData(row, { active: false }) }).unwrap();
  }, [data, updateDevice, t]);

  // ===================================================================
  // Metrics
  // ===================================================================

  const deviceMetrics: DeviceMetrics = useMemo(() => ({
    totalDevices: data.length,
    activeDevices: data.filter(d => d.active !== false).length,
    inactiveDevices: data.filter(d => d.active === false).length,
  }), [data]);

  const attrMetrics = [
    { key: "totalDevices", title: t("crud.device.metrics.total"), icon: GroupIcon, color: "blue", className: "text-blue-600" },
    { key: "activeDevices", title: t("crud.device.metrics.active"), icon: CheckLineIcon, color: "green", className: "text-green-600" },
    { key: "inactiveDevices", title: t("crud.device.metrics.inactive"), icon: TimeIcon, color: "red", className: "text-red-600" },
  ];

  // ===================================================================
  // CRUD Configuration
  // ===================================================================

  const resolveCategoryLabel = (rawType: string): string => {
    const category = resolveDeviceCategory(rawType || "");
    return category
      ? t(getDeviceCategoryLabelKey(category))
      : t("case.display.map_device_category_uncategorized");
  };

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
    entityName: t("crud.device.name"),
    entityNamePlural: t("crud.device.name"),
    apiEndpoints: {
      list: "/devices",
      create: "/devices/add",
      read: "/devices/:id",
      update: "/devices/:id",
      delete: "/devices/:id"
    },
    columns: [
      {
        key: language === "th" && "th" || "en",
        label: t("crud.device.list.header.name"),
        sortable: true,
        render: (deviceItem: Device) =>
          <span className="text-gray-900 dark:text-white">
            {language === "th" && deviceItem.th || capitalizeWords(deviceItem.en || "")} ({language === "th" && capitalizeWords(deviceItem.en || "") || deviceItem.th})
          </span>,
      },
      {
        key: "deviceType",
        label: t("crud.device.list.header.type"),
        sortable: true,
        render: (deviceItem: Device) =>
          <span className="text-gray-700 dark:text-gray-300">
            {deviceItem.deviceType || "-"}
            <span className="ml-2 text-xs text-gray-400 dark:text-gray-500">
              ({resolveCategoryLabel(deviceItem.deviceType)})
            </span>
          </span>,
      },
      {
        key: "status",
        label: t("crud.device.list.header.status"),
        sortable: true,
        render: (deviceItem: Device) => renderStatusBadge(deviceItem.active !== false)
      }
    ],
    actions: [
      {
        key: "update",
        label: t("crud.common.update"),
        variant: "warning" as const,
        onClick: (deviceItem: Device) => {
          setDeviceId(deviceItem.deviceId);
          setActive(deviceItem.active !== false);
          setTh(deviceItem.th ?? "");
          setEn(deviceItem.en ?? "");
          setDeviceType(deviceItem.deviceType ?? "");
          setModel(deviceItem.model ?? "");
          setFirmwareVer(deviceItem.firmwareVer ?? "");
          setIpAddress(deviceItem.ipAddress ?? "");
          setMacAddress(deviceItem.macAddress ?? "");
          setLatitude(deviceItem.latitude ?? "");
          setLongitude(deviceItem.longitude ?? "");
          setValidationErrors({ ...EMPTY_ERRORS });
          setIsOpen(true);
        },
        condition: () => isEditAvailable()
      },
      {
        key: "delete",
        label: t("crud.device.action.button.deactivate"),
        variant: "outline" as const,
        onClick: () => {},
        condition: () => isDeleteAvailable()
      }
    ]
  };

  // ===================================================================
  // Custom Card Rendering
  // ===================================================================

  const renderCard = (deviceItem: Device) => (
    <div className={`xl:flex items-start justify-between mb-4`}>
      <div className="xl:flex items-center gap-3 min-w-0 xl:flex-1">
        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate capitalize">
            {language === "th" && deviceItem.th || capitalizeWords(deviceItem.en || "")} ({language === "th" && capitalizeWords(deviceItem.en || "") || deviceItem.th})
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
            {deviceItem.deviceType || "-"} ({resolveCategoryLabel(deviceItem.deviceType)})
          </p>
          {renderStatusBadge(deviceItem.active !== false)}
        </div>
      </div>
    </div>
  );

  // ===================================================================
  // Render Component
  // ===================================================================

  return (
    <>
      <MetricsView metrics={deviceMetrics} attrMetrics={attrMetrics} />

      <EnhancedCrudContainer
        apiConfig={{
          baseUrl: "/api",
          endpoints: {
            create: "/devices/add",
            read: "/devices/:id",
            list: "/devices",
            update: "/devices/:id",
            delete: "/devices/:id"
          }
        }}
        config={config}
        data={data}
        // "Delete" is a soft delete: updateDevice invalidates the "Device Iot"
        // tag, so the list (and the case-map Device layer) refresh.
        deleteItem={softDeleteDevice}
        displayModes={["card", "table"]}
        // Whole route is gated by organization_settings.manage; gate the create
        // button and every row action on the same string.
        actionPermission={MANAGE_PERMISSION}
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
        searchFields={["th", "en", "deviceType", "model"]}
        onCreate={() => {
          handleDeviceReset();
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
          handleDeviceReset();
        }}
        className="max-w-4xl p-6 max-h-[80vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white cursor-default">
            {deviceId && t("crud.device.form.header.update") || t("crud.device.form.header.create")}
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="th" className="text-sm font-medium text-gray-700 dark:text-gray-200">
                {t("crud.device.form.th.label")}
              </label>
              <Input
                id="th"
                placeholder={t("crud.device.form.th.placeholder")}
                value={th}
                onChange={(e) => setTh(e.target.value)}
              />
              <span className="text-red-500 dark:text-red-400 text-xs">{validationErrors.th}</span>
            </div>
            <div>
              <label htmlFor="en" className="text-sm font-medium text-gray-700 dark:text-gray-200">
                {t("crud.device.form.en.label")}
              </label>
              <Input
                id="en"
                placeholder={t("crud.device.form.en.placeholder")}
                value={en}
                onChange={(e) => setEn(e.target.value)}
              />
              <span className="text-red-500 dark:text-red-400 text-xs">{validationErrors.en}</span>
            </div>
          </div>
          <div>
            <label htmlFor="deviceType" className="text-sm font-medium text-gray-700 dark:text-gray-200">
              {t("crud.device.form.deviceType.label")}
            </label>
            <Input
              id="deviceType"
              placeholder={t("crud.device.form.deviceType.placeholder")}
              value={deviceType}
              onChange={(e) => setDeviceType(e.target.value)}
            />
            <span className="text-xs text-gray-500 dark:text-gray-400 block">
              {t("crud.device.form.deviceType.hint")}
            </span>
            <span className="text-red-500 dark:text-red-400 text-xs">{validationErrors.deviceType}</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="model" className="text-sm font-medium text-gray-700 dark:text-gray-200">
                {t("crud.device.form.model.label")}
              </label>
              <Input
                id="model"
                placeholder={t("crud.device.form.model.placeholder")}
                value={model}
                onChange={(e) => setModel(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="firmwareVer" className="text-sm font-medium text-gray-700 dark:text-gray-200">
                {t("crud.device.form.firmwareVer.label")}
              </label>
              <Input
                id="firmwareVer"
                placeholder={t("crud.device.form.firmwareVer.placeholder")}
                value={firmwareVer}
                onChange={(e) => setFirmwareVer(e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="ipAddress" className="text-sm font-medium text-gray-700 dark:text-gray-200">
                {t("crud.device.form.ipAddress.label")}
              </label>
              <Input
                id="ipAddress"
                placeholder={t("crud.device.form.ipAddress.placeholder")}
                value={ipAddress}
                onChange={(e) => setIpAddress(e.target.value)}
              />
              <span className="text-red-500 dark:text-red-400 text-xs">{validationErrors.ipAddress}</span>
            </div>
            <div>
              <label htmlFor="macAddress" className="text-sm font-medium text-gray-700 dark:text-gray-200">
                {t("crud.device.form.macAddress.label")}
              </label>
              <Input
                id="macAddress"
                placeholder={t("crud.device.form.macAddress.placeholder")}
                value={macAddress}
                onChange={(e) => setMacAddress(e.target.value)}
              />
              <span className="text-red-500 dark:text-red-400 text-xs">{validationErrors.macAddress}</span>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
              {t("crud.device.form.coordinate.label")}
            </label>
            <div className="mt-1">
              <Suspense fallback={<Loading />}>
                <AddressMapField
                  value={mapValue}
                  onSelect={handleMapSelect}
                  onError={handleMapError}
                  readOnly={false}
                  height={360}
                  showExpand={false}
                />
              </Suspense>
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {t("crud.device.form.coordinate.hint")}
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="latitude" className="text-sm font-medium text-gray-700 dark:text-gray-200">
                {t("crud.device.form.latitude.label")}
              </label>
              <Input
                id="latitude"
                type="number"
                step={0.000001}
                placeholder={t("crud.device.form.latitude.placeholder")}
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
              />
              <span className="text-red-500 dark:text-red-400 text-xs">{validationErrors.latitude}</span>
            </div>
            <div>
              <label htmlFor="longitude" className="text-sm font-medium text-gray-700 dark:text-gray-200">
                {t("crud.device.form.longitude.label")}
              </label>
              <Input
                id="longitude"
                type="number"
                step={0.000001}
                placeholder={t("crud.device.form.longitude.placeholder")}
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
              />
              <span className="text-red-500 dark:text-red-400 text-xs">{validationErrors.longitude}</span>
            </div>
          </div>
          <div>
            <Switch
              key={deviceId || "new"}
              label={t("crud.device.form.active.label")}
              defaultChecked={active}
              onChange={setActive}
            />
          </div>
        </div>
        <div className="flex items-center justify-end mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex gap-3">
            <Button onClick={handleDeviceReset} variant="outline">
              {t("crud.device.action.button.reset")}
            </Button>
            <Button
              onClick={() => {
                setIsConfirmOpen(true);
                setIsOpen(false);
              }}
              variant="primary"
            >
              {t("crud.device.action.button.save")}
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
            {deviceId && t("crud.device.confirm.update.title") || t("crud.device.confirm.create.title")}
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
          {deviceId
            && t("crud.device.confirm.update.message").replace("_DEVICE_", language === "th" && th || en)
            || t("crud.device.confirm.create.message").replace("_DEVICE_", language === "th" && th || en)
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
              {t("crud.device.confirm.button.cancel")}
            </Button>
            <Button onClick={handleDeviceSave} variant="success">
              {loading && t("crud.device.confirm.button.saving") || t("crud.device.confirm.button.confirm")}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default DeviceManagementComponent;
