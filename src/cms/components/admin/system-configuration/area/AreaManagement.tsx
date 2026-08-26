// /src/components/admin/system-configuration/area/AreaManagement.tsx
import React, { useCallback, useMemo, useState } from "react";
import {
  Folder,
  Plus,
} from "lucide-react";
import { CloseIcon } from "@/core/icons";
import { Modal } from "@/core/components/ui/modal";
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
  useLazyGetCountryByIdQuery,
  useLazyGetProvinceByIdQuery,
  useLazyGetDistrictByIdQuery,
} from "@/cms/store/api/area";
import type {
  CountryCreateData, CountryUpdateData,
  AreaProvinceCreateData, AreaProvinceUpdateData,
  AreaDistrictCreateData, AreaDistrictUpdateData,
  AreaCountryTree, AreaDistrict, AreaProvince, Country, PolygonCoordinates
} from "@/cms/types/area";
import { isApiSuccess, resolveApiError, resolveApiMessage } from "@/cms/utils/apiResponse";
import { formatPolygonRings, parsePolygonRings, toCoordinatesPayload } from "@/cms/utils/areaGeometry";
import { filterAreaTrees } from "@/cms/utils/areaTree";
import { invalidateOrgBoundaryData } from "@/cms/components/case/createCase/map/boundaries/boundarySource";
import AreaFormModal, { type AreaFormField } from "@/cms/components/admin/system-configuration/area/AreaFormModal";
import {
  buildCountryFields,
  buildProvinceFields,
  buildDistrictFields
} from "@/cms/components/admin/system-configuration/area/areaFormFields";
import AreaHierarchyView, { type AreaFocusTarget, type AreaLevelPrefix } from "@/cms/components/admin/system-configuration/area/AreaHierarchyView";
import AreaTemplateSyncModal from "@/cms/components/admin/system-configuration/areaTemplate/AreaTemplateSyncModal";
import Input from "@/core/components/form/input/InputField";
import Button from "@/core/components/ui/button/Button";

interface AreaManagementProps {
  /** The org's country trees, joined client-side from the list endpoints - see useOrgAreaTrees. */
  trees: AreaCountryTree[];
  /**
   * Country list records. The hierarchy comes from `trees`; this supplies only
   * the fields the tree payload omits - currently `sourceTemplateId`.
   */
  countries: Country[];
  isLoading: boolean;
}

