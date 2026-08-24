// /src/components/admin/system-configuration/area/AreaManagement.tsx
import React, { useCallback, useMemo, useState } from "react";
import {
  Folder,
  Plus,
} from "lucide-react";
import { CloseIcon } from "@/core/icons";
import { ToastContainer } from "@/core/components/crud/ToastContainer";
import { usePermissions } from "@/core/hooks/usePermissions";
import { useToast } from "@/core/hooks/useToast";
import { useTranslation } from "@/core/hooks/useTranslation";
import {
  useCreateCountryMutation,
  useUpdateCountryMutation,
  useDeleteCountryMutation,
  useCreateProvinceMutation,
  useUpdateProvinceMutation,
  useDeleteProvinceMutation,
  useCreateDistrictMutation,
  useUpdateDistrictMutation,
  useDeleteDistrictMutation,
  useGenerateOrgCountryTreeMutation,
} from "@/cms/store/api/area";
import type {
  CountryCreateData, CountryUpdateData,
  AreaProvinceCreateData, AreaProvinceUpdateData,
  AreaDistrictCreateData, AreaDistrictUpdateData,
  AreaCountryTree
} from "@/cms/types/area";
import { isApiSuccess, resolveApiError, resolveApiMessage } from "@/cms/utils/apiResponse";
import { filterAreaTrees, findCountryIdByCode } from "@/cms/utils/areaTree";
import AreaFormModal, { type AreaFormField } from "@/cms/components/admin/system-configuration/area/AreaFormModal";
import AreaHierarchyView from "@/cms/components/admin/system-configuration/area/AreaHierarchyView";
import AreaTemplateSyncModal from "@/cms/components/admin/system-configuration/areaTemplate/AreaTemplateSyncModal";
import Input from "@/core/components/form/input/InputField";
import Button from "@/core/components/ui/button/Button";

interface AreaManagementProps {
  /** The org's country trees, already nested by the BFF. */
  trees: AreaCountryTree[];
  isLoading: boolean;
  /** Re-runs the tree fetches after data changes underneath them. */
  onReloadTrees: () => void;
}

