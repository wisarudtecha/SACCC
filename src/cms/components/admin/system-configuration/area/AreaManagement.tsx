// /src/components/admin/system-configuration/area/AreaManagement.tsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Folder,
  Plus,
} from "lucide-react";
import { CloseIcon } from "@/core/icons";
import { ToastContainer } from "@/core/components/crud/ToastContainer";
import { Modal } from "@/core/components/ui/modal";
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
} from "@/cms/store/api/area";
import type {
  CountryCreateData, CountryUpdateData,
  AreaProvinceCreateData, AreaProvinceUpdateData,
  AreaDistrictCreateData, AreaDistrictUpdateData,
  Country, AreaProvince, AreaDistrict, AreaManagementProps
} from "@/cms/types/area";
import AreaHierarchyView from "@/cms/components/admin/system-configuration/area/AreaHierarchyView";
import Input from "@/core/components/form/input/InputField";
import Select from "@/core/components/form/Select";
import Button from "@/core/components/ui/button/Button";

const AreaManagementComponent: React.FC<AreaManagementProps> = ({ countries, provinces, districts }) => {
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

  // ===================================================================
  // State management
  // ===================================================================

  const [country, setCountryList] = useState<Country[]>(countries || []);
  const [province, setProvinceList] = useState<AreaProvince[]>(provinces || []);
  const [district, setDistrictList] = useState<AreaDistrict[]>(districts || []);

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

  const [isLoading, setIsLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showInactive, ] = useState(false);
  const [viewMode, ] = useState<"hierarchy" | "list">("hierarchy");
  const [, setValidationErrors] = useState<string[]>([]);

  // ===================================================================
  // Modals and dialogs
  // ===================================================================

  const [countryIsOpen, setCountryIsOpen] = useState(false);
  const [provinceIsOpen, setProvinceIsOpen] = useState(false);
  const [districtIsOpen, setDistrictIsOpen] = useState(false);

  // ===================================================================
  // Fill select option
  // ===================================================================

  const [countriesOptions, setCountriesOptions] = useState<{ value: string; label: string }[]>([]);
  const [provincesOptions, setProvincesOptions] = useState<{ value: string; label: string; countryId: string }[]>([]);

  useEffect(() => {
    setCountriesOptions((countries || []).map(c => ({
      value: c.countryId,
      label: language === "th" && `${c.th} (${c.en})` || `${c.en} (${c.th})`
    })));
  }, [countries, language]);

  useEffect(() => {
    setProvincesOptions((provinces || []).map(p => ({
      value: p.provId,
      label: language === "th" && `${p.th} (${p.en})` || `${p.en} (${p.th})`,
      countryId: p.countryId
    })));
  }, [provinces, language]);

  // ===================================================================
  // Filter and search logic
  // ===================================================================

  const { filteredCountries, filteredProvinces, filteredDistricts } = useMemo(() => {
    if (!searchQuery) {
      return {
        filteredCountries: country,
        filteredProvinces: province,
        filteredDistricts: district
      };
    }

    const searchLower = searchQuery.toLowerCase();

    const matchingCountryIds = new Set<string>();
    const matchingProvIds = new Set<string>();
    const matchingDistIds = new Set<string>();

    country.forEach(c => {
      const matches = c.th.toLowerCase().includes(searchLower) || c.en.toLowerCase().includes(searchLower);
      if (matches) {
        matchingCountryIds.add(c.countryId);
      }
    });

    province.forEach(p => {
      const matches = p.th.toLowerCase().includes(searchLower) || p.en.toLowerCase().includes(searchLower);
      if (matches) {
        matchingProvIds.add(p.provId);
        matchingCountryIds.add(p.countryId); // Also include parent country
      }
    });

    district.forEach(d => {
      const matches = d.th.toLowerCase().includes(searchLower) || d.en.toLowerCase().includes(searchLower);
      if (matches) {
        matchingDistIds.add(d.distId);
        matchingProvIds.add(d.provId); // Also include parent province
        matchingCountryIds.add(d.countryId); // Also include parent country
      }
    });

    return {
      filteredCountries: country.filter(c => matchingCountryIds.has(c.countryId)),
      filteredProvinces: province.filter(p => matchingProvIds.has(p.provId) || matchingCountryIds.has(p.countryId)),
      filteredDistricts: district.filter(d => matchingDistIds.has(d.distId) || matchingProvIds.has(d.provId))
    };
  }, [country, province, district, searchQuery]);

  // ===================================================================
  // Validation before saving
  // ===================================================================

  const validateCountry = useCallback((): string[] => {
    const errors: string[] = [];
    if (!countryCode.trim()) {
      errors.push(t("crud.area.form.country.countryCode.required"));
      setCountryValidateErrors(prev => ({ ...prev, countryCode: t("crud.area.form.country.countryCode.required") }));
    }
    if (!countryTh.trim()) {
      errors.push(t("crud.area.form.country.countryTh.required"));
      setCountryValidateErrors(prev => ({ ...prev, countryTh: t("crud.area.form.country.countryTh.required") }));
    }
    if (!countryEn.trim()) {
      errors.push(t("crud.area.form.country.countryEn.required"));
      setCountryValidateErrors(prev => ({ ...prev, countryEn: t("crud.area.form.country.countryEn.required") }));
    }
    return errors;
  }, [countryCode, countryEn, countryTh, t]);

  const validateProvince = useCallback((): string[] => {
    const errors: string[] = [];
    if (!provCountryId.trim()) {
      errors.push(t("crud.area.form.province.provinceCountryId.required"));
      setProvValidateErrors(prev => ({ ...prev, countryId: t("crud.area.form.province.provinceCountryId.required") }));
    }
    if (!provinceCode.trim()) {
      errors.push(t("crud.area.form.province.provinceCode.required"));
      setProvValidateErrors(prev => ({ ...prev, provinceCode: t("crud.area.form.province.provinceCode.required") }));
    }
    if (!provinceTh.trim()) {
      errors.push(t("crud.area.form.province.provinceTh.required"));
      setProvValidateErrors(prev => ({ ...prev, provinceTh: t("crud.area.form.province.provinceTh.required") }));
    }
    if (!provinceEn.trim()) {
      errors.push(t("crud.area.form.province.provinceEn.required"));
      setProvValidateErrors(prev => ({ ...prev, provinceEn: t("crud.area.form.province.provinceEn.required") }));
    }
    return errors;
  }, [provCountryId, provinceCode, provinceEn, provinceTh, t]);

  const validateDistrict = useCallback((): string[] => {
    const errors: string[] = [];
    if (!distCountryId.trim()) {
      errors.push(t("crud.area.form.district.districtCountryId.required"));
      setDistValidateErrors(prev => ({ ...prev, countryId: t("crud.area.form.district.districtCountryId.required") }));
    }
    if (!distProvId.trim()) {
      errors.push(t("crud.area.form.district.districtProvId.required"));
      setDistValidateErrors(prev => ({ ...prev, provId: t("crud.area.form.district.districtProvId.required") }));
    }
    if (!districtCode.trim()) {
      errors.push(t("crud.area.form.district.districtCode.required"));
      setDistValidateErrors(prev => ({ ...prev, districtCode: t("crud.area.form.district.districtCode.required") }));
    }
    if (!districtTh.trim()) {
      errors.push(t("crud.area.form.district.districtTh.required"));
      setDistValidateErrors(prev => ({ ...prev, districtTh: t("crud.area.form.district.districtTh.required") }));
    }
    if (!districtEn.trim()) {
      errors.push(t("crud.area.form.district.districtEn.required"));
      setDistValidateErrors(prev => ({ ...prev, districtEn: t("crud.area.form.district.districtEn.required") }));
    }
    return errors;
  }, [distCountryId, distProvId, districtCode, districtEn, districtTh, t]);

  // ===================================================================
  // Country CRUD
  // ===================================================================

  const handleCountryDelete = useCallback(async (id: number) => {
    if (!id) {
      return;
    }
    try {
      setLoading(true);
      let response;
      if (permissions.hasAnyPermission(["area.delete"])) {
        response = await deleteCountry(id).unwrap();
      }
      else {
        throw new Error(t("crud.common.permission_denied"));
      }
      if (response?.status) {
        addToast("success", response?.message || response?.desc || response?.msg || t("crud.area.action.country.delete.success"));
        setTimeout(() => {
          window.location.replace(`/cms/area`);
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
        || t("crud.area.action.country.delete.error")}: ${error}`);
    }
    finally {
      setLoading(false);
    }
  }, [permissions, addToast, deleteCountry, t]);

  const handleCountryReset = () => {
    setCountryId("");
    setCountryCode("");
    setCountryTh("");
    setCountryEn("");
    setCountryValidateErrors({ countryCode: "", countryTh: "", countryEn: "" });
  };

  const handleCountrySave = useCallback(async () => {
    const errors = validateCountry();
    setValidationErrors(errors);
    if (errors.length > 0) {
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
      let response;
      if (permissions.hasAnyPermission(["area.create", "area.update"])) {
        if (countryId) {
          response = await updateCountry({
            id: countryId, data: { ...countryData, id: Number(countryId) }
          }).unwrap();
        }
        else {
          response = await createCountry(countryData).unwrap();
        }
      }
      else {
        throw new Error(t("crud.common.permission_denied"));
      }
      if (response?.status) {
        addToast("success", response?.message || response?.desc || response?.msg || (countryId && t("crud.area.action.country.update.success")) || t("crud.area.action.country.create.success"));
        setTimeout(() => {
          window.location.replace(`/cms/area`);
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
        || (countryId && t("crud.area.action.country.update.success")) || t("crud.area.action.country.create.success")}: ${error}`);
    }
    finally {
      setCountryIsOpen(false);
      setLoading(false);
    }
  }, [countryCode, countryEn, countryId, countryTh, permissions, addToast, createCountry, t, updateCountry, validateCountry]);

  // ===================================================================
  // Province CRUD
  // ===================================================================

  const handleProvinceDelete = useCallback(async (id: number) => {
    if (!id) {
      return;
    }
    try {
      setLoading(true);
      let response;
      if (permissions.hasAnyPermission(["area.delete"])) {
        response = await deleteProvince(id).unwrap();
      }
      else {
        throw new Error(t("crud.common.permission_denied"));
      }
      if (response?.status) {
        addToast("success", response?.message || response?.desc || response?.msg || t("crud.area.action.province.delete.success"));
        setTimeout(() => {
          window.location.replace(`/cms/area`);
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
        || t("crud.area.action.province.delete.error")}: ${error}`);
    }
    finally {
      setLoading(false);
    }
  }, [permissions, addToast, deleteProvince, t]);

  const handleProvinceReset = () => {
    setProvId("");
    setProvinceCode("");
    setProvCountryId("");
    setProvinceTh("");
    setProvinceEn("");
    setProvValidateErrors({ provinceCode: "", countryId: "", provinceTh: "", provinceEn: "" });
  };

  const handleProvinceSave = useCallback(async () => {
    const errors = validateProvince();
    setValidationErrors(errors);
    if (errors.length > 0) {
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
      let response;
      if (permissions.hasAnyPermission(["area.create", "area.update"])) {
        if (provId) {
          response = await updateProvince({
            id: provId, data: { ...provinceData, id: Number(provId) }
          }).unwrap();
        }
        else {
          response = await createProvince(provinceData).unwrap();
        }
      }
      else {
        throw new Error(t("crud.common.permission_denied"));
      }
      if (response?.status) {
        addToast("success", response?.message || response?.desc || response?.msg || (provId && t("crud.area.action.province.update.success")) || t("crud.area.action.province.create.success"));
        setTimeout(() => {
          window.location.replace(`/cms/area`);
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
        || (provId && t("crud.area.action.province.update.success")) || t("crud.area.action.province.create.success")}: ${error}`);
    }
    finally {
      setProvinceIsOpen(false);
      setLoading(false);
    }
  }, [provCountryId, provId, provinceCode, provinceEn, provinceTh, permissions, addToast, createProvince, t, updateProvince, validateProvince]);

  // ===================================================================
  // District CRUD
  // ===================================================================

  const handleDistrictDelete = useCallback(async (id: number) => {
    if (!id) {
      return;
    }
    try {
      setLoading(true);
      let response;
      if (permissions.hasAnyPermission(["area.delete"])) {
        response = await deleteDistrict(id).unwrap();
      }
      else {
        throw new Error(t("crud.common.permission_denied"));
      }
      if (response?.status) {
        addToast("success", response?.message || response?.desc || response?.msg || t("crud.area.action.district.delete.success"));
        setTimeout(() => {
          window.location.replace(`/cms/area`);
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
        || t("crud.area.action.district.delete.error")}: ${error}`);
    }
    finally {
      setLoading(false);
    }
  }, [permissions, addToast, deleteDistrict, t]);

  const handleDistrictReset = () => {
    setDistId("");
    setDistrictCode("");
    setDistCountryId("");
    setDistProvId("");
    setDistrictTh("");
    setDistrictEn("");
    setDistValidateErrors({ districtCode: "", countryId: "", provId: "", districtTh: "", districtEn: "" });
  };

  const handleDistrictSave = useCallback(async () => {
    const errors = validateDistrict();
    setValidationErrors(errors);
    if (errors.length > 0) {
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
      let response;
      if (permissions.hasAnyPermission(["area.create", "area.update"])) {
        if (distId) {
          response = await updateDistrict({
            id: distId, data: { ...districtData, id: Number(distId) }
          }).unwrap();
        }
        else {
          response = await createDistrict(districtData).unwrap();
        }
      }
      else {
        throw new Error(t("crud.common.permission_denied"));
      }
      if (response?.status) {
        addToast("success", response?.message || response?.desc || response?.msg || (distId && t("crud.area.action.district.update.success")) || t("crud.area.action.district.create.success"));
        setTimeout(() => {
          window.location.replace(`/cms/area`);
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
        || (distId && t("crud.area.action.district.update.success")) || t("crud.area.action.district.create.success")}: ${error}`);
    }
    finally {
      setDistrictIsOpen(false);
      setLoading(false);
    }
  }, [distCountryId, distId, distProvId, districtCode, districtEn, districtTh, permissions, addToast, createDistrict, t, updateDistrict, validateDistrict]);

  // ===================================================================
  // Render
  // ===================================================================

  useEffect(() => {
    setCountryList(countries || []);
    setProvinceList(provinces || []);
    setDistrictList(districts || []);
  }, [countries, provinces, districts]);

  useEffect(() => {
    setIsLoading(
      (countries?.length === 0 && provinces?.length === 0 && districts?.length === 0) ? true : false
    );
  }, [countries?.length, provinces?.length, districts?.length]);

  const renderAreaHierarchy = () => (
    <AreaHierarchyView
      countries={filteredCountries || country || []}
      provinces={filteredProvinces || province || []}
      districts={filteredDistricts || district || []}
      showInactive={showInactive}
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
  );

  const [localValue, setLocalValue] = useState<string>("");

  const handleResetQuery = () => {
    if (setLocalValue) {
      setLocalValue("");
    }
    if (setSearchQuery) {
      setSearchQuery("");
    }
  }

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
                          onChange={e => setLocalValue && setLocalValue(e.target.value)}
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
                        onClick={() => setSearchQuery && setSearchQuery(localValue)}
                        variant="dark"
                        className="h-11"
                      >
                        {t("crud.common.search")}
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="mt-4 sm:mt-0 xl:flex space-y-2 xl:space-y-0 items-center space-x-3">
                  <div className="xl:flex">
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
            {!isLoading && (country?.length > 0 || province?.length > 0 || district?.length > 0) && (
              <>
                {viewMode === "hierarchy" && renderAreaHierarchy()}
              </>
            )}
            {/* Empty state */}
            {!isLoading && country?.length === 0 && province?.length === 0 && district?.length === 0 && (
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
      <Modal
        isOpen={countryIsOpen}
        onClose={() => {
          setCountryIsOpen(false);
          handleCountryReset();
        }}
        className="max-w-4xl p-6 max-h-[80vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white cursor-default">
            {countryId && t("crud.area.form.country.header.update") || t("crud.area.form.country.header.create")}
          </h3>
          <Button
            onClick={() => setCountryIsOpen(false)}
            variant="ghost"
            size="sm"
          >
            <CloseIcon className="w-4 h-4" />
          </Button>
        </div>
        <div className="space-y-4">
          <div>
            <label htmlFor="countryCode" className="text-sm font-medium text-gray-700 dark:text-gray-200">
              {t("crud.area.form.country.countryCode.label")}
            </label>
            <Input
              id="countryCode"
              placeholder={t("crud.area.form.country.countryCode.placeholder")}
              value={countryCode}
              onChange={(e) => setCountryCode && setCountryCode(e.target.value)}
            />
            <span className="text-red-500 dark:text-red-400 text-xs">{countryValidateErrors.countryCode}</span>
          </div>
          <div>
            <label htmlFor="countryTh" className="text-sm font-medium text-gray-700 dark:text-gray-200">
              {t("crud.area.form.country.countryTh.label")}
            </label>
            <Input
              id="countryTh"
              placeholder={t("crud.area.form.country.countryTh.placeholder")}
              value={countryTh}
              onChange={(e) => setCountryTh && setCountryTh(e.target.value)}
            />
            <span className="text-red-500 dark:text-red-400 text-xs">{countryValidateErrors.countryTh}</span>
          </div>
          <div>
            <label htmlFor="countryEn" className="text-sm font-medium text-gray-700 dark:text-gray-200">
              {t("crud.area.form.country.countryEn.label")}
            </label>
            <Input
              id="countryEn"
              placeholder={t("crud.area.form.country.countryEn.placeholder")}
              value={countryEn}
              onChange={(e) => setCountryEn && setCountryEn(e.target.value)}
            />
            <span className="text-red-500 dark:text-red-400 text-xs">{countryValidateErrors.countryEn}</span>
          </div>
        </div>
        <div className="flex items-center justify-end mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex gap-3">
            <Button onClick={handleCountryReset} variant="outline">
              {t("crud.area.action.button.reset")}
            </Button>
            <Button onClick={handleCountrySave} variant="primary" disabled={loading} className={`${loading && "cursor-not-allowed disabled"}`}>
              {!loading && t("crud.area.confirm.button.confirm") || t("crud.area.confirm.button.saving")}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Create / Update Province */}
      <Modal
        isOpen={provinceIsOpen}
        onClose={() => {
          setProvinceIsOpen(false);
          handleProvinceReset();
        }}
        className="max-w-4xl p-6 max-h-[80vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white cursor-default">
            {provId && t("crud.area.form.province.header.update") || t("crud.area.form.province.header.create")}
          </h3>
          <Button
            onClick={() => setProvinceIsOpen(false)}
            variant="ghost"
            size="sm"
          >
            <CloseIcon className="w-4 h-4" />
          </Button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
              {t("crud.area.form.province.provinceCountryId.label")}
            </label>
            <Select
              value={provCountryId || ""}
              onChange={value => setProvCountryId && setProvCountryId(value)}
              options={countriesOptions || []}
              placeholder={t("crud.area.form.province.provinceCountryId.placeholder")}
              className="cursor-pointer"
            />
            <span className="text-red-500 dark:text-red-400 text-xs">{provValidateErrors.countryId}</span>
          </div>
          <div>
            <label htmlFor="provinceCode" className="text-sm font-medium text-gray-700 dark:text-gray-200">
              {t("crud.area.form.province.provinceCode.label")}
            </label>
            <Input
              id="provinceCode"
              placeholder={t("crud.area.form.province.provinceCode.placeholder")}
              value={provinceCode}
              onChange={(e) => setProvinceCode && setProvinceCode(e.target.value)}
            />
            <span className="text-red-500 dark:text-red-400 text-xs">{provValidateErrors.provinceCode}</span>
          </div>
          <div>
            <label htmlFor="provinceTh" className="text-sm font-medium text-gray-700 dark:text-gray-200">
              {t("crud.area.form.province.provinceTh.label")}
            </label>
            <Input
              id="provinceTh"
              placeholder={t("crud.area.form.province.provinceTh.placeholder")}
              value={provinceTh}
              onChange={(e) => setProvinceTh && setProvinceTh(e.target.value)}
            />
            <span className="text-red-500 dark:text-red-400 text-xs">{provValidateErrors.provinceTh}</span>
          </div>
          <div>
            <label htmlFor="provinceEn" className="text-sm font-medium text-gray-700 dark:text-gray-200">
              {t("crud.area.form.province.provinceEn.label")}
            </label>
            <Input
              id="provinceEn"
              placeholder={t("crud.area.form.province.provinceEn.placeholder")}
              value={provinceEn}
              onChange={(e) => setProvinceEn && setProvinceEn(e.target.value)}
            />
            <span className="text-red-500 dark:text-red-400 text-xs">{provValidateErrors.provinceEn}</span>
          </div>
        </div>
        <div className="flex items-center justify-end mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex gap-3">
            <Button onClick={handleProvinceReset} variant="outline">
              {t("crud.area.action.button.reset")}
            </Button>
            <Button onClick={handleProvinceSave} variant="primary" disabled={loading} className={`${loading && "cursor-not-allowed disabled"}`}>
              {!loading && t("crud.area.confirm.button.confirm") || t("crud.area.confirm.button.saving")}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Create / Update District */}
      <Modal
        isOpen={districtIsOpen}
        onClose={() => {
          setDistrictIsOpen(false);
          handleDistrictReset();
        }}
        className="max-w-4xl p-6 max-h-[80vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white cursor-default">
            {distId && t("crud.area.form.district.header.update") || t("crud.area.form.district.header.create")}
          </h3>
          <Button
            onClick={() => setDistrictIsOpen(false)}
            variant="ghost"
            size="sm"
          >
            <CloseIcon className="w-4 h-4" />
          </Button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
              {t("crud.area.form.district.districtCountryId.label")}
            </label>
            <Select
              value={distCountryId || ""}
              onChange={value => {
                setDistCountryId(value);
                setDistProvId("");
              }}
              options={countriesOptions || []}
              placeholder={t("crud.area.form.district.districtCountryId.placeholder")}
              className="cursor-pointer"
            />
            <span className="text-red-500 dark:text-red-400 text-xs">{distValidateErrors.countryId}</span>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
              {t("crud.area.form.district.districtProvId.label")}
            </label>
            <Select
              value={distProvId || ""}
              onChange={value => setDistProvId && setDistProvId(value)}
              options={provincesOptions?.filter(option => option.countryId === distCountryId) || []}
              placeholder={t("crud.area.form.district.districtProvId.placeholder")}
              className="cursor-pointer"
              disabled={!distCountryId}
            />
            <span className="text-red-500 dark:text-red-400 text-xs">{distValidateErrors.provId}</span>
          </div>
          <div>
            <label htmlFor="districtCode" className="text-sm font-medium text-gray-700 dark:text-gray-200">
              {t("crud.area.form.district.districtCode.label")}
            </label>
            <Input
              id="districtCode"
              placeholder={t("crud.area.form.district.districtCode.placeholder")}
              value={districtCode}
              onChange={(e) => setDistrictCode && setDistrictCode(e.target.value)}
            />
            <span className="text-red-500 dark:text-red-400 text-xs">{distValidateErrors.districtCode}</span>
          </div>
          <div>
            <label htmlFor="districtTh" className="text-sm font-medium text-gray-700 dark:text-gray-200">
              {t("crud.area.form.district.districtTh.label")}
            </label>
            <Input
              id="districtTh"
              placeholder={t("crud.area.form.district.districtTh.placeholder")}
              value={districtTh}
              onChange={(e) => setDistrictTh && setDistrictTh(e.target.value)}
            />
            <span className="text-red-500 dark:text-red-400 text-xs">{distValidateErrors.districtTh}</span>
          </div>
          <div>
            <label htmlFor="districtEn" className="text-sm font-medium text-gray-700 dark:text-gray-200">
              {t("crud.area.form.district.districtEn.label")}
            </label>
            <Input
              id="districtEn"
              placeholder={t("crud.area.form.district.districtEn.placeholder")}
              value={districtEn}
              onChange={(e) => setDistrictEn && setDistrictEn(e.target.value)}
            />
            <span className="text-red-500 dark:text-red-400 text-xs">{distValidateErrors.districtEn}</span>
          </div>
        </div>
        <div className="flex items-center justify-end mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex gap-3">
            <Button onClick={handleDistrictReset} variant="outline">
              {t("crud.area.action.button.reset")}
            </Button>
            <Button onClick={handleDistrictSave} variant="primary" disabled={loading} className={`${loading && "cursor-not-allowed disabled"}`}>
              {!loading && t("crud.area.confirm.button.confirm") || t("crud.area.confirm.button.saving")}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default AreaManagementComponent;
