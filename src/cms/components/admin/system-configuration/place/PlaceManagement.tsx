// /src/components/admin/system-configuration/place/PlaceManagement.tsx
//
// Cloned from ../property/PropertyManagement.tsx. Three deliberate departures:
//   1. adds a fixed `category` Select, an embedded AddressMapField coordinate
//      picker, and lat/lon number inputs kept in two-way sync with it;
//   2. relies on the "Place" RTK cache tag (placesApi) to refresh the list after
//      a mutation, instead of window.location.replace;
//   3. every in-screen permission check uses `organization_settings.manage`
//      (ticket Q3) - there is no per-entity `place.*` permission family.
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
  useCreatePlaceMutation, useDeletePlaceMutation, useUpdatePlaceMutation
} from "@/cms/store/api/placesApi";
import { capitalizeWords } from "@/core/utils/stringFormatters";
import {
  PLACE_CATEGORIES
} from "@/cms/types/place";
import type {
  Place, PlaceCategory, PlaceManagementProps, PlaceMetrics, PlaceUpdateData
} from "@/cms/types/place";
import type { PreviewConfig } from "@/core/types/enhanced-crud";
import Input from "@/core/components/form/input/InputField";
import Select from "@/core/components/form/Select";
import Switch from "@/core/components/form/switch/Switch";
import Button from "@/core/components/ui/button/Button";
import Loading from "@/core/components/common/Loading";
import type { AddressResult } from "@/cms/components/case/createCase/map/mapTypes";

// Heavy (pulls the map SDK); only loaded when the create/edit modal opens.
const AddressMapField = lazy(() => import("@/cms/components/case/createCase/map/AddressMapField"));

const MANAGE_PERMISSION = "organization_settings.manage";
const LAT_MIN = -90;
const LAT_MAX = 90;
const LON_MIN = -180;
const LON_MAX = 180;

const isValidCoordinate = (raw: string, min: number, max: number): boolean => {
  if (!raw.trim()) {
    return false;
  }
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed >= min && parsed <= max;
};