const AreaManagementComponent: React.FC<AreaManagementProps> = ({
  trees,
  countries,
  isLoading
}) => {
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

  // Editing reads the authoritative record rather than the tree: the tree omits
  // nameSpace entirely and is a server-side cache, so a form seeded from it would
  // silently drop whatever it does not carry on the next save.
  const [fetchCountryById] = useLazyGetCountryByIdQuery();
  const [fetchProvinceById] = useLazyGetProvinceByIdQuery();
  const [fetchDistrictById] = useLazyGetDistrictByIdQuery();

  // ===================================================================
  // State management
  // ===================================================================

  // Country - countryId identifies the record being edited (empty = create mode);
  // countryCode is the user-editable business code sent as the "countryId" API field.
  const [countryId, setCountryId] = useState<string>("");
  const [countryCode, setCountryCode] = useState("");
  const [countryTh, setCountryTh] = useState("");
  const [countryEn, setCountryEn] = useState("");
  const [countryValidateErrors, setCountryValidateErrors] = useState({ countryCode: "", countryTh: "", countryEn: "", coordinates: "" });
  // Geometry is edited as text and submitted as rings. `existing*` holds what the
  // record already had, so an edit that never touches the boundary still resends
  // it - see toCoordinatesPayload for why omitting is not safe.
  const [countryCoordinatesText, setCountryCoordinatesText] = useState("");
  const [existingCountryCoordinates, setExistingCountryCoordinates] = useState<PolygonCoordinates | null>(null);
  const [countryYearOfData, setCountryYearOfData] = useState("");
  const [countryShapeArea, setCountryShapeArea] = useState("");
  const [countryShapeLength, setCountryShapeLength] = useState("");
  const [countryNameSpace, setCountryNameSpace] = useState("");
  const [countryActive, setCountryActive] = useState(true);

  // Province
  const [provId, setProvId] = useState<string>("");
  const [provinceCode, setProvinceCode] = useState("");
  const [provCountryId, setProvCountryId] = useState("");
  const [provinceTh, setProvinceTh] = useState("");
  const [provinceEn, setProvinceEn] = useState("");
  const [provValidateErrors, setProvValidateErrors] = useState({ provinceCode: "", countryId: "", provinceTh: "", provinceEn: "", coordinates: "" });
  const [provinceCoordinatesText, setProvinceCoordinatesText] = useState("");
  const [existingProvinceCoordinates, setExistingProvinceCoordinates] = useState<PolygonCoordinates | null>(null);
  const [provinceNameSpace, setProvinceNameSpace] = useState("");
  const [provinceActive, setProvinceActive] = useState(true);

  // District
  const [distId, setDistId] = useState<string>("");
  const [districtCode, setDistrictCode] = useState("");
  const [distCountryId, setDistCountryId] = useState("");
  const [distProvId, setDistProvId] = useState("");
  const [districtTh, setDistrictTh] = useState("");
  const [districtEn, setDistrictEn] = useState("");
  const [distValidateErrors, setDistValidateErrors] = useState({ districtCode: "", countryId: "", provId: "", districtTh: "", districtEn: "", coordinates: "" });
  const [districtCoordinatesText, setDistrictCoordinatesText] = useState("");
  const [existingDistrictCoordinates, setExistingDistrictCoordinates] = useState<PolygonCoordinates | null>(null);
  const [districtNameSpace, setDistrictNameSpace] = useState("");
  const [districtActive, setDistrictActive] = useState(true);

  /** A non-empty row id is what "editing" means here - not a filled-in code. */
  const isEditingCountry = Boolean(countryId);
  const isEditingProvince = Boolean(provId);
  const isEditingDistrict = Boolean(distId);

  const [loading, setLoading] = useState(false);
  // A record fetch is in flight; the open form is showing placeholder values.
  const [isLoadingRecord, setIsLoadingRecord] = useState(false);
  // The row a successful write just touched, revealed in the tree once the
  // regenerated trees arrive. Cleared by a delete - there is nothing to reveal.
  const [focusTarget, setFocusTarget] = useState<AreaFocusTarget | null>(null);

  // The records the open edit forms were seeded from, kept so Restore can put an
  // edited form back without a second fetch. The authoritative record is already
  // in hand at that point - see handleEditRecord.
  const [loadedCountry, setLoadedCountry] = useState<Country | null>(null);
  const [loadedProvince, setLoadedProvince] = useState<AreaProvince | null>(null);
  const [loadedDistrict, setLoadedDistrict] = useState<AreaDistrict | null>(null);
  const [showInactive, setShowInactive] = useState(false);
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

  const canUpdate = permissions.hasAnyPermission(["area.create", "area.update"]);
  const canDelete = permissions.hasAnyPermission(["area.delete"]);

  // ===================================================================
  // Post-write refresh
  // ===================================================================

  /**
   * The hierarchy itself is joined from `getCountries`/`getProvinces`/`getDistricts`, and every
   * mutation above already carries `invalidatesTags: ["Area"]`, so RTK Query refetches those
   * three queries on its own - nothing to trigger here for `trees`.
   *
   * The case maps are a separate, still tree-cache-backed consumer of the same org area data
   * (`boundarySource.ts`) and cache their built boundaries for the session, so without this an
   * edit made here stays invisible there until something regenerates that cache.
   */
  const refreshAfterWrite = useCallback(async () => {
    invalidateOrgBoundaryData();
  }, []);

  // ===================================================================
  // Validation before saving
  // ===================================================================

  /** Geometry is optional; only a non-empty, malformed value is an error. */
  const geometryError = useCallback((text: string): string => {
    const parsed = parsePolygonRings(text);
    return parsed.error ? t(`crud.areaTemplate.geometry.error.${parsed.error}`) : "";
  }, [t]);

  const validateCountry = useCallback((): boolean => {
    const errors = {
      countryCode: countryCode.trim() ? "" : t("crud.area.form.country.countryCode.required"),
      countryTh: countryTh.trim() ? "" : t("crud.area.form.country.countryTh.required"),
      countryEn: countryEn.trim() ? "" : t("crud.area.form.country.countryEn.required"),
      coordinates: geometryError(countryCoordinatesText),
    };
    setCountryValidateErrors(errors);
    return Object.values(errors).every(message => !message);
  }, [countryCode, countryCoordinatesText, countryEn, countryTh, geometryError, t]);

  const validateProvince = useCallback((): boolean => {
    const errors = {
      countryId: provCountryId.trim() ? "" : t("crud.area.form.province.provinceCountryId.required"),
      provinceCode: provinceCode.trim() ? "" : t("crud.area.form.province.provinceCode.required"),
      provinceTh: provinceTh.trim() ? "" : t("crud.area.form.province.provinceTh.required"),
      provinceEn: provinceEn.trim() ? "" : t("crud.area.form.province.provinceEn.required"),
      coordinates: geometryError(provinceCoordinatesText),
    };
    setProvValidateErrors(errors);
    return Object.values(errors).every(message => !message);
  }, [provCountryId, provinceCode, provinceCoordinatesText, provinceEn, provinceTh, geometryError, t]);

  const validateDistrict = useCallback((): boolean => {
    const errors = {
      countryId: distCountryId.trim() ? "" : t("crud.area.form.district.districtCountryId.required"),
      provId: distProvId.trim() ? "" : t("crud.area.form.district.districtProvId.required"),
      districtCode: districtCode.trim() ? "" : t("crud.area.form.district.districtCode.required"),
      districtTh: districtTh.trim() ? "" : t("crud.area.form.district.districtTh.required"),
      districtEn: districtEn.trim() ? "" : t("crud.area.form.district.districtEn.required"),
      coordinates: geometryError(districtCoordinatesText),
    };
    setDistValidateErrors(errors);
    return Object.values(errors).every(message => !message);
  }, [distCountryId, distProvId, districtCode, districtCoordinatesText, districtEn, districtTh, geometryError, t]);

  // ===================================================================
  // Country CRUD
  // ===================================================================

  const handleCountryReset = useCallback(() => {
    setCountryId("");
    setCountryCode("");
    setCountryTh("");
    setCountryEn("");
    setCountryCoordinatesText("");
    setExistingCountryCoordinates(null);
    setCountryYearOfData("");
    setCountryShapeArea("");
    setCountryShapeLength("");
    setCountryNameSpace("");
    setCountryActive(true);
    setCountryValidateErrors({ countryCode: "", countryTh: "", countryEn: "", coordinates: "" });
  }, []);

  const handleCountryDelete = useCallback(async (id: number) => {
    if (!id) {
      return;
    }
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
      setFocusTarget(null);
      await refreshAfterWrite();
    }
    catch (error) {
      addToast("error", resolveApiError(error, t("crud.area.action.country.delete.error")));
    }
    finally {
      setLoading(false);
    }
  }, [permissions, addToast, deleteCountry, refreshAfterWrite, t]);

  const handleCountrySave = useCallback(async () => {
    if (!validateCountry()) {
      return;
    }
    // validateCountry already rejected malformed geometry, so this parse cannot
    // fail here; rings is [] when the field is empty.
    const { rings = [] } = parsePolygonRings(countryCoordinatesText);
    const countryData: CountryCreateData | CountryUpdateData = {
      active: countryActive,
      countryId: countryCode,
      en: countryEn,
      nameSpace: countryNameSpace,
      th: countryTh,
      // Resends the existing boundary when the user did not touch it. Dropping
      // the field here is what would let a rename blank the geometry.
      coordinates: toCoordinatesPayload(rings, existingCountryCoordinates),
      yearOfData: countryYearOfData.trim() ? Number(countryYearOfData) : null,
      shapeArea: countryShapeArea.trim() ? Number(countryShapeArea) : null,
      shapeLength: countryShapeLength.trim() ? Number(countryShapeLength) : null,
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
      setFocusTarget({ level: "country", code: countryCode });
      await refreshAfterWrite();
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
    countryCode, countryEn, countryId, countryTh, countryCoordinatesText, existingCountryCoordinates,
    countryYearOfData, countryShapeArea, countryShapeLength, countryNameSpace, countryActive,
    permissions, addToast,
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
    setProvinceCoordinatesText("");
    setExistingProvinceCoordinates(null);
    setProvinceNameSpace("");
    setProvinceActive(true);
    setProvValidateErrors({ provinceCode: "", countryId: "", provinceTh: "", provinceEn: "", coordinates: "" });
  }, []);

  const handleProvinceDelete = useCallback(async (id: number) => {
    if (!id) {
      return;
    }
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
      setFocusTarget(null);
      await refreshAfterWrite();
    }
    catch (error) {
      addToast("error", resolveApiError(error, t("crud.area.action.province.delete.error")));
    }
    finally {
      setLoading(false);
    }
  }, [permissions, addToast, deleteProvince, refreshAfterWrite, t]);

  const handleProvinceSave = useCallback(async () => {
    if (!validateProvince()) {
      return;
    }
    const { rings = [] } = parsePolygonRings(provinceCoordinatesText);
    const provinceData: AreaProvinceCreateData | AreaProvinceUpdateData = {
      active: provinceActive,
      countryId: provCountryId,
      en: provinceEn,
      nameSpace: provinceNameSpace,
      provId: provinceCode,
      th: provinceTh,
      coordinates: toCoordinatesPayload(rings, existingProvinceCoordinates),
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
      setFocusTarget({ level: "province", code: provinceCode, countryCode: provCountryId });
      await refreshAfterWrite();
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
    provCountryId, provId, provinceCode, provinceEn, provinceTh, provinceCoordinatesText,
    existingProvinceCoordinates, provinceNameSpace, provinceActive, permissions, addToast,
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
    setDistrictCoordinatesText("");
    setExistingDistrictCoordinates(null);
    setDistrictNameSpace("");
    setDistrictActive(true);
    setDistValidateErrors({ districtCode: "", countryId: "", provId: "", districtTh: "", districtEn: "", coordinates: "" });
  }, []);

  const handleDistrictDelete = useCallback(async (id: number) => {
    if (!id) {
      return;
    }
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
      setFocusTarget(null);
      await refreshAfterWrite();
    }
    catch (error) {
      addToast("error", resolveApiError(error, t("crud.area.action.district.delete.error")));
    }
    finally {
      setLoading(false);
    }
  }, [permissions, addToast, deleteDistrict, refreshAfterWrite, t]);

  const handleDistrictSave = useCallback(async () => {
    if (!validateDistrict()) {
      return;
    }
    const { rings = [] } = parsePolygonRings(districtCoordinatesText);
    const districtData: AreaDistrictCreateData | AreaDistrictUpdateData = {
      active: districtActive,
      countryId: distCountryId,
      distId: districtCode,
      en: districtEn,
      nameSpace: districtNameSpace,
      provId: distProvId,
      th: districtTh,
      coordinates: toCoordinatesPayload(rings, existingDistrictCoordinates),
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
      setFocusTarget({
        level: "district",
        code: districtCode,
        countryCode: distCountryId,
        provinceCode: distProvId
      });
      await refreshAfterWrite();
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
    distCountryId, distId, distProvId, districtCode, districtEn, districtTh, districtCoordinatesText,
    existingDistrictCoordinates, districtNameSpace, districtActive, permissions, addToast,
    createDistrict, updateDistrict, validateDistrict, handleDistrictReset, refreshAfterWrite, t
  ]);

  // ===================================================================
  // Opening the forms
  // ===================================================================

  const closeAllForms = useCallback(() => {
    setCountryIsOpen(false);
    setProvinceIsOpen(false);
    setDistrictIsOpen(false);
  }, []);

  const resetAllForms = useCallback(() => {
    handleCountryReset();
    handleProvinceReset();
    handleDistrictReset();
    // Restore points belong to the record that was open; keeping them would let
    // Restore re-seed one form from a different row.
    setLoadedCountry(null);
    setLoadedProvince(null);
    setLoadedDistrict(null);
  }, [handleCountryReset, handleProvinceReset, handleDistrictReset]);

  /**
   * Seeds the country form from a record.
   *
   * Every writable field is applied here and resent on save. That is the whole
   * point: the form is the only thing that decides what a PATCH carries, so any
   * field it does not load is a field the next save silently drops. nameSpace is
   * the concrete example - it is absent from the tree, so a tree-seeded form
   * blanked it. Shared with Restore so the two can never disagree about which
   * fields a record owns.
   */
  const applyCountryRecord = useCallback((record: Country) => {
    setCountryCode(record.countryId || "");
    setCountryTh(record.th || "");
    setCountryEn(record.en || "");
    setCountryNameSpace(record.nameSpace || "");
    setCountryActive(record.active);
    setCountryCoordinatesText(formatPolygonRings(record.coordinates));
    setExistingCountryCoordinates(record.coordinates ?? null);
    setCountryYearOfData(record.yearOfData != null ? String(record.yearOfData) : "");
    setCountryShapeArea(record.shapeArea != null ? String(record.shapeArea) : "");
    setCountryShapeLength(record.shapeLength != null ? String(record.shapeLength) : "");
    setCountryValidateErrors({ countryCode: "", countryTh: "", countryEn: "", coordinates: "" });
  }, []);

  /** See applyCountryRecord. */
  const applyProvinceRecord = useCallback((record: AreaProvince) => {
    setProvinceCode(record.provId || "");
    setProvCountryId(record.countryId || "");
    setProvinceTh(record.th || "");
    setProvinceEn(record.en || "");
    setProvinceNameSpace(record.nameSpace || "");
    setProvinceActive(record.active);
    setProvinceCoordinatesText(formatPolygonRings(record.coordinates));
    setExistingProvinceCoordinates(record.coordinates ?? null);
    setProvValidateErrors({ provinceCode: "", countryId: "", provinceTh: "", provinceEn: "", coordinates: "" });
  }, []);

  /** See applyCountryRecord. */
  const applyDistrictRecord = useCallback((record: AreaDistrict) => {
    setDistrictCode(record.distId || "");
    setDistCountryId(record.countryId || "");
    setDistProvId(record.provId || "");
    setDistrictTh(record.th || "");
    setDistrictEn(record.en || "");
    setDistrictNameSpace(record.nameSpace || "");
    setDistrictActive(record.active);
    setDistrictCoordinatesText(formatPolygonRings(record.coordinates));
    setExistingDistrictCoordinates(record.coordinates ?? null);
    setDistValidateErrors({ districtCode: "", countryId: "", provId: "", districtTh: "", districtEn: "", coordinates: "" });
  }, []);

  /**
   * Opens an edit form seeded from the authoritative record.
   *
   * Every writable field is read here and resent on save. That is the whole
   * point: the form is the only thing that decides what a PATCH carries, so any
   * field it does not load is a field the next save silently drops. nameSpace is
   * the concrete example - it is absent from the tree, so a tree-seeded form
   * blanked it.
   */
  const handleEditRecord = useCallback(async (level: "country" | "province" | "district", id: number) => {
    resetAllForms();
    closeAllForms();
    setIsLoadingRecord(true);

    // Open immediately so the click feels responsive; fields stay disabled until
    // the record lands.
    if (level === "country") {
      setCountryId(String(id));
      setCountryIsOpen(true);
    }
    else if (level === "province") {
      setProvId(String(id));
      setProvinceIsOpen(true);
    }
    else {
      setDistId(String(id));
      setDistrictIsOpen(true);
    }

    try {
      if (level === "country") {
        const record = (await fetchCountryById(id).unwrap())?.data as Country | undefined;
        if (!record) {
          throw new Error(t("errors.unknownApi"));
        }
        applyCountryRecord(record);
        setLoadedCountry(record);
      }
      else if (level === "province") {
        const record = (await fetchProvinceById(id).unwrap())?.data as AreaProvince | undefined;
        if (!record) {
          throw new Error(t("errors.unknownApi"));
        }
        applyProvinceRecord(record);
        setLoadedProvince(record);
      }
      else {
        const record = (await fetchDistrictById(id).unwrap())?.data as AreaDistrict | undefined;
        if (!record) {
          throw new Error(t("errors.unknownApi"));
        }
        applyDistrictRecord(record);
        setLoadedDistrict(record);
      }
    }
    catch (error) {
      // Saving a half-loaded form would write blanks over real data, so close it.
      closeAllForms();
      resetAllForms();
      addToast("error", resolveApiError(error, t("errors.unknownApi")));
    }
    finally {
      setIsLoadingRecord(false);
    }
  }, [
    fetchCountryById, fetchProvinceById, fetchDistrictById,
    applyCountryRecord, applyProvinceRecord, applyDistrictRecord,
    resetAllForms, closeAllForms, addToast, t
  ]);

  /**
   * Puts an edited form back to the record it was opened with.
   *
   * Re-applies the record already in hand rather than refetching: a second GET
   * would re-enter the loading state, and a failure there closes the form
   * outright, which is a harsh outcome for "undo my typing".
   */
  const handleCountryRestore = useCallback(() => {
    if (loadedCountry) {
      applyCountryRecord(loadedCountry);
    }
  }, [loadedCountry, applyCountryRecord]);

  const handleProvinceRestore = useCallback(() => {
    if (loadedProvince) {
      applyProvinceRecord(loadedProvince);
    }
  }, [loadedProvince, applyProvinceRecord]);

  const handleDistrictRestore = useCallback(() => {
    if (loadedDistrict) {
      applyDistrictRecord(loadedDistrict);
    }
  }, [loadedDistrict, applyDistrictRecord]);

  // ===================================================================
  // Save confirmation
  // ===================================================================

  /** Which form is waiting on a confirmed save; null closes the dialog. */
  const [confirmLevel, setConfirmLevel] = useState<AreaLevelPrefix | null>(null);

  /**
   * Validates, then asks.
   *
   * The order matters: a dialog the user confirms only to watch the save bounce
   * off field validation teaches them the dialog means nothing. Validating first
   * also paints the field errors, so the reason the dialog did not open is on
   * screen. The save handlers still validate on their own - they are reachable
   * from the confirm dialog, and a guard that only runs on one path is not one.
   */
  const requestSave = useCallback((level: AreaLevelPrefix) => {
    const isValid = level === "country" && validateCountry()
      || level === "province" && validateProvince()
      || level === "district" && validateDistrict();
    if (!isValid) {
      return;
    }
    setConfirmLevel(level);
  }, [validateCountry, validateProvince, validateDistrict]);

  const handleConfirmedSave = useCallback(async () => {
    const level = confirmLevel;
    if (!level) {
      return;
    }
    // Closed before the save runs so the form's own "saving" state is what the
    // user watches, rather than a dialog frozen over it.
    setConfirmLevel(null);

    if (level === "country") {
      await handleCountrySave();
    }
    else if (level === "province") {
      await handleProvinceSave();
    }
    else {
      await handleDistrictSave();
    }
  }, [confirmLevel, handleCountrySave, handleProvinceSave, handleDistrictSave]);

  /**
   * What this save does to records other than the one being saved.
   *
   * Countries, provinces and districts are joined by business code, not row id:
   * a province carries its country's `countryId` string, a district carries both
   * `countryId` and `provId`. Nothing rewrites those when a parent's code
   * changes, so re-keying a record leaves the rows below it pointing at a code
   * that no longer exists, and they drop out of the regenerated tree. Re-parenting
   * moves the record to another branch while the rows below it keep the parent
   * codes they already had, so they do not follow.
   *
   * Compared against the record the form was loaded with rather than shown on
   * every edit: a warning on a save that only renamed something is noise, and
   * noise is what teaches people to click past warnings that matter.
   *
   * Gated on the editing flag as well as the snapshot. The snapshot deliberately
   * outlives a Reset so Restore still works, which means it is also still around
   * when the next create form opens - and comparing a new record's code against
   * the last edited one would warn about a record that has no children at all.
   */
  const confirmWarnings = useMemo(() => {
    const warnings: string[] = [];
    const codeChanged = (current: string, loaded?: string) => Boolean(loaded) && current !== loaded;

    if (confirmLevel === "country" && isEditingCountry && loadedCountry) {
      if (codeChanged(countryCode, loadedCountry.countryId)) {
        warnings.push(t("crud.area.confirm.warning.code_change"));
      }
    }
    else if (confirmLevel === "province" && isEditingProvince && loadedProvince) {
      if (codeChanged(provinceCode, loadedProvince.provId)) {
        warnings.push(t("crud.area.confirm.warning.code_change"));
      }
      if (codeChanged(provCountryId, loadedProvince.countryId)) {
        warnings.push(t("crud.area.confirm.warning.parent_change"));
      }
    }
    else if (confirmLevel === "district" && isEditingDistrict && loadedDistrict) {
      if (codeChanged(districtCode, loadedDistrict.distId)) {
        warnings.push(t("crud.area.confirm.warning.code_change"));
      }
      if (codeChanged(distCountryId, loadedDistrict.countryId)
        || codeChanged(distProvId, loadedDistrict.provId)) {
        warnings.push(t("crud.area.confirm.warning.parent_change"));
      }
    }

    return warnings;
  }, [
    confirmLevel, t,
    isEditingCountry, loadedCountry, countryCode,
    isEditingProvince, loadedProvince, provinceCode, provCountryId,
    isEditingDistrict, loadedDistrict, districtCode, distCountryId, distProvId
  ]);

  /**
   * Title and body for the pending save.
   *
   * The strings already existed per level and per action and were never wired
   * up; each carries its own _COUNTRY_ / _PROVINCE_ / _DISTRICT_ placeholder.
   */
  const confirmCopy = useMemo(() => {
    if (!confirmLevel) {
      return null;
    }

    const perLevel = {
      country: {
        isEdit: isEditingCountry,
        token: "_COUNTRY_",
        name: (language === "th" ? countryTh : countryEn) || countryCode
      },
      province: {
        isEdit: isEditingProvince,
        token: "_PROVINCE_",
        name: (language === "th" ? provinceTh : provinceEn) || provinceCode
      },
      district: {
        isEdit: isEditingDistrict,
        token: "_DISTRICT_",
        name: (language === "th" ? districtTh : districtEn) || districtCode
      }
    }[confirmLevel];

    const action = perLevel.isEdit ? "update" : "create";

    return {
      title: t(`crud.area.confirm.${confirmLevel}.${action}.title`),
      message: t(`crud.area.confirm.${confirmLevel}.${action}.message`).replace(perLevel.token, perLevel.name)
    };
  }, [
    confirmLevel, language, t,
    isEditingCountry, countryTh, countryEn, countryCode,
    isEditingProvince, provinceTh, provinceEn, provinceCode,
    isEditingDistrict, districtTh, districtEn, districtCode
  ]);

  /** Opens a create form for a child, seeded with its parent's codes. */
  const handleCreateChild = useCallback((
    level: "country" | "province" | "district",
    parent: { countryCode?: string; provinceCode?: string }
  ) => {
    resetAllForms();
    closeAllForms();

    if (level === "province") {
      setProvCountryId(parent.countryCode || "");
      setProvinceIsOpen(true);
    }
    else if (level === "district") {
      setDistCountryId(parent.countryCode || "");
      setDistProvId(parent.provinceCode || "");
      setDistrictIsOpen(true);
    }
  }, [resetAllForms, closeAllForms]);

  // ===================================================================
  // Form field definitions
  // ===================================================================

  const countryFields: AreaFormField[] = buildCountryFields({
    t,
    countryCode,
    countryTh,
    countryEn,
    countryYearOfData,
    countryShapeArea,
    countryShapeLength,
    countryNameSpace,
    countryActive,
    countryCoordinatesText,
    countryValidateErrors,
    setCountryCode,
    setCountryTh,
    setCountryEn,
    setCountryYearOfData,
    setCountryShapeArea,
    setCountryShapeLength,
    setCountryNameSpace,
    setCountryActive,
    setCountryCoordinatesText
  });

  const provinceFields: AreaFormField[] = buildProvinceFields({
    t,
    countriesOptions,
    provinceCode,
    provCountryId,
    provinceTh,
    provinceEn,
    provinceNameSpace,
    provinceActive,
    provinceCoordinatesText,
    provValidateErrors,
    setProvinceCode,
    setProvCountryId,
    setProvinceTh,
    setProvinceEn,
    setProvinceNameSpace,
    setProvinceActive,
    setProvinceCoordinatesText
  });

  const districtFields: AreaFormField[] = buildDistrictFields({
    t,
    countriesOptions,
    provincesOptions,
    districtCode,
    distCountryId,
    distProvId,
    districtTh,
    districtEn,
    districtNameSpace,
    districtActive,
    districtCoordinatesText,
    distValidateErrors,
    setDistrictCode,
    setDistCountryId,
    setDistProvId,
    setDistrictTh,
    setDistrictEn,
    setDistrictNameSpace,
    setDistrictActive,
    setDistrictCoordinatesText
  });

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

                    {/* Inactive rows are hidden by default. Without this they were
                        unreachable entirely - and so was any way to reactivate them. */}
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={showInactive}
                        onChange={event => setShowInactive(event.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-200">
                        {t("crud.common.list.toolbar.show_inactive")}
                      </span>
                    </label>
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
            {/* Loading state - only when there is nothing to show yet. Swapping the
                hierarchy out for this on every reload is what unmounted HierarchyView
                and threw away which rows the user had expanded; a write reloads the
                trees, so the tree came back fully folded after every save. */}
            {isLoading && !hasRecords && (
              <div className="flex items-center justify-center py-12 text-gray-500 dark:text-gray-400 cursor-default">
                {t("crud.common.loading_records")}
              </div>
            )}
            {/* Refreshing an already-rendered tree: say so without unmounting it.
                useOrgAreaTrees keeps the previous trees until the refetch settles. */}
            {isLoading && hasRecords && (
              <div className="mb-3 text-sm text-gray-500 dark:text-gray-400 cursor-default">
                {t("crud.common.loading_records")}
              </div>
            )}
            {/* Content */}
            {hasRecords && (
              <AreaHierarchyView
                trees={filteredTrees}
                countries={countries || []}
                showInactive={showInactive}
                canUpdate={canUpdate}
                canDelete={canDelete}
                focusTarget={focusTarget}
                handleCountryDelete={handleCountryDelete}
                handleProvinceDelete={handleProvinceDelete}
                handleDistrictDelete={handleDistrictDelete}
                onEditRecord={handleEditRecord}
                onCreateChild={handleCreateChild}
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
        isLoadingRecord={isLoadingRecord}
        onClose={() => {
          setCountryIsOpen(false);
          handleCountryReset();
        }}
        onReset={handleCountryReset}
        onRestore={isEditingCountry ? handleCountryRestore : undefined}
        onSave={() => requestSave("country")}
      />

      {/* Create / Update Province */}
      <AreaFormModal
        isOpen={provinceIsOpen}
        title={provId && t("crud.area.form.province.header.update") || t("crud.area.form.province.header.create")}
        fields={provinceFields}
        loading={loading}
        isLoadingRecord={isLoadingRecord}
        onClose={() => {
          setProvinceIsOpen(false);
          handleProvinceReset();
        }}
        onReset={handleProvinceReset}
        onRestore={isEditingProvince ? handleProvinceRestore : undefined}
        onSave={() => requestSave("province")}
      />

      {/* Create / Update District */}
      <AreaFormModal
        isOpen={districtIsOpen}
        title={distId && t("crud.area.form.district.header.update") || t("crud.area.form.district.header.create")}
        fields={districtFields}
        loading={loading}
        isLoadingRecord={isLoadingRecord}
        onClose={() => {
          setDistrictIsOpen(false);
          handleDistrictReset();
        }}
        onReset={handleDistrictReset}
        onRestore={isEditingDistrict ? handleDistrictRestore : undefined}
        onSave={() => requestSave("district")}
      />

      {/* Confirm a create or an edit. Rendered after the form modals on purpose -
          see the note above requestSave for why it opens only once validation passes. */}
      <Modal
        isOpen={Boolean(confirmLevel)}
        onClose={() => setConfirmLevel(null)}
        className="max-w-xl p-6 max-h-[80vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white cursor-default">
            {confirmCopy?.title}
          </h3>
          <Button onClick={() => setConfirmLevel(null)} size="sm" variant="ghost">
            <CloseIcon className="w-4 h-4" />
          </Button>
        </div>
        <div className="space-y-4 text-gray-800 dark:text-gray-100 cursor-default">
          {confirmCopy?.message}

          {confirmWarnings.map(warning => (
            <p
              key={warning}
              className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-700 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-400"
            >
              {warning}
            </p>
          ))}
        </div>
        <div className="flex items-center justify-end mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex gap-3">
            <Button onClick={() => setConfirmLevel(null)} variant="outline">
              {t("crud.area.confirm.button.cancel")}
            </Button>
            <Button onClick={handleConfirmedSave} variant="success" disabled={loading}>
              {!loading && t("crud.area.confirm.button.confirm") || t("crud.area.confirm.button.saving")}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Import / sync from an area template */}
      <AreaTemplateSyncModal
        isOpen={syncIsOpen}
        trees={trees || []}
        countries={countries || []}
        onClose={() => setSyncIsOpen(false)}
        onSuccess={message => addToast("success", message)}
        onError={message => addToast("error", message)}
      />
    </>
  );
};

export default AreaManagementComponent;