const AreaManagementComponent: React.FC<AreaManagementProps> = ({ trees, isLoading, onReloadTrees }) => {
  const permissions = usePermissions();
  const { toasts, addToast, removeToast } = useToast();
  const { language, t } = useTranslation();

  const [createCountry] = useCreateCountryMutation();
  const [updateCountry] = useUpdateCountryMutation();
  const [deleteCountry] = useDeleteCountryMutation();
  const [createProvince] = useCreateProvinceMutation();
  const [updateProvince] = useUpdateProvinceMutation();
  const [deleteProvince] = useDeleteProvinceMutation();
  const [createDistrict] = useCreateDistrictMutation();
  const [updateDistrict] = useUpdateDistrictMutation();
  const [deleteDistrict] = useDeleteDistrictMutation();
  const [generateOrgCountryTree] = useGenerateOrgCountryTreeMutation();

  // ===================================================================
  // State management
  // ===================================================================

  // Country - countryId identifies the record being edited (empty = create mode);
  // countryCode is the user-editable business code sent as the "countryId" API field.
  const [countryId, setCountryId] = useState<string>("");
  const [countryCode, setCountryCode] = useState("");
  const [countryTh, setCountryTh] = useState("");
  const [countryEn, setCountryEn] = useState("");
  const [countryValidateErrors, setCountryValidateErrors] = useState({ countryCode: "", countryTh: "", countryEn: "" });

  // Province
  const [provId, setProvId] = useState<string>("");
  const [provinceCode, setProvinceCode] = useState("");
  const [provCountryId, setProvCountryId] = useState("");
  const [provinceTh, setProvinceTh] = useState("");
  const [provinceEn, setProvinceEn] = useState("");
  const [provValidateErrors, setProvValidateErrors] = useState({ provinceCode: "", countryId: "", provinceTh: "", provinceEn: "" });

  // District
  const [distId, setDistId] = useState<string>("");
  const [districtCode, setDistrictCode] = useState("");
  const [distCountryId, setDistCountryId] = useState("");
  const [distProvId, setDistProvId] = useState("");
  const [districtTh, setDistrictTh] = useState("");
  const [districtEn, setDistrictEn] = useState("");
  const [distValidateErrors, setDistValidateErrors] = useState({ districtCode: "", countryId: "", provId: "", districtTh: "", districtEn: "" });

  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [localValue, setLocalValue] = useState<string>("");

  // ===================================================================
  // Modals and dialogs
  // ===================================================================

  const [countryIsOpen, setCountryIsOpen] = useState(false);
  const [provinceIsOpen, setProvinceIsOpen] = useState(false);
  const [districtIsOpen, setDistrictIsOpen] = useState(false);
  const [syncIsOpen, setSyncIsOpen] = useState(false);

  // ===================================================================
  // Fill select option
  // ===================================================================

  const countriesOptions = useMemo(
    () => (trees || []).map(country => ({
      value: country.countryId,
      label: language === "th" && `${country.th} (${country.en})` || `${country.en} (${country.th})`
    })),
    [trees, language]
  );

  const provincesOptions = useMemo(
    () => (trees || []).flatMap(country => (country.provinces || []).map(province => ({
      value: province.provId,
      label: language === "th" && `${province.th} (${province.en})` || `${province.en} (${province.th})`,
      countryId: country.countryId
    }))),
    [trees, language]
  );

  // ===================================================================
  // Filter and search logic
  // ===================================================================

  const filteredTrees = useMemo(
    () => filterAreaTrees(trees || [], searchQuery),
    [trees, searchQuery]
  );

  const hasRecords = (trees || []).length > 0;

  // ===================================================================
  // Post-write refresh
  // ===================================================================

  /**
   * The org tree is a server-side cache: the country/province/district mutations
   * do not touch it, so invalidating "Area" on its own just refetches the
   * pre-edit shape. Regenerate the affected country first, then reload.
   *
   * `countryCode` is the business code the form carries; the tree endpoint wants
   * the row's numeric id, hence the lookup.
   */
  const refreshAfterWrite = useCallback(async (countryCode?: string) => {
    const numericId = countryCode ? findCountryIdByCode(trees || [], countryCode) : undefined;
    if (numericId !== undefined) {
      try {
        await generateOrgCountryTree(numericId).unwrap();
      }
      catch {
        // A failed regenerate is not a failed write - the record did change, the
        // cached tree is just stale. Reloading below still shows the old shape,
        // which is better than reporting the write itself as failed.
      }
    }
    onReloadTrees();
  }, [trees, generateOrgCountryTree, onReloadTrees]);

  // ===================================================================
  // Validation before saving
  // ===================================================================

  const validateCountry = useCallback((): boolean => {
    const errors = {
      countryCode: countryCode.trim() ? "" : t("crud.area.form.country.countryCode.required"),
      countryTh: countryTh.trim() ? "" : t("crud.area.form.country.countryTh.required"),
      countryEn: countryEn.trim() ? "" : t("crud.area.form.country.countryEn.required"),
    };
    setCountryValidateErrors(errors);
    return Object.values(errors).every(message => !message);
  }, [countryCode, countryEn, countryTh, t]);

  const validateProvince = useCallback((): boolean => {
    const errors = {
      countryId: provCountryId.trim() ? "" : t("crud.area.form.province.provinceCountryId.required"),
      provinceCode: provinceCode.trim() ? "" : t("crud.area.form.province.provinceCode.required"),
      provinceTh: provinceTh.trim() ? "" : t("crud.area.form.province.provinceTh.required"),
      provinceEn: provinceEn.trim() ? "" : t("crud.area.form.province.provinceEn.required"),
    };
    setProvValidateErrors(errors);
    return Object.values(errors).every(message => !message);
  }, [provCountryId, provinceCode, provinceEn, provinceTh, t]);

  const validateDistrict = useCallback((): boolean => {
    const errors = {
      countryId: distCountryId.trim() ? "" : t("crud.area.form.district.districtCountryId.required"),
      provId: distProvId.trim() ? "" : t("crud.area.form.district.districtProvId.required"),
      districtCode: districtCode.trim() ? "" : t("crud.area.form.district.districtCode.required"),
      districtTh: districtTh.trim() ? "" : t("crud.area.form.district.districtTh.required"),
      districtEn: districtEn.trim() ? "" : t("crud.area.form.district.districtEn.required"),
    };
    setDistValidateErrors(errors);
    return Object.values(errors).every(message => !message);
  }, [distCountryId, distProvId, districtCode, districtEn, districtTh, t]);

  // ===================================================================
  // Country CRUD
  // ===================================================================

  const handleCountryReset = useCallback(() => {
    setCountryId("");
    setCountryCode("");
    setCountryTh("");
    setCountryEn("");
    setCountryValidateErrors({ countryCode: "", countryTh: "", countryEn: "" });
  }, []);

  const handleCountryDelete = useCallback(async (id: number) => {
    if (!id) {
      return;
    }
    const affectedCode = (trees || []).find(country => country.id === id)?.countryId;
    try {
      setLoading(true);
      if (!permissions.hasAnyPermission(["area.delete"])) {
        throw new Error(t("crud.common.permission_denied"));
      }
      const response = await deleteCountry(id).unwrap();
      if (!isApiSuccess(response)) {
        throw new Error(resolveApiError(response, t("errors.unknownApi")));
      }
      addToast("success", resolveApiMessage(response, t("crud.area.action.country.delete.success")));
      await refreshAfterWrite(affectedCode);
    }
    catch (error) {
      addToast("error", resolveApiError(error, t("crud.area.action.country.delete.error")));
    }
    finally {
      setLoading(false);
    }
  }, [trees, permissions, addToast, deleteCountry, refreshAfterWrite, t]);

  const handleCountrySave = useCallback(async () => {
    if (!validateCountry()) {
      return;
    }
    const countryData: CountryCreateData | CountryUpdateData = {
      active: true,
      countryId: countryCode,
      en: countryEn,
      nameSpace: "",
      th: countryTh,
    };
    try {
      setLoading(true);
      if (!permissions.hasAnyPermission(["area.create", "area.update"])) {
        throw new Error(t("crud.common.permission_denied"));
      }
      const response = countryId
        ? await updateCountry({ id: countryId, data: { ...countryData, id: Number(countryId) } }).unwrap()
        : await createCountry(countryData).unwrap();

      if (!isApiSuccess(response)) {
        throw new Error(resolveApiError(response, t("errors.unknownApi")));
      }
      addToast("success", resolveApiMessage(
        response,
        countryId ? t("crud.area.action.country.update.success") : t("crud.area.action.country.create.success")
      ));
      // Only a successful save closes the form - a failure keeps the user's input.
      setCountryIsOpen(false);
      handleCountryReset();
      await refreshAfterWrite(countryCode);
    }
    catch (error) {
      addToast("error", resolveApiError(
        error,
        countryId ? t("crud.area.action.country.update.error") : t("crud.area.action.country.create.error")
      ));
    }
    finally {
      setLoading(false);
    }
  }, [
    countryCode, countryEn, countryId, countryTh, permissions, addToast,
    createCountry, updateCountry, validateCountry, handleCountryReset, refreshAfterWrite, t
  ]);

  // ===================================================================
  // Province CRUD
  // ===================================================================

  const handleProvinceReset = useCallback(() => {
    setProvId("");
    setProvinceCode("");
    setProvCountryId("");
    setProvinceTh("");
    setProvinceEn("");
    setProvValidateErrors({ provinceCode: "", countryId: "", provinceTh: "", provinceEn: "" });
  }, []);

  const handleProvinceDelete = useCallback(async (id: number) => {
    if (!id) {
      return;
    }
    const affectedCode = (trees || [])
      .find(country => (country.provinces || []).some(province => province.id === id))?.countryId;
    try {
      setLoading(true);
      if (!permissions.hasAnyPermission(["area.delete"])) {
        throw new Error(t("crud.common.permission_denied"));
      }
      const response = await deleteProvince(id).unwrap();
      if (!isApiSuccess(response)) {
        throw new Error(resolveApiError(response, t("errors.unknownApi")));
      }
      addToast("success", resolveApiMessage(response, t("crud.area.action.province.delete.success")));
      await refreshAfterWrite(affectedCode);
    }
    catch (error) {
      addToast("error", resolveApiError(error, t("crud.area.action.province.delete.error")));
    }
    finally {
      setLoading(false);
    }
  }, [trees, permissions, addToast, deleteProvince, refreshAfterWrite, t]);

  const handleProvinceSave = useCallback(async () => {
    if (!validateProvince()) {
      return;
    }
    const provinceData: AreaProvinceCreateData | AreaProvinceUpdateData = {
      active: true,
      countryId: provCountryId,
      en: provinceEn,
      nameSpace: "",
      provId: provinceCode,
      th: provinceTh,
    };
    try {
      setLoading(true);
      if (!permissions.hasAnyPermission(["area.create", "area.update"])) {
        throw new Error(t("crud.common.permission_denied"));
      }
      const response = provId
        ? await updateProvince({ id: provId, data: { ...provinceData, id: Number(provId) } }).unwrap()
        : await createProvince(provinceData).unwrap();

      if (!isApiSuccess(response)) {
        throw new Error(resolveApiError(response, t("errors.unknownApi")));
      }
      addToast("success", resolveApiMessage(
        response,
        provId ? t("crud.area.action.province.update.success") : t("crud.area.action.province.create.success")
      ));
      setProvinceIsOpen(false);
      handleProvinceReset();
      await refreshAfterWrite(provCountryId);
    }
    catch (error) {
      addToast("error", resolveApiError(
        error,
        provId ? t("crud.area.action.province.update.error") : t("crud.area.action.province.create.error")
      ));
    }
    finally {
      setLoading(false);
    }
  }, [
    provCountryId, provId, provinceCode, provinceEn, provinceTh, permissions, addToast,
    createProvince, updateProvince, validateProvince, handleProvinceReset, refreshAfterWrite, t
  ]);

  // ===================================================================
  // District CRUD
  // ===================================================================

  const handleDistrictReset = useCallback(() => {
    setDistId("");
    setDistrictCode("");
    setDistCountryId("");
    setDistProvId("");
    setDistrictTh("");
    setDistrictEn("");
    setDistValidateErrors({ districtCode: "", countryId: "", provId: "", districtTh: "", districtEn: "" });
  }, []);

  const handleDistrictDelete = useCallback(async (id: number) => {
    if (!id) {
      return;
    }
    const affectedCode = (trees || []).find(country =>
      (country.provinces || []).some(province =>
        (province.districts || []).some(district => district.id === id)
      )
    )?.countryId;
    try {
      setLoading(true);
      if (!permissions.hasAnyPermission(["area.delete"])) {
        throw new Error(t("crud.common.permission_denied"));
      }
      const response = await deleteDistrict(id).unwrap();
      if (!isApiSuccess(response)) {
        throw new Error(resolveApiError(response, t("errors.unknownApi")));
      }
      addToast("success", resolveApiMessage(response, t("crud.area.action.district.delete.success")));
      await refreshAfterWrite(affectedCode);
    }
    catch (error) {
      addToast("error", resolveApiError(error, t("crud.area.action.district.delete.error")));
    }
    finally {
      setLoading(false);
    }
  }, [trees, permissions, addToast, deleteDistrict, refreshAfterWrite, t]);

  const handleDistrictSave = useCallback(async () => {
    if (!validateDistrict()) {
      return;
    }
    const districtData: AreaDistrictCreateData | AreaDistrictUpdateData = {
      active: true,
      countryId: distCountryId,
      distId: districtCode,
      en: districtEn,
      nameSpace: "",
      provId: distProvId,
      th: districtTh,
    };
    try {
      setLoading(true);
      if (!permissions.hasAnyPermission(["area.create", "area.update"])) {
        throw new Error(t("crud.common.permission_denied"));
      }
      const response = distId
        ? await updateDistrict({ id: distId, data: { ...districtData, id: Number(distId) } }).unwrap()
        : await createDistrict(districtData).unwrap();

      if (!isApiSuccess(response)) {
        throw new Error(resolveApiError(response, t("errors.unknownApi")));
      }
      addToast("success", resolveApiMessage(
        response,
        distId ? t("crud.area.action.district.update.success") : t("crud.area.action.district.create.success")
      ));
      setDistrictIsOpen(false);
      handleDistrictReset();
      await refreshAfterWrite(distCountryId);
    }
    catch (error) {
      addToast("error", resolveApiError(
        error,
        distId ? t("crud.area.action.district.update.error") : t("crud.area.action.district.create.error")
      ));
    }
    finally {
      setLoading(false);
    }
  }, [
    distCountryId, distId, distProvId, districtCode, districtEn, districtTh, permissions, addToast,
    createDistrict, updateDistrict, validateDistrict, handleDistrictReset, refreshAfterWrite, t
  ]);

  // ===================================================================
  // Form field definitions
  // ===================================================================

  const countryFields: AreaFormField[] = [
    {
      key: "countryCode",
      type: "text",
      label: t("crud.area.form.country.countryCode.label"),
      placeholder: t("crud.area.form.country.countryCode.placeholder"),
      value: countryCode,
      error: countryValidateErrors.countryCode,
      onChange: setCountryCode
    },
    {
      key: "countryTh",
      type: "text",
      label: t("crud.area.form.country.countryTh.label"),
      placeholder: t("crud.area.form.country.countryTh.placeholder"),
      value: countryTh,
      error: countryValidateErrors.countryTh,
      onChange: setCountryTh
    },
    {
      key: "countryEn",
      type: "text",
      label: t("crud.area.form.country.countryEn.label"),
      placeholder: t("crud.area.form.country.countryEn.placeholder"),
      value: countryEn,
      error: countryValidateErrors.countryEn,
      onChange: setCountryEn
    }
  ];

  const provinceFields: AreaFormField[] = [
    {
      key: "provinceCountryId",
      type: "select",
      label: t("crud.area.form.province.provinceCountryId.label"),
      placeholder: t("crud.area.form.province.provinceCountryId.placeholder"),
      value: provCountryId,
      error: provValidateErrors.countryId,
      options: countriesOptions,
      onChange: setProvCountryId
    },
    {
      key: "provinceCode",
      type: "text",
      label: t("crud.area.form.province.provinceCode.label"),
      placeholder: t("crud.area.form.province.provinceCode.placeholder"),
      value: provinceCode,
      error: provValidateErrors.provinceCode,
      onChange: setProvinceCode
    },
    {
      key: "provinceTh",
      type: "text",
      label: t("crud.area.form.province.provinceTh.label"),
      placeholder: t("crud.area.form.province.provinceTh.placeholder"),
      value: provinceTh,
      error: provValidateErrors.provinceTh,
      onChange: setProvinceTh
    },
    {
      key: "provinceEn",
      type: "text",
      label: t("crud.area.form.province.provinceEn.label"),
      placeholder: t("crud.area.form.province.provinceEn.placeholder"),
      value: provinceEn,
      error: provValidateErrors.provinceEn,
      onChange: setProvinceEn
    }
  ];

  const districtFields: AreaFormField[] = [
    {
      key: "districtCountryId",
      type: "select",
      label: t("crud.area.form.district.districtCountryId.label"),
      placeholder: t("crud.area.form.district.districtCountryId.placeholder"),
      value: distCountryId,
      error: distValidateErrors.countryId,
      options: countriesOptions,
      onChange: value => {
        setDistCountryId(value);
        // The province list is scoped to the country, so a stale selection here
        // would silently submit a province from a different country.
        setDistProvId("");
      }
    },
    {
      key: "districtProvId",
      type: "select",
      label: t("crud.area.form.district.districtProvId.label"),
      placeholder: t("crud.area.form.district.districtProvId.placeholder"),
      value: distProvId,
      error: distValidateErrors.provId,
      options: provincesOptions.filter(option => option.countryId === distCountryId),
      disabled: !distCountryId,
      onChange: setDistProvId
    },
    {
      key: "districtCode",
      type: "text",
      label: t("crud.area.form.district.districtCode.label"),
      placeholder: t("crud.area.form.district.districtCode.placeholder"),
      value: districtCode,
      error: distValidateErrors.districtCode,
      onChange: setDistrictCode
    },
    {
      key: "districtTh",
      type: "text",
      label: t("crud.area.form.district.districtTh.label"),
      placeholder: t("crud.area.form.district.districtTh.placeholder"),
      value: districtTh,
      error: distValidateErrors.districtTh,
      onChange: setDistrictTh
    },
    {
      key: "districtEn",
      type: "text",
      label: t("crud.area.form.district.districtEn.label"),
      placeholder: t("crud.area.form.district.districtEn.placeholder"),
      value: districtEn,
      error: distValidateErrors.districtEn,
      onChange: setDistrictEn
    }
  ];

  // ===================================================================
  // Render
  // ===================================================================

  const handleResetQuery = () => {
    setLocalValue("");
    setSearchQuery("");
  };

  const canAdopt = permissions.hasAnyPermission(["area.create", "area.update"]);

  return (
    <>
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/3 p-6">
        <div className={`mx-auto w-full`}>
          <div className={`mx-auto w-full`}>
            {/* Header */}
            <div className="mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div className="mt-4 sm:mt-0 xl:flex space-y-2 xl:space-y-0 items-center space-x-3">
                  {/* Toolbar */}
                  <div className="xl:flex space-y-2 xl:space-y-0 items-center space-x-4">
                    {/* Search */}
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <Input
                          value={localValue}
                          onChange={e => setLocalValue(e.target.value)}
                          placeholder={t("crud.area.list.toolbar.search.placeholder")}
                        />
                        {localValue && (
                          <Button
                            onClick={handleResetQuery}
                            className="absolute right-0 top-1/2 transform -translate-y-1/2"
                            variant="outline"
                          >
                            <CloseIcon className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                      <Button
                        onClick={() => setSearchQuery(localValue)}
                        variant="dark"
                        className="h-11"
                      >
                        {t("crud.common.search")}
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="mt-4 sm:mt-0 xl:flex space-y-2 xl:space-y-0 items-center space-x-3">
                  <div className="xl:flex gap-3">
                    {canAdopt && (
                      <Button onClick={() => setSyncIsOpen(true)} size="sm" variant="outline">
                        {t("crud.areaTemplate.sync.button")}
                      </Button>
                    )}
                    <Button
                      onClick={() => {
                        handleCountryReset();
                        setCountryIsOpen(true);
                      }} size="sm">
                      {t("crud.area.form.country.header.create")}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
            {/* Loading state */}
            {isLoading && (
              <div className="flex items-center justify-center py-12 text-gray-500 dark:text-gray-400 cursor-default">
                {t("crud.common.loading_records")}
              </div>
            )}
            {/* Content */}
            {!isLoading && hasRecords && (
              <AreaHierarchyView
                trees={filteredTrees}
                showInactive={false}
                handleCountryDelete={handleCountryDelete}
                handleCountryReset={handleCountryReset}
                handleProvinceDelete={handleProvinceDelete}
                handleProvinceReset={handleProvinceReset}
                handleDistrictDelete={handleDistrictDelete}
                handleDistrictReset={handleDistrictReset}
                setCountryId={setCountryId}
                setCountryIsOpen={setCountryIsOpen}
                setCountryCode={setCountryCode}
                setCountryTh={setCountryTh}
                setCountryEn={setCountryEn}
                setProvId={setProvId}
                setProvinceIsOpen={setProvinceIsOpen}
                setProvinceCode={setProvinceCode}
                setProvCountryId={setProvCountryId}
                setProvinceTh={setProvinceTh}
                setProvinceEn={setProvinceEn}
                setDistId={setDistId}
                setDistrictIsOpen={setDistrictIsOpen}
                setDistrictCode={setDistrictCode}
                setDistCountryId={setDistCountryId}
                setDistProvId={setDistProvId}
                setDistrictTh={setDistrictTh}
                setDistrictEn={setDistrictEn}
              />
            )}
            {/* Empty state */}
            {!isLoading && !hasRecords && (
              <div className="text-center py-12">
                <Folder className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-800 dark:text-gray-100 mb-2 cursor-default">
                  {t("crud.common.zero_records")}
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-4 cursor-default">
                  {searchQuery ? t("crud.common.no_filters_active") : t("crud.common.no_records").replace("_ENTITY_", t("crud.area.name"))}
                </p>
                <button
                  onClick={() => {
                    handleCountryReset();
                    setCountryIsOpen(true);
                  }}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 dark:bg-blue-300 text-white dark:text-gray-900 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-200 mx-auto"
                >
                  <Plus className="w-4 h-4" />
                  <span>{t("crud.area.form.country.header.create")}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {/* Create / Update Country */}
      <AreaFormModal
        isOpen={countryIsOpen}
        title={countryId && t("crud.area.form.country.header.update") || t("crud.area.form.country.header.create")}
        fields={countryFields}
        loading={loading}
        onClose={() => {
          setCountryIsOpen(false);
          handleCountryReset();
        }}
        onReset={handleCountryReset}
        onSave={handleCountrySave}
      />

      {/* Create / Update Province */}
      <AreaFormModal
        isOpen={provinceIsOpen}
        title={provId && t("crud.area.form.province.header.update") || t("crud.area.form.province.header.create")}
        fields={provinceFields}
        loading={loading}
        onClose={() => {
          setProvinceIsOpen(false);
          handleProvinceReset();
        }}
        onReset={handleProvinceReset}
        onSave={handleProvinceSave}
      />

      {/* Create / Update District */}
      <AreaFormModal
        isOpen={districtIsOpen}
        title={distId && t("crud.area.form.district.header.update") || t("crud.area.form.district.header.create")}
        fields={districtFields}
        loading={loading}
        onClose={() => {
          setDistrictIsOpen(false);
          handleDistrictReset();
        }}
        onReset={handleDistrictReset}
        onSave={handleDistrictSave}
      />

      {/* Import / sync from an area template */}
      <AreaTemplateSyncModal
        isOpen={syncIsOpen}
        trees={trees || []}
        onClose={() => setSyncIsOpen(false)}
        onSuccess={message => {
          addToast("success", message);
          onReloadTrees();
        }}
        onError={message => addToast("error", message)}
      />
    </>
  );
};

export default AreaManagementComponent;
