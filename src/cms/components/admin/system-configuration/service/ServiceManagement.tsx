// /src/components/admin/system-configuration/service/ServiceManagement.tsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { CloseIcon } from "@/core/icons";
import { ToastContainer } from "@/core/components/crud/ToastContainer";
import { Modal } from "@/core/components/ui/modal";
import { usePermissions } from "@/core/hooks/usePermissions";
import { useToast } from "@/core/hooks/useToast";
import { useTranslation } from "@/core/hooks/useTranslation";
import {
  useCreateCaseTypesMutation,
  useUpdateCaseTypesMutation,
  useDeleteCaseTypesMutation,
  useCreateCaseSubTypesMutation,
  useUpdateCaseSubTypesMutation,
  useDeleteCaseSubTypesMutation
} from "@/cms/store/api/serviceApi";
import { useGetWorkflowQuery } from "@/cms/store/api/workflowApi";
import type {
  CaseSubTypesCreateData,
  CaseSubTypesUpdateData,
  CaseTypeManagementProps,
  CaseTypesCreateData,
  CaseTypesUpdateData,
  EnhancedCaseSubType,
  EnhancedCaseType,
  ServiceFocusTarget,
  // TypeAnalytics
} from "@/cms/types/case";
import type { Property } from "@/cms/types/unit";
import type { EnhancedSkill } from "@/core/types/user";
import type { Workflow, WorkflowData } from "@/cms/types/workflow";
import ServiceTypeAndSubTypeComponent from "@/cms/components/admin/system-configuration/service/ServiceTypeAndSubType";
import CustomizableSelect from "@/core/components/form/CustomizableSelect";
import Input from "@/core/components/form/input/InputField";
import Select from "@/core/components/form/Select";
import Button from "@/core/components/ui/button/Button";

// const mockAnalytics: Record<string, TypeAnalytics> = {
//   "EMERGENCY": {
//     usageCount: 245,
//     averageResolutionTime: 45,
//     slaCompliance: 98.5,
//     resourceUtilization: 85,
//     efficiency: 92,
//     lastUsed: "2025-08-26T14:30:00Z"
//   },
//   "MAINTENANCE": {
//     usageCount: 156,
//     averageResolutionTime: 180,
//     slaCompliance: 94.2,
//     resourceUtilization: 72,
//     efficiency: 88,
//     lastUsed: "2025-08-25T09:15:00Z"
//   }
// };