const PlaceManagementComponent: React.FC<PlaceManagementProps> = ({
  places, isLoading, isError, onRefresh
}) => {
  const isSystemAdmin = useIsSystemAdmin();

  const permissions = usePermissions();
  const { language, t } = useTranslation();
  const { toasts, addToast, removeToast } = useToast();

  const [createPlace] = useCreatePlaceMutation();
  const [updatePlace] = useUpdatePlaceMutation();
  const [deletePlace] = useDeletePlaceMutation();

  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [placeId, setPlaceId] = useState("");
  const [active, setActive] = useState(true);
  const [th, setTh] = useState("");
  const [en, setEn] = useState("");
  const [category, setCategory] = useState<PlaceCategory | "">("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [validationErrors, setValidationErrors] = useState({
    th: "", en: "", category: "", latitude: "", longitude: ""
  });

  const canManage = permissions.hasPermission(MANAGE_PERMISSION) || isSystemAdmin;

  const categoryOptions = useMemo(
    () => PLACE_CATEGORIES.map(value => ({
      value,
      label: t(`case.display.map_place_category_${value}`)
    })),
    [t]
  );

  // The map picker and the two number inputs both read/write `latitude` /
  // `longitude`, so they stay in sync in both directions for free: `mapValue` is
  // derived from the strings (typing re-pins the map), and `handleMapSelect`
  // writes the strings back (clicking/searching fills the inputs).
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

  const handlePlaceReset = () => {
    setActive(true);
    setPlaceId("");
    setTh("");
    setEn("");
    setCategory("");
    setLatitude("");
    setLongitude("");
    setValidationErrors({ th: "", en: "", category: "", latitude: "", longitude: "" });
    setIsOpen(false);
  };

  const validateError = useCallback((): string[] => {
    const errors: string[] = [];
    const next = { th: "", en: "", category: "", latitude: "", longitude: "" };

    if (!th.trim()) {
      next.th = t("crud.place.form.th.required");
      errors.push(next.th);
    }
    if (!en.trim()) {
      next.en = t("crud.place.form.en.required");
      errors.push(next.en);
    }
    if (!category) {
      next.category = t("crud.place.form.category.required");
      errors.push(next.category);
    }
    if (!isValidCoordinate(latitude, LAT_MIN, LAT_MAX)) {
      next.latitude = t("crud.place.form.latitude.required");
      errors.push(next.latitude);
    }
    if (!isValidCoordinate(longitude, LON_MIN, LON_MAX)) {
      next.longitude = t("crud.place.form.longitude.required");
      errors.push(next.longitude);
    }

    setValidationErrors(next);
    return errors;
  }, [th, en, category, latitude, longitude, t]);

  const handlePlaceSave = useCallback(async () => {
    const errors = validateError();
    if (errors.length > 0) {
      // Rejected submission: return to the form modal (where validationErrors
      // is actually rendered) instead of leaving the confirm dialog open with
      // no visible reason - the user shouldn't have to click Cancel manually.
      setIsConfirmOpen(false);
      setIsOpen(true);
      return;
    }
    // `active` is always a real boolean here (component state), so this value
    // satisfies both PlaceCreateData's optional `active` and
    // PlaceUpdateData's required `active`.
    const data: PlaceUpdateData = {
      en,
      th,
      category: category as PlaceCategory,
      latitude: Number(latitude),
      longitude: Number(longitude),
      active
    };
    try {
      setLoading(true);
      let response;
      if (canManage) {
        if (placeId) {
          response = await updatePlace({ id: placeId, data }).unwrap();
        }
        else {
          response = await createPlace(data).unwrap();
        }
      }
      else {
        throw new Error(t("crud.common.permission_denied"));
      }
      if (response?.status) {
        addToast(
          "success",
          response?.message || response?.desc || response?.msg
          || (placeId && t("crud.place.action.update.success"))
          || t("crud.place.action.create.success")
        );
        // No window.location.replace: placesApi invalidates the "Place" tag, so
        // the list query re-runs and the row appears/updates in place.
      }
      else {
        throw new Error(response?.desc || response?.msg || t("errors.unknownApi"));
      }
    }
    catch (error) {
      addToast("error", `${(error as { data?: { message?: string } })?.data?.message
        || (error as { data?: { desc?: string } })?.data?.desc
        || (error as { data?: { msg?: string } })?.data?.msg
        || placeId && t("crud.place.action.update.error") || t("crud.place.action.create.error")}: ${error}`);
    }
    finally {
      setIsOpen(false);
      setIsConfirmOpen(false);
      setLoading(false);
    }
  }, [
    active, addToast, canManage, category, createPlace, en, latitude, longitude,
    placeId, th, t, updatePlace, validateError
  ]);

  const isEditAvailable = () => canManage;
  const isDeleteAvailable = () => canManage;
  // No separate view permission for Place (same organization_settings.manage
  // gate as everything else on this screen - ticket Q3).
  const isViewAvailable = () => canManage;

  // ===================================================================
  // Real Functionality Data
  // ===================================================================

  const data: (Place & { id: string; name: string })[] = useMemo(
    () => places?.map(p => ({
      ...p,
      id: p.id ?? "",
      name: (language === "th" ? p.th : p.en) || p.th || p.en || "",
    })) ?? [],
    [places, language]
  );

  // ===================================================================
  // Metrics
  // ===================================================================

  const placeMetrics: PlaceMetrics = useMemo(() => ({
    totalPlaces: data.length,
    activePlaces: data.filter(p => p.active).length,
    inactivePlaces: data.filter(p => !p.active).length,
  }), [data]);

  const attrMetrics = [
    { key: "totalPlaces", title: t("crud.place.metrics.total"), icon: GroupIcon, color: "blue", className: "text-blue-600" },
    { key: "activePlaces", title: t("crud.place.metrics.active"), icon: CheckLineIcon, color: "green", className: "text-green-600" },
    { key: "inactivePlaces", title: t("crud.place.metrics.inactive"), icon: TimeIcon, color: "red", className: "text-red-600" },
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
    entityName: t("crud.place.name"),
    entityNamePlural: t("crud.place.name"),
    apiEndpoints: {
      list: "/places",
      create: "/places",
      read: "/places/:id",
      update: "/places/:id",
      delete: "/places/:id"
    },
    columns: [
      {
        key: language === "th" && "th" || "en",
        label: t("crud.place.list.header.name"),
        sortable: true,
        render: (placeItem: Place) =>
          <span className="text-gray-900 dark:text-white">
            {language === "th" && placeItem.th || capitalizeWords(placeItem.en || "")} ({language === "th" && capitalizeWords(placeItem.en || "") || placeItem.th})
          </span>,
      },
      {
        key: "category",
        label: t("crud.place.list.header.category"),
        sortable: true,
        render: (placeItem: Place) =>
          <span className="text-gray-700 dark:text-gray-300">
            {t(`case.display.map_place_category_${placeItem.category}`)}
          </span>,
      },
      {
        key: "status",
        label: t("crud.place.list.header.status"),
        sortable: true,
        render: (placeItem: Place) => renderStatusBadge(placeItem.active)
      }
    ],
    filters: [
      {
        key: "category",
        label: t("crud.place.list.header.category"),
        type: "select" as const,
        options: categoryOptions,
        placeholder: t("crud.place.list.toolbar.filter.category")
      }
    ],
    actions: [
      {
        key: "view",
        label: t("crud.common.read"),
        variant: "primary" as const,
        // No-op: EnhancedCrudContainer intercepts "view" (module="place") and
        // opens the preview dialog itself - see previewConfig below.
        onClick: () => {},
        condition: () => isViewAvailable()
      },
      {
        key: "update",
        label: t("crud.common.update"),
        variant: "warning" as const,
        onClick: (placeItem: Place) => {
          setPlaceId(placeItem.id);
          setActive(placeItem.active);
          setTh(placeItem.th);
          setEn(placeItem.en);
          setCategory(placeItem.category);
          setLatitude(String(placeItem.latitude));
          setLongitude(String(placeItem.longitude));
          setValidationErrors({ th: "", en: "", category: "", latitude: "", longitude: "" });
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

  const previewConfig: PreviewConfig<Place & { id: string; name: string }> = {
    title: () => t("crud.place.list.preview.header"),
    size: "xl",
    enableNavigation: true,
    tabs: [
      {
        key: "overview",
        label: "",
        fields: [
          {
            key: language === "th" && "th" || "en",
            label: t("crud.place.list.header.name"),
            type: "custom" as const,
            render: (_, placeItem) =>
              <span className="text-gray-900 dark:text-white">
                {language === "th" && placeItem.th || capitalizeWords(placeItem.en || "")} ({language === "th" && capitalizeWords(placeItem.en || "") || placeItem.th})
              </span>,
          },
          {
            key: "category",
            label: t("crud.place.list.header.category"),
            type: "custom",
            render: (_, placeItem) =>
              <span className="text-gray-700 dark:text-gray-300">
                {t(`case.display.map_place_category_${placeItem.category}`)}
              </span>,
          },
          {
            key: "latitude",
            label: t("crud.place.form.latitude.label"),
            type: "custom",
            render: value => <span>{String(value)}</span>,
          },
          {
            key: "longitude",
            label: t("crud.place.form.longitude.label"),
            type: "custom",
            render: value => <span>{String(value)}</span>,
          },
          {
            key: "active",
            label: t("crud.place.list.header.status"),
            type: "custom",
            render: (_, placeItem) => renderStatusBadge(placeItem.active)
          },
          {
            key: "createdAt",
            label: t("crud.place.list.preview.field.createdAt"),
            type: "date",
          },
          {
            key: "updatedAt",
            label: t("crud.place.list.preview.field.updatedAt"),
            type: "date",
          },
          {
            key: "createdBy",
            label: t("crud.place.list.preview.field.createdBy"),
            type: "text",
          },
          {
            key: "updatedBy",
            label: t("crud.place.list.preview.field.updatedBy"),
            type: "text",
          },
        ]
      }
    ]
  };

  // ===================================================================
  // Custom Card Rendering
  // ===================================================================

  const renderCard = (placeItem: Place) => (
    <div className={`xl:flex items-start justify-between mb-4`}>
      <div className="xl:flex items-center gap-3 min-w-0 xl:flex-1">
        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate capitalize">
            {language === "th" && placeItem.th || capitalizeWords(placeItem.en || "")} ({language === "th" && capitalizeWords(placeItem.en || "") || placeItem.th})
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
            {t(`case.display.map_place_category_${placeItem.category}`)}
          </p>
          {renderStatusBadge(placeItem.active)}
        </div>
      </div>
    </div>
  );

  // ===================================================================
  // Render Component
  // ===================================================================

  return (
    <>
      <MetricsView metrics={placeMetrics} attrMetrics={attrMetrics} />

      <EnhancedCrudContainer
        apiConfig={{
          baseUrl: "/api",
          endpoints: {
            create: "/places",
            read: "/places/:id",
            list: "/places",
            update: "/places/:id",
            delete: "/places/:id"
          }
        }}
        config={config}
        data={data}
        // Routes DELETE through RTK Query (createHybridBaseQuery -> GraphQL) and,
        // because deletePlace invalidates the "Place" tag, refreshes the list.
        deleteItem={(id: string) => deletePlace(id).unwrap()}
        displayModes={["card", "table"]}
        module="place"
        previewConfig={previewConfig}
        // Whole route is gated by organization_settings.manage; gate the create
        // button and every row action on the same string (no place.* permission
        // family - ticket Q3).
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
        searchFields={["th", "en"]}
        onCreate={() => {
          handlePlaceReset();
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
          handlePlaceReset();
        }}
        className="max-w-4xl p-6 max-h-[80vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white cursor-default">
            {placeId && t("crud.place.form.header.update") || t("crud.place.form.header.create")}
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
              {t("crud.place.form.th.label")}
            </label>
            <Input
              id="th"
              placeholder={t("crud.place.form.th.placeholder")}
              value={th}
              onChange={(e) => setTh(e.target.value)}
            />
            <span className="text-red-500 dark:text-red-400 text-xs">{validationErrors.th}</span>
          </div>
          <div>
            <label htmlFor="en" className="text-sm font-medium text-gray-700 dark:text-gray-200">
              {t("crud.place.form.en.label")}
            </label>
            <Input
              id="en"
              placeholder={t("crud.place.form.en.placeholder")}
              value={en}
              onChange={(e) => setEn(e.target.value)}
            />
            <span className="text-red-500 dark:text-red-400 text-xs">{validationErrors.en}</span>
          </div>
          <div>
            <label htmlFor="category" className="text-sm font-medium text-gray-700 dark:text-gray-200">
              {t("crud.place.form.category.label")}
            </label>
            <Select
              options={categoryOptions}
              placeholder={t("crud.place.form.category.placeholder")}
              value={category}
              onChange={(value) => setCategory(value as PlaceCategory)}
            />
            <span className="text-red-500 dark:text-red-400 text-xs">{validationErrors.category}</span>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
              {t("crud.place.form.coordinate.label")}
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
              {t("crud.place.form.coordinate.hint")}
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="latitude" className="text-sm font-medium text-gray-700 dark:text-gray-200">
                {t("crud.place.form.latitude.label")}
              </label>
              <Input
                id="latitude"
                type="number"
                step={0.000001}
                placeholder={t("crud.place.form.latitude.placeholder")}
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
              />
              <span className="text-red-500 dark:text-red-400 text-xs">{validationErrors.latitude}</span>
            </div>
            <div>
              <label htmlFor="longitude" className="text-sm font-medium text-gray-700 dark:text-gray-200">
                {t("crud.place.form.longitude.label")}
              </label>
              <Input
                id="longitude"
                type="number"
                step={0.000001}
                placeholder={t("crud.place.form.longitude.placeholder")}
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
              />
              <span className="text-red-500 dark:text-red-400 text-xs">{validationErrors.longitude}</span>
            </div>
          </div>
          <div>
            <Switch
              key={placeId || "new"}
              label={t("crud.place.form.active.label")}
              defaultChecked={active}
              onChange={setActive}
            />
          </div>
        </div>
        <div className="flex items-center justify-end mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex gap-3">
            <Button onClick={handlePlaceReset} variant="outline">
              {t("crud.place.action.button.reset")}
            </Button>
            <Button
              onClick={() => {
                setIsConfirmOpen(true);
                setIsOpen(false);
              }}
              variant="primary"
            >
              {t("crud.place.action.button.save")}
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
            {placeId && t("crud.place.confirm.update.title") || t("crud.place.confirm.create.title")}
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
          {placeId
            && t("crud.place.confirm.update.message").replace("_PLACE_", language === "th" && th || en)
            || t("crud.place.confirm.create.message").replace("_PLACE_", language === "th" && th || en)
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
              {t("crud.place.confirm.button.cancel")}
            </Button>
            <Button onClick={handlePlaceSave} variant="success">
              {loading && t("crud.place.confirm.button.saving") || t("crud.place.confirm.button.confirm")}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default PlaceManagementComponent;