const ServiceManagementComponent: React.FC<CaseTypeManagementProps> = ({
  caseSubTypes,
  caseTypes,
  properties,
  skills,
  workflows,
  className
}) => {
  const permissions = usePermissions();
  const { toasts, addToast, removeToast } = useToast();
  const { language, t } = useTranslation();

  const [createCaseSubTypes] = useCreateCaseSubTypesMutation();
  const [updateCaseSubTypes] = useUpdateCaseSubTypesMutation();
  const [deleteCaseSubTypes] = useDeleteCaseSubTypesMutation();
  const [createCaseTypes] = useCreateCaseTypesMutation();
  const [updateCaseTypes] = useUpdateCaseTypesMutation();
  const [deleteCaseTypes] = useDeleteCaseTypesMutation();

  // ===================================================================
  // State management
  // ===================================================================

  // Case Sub-Type
  // The row a successful write just touched, revealed in the hierarchy once the
  // invalidated lists come back. A delete clears it - nothing left to reveal.
  const [focusTarget, setFocusTarget] = useState<ServiceFocusTarget | null>(null);

  const [caseSubType, setCaseSubType] = useState<EnhancedCaseSubType[]>(caseSubTypes || []);
  const [sTypeId, setSTypeId] = useState<string>("");
  const [sTypeTh, setSTypeTh] = useState<string>("");
  const [sTypeEn, setSTypeEn] = useState<string>("");
  const [sTypeCode, setSTypeCode] = useState<string>("");
  const [sTypeTypeId, setSTypeTypeId] = useState<string>("");
  const [caseSla, setCaseSla] = useState<string>("");
  const [priority, setPriority] = useState<string>("");
  const [unitPropLists, setUnitPropLists] = useState<string[]>([]);
  const [userSkillList, setUserSkillList] = useState<string[]>([]);
  const [wfId, setWfId] = useState("");
  const [mDeviceType, setMDeviceType] = useState<string>("");
  const [mDeviceTypeName, setMDeviceTypeName] = useState<string>("");
  const [mWorkOrderType, setMWorkOrderType] = useState<string>("");
  const [sTypeValidateErrors, setSTypeValidateErrors] = useState<{
    sTypeTh: string,
    sTypeEn: string,
    sTypeCode: string,
    sTypeTypeId: string,
    caseSla: string,
    priority: string,
    unitPropLists: string,
    userSkillList: string,
    wfId: string,
    mDeviceType: string,
    mDeviceTypeName: string,
    mWorkOrderType: string
  }>({
    sTypeTh: "",
    sTypeEn: "",
    sTypeCode: "",
    sTypeTypeId: "",
    caseSla: "",
    priority: "",
    unitPropLists: "",
    userSkillList: "",
    wfId: "",
    mDeviceType: "",
    mDeviceTypeName: "",
    mWorkOrderType: ""
  });

  const [selectedWorkflow, setSelectedWorkflow] = useState<string | null>(null);
  const { data: workflowsData } = useGetWorkflowQuery(selectedWorkflow ?? "", { skip: !selectedWorkflow });
  useEffect(() => {
    const workflows = workflowsData?.data as unknown as WorkflowData || [];
    if (workflows?.metadata?.totalSla) {
      setCaseSla(String(workflows?.metadata?.totalSla));
    }
  }, [workflowsData]);

  // Case Type
  const [caseType, setCaseType] = useState<EnhancedCaseType[]>(caseTypes || []);
  const [typeId, setTypeId] = useState<string>("");
  const [typeTh, setTypeTh] = useState<string>("");
  const [typeEn, setTypeEn] = useState<string>("");
  const [typeValidateErrors, setTypeValidateErrors] = useState<{
    typeTh: string,
    typeEn: string
  }>({ typeTh: "", typeEn: "" });

  // Property
  const [property, setProperty] = useState<Property[]>(properties || []);

  // Skill
  const [, setSkill] = useState<EnhancedSkill[]>(skills || []);

  // Workflow
  const [workflow, setWorkflow] = useState<Workflow[]>(workflows || []);

  // const [isLoading, ] = useState(false);
  const [isLoading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showInactive, ] = useState(false);
  // const [filterCategory, ] = useState<string>("all");
  // const [viewMode, ] = useState<"hierarchy" | "list">("hierarchy");
  const [, setValidationErrors] = useState<string[]>([]);

  // ===================================================================
  // Modals and dialogs
  // ===================================================================

  const [sTypeIsOpen, setSTypeIsOpen] = useState(false);
  const [sTypeConfirmIsOpen, setSTypeConfirmIsOpen] = useState(false);
  const [typeIsOpen, setTypeIsOpen] = useState(false);
  const [typeConfirmIsOpen, setTypeConfirmIsOpen] = useState(false);

  // ===================================================================
  // Fill select option
  // ===================================================================

  const [caseTypesOptions, setCaseTypesOptions] = useState<{ value: string; label: string }[]>([]);
  const [propertiesOptions, setPropertiesOptions] = useState<{ value: string; label: string }[]>([]);
  const [skillsOptions, setSkillsOptions] = useState<{ value: string; label: string }[]>([]);
  const [workflowsOptions, setWorkflowsOptions] = useState<{ value: string; label: string }[]>([]);

  // ===================================================================
  // Filter and search logic
  // ===================================================================

  const filteredTypes = useMemo(() => {
    const searchLower = searchQuery?.toLowerCase() || '';
    
    const filtered = caseType.filter(type => {
      // Check if type itself matches
      if (searchQuery) {
        const typeMatches = 
          type.en.toLowerCase().includes(searchLower) ||
          type.th.toLowerCase().includes(searchLower);
        
        if (typeMatches) {
          return !showInactive ? type.active : true;
        }
        
        // Check if any child subtype matches
        const hasMatchingChild = caseSubType.some(subType => 
          subType.typeId === type.typeId && (
            subType.en.toLowerCase().includes(searchLower) ||
            subType.th.toLowerCase().includes(searchLower) ||
            subType.sTypeCode.toLowerCase().includes(searchLower)
          )
        );
        
        if (hasMatchingChild) {
          return !showInactive ? type.active : true;
        }
        
        return false;
      }

      // No search query - apply other filters
      return !showInactive ? type.active : true;
    });

    return filtered.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  }, [caseType, caseSubType, searchQuery, showInactive]);

  const filteredSubTypes = useMemo(() => {
    if (!searchQuery) {
      return caseSubType;
    }

    const searchLower = searchQuery.toLowerCase();
    
    // Get IDs of filtered parent types
    const filteredTypeIds = filteredTypes.map(t => t.typeId);
    
    return caseSubType.filter(subType => {
      // Include if parent type is in filtered list
      if (filteredTypeIds.includes(subType.typeId)) {
        return true;
      }
      
      // OR include if subtype itself matches search
      const matchesSearch = 
        subType.en.toLowerCase().includes(searchLower) ||
        subType.th.toLowerCase().includes(searchLower) ||
        subType.sTypeCode.toLowerCase().includes(searchLower);
      
      return matchesSearch;
    });
  }, [caseSubType, filteredTypes, searchQuery]);

  // const filteredTypes = useMemo(() => {
  //   const filtered = caseType.filter(type => {
  //     // Search filter
  //     if (searchQuery) {
  //       const searchLower = searchQuery.toLowerCase();
  //       const matchesSearch = 
  //         type.en.toLowerCase().includes(searchLower) ||
  //         type.th.toLowerCase().includes(searchLower) ||
  //         type.typeId.toLowerCase().includes(searchLower);
  //       if (!matchesSearch) {
  //         return false;
  //       }
  //     }

  //     // Category filter
  //     // if (filterCategory !== "all" && type.category !== filterCategory) {
  //     //   return false;
  //     // }

  //     // Active filter
  //     if (!showInactive && !type.active) {
  //       return false;
  //     }

  //     return true;
  //   });

  //   return filtered.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  // }, [
  //   caseType,
  //   searchQuery,
  //   // filterCategory,
  //   showInactive
  // ]);

  // ===================================================================
  // Validation before saving
  // ===================================================================

  // Validate Type
  const validateType = useCallback((): string[] => {
    const errors: string[] = [];
    if (!typeTh.trim()) {
      errors.push(t("crud.service.form.type.typeTh.required"));
      setTypeValidateErrors(prev => ({ ...prev, typeTh: t("crud.service.form.type.typeTh.required") }));
    }
    if (!typeEn.trim()) {
      errors.push(t("crud.service.form.type.typeEn.required"));
      setTypeValidateErrors(prev => ({ ...prev, typeEn: t("crud.service.form.type.typeEn.required") }));
    }
    return errors;
  }, [typeEn, typeTh, t]);

  // Validate Sub-Type
  const validateSubType = useCallback((): string[] => {
    const errors: string[] = [];
    if (!sTypeTh.trim()) {
      errors.push(t("crud.service.form.sub_type.sTypeTh.required"));
      setSTypeValidateErrors(prev => ({ ...prev, sTypeTh: t("crud.service.form.sub_type.sTypeTh.required") }));
    }
    if (!sTypeEn.trim()) {
      errors.push(t("crud.service.form.sub_type.sTypeEn.required"));
      setSTypeValidateErrors(prev => ({ ...prev, sTypeEn: t("crud.service.form.sub_type.sTypeEn.required") }));
    }
    if (!sTypeCode.trim()) {
      errors.push(t("crud.service.form.sub_type.sTypeCode.required"));
      setSTypeValidateErrors(prev => ({ ...prev, sTypeCode: t("crud.service.form.sub_type.sTypeCode.required") }));
    }
    if (!sTypeTypeId.trim()) {
      errors.push(t("crud.service.form.sub_type.sTypeTypeId.required"));
      setSTypeValidateErrors(prev => ({ ...prev, sTypeTypeId: t("crud.service.form.sub_type.sTypeTypeId.required") }));
    }
    if (!caseSla.trim()) {
      // errors.push(t("crud.service.form.sub_type.caseSla.required"));
      // setSTypeValidateErrors(prev => ({ ...prev, caseSla: t("crud.service.form.sub_type.caseSla.required") }));
    }
    if (!priority.trim()) {
      errors.push(t("crud.service.form.sub_type.priority.required"));
      setSTypeValidateErrors(prev => ({ ...prev, priority: t("crud.service.form.sub_type.priority.required") }));
    }
    if (!unitPropLists) {
      errors.push(t("crud.service.form.sub_type.unitPropLists.required"));
      setSTypeValidateErrors(prev => ({ ...prev, unitPropLists: t("crud.service.form.sub_type.unitPropLists.required") }));
    }
    if (!userSkillList) {
      errors.push(t("crud.service.form.sub_type.userSkillList.required"));
      setSTypeValidateErrors(prev => ({ ...prev, userSkillList: t("crud.service.form.sub_type.userSkillList.required") }));
    }
    if (!wfId) {
      errors.push(t("crud.service.form.sub_type.wfId.required"));
      setSTypeValidateErrors(prev => ({ ...prev, wfId: t("crud.service.form.sub_type.wfId.required") }));
    }
    if (!mDeviceType.trim()) {
      errors.push(t("crud.service.form.sub_type.mDeviceType.required"));
      setSTypeValidateErrors(prev => ({ ...prev, mDeviceType: t("crud.service.form.sub_type.mDeviceType.required") }));
    }
    if (!mDeviceTypeName.trim()) {
      errors.push(t("crud.service.form.sub_type.mDeviceTypeName.required"));
      setSTypeValidateErrors(prev => ({ ...prev, mDeviceTypeName: t("crud.service.form.sub_type.mDeviceTypeName.required") }));
    }
    if (!mWorkOrderType.trim()) {
      errors.push(t("crud.service.form.sub_type.mWorkOrderType.required"));
      setSTypeValidateErrors(prev => ({ ...prev, mWorkOrderType: t("crud.service.form.sub_type.mWorkOrderType.required") }));
    }
    return errors;
  }, [caseSla, priority, sTypeCode, sTypeEn, sTypeTh, sTypeTypeId, unitPropLists, userSkillList, wfId, mDeviceType, mDeviceTypeName, mWorkOrderType, t]);

  // ===================================================================
  // Type CRUD
  // ===================================================================

  // Delete Type
  const handleTypeDelete = useCallback(async (id: number) => {
    if (!id) {
      // throw new Error("Type ID not found");
      return; // Don"t save if there are validation errors
    }
    try {
      // console.log("🚀 ~ ServiceManagementComponent ~ handleTypeDelete - id:", id);
      // throw new Error("");

      setLoading(true);
      let response;
      if (permissions.hasAnyPermission(["service.delete"])) {
        response = await deleteCaseTypes(id).unwrap();
      }
      else {
        throw new Error(t("crud.common.permission_denied"));
      }
      if (response?.status) {
        // addToast("success", `Service Management - Type: ${response?.desc || response?.msg || "Delete successfully"}`);
        addToast("success", response?.message || response?.desc || response?.msg || t("crud.service.action.type.delete.success"));
        // The lists refresh themselves now that the mutations invalidate "Cases";
        // reloading the page here was what threw away which rows were expanded.
        setFocusTarget(null);
      }
      else {
        throw new Error(response?.desc || response?.msg || t("errors.unknownApi"));
      }
    }
    catch (error) {
      // addToast("error", `Service Management - Type: ${error}`);
      addToast("error", `${(error as { data?: { message?: string } })?.data?.message
        || (error as { data?: { desc?: string } })?.data?.desc
        || (error as { data?: { msg?: string } })?.data?.msg
        || t("crud.service.action.type.delete.error")}: ${error}`);
    }
    finally {
      setLoading(false);
    }
  }, [permissions, addToast, deleteCaseTypes, t]);

  // Reset Department
  const handleTypeReset = () => {
    setTypeId("");
    setTypeTh("");
    setTypeEn("");
    setTypeValidateErrors({ typeTh: "", typeEn: "" });
  };

  // Create / Update Type
  const handleTypeSave = useCallback(async () => {
    const errors = validateType();
    setValidationErrors(errors);
    if (errors.length > 0) {
      return; // Don"t save if there are validation errors
    }
    const typeData: CaseTypesCreateData | CaseTypesUpdateData = {
      active: true,
      th: typeTh,
      en: typeEn,
    };
    try {
      // console.log("🚀 ~ ServiceManagementComponent ~ handleTypeSave - id:", typeId, "data:", typeData);
      // throw new Error("");

      setLoading(true);
      let response;
      if (permissions.hasAnyPermission(["service.create", "service.update"])) {
        if (typeId) {
          response = await updateCaseTypes({
            id: typeId, data: typeData
          }).unwrap();
        }
        else {
          response = await createCaseTypes(typeData).unwrap();
        }
      }
      else {
        throw new Error(t("crud.common.permission_denied"));
      }
      if (response?.status) {
        // addToast("success", `Service Management - Type: ${response?.desc || response?.msg || "Save successfully"}`);
        addToast("success", response?.message || response?.desc || response?.msg || (typeId && t("crud.service.action.type.update.success")) || t("crud.service.action.type.create.success"));
        // An edit knows its row id; a create is matched by name once the
        // invalidated lists come back - see ServiceFocusTarget.
        setFocusTarget({ level: "type", id: typeId || undefined, en: typeEn });
        handleTypeReset();
      }
      else {
        throw new Error(response?.desc || response?.msg || t("errors.unknownApi"));
      }
    }
    catch (error) {
      // addToast("error", `Service Management - Type: ${error}`);
      addToast("error", `${(error as { data?: { message?: string } })?.data?.message
        || (error as { data?: { desc?: string } })?.data?.desc
        || (error as { data?: { msg?: string } })?.data?.msg
        || (typeId && t("crud.service.action.type.update.success")) || t("crud.service.action.type.create.success")}: ${error}`);
    }
    finally {
      setTypeIsOpen(false);
      setLoading(false);
    }
  }, [typeEn, typeId, typeTh, permissions, addToast, createCaseTypes, t, updateCaseTypes, validateType]);

  // ===================================================================
  // Sub-Type CRUD
  // ===================================================================

  // Delete Sub-Type
  const handleSTypeDelete = useCallback(async (id: number) => {
    if (!id) {
      // throw new Error("Sub-Type ID not found");
      return; // Don"t save if there are validation errors
    }
    try {
      // console.log("🚀 ~ ServiceManagementComponent ~ handleSTypeDelete - id:", id);
      // throw new Error("");

      setLoading(true);
      let response;
      if (permissions.hasAnyPermission(["service.delete"])) {
        response = await deleteCaseSubTypes(id).unwrap();
      }
      else {
        throw new Error(t("crud.common.permission_denied"));
      }
      if (response?.status) {
        // addToast("success", `Service Management - Sub-Type: ${response?.desc || response?.msg || "Delete successfully"}`);
        addToast("success", response?.message || response?.desc || response?.msg || t("crud.service.action.sub_type.delete.success"));
        setFocusTarget(null);
      }
      else {
        throw new Error(response?.desc || response?.msg || t("errors.unknownApi"));
      }
    }
    catch (error) {
      // addToast("error", `Service Management - Sub-Type: ${error}`);
      addToast("error", `${(error as { data?: { message?: string } })?.data?.message
        || (error as { data?: { desc?: string } })?.data?.desc
        || (error as { data?: { msg?: string } })?.data?.msg
        || t("crud.service.action.sub_type.delete.error")}: ${error}`);
    }
    finally {
      setLoading(false);
    }
  }, [permissions, addToast, deleteCaseSubTypes, t]);

  // Reset Sub-Type
  const handleSTypeReset = () => {
    setSTypeId("");
    setSTypeTh("");
    setSTypeEn("");
    setSTypeCode("");
    setSTypeTypeId("");
    setCaseSla("");
    setPriority("");
    setUnitPropLists([]);
    setUserSkillList([]);
    setWfId("");
    setMDeviceType("");
    setMDeviceTypeName("");
    setMWorkOrderType("");
    setSTypeValidateErrors({
      sTypeTh: "",
      sTypeEn: "",
      sTypeCode: "",
      sTypeTypeId: "",
      caseSla: "",
      priority: "",
      unitPropLists: "",
      userSkillList: "",
      wfId: "",
      mDeviceType: "",
      mDeviceTypeName: "",
      mWorkOrderType: ""
    });
  };

  // Create / Update Sub-Type
  const handleSTypeSave = useCallback(async () => {
    const errors = validateSubType();
    setValidationErrors(errors);
    if (errors.length > 0) {
      return; // Don"t save if there are validation errors
    }
    const sTypeData: CaseSubTypesCreateData | CaseSubTypesUpdateData = {
      active: true,
      caseSla: caseSla,
      en: sTypeEn,
      priority: priority,
      sTypeCode: sTypeCode,
      th: sTypeTh,
      typeId: sTypeTypeId,
      unitPropLists: unitPropLists,
      userSkillList: userSkillList,
      wfId: wfId,
      mDeviceType: mDeviceType,
      mDeviceTypeName: mDeviceTypeName,
      mWorkOrderType: mWorkOrderType
    };
    try {
      // console.log("🚀 ~ ServiceManagementComponent ~ handleSTypeSave - id:", sTypeId, "data:", sTypeData);
      // throw new Error("");
      setLoading(true);
      let response;
      if (permissions.hasAnyPermission(["service.create", "service.update"])) {
        if (sTypeId) {          
          response = await updateCaseSubTypes({
            id: sTypeId, data: sTypeData
          }).unwrap();
        }
        else {
          response = await createCaseSubTypes(sTypeData).unwrap();
        }
      }
      else {
        throw new Error(t("crud.common.permission_denied"));
      }
      if (response?.status) {
        // addToast("success", `Service Management - Sub-Type: ${response?.desc || response?.msg || "Save successfully"}`);
        addToast("success", response?.message || response?.desc || response?.msg || (sTypeId && t("crud.service.action.sub_type.update.success")) || t("crud.service.action.sub_type.create.success"));
        setFocusTarget({ level: "subType", id: sTypeId || undefined, sTypeCode });
        handleSTypeReset();
      }
      else {
        throw new Error(response?.desc || response?.msg || t("errors.unknownApi"));
      }
    }
    catch (error) {
      // addToast("error", `Service Management - Sub-Type: ${error}`);
      addToast("error", `${(error as { data?: { message?: string } })?.data?.message
        || (error as { data?: { desc?: string } })?.data?.desc
        || (error as { data?: { msg?: string } })?.data?.msg
        || (sTypeId && t("crud.service.action.sub_type.update.success")) || t("crud.service.action.sub_type.create.success")}: ${error}`);
    }
    finally {
      setSTypeIsOpen(false);
      setLoading(false);
    }
  }, [
    caseSla, permissions, priority, sTypeCode, sTypeEn, sTypeId, sTypeTh, sTypeTypeId, unitPropLists, userSkillList, wfId, mDeviceType, mDeviceTypeName, mWorkOrderType,
    addToast, createCaseSubTypes, t, updateCaseSubTypes, validateSubType
  ]);

  // ===================================================================
  // Render
  // ===================================================================

  useEffect(() => {
    setCaseSubType(caseSubTypes || []);
    setCaseType(caseTypes|| []);
  }, [caseSubTypes, caseTypes]);

  useEffect(() => {
    setCaseTypesOptions(caseTypes?.map(t => ({
      value: String(t.typeId),
      label: language === "th" && `${t.th} (${t.en})` || `${t.en} (${t.th})`
    })) || []);
  }, [caseTypes, language]);

  useEffect(() => {
    setPropertiesOptions(properties?.map(p => ({
      value: String(p.propId),
      label: language === "th" && `${p.th} (${p.en})` || `${p.en} (${p.th})`,
    })) || []);
  }, [properties, language]);

  useEffect(() => {
    setSkillsOptions(skills?.map(s => ({
      value: String(s.skillId),
      label: language === "th" && `${s.th} (${s.en})` || `${s.en} (${s.th})`,
    })) || []);
  }, [skills, language]);

  useEffect(() => {
    setWorkflowsOptions(workflows?.map(w => ({
      value: String(w.wfId),
      label: `${w.title}`,
    })) || []);
  }, [workflows]);

  const renderServiceHierarchy = () => (
    <ServiceTypeAndSubTypeComponent
      // analytics={mockAnalytics}
      caseSubTypes={filteredSubTypes || caseSubType || []}
      caseTypes={filteredTypes || caseType || []}
      filteredTypes={filteredTypes || []}
      focusTarget={focusTarget}
      properties={property}
      searchQuery={searchQuery}
      skills={skills}
      workflows={workflow}
      handleSTypeDelete={handleSTypeDelete}
      handleSTypeReset={handleSTypeReset}
      handleTypeDelete={handleTypeDelete}
      handleTypeReset={handleTypeReset}
      setSearchQuery={setSearchQuery}
      setCaseSla={setCaseSla}
      setMDeviceType={setMDeviceType}
      setMDeviceTypeName={setMDeviceTypeName}
      setMWorkOrderType={setMWorkOrderType}
      setPriority={setPriority}
      setSTypeCode={setSTypeCode}
      setSTypeEn={setSTypeEn}
      setSTypeId={setSTypeId}
      setSTypeIsOpen={setSTypeIsOpen}
      setSTypeTh={setSTypeTh}
      setSTypeTypeId={setSTypeTypeId}
      setTypeEn={setTypeEn}
      setTypeId={setTypeId}
      setTypeIsOpen={setTypeIsOpen}
      setTypeTh={setTypeTh}
      setUnitPropLists={setUnitPropLists}
      setUserSkillList={setUserSkillList}
      setWfId={setWfId}
    />
  );

  // const tabItem: TabItem[] = [
  //   {
  //     id: "typesAndSubTypes",
  //     label: "Types & Sub-Types",
  //     content: <ServiceTypeAndSubType
  //       analytics={mockAnalytics}
  //       caseSubTypes={caseSubType}
  //       caseTypes={caseType}
  //       filteredTypes={filteredTypes}
  //       searchQuery={searchQuery}
  //       setSearchQuery={setSearchQuery}
  //     />
  //   },
  //   {
  //     id: "analytics",
  //     label: "Analytics",
  //     content: <ServiceAnalyticsContent
  //       // analytics={mockAnalytics}
  //       // filteredTypes={filteredTypes}
  //     />
  //   },
  // ];

  useEffect(() => {
    setCaseSubType(caseSubTypes || []);
  }, [caseSubTypes]);

  useEffect(() => {
    setCaseType(caseTypes || []);
  }, [caseTypes]);

  useEffect(() => {
    setProperty(properties || []);
  }, [properties]);

  useEffect(() => {
    setSkill(skills || []);
  }, [skills]);

  useEffect(() => {
    setWorkflow(workflows || []);
  }, [workflows]);

  return (
    <>
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/3 p-6">
        <div className={`mx-auto w-full ${className}`}>
          {/*
          <ServiceTypeAndSubTypeComponent
            // analytics={mockAnalytics}
            caseSubTypes={caseSubType}
            caseTypes={caseType}
            properties={property}
            workflows={workflow}
            filteredTypes={filteredTypes}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
          />
          */}
          {renderServiceHierarchy()}

          {/* <Tab items={tabItem} variant="underline" /> */}
        </div>
      </div>
      
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      
      {/* Create / Update Type */}
      <Modal
        isOpen={typeIsOpen}
        onClose={() => {
          handleTypeReset();
          setTypeConfirmIsOpen(false);
          setTypeIsOpen(false);
        }}
        className="max-w-4xl p-6 max-h-[80vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white cursor-default">
            {typeId && t("crud.service.form.type.header.update") || t("crud.service.form.type.header.create")}
          </h3>
          <Button
            onClick={() => {
              handleTypeReset();
              setTypeConfirmIsOpen(false);
              setTypeIsOpen(false);
            }}
            variant="ghost"
            size="sm"
          >
            <CloseIcon className="w-4 h-4" />
          </Button>
        </div>
        <div className="space-y-4">
          <div>
            <label htmlFor="typeTh" className="text-sm font-medium text-gray-700 dark:text-gray-200">
              {t("crud.service.form.type.typeTh.label")}
            </label>
            <Input
              id="typeTh"
              placeholder={t("crud.service.form.type.typeTh.placeholder")}
              value={typeTh}
              onChange={(e) => setTypeTh && setTypeTh(e.target.value)}
            />
            <span className="text-red-500 dark:text-red-400 text-xs">{typeValidateErrors.typeTh}</span>
          </div>
          <div>
            <label htmlFor="typeEn" className="text-sm font-medium text-gray-700 dark:text-gray-200">
              {t("crud.service.form.type.typeEn.label")}
            </label>
            <Input
              id="typeEn"
              placeholder={t("crud.service.form.type.typeEn.placeholder")}
              value={typeEn}
              onChange={(e) => setTypeEn && setTypeEn(e.target.value)}
            />
            <span className="text-red-500 dark:text-red-400 text-xs">{typeValidateErrors.typeEn}</span>
          </div>
        </div>
        <div className="flex items-center justify-end mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex gap-3">
            {!typeId && (
              <Button onClick={handleTypeReset} variant="outline">
                {t("crud.service.action.button.reset")}
              </Button>
            )}
            <Button 
              onClick={() => {
                setTypeConfirmIsOpen(true);
                setTypeIsOpen(false);
              }}
              variant="primary"
            >
              {t("crud.service.action.button.save")}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Confirm Type */}
      <Modal
        isOpen={typeConfirmIsOpen}
        onClose={() => {
          setTypeConfirmIsOpen(false);
          setTypeIsOpen(true);
        }}
        className="max-w-4xl p-6 max-h-[80vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white cursor-default">
            {typeId && t("crud.service.confirm.type.update.title") || t("crud.service.confirm.type.create.title")}
          </h3>
          <Button
            onClick={() => {
              setTypeConfirmIsOpen(false);
              setTypeIsOpen(true);
            }}
            variant="ghost"
            size="sm"
          >
            <CloseIcon className="w-4 h-4" />
          </Button>
        </div>
        <div className="space-y-4 text-gray-800 dark:text-gray-100">
          {typeId
            && t("crud.service.confirm.type.update.message").replace("_TYPE_", language === "th" && typeTh || typeEn)
            || t("crud.service.confirm.type.create.message").replace("_TYPE_", language === "th" && typeTh || typeEn)
          }
        </div>
        <div className="flex items-center justify-end mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex gap-3">
            <Button
              onClick={() => {
                setTypeConfirmIsOpen(false);
                setTypeIsOpen(true);
              }}
              variant="outline"
            >
              {t("crud.service.confirm.button.cancel")}
            </Button>
            <Button onClick={handleTypeSave} variant="success" disabled={isLoading} className={`${isLoading && "cursor-not-allowed disabled"}`}>
              {!isLoading && t("crud.service.confirm.button.confirm") || t("crud.service.confirm.button.saving")}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Create / Update Sub-Type */}
      <Modal
        isOpen={sTypeIsOpen}
        onClose={() => {
          handleSTypeReset();
          setSTypeConfirmIsOpen(false);
          setSTypeIsOpen(false);
        }}
        className="max-w-4xl p-6 max-h-[80vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white cursor-default">
            {sTypeId && t("crud.service.form.sub_type.header.update") || t("crud.service.form.sub_type.header.create")}
          </h3>
          <Button
            onClick={() => {
              handleSTypeReset();
              setSTypeConfirmIsOpen(false);
              setSTypeIsOpen(false);
            }}
            variant="ghost"
            size="sm"
          >
            <CloseIcon className="w-4 h-4" />
          </Button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
              {t("crud.service.form.sub_type.sTypeTypeId.label")}
            </label>
            <Select
              value={sTypeTypeId || ""}
              onChange={value => setSTypeTypeId && setSTypeTypeId(value)}
              options={caseTypesOptions || []}
              placeholder={t("crud.service.form.sub_type.sTypeTypeId.placeholder")}
              className="cursor-pointer"
            />
            <span className="text-red-500 dark:text-red-400 text-xs">{sTypeValidateErrors.sTypeTypeId}</span>
          </div>
          <div>
            <label htmlFor="sTypeCode" className="text-sm font-medium text-gray-700 dark:text-gray-200">
              {t("crud.service.form.sub_type.sTypeCode.label")}
            </label>
            <Input
              id="sTypeCode"
              placeholder={t("crud.service.form.sub_type.sTypeCode.placeholder")}
              value={sTypeCode}
              onChange={(e) => setSTypeCode && setSTypeCode(e.target.value)}
            />
            <span className="text-red-500 dark:text-red-400 text-xs">{sTypeValidateErrors.sTypeCode}</span>
          </div>
          <div>
            <label htmlFor="sTypeTh" className="text-sm font-medium text-gray-700 dark:text-gray-200">
              {t("crud.service.form.sub_type.sTypeTh.label")}
            </label>
            <Input
              id="sTypeTh"
              placeholder={t("crud.service.form.sub_type.sTypeTh.placeholder")}
              value={sTypeTh}
              onChange={(e) => setSTypeTh && setSTypeTh(e.target.value)}
            />
            <span className="text-red-500 dark:text-red-400 text-xs">{sTypeValidateErrors.sTypeTh}</span>
          </div>
          <div>
            <label htmlFor="sTypeEn" className="text-sm font-medium text-gray-700 dark:text-gray-200">
              {t("crud.service.form.sub_type.sTypeEn.label")}
            </label>
            <Input
              id="sTypeEn"
              placeholder={t("crud.service.form.sub_type.sTypeEn.placeholder")}
              value={sTypeEn}
              onChange={(e) => setSTypeEn && setSTypeEn(e.target.value)}
            />
            <span className="text-red-500 dark:text-red-400 text-xs">{sTypeValidateErrors.sTypeEn}</span>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
              {t("crud.service.form.sub_type.priority.label")}
            </label>
            <Select
              value={priority || ""}
              onChange={value => setPriority && setPriority(value)}
              options={[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => {
                return { value: String(n), label: String(n) }
              })}
              placeholder={t("crud.service.form.sub_type.priority.placeholder")}
              className="cursor-pointer"
            />
            <span className="text-red-500 dark:text-red-400 text-xs">{sTypeValidateErrors.priority}</span>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
              {t("crud.service.form.sub_type.unitPropLists.label")}
            </label>
            <CustomizableSelect
              options={propertiesOptions}
              value={Array.isArray(unitPropLists) ? unitPropLists : []}
              onChange={value => setUnitPropLists(value as string[])}
              placeholder={t("crud.service.form.sub_type.unitPropLists.placeholder")}
            />
            <span className="text-red-500 dark:text-red-400 text-xs">{sTypeValidateErrors.unitPropLists}</span>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
              {t("crud.service.form.sub_type.userSkillList.label")}
            </label>
            <CustomizableSelect
              options={skillsOptions}
              value={Array.isArray(userSkillList) ? userSkillList : []}
              onChange={value => setUserSkillList(value as string[])}
              placeholder={t("crud.service.form.sub_type.userSkillList.placeholder")}
            />
            <span className="text-red-500 dark:text-red-400 text-xs">{sTypeValidateErrors.userSkillList}</span>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
              {t("crud.service.form.sub_type.wfId.label")}
            </label>
            <Select
              value={wfId || ""}
              onChange={value => {
                if (setWfId) {
                  setWfId(value);
                  setSelectedWorkflow(value);
                }
              }}
              options={workflowsOptions || []}
              placeholder={t("crud.service.form.sub_type.wfId.placeholder")}
              className="cursor-pointer"
            />
            <span className="text-red-500 dark:text-red-400 text-xs">{sTypeValidateErrors.wfId}</span>
          </div>
          <div>
            <label htmlFor="caseSla" className="text-sm font-medium text-gray-700 dark:text-gray-200">
              SLA
            </label>
            <div className=" h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3 dark:bg-gray-900 dark:placeholder:text-white/30  bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-brand-500/20 dark:border-gray-700 dark:text-white/90 dark:focus:border-brand-800 cursor-default">
              {caseSla || 0}
            </div>
            {/*
            <Input
              id="caseSla"
              placeholder="Fill SLA"
              value={caseSla}
              onChange={(e) => setCaseSla && setCaseSla(e.target.value)}
            />
            <span className="text-red-500 dark:text-red-400 text-xs">{sTypeValidateErrors.caseSla}</span>
            */}
          </div>
          <div>
            <label htmlFor="mDeviceType" className="text-sm font-medium text-gray-700 dark:text-gray-200">
              {t("crud.service.form.sub_type.mDeviceType.label")}
            </label>
            <Input
              id="mDeviceType"
              placeholder={t("crud.service.form.sub_type.mDeviceType.placeholder")}
              value={mDeviceType}
              onChange={(e) => setMDeviceType && setMDeviceType(e.target.value)}
            />
            <span className="text-red-500 dark:text-red-400 text-xs">{sTypeValidateErrors.mDeviceType}</span>
          </div>
          <div>
            <label htmlFor="mDeviceTypeName" className="text-sm font-medium text-gray-700 dark:text-gray-200">
              {t("crud.service.form.sub_type.mDeviceTypeName.label")}
            </label>
            <Input
              id="mDeviceTypeName"
              placeholder={t("crud.service.form.sub_type.mDeviceTypeName.placeholder")}
              value={mDeviceTypeName}
              onChange={(e) => setMDeviceTypeName && setMDeviceTypeName(e.target.value)}
            />
            <span className="text-red-500 dark:text-red-400 text-xs">{sTypeValidateErrors.mDeviceTypeName}</span>
          </div>
          <div>
            <label htmlFor="mWorkOrderType" className="text-sm font-medium text-gray-700 dark:text-gray-200">
              {t("crud.service.form.sub_type.mWorkOrderType.label")}
            </label>
            <Input
              id="mWorkOrderType"
              placeholder={t("crud.service.form.sub_type.mWorkOrderType.placeholder")}
              value={mWorkOrderType}
              onChange={(e) => setMWorkOrderType && setMWorkOrderType(e.target.value)}
            />
            <span className="text-red-500 dark:text-red-400 text-xs">{sTypeValidateErrors.mWorkOrderType}</span>
          </div>
        </div>
        <div className="flex items-center justify-end mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex gap-3">
            {!sTypeId && (
              <Button onClick={handleSTypeReset} variant="outline">
                {t("crud.service.action.button.reset")}
              </Button>
            )}
            <Button
              onClick={() => {
                setSTypeConfirmIsOpen(true);
                setSTypeIsOpen(false);
              }}
              variant="primary"
            >
              {t("crud.service.action.button.save")}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Confirm Sub-Type */}
      <Modal
        isOpen={sTypeConfirmIsOpen}
        onClose={() => {
          setSTypeConfirmIsOpen(false);
          setSTypeIsOpen(true);
        }}
        className="max-w-4xl p-6 max-h-[80vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white cursor-default">
            {sTypeId && t("crud.service.confirm.sub_type.update.title") || t("crud.service.confirm.sub_type.create.title")}
          </h3>
          <Button
            onClick={() => {
              setSTypeConfirmIsOpen(false);
              setSTypeIsOpen(true);
            }}
            variant="ghost"
            size="sm"
          >
            <CloseIcon className="w-4 h-4" />
          </Button>
        </div>
        <div className="space-y-4 text-gray-800 dark:text-gray-100">
          {sTypeId
            && t("crud.service.confirm.sub_type.update.message").replace("_SUB_TYPE_", language === "th" && sTypeTh || sTypeEn)
            || t("crud.service.confirm.sub_type.create.message").replace("_SUB_TYPE_", language === "th" && sTypeTh || sTypeEn)
          }
        </div>
        <div className="flex items-center justify-end mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex gap-3">
            <Button
              onClick={() => {
                setSTypeConfirmIsOpen(false);
                setSTypeIsOpen(true);
              }}
              variant="outline"
            >
              {t("crud.service.confirm.button.cancel")}
            </Button>
            <Button onClick={handleSTypeSave} variant="success">
              {!isLoading && t("crud.service.confirm.button.confirm") || t("crud.service.confirm.button.saving")}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default ServiceManagementComponent;
