// src/cms/components/case/CaseHistory.tsx
import React, {
  useCallback,
  useEffect,
  // useMemo,
  useState
} from "react";
import { useNavigate } from "react-router-dom";
// import {
//   // AtSign,
//   Building,
//   ChartColumnStacked,
//   CheckCircle,
//   ClockArrowUp,
//   Contact,
//   Cpu,
//   // Mail,
//   MapPin,
//   MapPinHouse,
//   Phone,
//   Share2,
//   Siren,
//   Tag,
//   Ticket,
//   // Truck,
//   User
// } from "lucide-react";
import { CalenderIcon, ChatIcon, TimeIcon, UserIcon } from "@/core/icons";
// import { PermissionGate } from "@/core/components/auth/PermissionGate";
// import { CaseTimelineSteps } from "@/cms/components/case/CaseTimelineSteps";
// import { mapSopToOrderedProgress } from "@/cms/components/case/sopStepTranForm";
// import { source } from "@/cms/components/case/constants/caseConstants";
import { EnhancedCrudContainer } from "@/core/components/crud/EnhancedCrudContainer";
import { TableSkeleton } from "@/core/components/ui/loading/LoadingSystem";
// import { ProgressTimeline } from "@/cms/components/ui/progressTimeline/ProgressTimeline";
import { useIsSystemAdmin } from "@/core/hooks/useIsSystemAdmin";
import { usePermissions } from "@/core/hooks/usePermissions";
import { useTranslation } from "@/core/hooks/useTranslation";
// import { USE_GRAPHQL } from "@/core/utils/constants";
import { Area } from "@/cms/store/api/area";
import {
  // DepartmentCommandStationDataMerged,
  // mergeDeptCommandStation,
  useGetCaseHistoryQuery,
  // useGetListCaseQuery,
  useLazyGetListCaseQuery
} from "@/cms/store/api/caseApi";
// import { useGetListCaseGqlQuery } from "@/cms/store/api/graphql/caseGqlApi";
// import { useGetCaseSopQuery } from "@/cms/store/api/dispatch";
// import { useGetUserByUserNameQuery } from "@/core/store/api/userApi";
// import { AuthService } from "@/cms/utils/authService";
import { CASE_CANNOT_DELETE, CASE_CANNOT_UPDATE, PRIORITY_LABELS_SHORT, PRIORITY_CONFIG } from "@/cms/utils/constants";
import { formatDate } from "@/core/utils/crud";
import type { CaseListParams } from "@/cms/store/api/caseApi";
import type {
  CaseEntity,
  // CaseHistories,
  CaseHistory,
  CaseStatus,
  CaseTypeSubType,
  EnhancedCaseSubType,
  EnhancedCaseType
} from "@/cms/types/case";
// import type { CaseSop, UnitWithSop } from "@/cms/types/dispatch";
import type { PreviewConfig } from "@/core/types/enhanced-crud";
import type { UserProfile } from "@/core/types/user";
// import AttachedFiles from "@/cms/components/Attachment/AttachmentPreviewList";
// import ProgressStepPreview from "@/cms/components/case/activityTimeline/caseActivityTimeline";
// import ProgressStepPreviewUnit from "@/cms/components/case/activityTimeline/officerActivityTimeline";
// import ProgressSummary from "@/cms/components/case/activityTimeline/sumaryUnitProgress";
import OverviewTab from "@/cms/components/case/OverviewTab";
import PageBreadcrumb from "@/core/components/common/PageBreadCrumb";
// import FormViewer from "@/cms/components/form/dynamic-form/FormViewValue";
import Badge from "@/core/components/ui/badge/Badge";
// import caseHistoryList from "@/mocks/caseHistoryList.json";

const CaseHistoryComponent: React.FC<{
  areas: Area[];
  // caseHistories: CaseEntity[];
  // caseHistories: CaseHistories;
  caseStatuses: CaseStatus[];
  caseStatusesAll: string;
  caseSubTypes: EnhancedCaseSubType[];
  caseTypes: EnhancedCaseType[];
  caseTypesSubTypes: CaseTypeSubType[];
  users: UserProfile[];
}> = ({
  areas,
  // caseHistories,
  caseStatuses,
  caseStatusesAll,
  caseSubTypes,
  caseTypes,
  caseTypesSubTypes,
  users
}) => {
  const { t, language } = useTranslation();

  // const isSystemAdmin = AuthService.isSystemAdmin();
  const isSystemAdmin = useIsSystemAdmin();

  // const { data: userData, isLoading } = useGetUserByUserNameQuery({ username: officer.unit.username });
  const navigate = useNavigate();
  const permissions = usePermissions();
  
  const [crudOpen, ] = useState("block");
  // const [selectedCaseForAssignee, setSelectedCaseForAssignee] = useState<string | null>(null);
  const [selectedCaseForHistory, setSelectedCaseForHistory] = useState<string | null>(null);
  // const [selectedCaseForSop, setSelectedCaseForSop] = useState<string | null>(null);
  // const [selectedCaseForUnit, setSelectedCaseForUnit] = useState<string | null>(null);
  // const [sopData, setSopData] = useState<CaseSop | null>(null);
  // const [, setAssigneeData] = useState<UnitWithSop | null>(null);
  // const [, setUnitData] = useState<UnitWithSop | null>(null);

  // ===================================================================
  // Fill select option
  // ===================================================================

  const [caseSubTypesOptions, setCaseSubTypesOptions] = useState<{ value: string; label: string }[]>([]);
  const [caseTypesOptions, setCaseTypesOptions] = useState<{ value: string; label: string }[]>([]);
  const [countryIdOptions, setCountryIdOptions] = useState<{ value: string; label: string }[]>([]);
  const [distIdOptions, setDistIdOptions] = useState<{ value: string; label: string }[]>([]);
  const [provIdOptions, setProvIdOptions] = useState<{ value: string; label: string }[]>([]);
  const [usersOptions, setUsersOptions] = useState<{ value: string; label: string }[]>([]);

  useEffect(() => {
    setCaseSubTypesOptions(caseSubTypes?.length && caseSubTypes?.map(cst => ({
      value: String(cst.sTypeId),
      label: `${cst.sTypeCode}-${language === "th" ? cst.th : cst.en}`
    })) || []);
  }, [caseSubTypes, language]);

  useEffect(() => {
    setCaseTypesOptions(caseTypes?.length && caseTypes?.map(ct => ({
      value: String(ct.typeId),
      label: language === "th" ? ct.th : ct.en
    })) || []);
  }, [caseTypes, language]);

  useEffect(() => {
    setCountryIdOptions(areas?.length && areas.filter(
      (item, index, self) => index === self.findIndex(t => t.countryId === item.countryId)
    )?.map(a => ({
      value: String(a.countryId),
      label: language === "th" ? a.countryTh : a.countryEn
    })) || []);

    setDistIdOptions(areas?.length && areas.filter(
      (item, index, self) => index === self.findIndex(t => t.distId === item.distId)
    )?.map(a => ({
      value: String(a.distId),
      label: language === "th" ? a.districtTh : a.districtEn
    })) || []);

    setProvIdOptions(areas?.length && areas.filter(
      (item, index, self) => index === self.findIndex(t => t.provId === item.provId)
    )?.map(a => ({
      value: String(a.provId),
      label: language === "th" ? a.provinceTh : a.provinceEn
    })) || []);
  }, [areas, language]);

  useEffect(() => {
    setUsersOptions(users?.length && users?.map(u => ({
      value: String(u.username),
      label: `${u.username} (${u.firstName} ${u.lastName})`
    })) || []);
  }, [users]);

  // API query params state
  const [queryParams, setQueryParams] = useState<CaseListParams>({
    start: 0,
    length: 10,
    start_date: "",
    end_date: "",
    caseType: "",
    caseSType: "",
    // statusId: "",
    statusId: caseStatusesAll || "",
    detail: "",
    caseId: "",
    countryId: "",
    provId: "",
    // distId: distIdCommaSeparate() || "",
    category: "",
    createBy: "",
    orderBy: "",
    direction: ""
  });

  // const [data, setData] = useState<(CaseEntity & { id: string; title?: string })[] | []>([]);
  // const [currentPage, setCurrentPage] = useState<number>(1);
  // const [pageSize, setPageSize] = useState<number>(10);
  // const [totalFiltered, setTotalFiltered] = useState<number>(0);
  // const [totalPage, setTotalPage] = useState<number>(1);
  // const [totalRecords, setTotalRecords] = useState<number>(0);

  // const [start, setStart] = useState<number>(0);
  // const [length, setLength] = useState<number>(pageSize);
  // const [start_date, setStart_date] = useState<string>("");
  // const [end_date, setEnd_date] = useState<string>("");
  // const [caseType, setCaseType] = useState<string>("");
  // const [caseSType, setCaseSType] = useState<string>("");
  // const [statusId, setStatusId] = useState<string>("");
  // const [detail, setDetail] = useState<string>("");
  // // const [caseId, setCaseId] = useState<string>("");
  // const [countryId, setCountryId] = useState<string>("");
  // const [provId, setProvId] = useState<string>("");
  // const [distId, setDistId] = useState<string>("");
  // const [category, setCategory] = useState<string>("");
  // const [createBy, setCreateBy] = useState<string>("");
  // const [orderBy, setOrderBy] = useState<string>("");
  // const [direction, setDirection] = useState<string>("");

  // const caseHistoriesResponse = useGetListCaseQuery({
  //   start: start ?? 0,
  //   length: length ?? 10,
  //   start_date: start_date ?? "",
  //   end_date: end_date ?? "",
  //   caseType: caseType ?? "",
  //   caseSType: caseSType ?? "",
  //   statusId: statusId ?? "",
  //   detail: detail ?? "",
  //   caseId: selectedCaseForHistory ?? "",
  //   countryId: countryId ?? "",
  //   provId: provId ?? "",
  //   distId: distId ?? "",
  //   category: category ?? "",
  //   createBy: createBy ?? "",
  //   orderBy: orderBy ?? "",
  //   direction: direction ?? ""
  // });

  // const { data: response, isLoading } = useGetListCaseQuery(queryParams);
  // const { data: response, isLoading } = useGetListCaseQuery(queryParams, { skip: !caseStatusesAll });

  // const shouldSkipGql = !USE_GRAPHQL || !caseStatusesAll || !queryParams?.statusId;
  // const gqlQueryResult = useGetListCaseGqlQuery(queryParams, { skip: shouldSkipGql });
  // const [restTrigger, restQueryResult] = useLazyGetListCaseQuery();
  // const { data: response, isLoading } = USE_GRAPHQL ? gqlQueryResult : restQueryResult;

  const [trigger, { data: response, isLoading }] = useLazyGetListCaseQuery();

  useEffect(() => {
    setQueryParams(prev => ({
      ...prev,
      statusId: caseStatusesAll,
    }));
  }, [caseStatusesAll]);

  useEffect(() => {
    if (caseStatusesAll && queryParams?.statusId) {
      trigger(queryParams);

      // if (!USE_GRAPHQL) {
      //   restTrigger(queryParams); // Manually trigger the query for REST
      // }
    }
  }, [
    queryParams,
    caseStatusesAll,
    trigger,
    // restTrigger
  ]);

  // const { data: caseHistoriesResponse, isLoading } = useGetListCaseQuery(queryParams);
  // const caseHistories = caseHistoriesResponse?.data as unknown as CaseEntity[] || [];

  // const { data: caseHistoriesResponse } = useGetListCaseQuery({ start: 0, length: 10 });
  // const caseHistories = caseHistoriesResponse?.data as unknown as CaseEntity[] || [];

  // Extract pagination data from response
  const caseHistories = response?.data as unknown as CaseEntity[] || [];
  // const caseHistories = response?.data || [];
  
  const queryStart = queryParams.start ?? 0;
  const queryLength = queryParams.length ?? 10;

  const currentPage = Math.floor(queryStart / queryLength) + 1;
  const pageSize = queryParams.length;
  const totalFiltered = response?.totalFiltered || 0;
  const totalPages = Math.ceil(totalFiltered / queryLength);
  const totalRecords = response?.totalRecords || 0;

  const clearFilters = () => {
    setQueryParams({
      start: 0,
      length: queryParams.length,
      start_date: "",
      end_date: "",
      caseType: "",
      caseSType: "",
      // statusId: "",
      statusId: caseStatusesAll || "",
      detail: "",
      caseId: "",
      countryId: "",
      provId: "",
      // distId: distIdCommaSeparate() || "",
      category: "",
      createBy: "",
      orderBy: "",
      direction: ""
    });
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    setQueryParams(prev => ({
      ...prev,
      start: (page - 1) * (pageSize || 10)
    }));
  };

  // Handle page size change
  const handlePageSizeChange = (size: number) => {
    setQueryParams(prev => ({
      ...prev,
      length: size,
      start: 0
    }));
  };

  // Handle search
  const handleSearch = (searchText: string) => {
    setQueryParams(prev => ({
      ...prev,
      // detail: searchText,
      caseId: searchText,
      start: 0
    }));
  };

  // Handle filter change
  const handleFilterChange = (key: string, value: string | number | boolean | null | undefined) => {
    setQueryParams(prev => ({
      ...prev,
      [key]: value,
      start: 0 
    }));
  };

  // Handle sort
  const handleSort = (field: string, direction: string) => {
    setQueryParams(prev => ({
      ...prev,
      orderBy: field,
      direction: direction
    }));
  };

  // const handleAdvancedFilter = (filters: Record<string, unknown>) => {
  //   setQueryParams(prev => ({
  //     ...prev,
  //     ...filters,
  //     start: 0
  //   }));
  // };
  
  // const { data: dispatchSOPsData } = useGetCaseSopQuery(
  //   { caseId: selectedCaseForSop ?? "" }, 
  //   { skip: !selectedCaseForSop }
  // );
  
  // const { data: gqlData } = useGetListCaseGqlQuery({ caseId: selectedCaseForHistory ?? ""  }, { skip: !USE_GRAPHQL && !selectedCaseForHistory });
  // const { data: restData } = useGetCaseHistoryQuery({ caseId: selectedCaseForHistory ?? ""  }, { skip: USE_GRAPHQL || !selectedCaseForHistory });
  // const caseHistoriesData = USE_GRAPHQL ? gqlData : restData;

  const { data: caseHistoriesData } = useGetCaseHistoryQuery(
    { caseId: selectedCaseForHistory ?? ""  }, 
    { skip: !selectedCaseForHistory }
  );

  // const { data: unitsData } = useGetUserByUserNameQuery(
  //   { username: selectedCaseForUnit ?? "" }, 
  //   { skip: !selectedCaseForUnit }
  // );

  // const { data: assigneesData } = useGetUserByUserNameQuery(
  //   { username: selectedCaseForAssignee ?? "" }, 
  //   { skip: !selectedCaseForAssignee }
  // );

  const isCancelAvailable = (data: CaseEntity) => {
    const canCancel = permissions.hasPermission("case.delete") && !CASE_CANNOT_DELETE.includes(data.statusId as typeof CASE_CANNOT_DELETE[number]);
    // console.log("🚀 ~ isCancelAvailable ~ canCancel:", canCancel);
    return canCancel || isSystemAdmin;
  }

  const isEditAvailable = (data: CaseEntity) => {
    const canEdit = permissions.hasPermission("case.update") && !CASE_CANNOT_UPDATE.includes(data.statusId as typeof CASE_CANNOT_UPDATE[number]);
    // console.log("🚀 ~ isEditAvailable ~ canEdit:", canEdit);
    return canEdit || isSystemAdmin;
  }

  const isViewAvailable = () => {
    const canView = permissions.hasPermission("case.view");
    // console.log("🚀 ~ isCancelAvailable ~ canView:", canView);
    return canView || isSystemAdmin;
  }

  // ===================================================================
  // Case Status Properties
  // ===================================================================

  // const caseStatusesColorMap: Record<string, string> = {
  //   "#000000": "bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-100 border border-gray-300 dark:border-gray-600",
  //   "#F9C601": "bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100 border border-yellow-300 dark:border-yellow-600",
  //   "#852B99": "bg-purple-100 text-purple-800 dark:bg-purple-800 dark:text-purple-100 border border-purple-300 dark:border-purple-600",
  //   "#FF0080": "bg-pink-100 text-pink-800 dark:bg-pink-800 dark:text-pink-100 border border-pink-300 dark:border-pink-600",
  //   "#295F79": "bg-cyan-100 text-cyan-800 dark:bg-cyan-800 dark:text-cyan-100 border border-cyan-300 dark:border-cyan-600",
  //   "#468847": "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100 border border-green-300 dark:border-green-600",
  //   "#999999": "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100 border border-gray-300 dark:border-gray-600",
  //   "#FF8000": "bg-orange-100 text-orange-800 dark:bg-orange-800 dark:text-orange-100 border border-orange-300 dark:border-orange-600",
  //   "#FF0000": "bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100 border border-red-300 dark:border-red-600",
  //   "#B94A48": "bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100 border border-red-300 dark:border-red-600",
  //   null: "bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-100 border border-gray-300 dark:border-gray-600"
  // };

  const generateStatusConfigs = (data: CaseStatus[]) => {
    const configs: Record<string, { color?: string; label: string, style: { background: string, border: string, color: string }}> = {};
    data.forEach(item => {
      configs[item.statusId] = {
        // color: caseStatusesColorMap[item.color as keyof typeof caseStatusesColorMap] || caseStatusesColorMap.null,
        label: item[language as keyof CaseStatus] as string || item?.th || item?.en,
        // style: `background:transparent;border:1px solid ${item.color};color:${item.color}`
        style: {
          background: "transparent",
          border: `1px solid ${item?.color || "#000000"}`,
          color: item?.color || "#000000"
        }
      };
    });
    // console.log("🚀 ~ generateStatusConfigs ~ configs:", configs);
    return configs;
  }

  const statusConfigs = generateStatusConfigs(caseStatuses);

  const getStatusConfig = (caseItem: CaseEntity) => {
    // console.log("🚀 ~ getStatusConfig ~ statusConfigs:", statusConfigs[caseItem.statusId]);
    return statusConfigs[caseItem.statusId as keyof typeof statusConfigs] || statusConfigs["S000"];
  };

  const caseStatusOptions = [{
    value: caseStatusesAll,
    label: language === "th" ? "ทั้งหมด" : "All"
  }]

  // const caseStatusOptions = Array.isArray(caseStatuses) ? caseStatuses.map((caseStatus) => ({
  //   value: caseStatus?.statusId || "",
  //   label: caseStatus[language as keyof CaseStatus] as string || caseStatus?.th || caseStatus?.en
  // })) : [];

  caseStatuses.map(caseStatus => {
    caseStatusOptions.push({
      value: caseStatus?.statusId || "",
      label: caseStatus[language as keyof CaseStatus] as string || caseStatus?.th || caseStatus?.en
    });
  });

  // ===================================================================
  // Case Priority Properties
  // ===================================================================

  const generatePriorityConfigs = () => {
    const langKey = language as keyof typeof PRIORITY_LABELS_SHORT.high;
    return PRIORITY_CONFIG.flatMap(({ type, count, color, icon }) =>
      Array(count).fill(null).map(() => ({
        color,
        icon,
        label: PRIORITY_LABELS_SHORT[type][langKey]
      }))
    );
  }

  const priorityConfigs = generatePriorityConfigs();

  const getPriorityConfig = (caseItem: CaseEntity) => {
    return priorityConfigs[caseItem.priority as number] || priorityConfigs[9];
  };

  // ===================================================================
  // Case Type Sub-Type Properties
  // ===================================================================

  const generateTypeSubTypeConfigs = (data: CaseTypeSubType[]) => {
    return Array.isArray(data) ? data.map((caseTypeSubType) => ({
      en: caseTypeSubType?.en || "",
      th: caseTypeSubType?.th || "",
      subTypeEn: caseTypeSubType?.subTypeEn || "",
      subTypeTh: caseTypeSubType?.subTypeTh || "",
      sTypeCode: caseTypeSubType?.sTypeCode || "",
      sTypeId: caseTypeSubType?.sTypeId || ""
    })) : []
  }

  const typeSubTypeConfigs = generateTypeSubTypeConfigs(caseTypesSubTypes);

  // const getTypeSubTypeConfig = (caseItem: CaseEntity) => {
  //   const found = typeSubTypeConfigs?.find(config => 
  //     config.sTypeId === caseItem.caseSTypeId
  //   ) || null;
  //   return found || { 
  //     en: "", 
  //     th: "", 
  //     subTypeEn: "", 
  //     subTypeTh: "", 
  //     sTypeCode: "" 
  //   };
  // };

  const getTypeSubTypeConfig = useCallback((caseItem: CaseEntity) => {
    const found = typeSubTypeConfigs?.find(config => 
      config.sTypeId === caseItem.caseSTypeId
    ) || null;
    return found || { 
      en: "", 
      th: "", 
      subTypeEn: "", 
      subTypeTh: "", 
      sTypeCode: "" 
    };
  }, [typeSubTypeConfigs]);

  // const caseTitle = (data: CaseEntity) => {
  //   const config = getTypeSubTypeConfig(data);
  //   const sTypeCode = config.sTypeCode || "";
  //   const displayName = `${(language === "th" && config.th) || config.en || ""}-${(language === "th" && config.subTypeTh) || config.subTypeEn || ""}`;
  //   return sTypeCode && displayName && `${sTypeCode}-${displayName}` || <TableSkeleton rows={0} columns={1} />;
  // };

  const caseTitle = useCallback((data: CaseEntity) => {
    const config = getTypeSubTypeConfig(data);
    const sTypeCode = config.sTypeCode || "";
    const displayName = `${(language === "th" && config.th) || config.en || ""}-${(language === "th" && config.subTypeTh) || config.subTypeEn || ""}`;
    return sTypeCode && displayName && `${sTypeCode}-${displayName}` || <TableSkeleton rows={0} columns={1} />;
  }, [language, getTypeSubTypeConfig]);

  // const caseTypesSubTypesOptions = Array.isArray(caseTypesSubTypes)
  //   ? caseTypesSubTypes
  //     .slice() // make a shallow copy to avoid mutating the original array
  //     .sort((a, b) => (a.sTypeCode || "").localeCompare(b.sTypeCode || ""))
  //     .map((caseTypeSubType) => ({
  //       value: caseTypeSubType?.sTypeId || "",
  //       label: `${caseTypeSubType.sTypeCode || "Unknown:Code"}-${
  //         caseTypeSubType[language as keyof CaseTypeSubType] as string || caseTypeSubType?.th || caseTypeSubType?.en || "Unknown:Type"
  //       }-${
  //         (language === "th" && caseTypeSubType?.subTypeTh) || caseTypeSubType?.subTypeEn || "Unknown:Name"
  //       }`,
  //     }))
  //   : [];

  // ===================================================================
  // Areas Properties
  // ===================================================================

  // const generateAreaConfigs = (data: Area[]) => {
  //   return Array.isArray(data) ? data.map((area) => ({
  //     distId: area?.distId || "",
  //     district: (language === "th" && area?.districtTh) || area?.districtEn || "",
  //     province: (language === "th" && area?.provinceTh) || area?.provinceEn || "",
  //     country: (language === "th" && area?.countryTh) || area?.countryEn || "",
  //   })) : []
  // }

  // const areaConfigs = generateAreaConfigs(areas);

  // const getAreaConfig = (
  //   // caseItem: CaseEntity
  //   caseItem: CaseSop
  // ) => {
  //   const found = areaConfigs?.find(config => 
  //     config?.distId === caseItem?.distId
  //   ) || null;
  //   return found || {
  //     distId: "",
  //     district: "", 
  //     province: "", 
  //     country: ""
  //   };
  // };

  // ===================================================================
  // Case History Mock Data
  // ===================================================================

  // const data: CaseEntity[] = caseHistoryList as unknown as CaseEntity[];

  // ===================================================================
  // Case History Real Functionality Data
  // ===================================================================

  const data: (CaseEntity & { id: string })[] = caseHistories.map(c => ({
    ...c,
    id: typeof c.id === "string" ? c.id : c.caseId?.toString?.() ?? c.id?.toString?.() ?? "",
    title: caseTitle(c),
  }));

  // const caseHistories = useMemo(() => (
  //   caseHistoriesResponse?.data as unknown as CaseHistories || null
  // ), [caseHistoriesResponse]);

  // useEffect(() => {
  //   const items = Array.isArray(caseHistories?.data) ? caseHistories.data : Array.isArray(caseHistoriesResponse?.data) ? caseHistoriesResponse.data : [];
  //   if (Array.isArray(items)) {
  //     const mapped = (items as CaseEntity[]).map(c => ({
  //       ...c,
  //       id: typeof c.id === "string" ? c.id : c.caseId?.toString?.() ?? c.id?.toString?.() ?? "",
  //       title: caseTitle(c),
  //     })) as (CaseEntity & { id: string; title?: string })[] | [];
  //     setData(mapped ?? []);
  //   }
  //   else {
  //     setData([]);
  //   }
  // }, [caseHistoriesResponse, caseHistories, caseTitle]);

  // useEffect(() => {
  //   const items = Array.isArray(caseHistories?.data)
  //     ? caseHistories.data
  //     : Array.isArray(caseHistoriesResponse?.data)
  //     ? caseHistoriesResponse.data
  //     : [];

  //   const mapped = items.map(c => ({
  //     ...c,
  //     id: typeof c.id === "string" ? c.id : c.caseId?.toString?.() ?? c.id?.toString?.() ?? "",
  //     title: caseTitle(c),
  //   }));

  //   setData(prevData => {
  //     const same = JSON.stringify(prevData) === JSON.stringify(mapped);
  //     return same ? prevData : mapped;
  //   });
  // }, [caseHistoriesResponse, caseHistories, caseTitle]);

  // useEffect(() => {
  //   setCurrentPage(caseHistories?.currentPage as number || 1);
  // }, [caseHistories?.currentPage]);

  // useEffect(() => {
  //   setPageSize(caseHistories?.pageSize as number || 10);
  // }, [caseHistories?.pageSize]);

  // useEffect(() => {
  //   setTotalFiltered(caseHistories?.totalFiltered as number || 0);
  // }, [caseHistories?.totalFiltered]);

  // useEffect(() => {
  //   setTotalPage(caseHistories?.totalPage as number || 1);
  // }, [caseHistories?.totalPage]);

  // useEffect(() => {
  //   setTotalRecords(caseHistories?.totalRecords as number || 0);
  // }, [caseHistories?.totalRecords]);

  // const goToPage = (page: number) => {
  //   setStart((page - 1) * pageSize);
  // }

  // ===================================================================
  // CRUD Configuration
  // ===================================================================

  const config = {
    entityName: t("crud.case_history.name"),
    entityNamePlural: t("crud.case_history.name"),
    apiEndpoints: {
      list: "/api/case",
      create: "/api/case",
      read: "/api/case/:id",
      // update: "/api/case/:id",
      delete: "/api/case/:id",
      // bulkDelete: "/api/case/bulk",
      export: "/api/case/export"
    },
    columns: [
      {
        key: "caseId",
        label: t("crud.case_history.list.header.case"),
        sortable: true,
        render: (caseItem: CaseEntity) => (
          <div className="text-gray-700 dark:text-gray-200">
            {caseItem.caseId}
          </div>
        )
      },
      {
        key: "caseDetail",
        label: t("crud.case_history.list.header.detail"),
        sortable: true,
        render: (caseItem: CaseEntity) => (
          <div
            className="flex items-center gap-3"
            title={`
              ${caseTitle(caseItem) as string || ""}\n${caseItem.caseDetail || ""}\n${caseItem.caselocAddr || caseItem.caseLocAddr || caseItem.caselocAddrDecs || ""}`
            }
          >
            {/* <FolderIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" /> */}
            <div>
              <div className="font-semibold text-gray-900 dark:text-white truncate">
                {caseTitle(caseItem) || ""}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300 truncate max-w-xs">
                {caseItem.caseDetail || ""}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-xs">
                {caseItem.caselocAddrDecs || caseItem.caselocAddr || caseItem.caseLocAddr || ""}
              </div>
            </div>
          </div>
        )
      },
      {
        key: "statusId",
        label: t("crud.case_history.list.header.status"),
        sortable: true,
        render: (caseItem: CaseEntity) => {
          return (
            <Badge className={`${getStatusConfig(caseItem)?.color} text-sm`}>
              {getStatusConfig(caseItem)?.label}
            </Badge>
          );
        }
      },
      {
        key: "priority",
        label: t("crud.case_history.list.header.priority"),
        sortable: true,
        render: (caseItem: CaseEntity) => {
          return (
            <div className={`flex gap-1 items-center ${getPriorityConfig(caseItem).color}`}>
              {/* <Icon className="w-4 h-4" /> */}
              <span className="capitalize font-medium text-sm">{getPriorityConfig(caseItem).label}</span>
            </div>
          );
        }
      },
      {
        key: "createdBy",
        label: t("crud.case_history.list.header.created_by"),
        sortable: true,
        render: (caseItem: CaseEntity) => {
          return (caseItem.usercreate || caseItem.createdBy) && (
            <div className="flex gap-1 items-center">
              <UserIcon className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-500 dark:text-gray-400">{caseItem.usercreate || caseItem.createdBy}</span>
            </div>
          )
        }
      },
      {
        key: "createdAt",
        label: t("crud.case_history.list.header.created_at"),
        sortable: true,
        render: (caseItem: CaseEntity) => (
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {formatDate(caseItem.createdAt as string)}
          </span>
        )
      }
    ],
    filters: [
      {
        key: "statusId",
        label: "Status",
        type: "select" as const,
        options: caseStatusOptions,
        placeholder: t("crud.case_history.list.toolbar.filter.status")
      },
      // {
      //   key: "priority",
      //   label: "Priority",
      //   type: "select" as const,
      //   options: [
      //     { value: "low", label: "Low" },
      //     { value: "medium", label: "Medium" },
      //     { value: "high", label: "High" },
      //   ],
      //   placeholder: t("crud.case_history.list.toolbar.filter.priority")
      // }
    ],
    actions: [
      {
        key: "view",
        label: t("crud.common.read"),
        variant: "primary" as const,
        // icon: EyeIcon,
        onClick: () => {},
        // condition: () => (permissions.hasPermission("case.view") || isSystemAdmin) as boolean isViewAvailable
        condition: () => isViewAvailable()
      },
      {
        key: "update",
        label: t("crud.common.update"),
        variant: "warning" as const,
        // icon: PencilIcon,
        onClick: (caseItem: CaseEntity) => navigate(`/cms/case/${caseItem.caseId}`),
        // condition: () => (permissions.hasPermission("case.update") || isSystemAdmin) as boolean
        condition: (caseItem: CaseEntity) => isEditAvailable(caseItem)
      },
      {
        key: "delete",
        label: t("crud.case_history.list.body.actions.cancel"),
        variant: "outline" as const,
        // icon: TrashBinIcon,
        onClick: (caseItem: CaseEntity) => {
          console.log("Delete case:", caseItem.id);
        },
        // condition: (caseItem: CaseEntity) => isCancelAvailable(caseItem) && (permissions.hasPermission("case.delete") || isSystemAdmin) as boolean
        condition: (caseItem: CaseEntity) => isCancelAvailable(caseItem)
      }
    ]
  };

  // ===================================================================
  // Preview Configuration
  // ===================================================================

  const PreviewTitle: React.FC<{ caseItem: CaseEntity }> = ({ caseItem }) => {
    return (
      <div className="flex gap-4 items-center">
        <div className="flex gap-2 items-center">
          <TimeIcon className="w-4 h-4" /> {t("case.assignment.create_date")}: {formatDate(caseItem.createdAt)}
          <UserIcon className="w-4 h-4" /> {t("case.assignment.create_by")}: {caseItem.createdBy}
        </div>
        <div className="flex gap-2 items-center">
          <Badge className={`${getPriorityConfig(caseItem)?.color} border text-sm`}>
            {getPriorityConfig(caseItem)?.label}
          </Badge>
          <span
            className="border border-blue-500 dark:border-blue-400 text-blue-500 dark:text-blue-400 inline-flex items-center px-2.5 py-0.5 justify-center gap-1 rounded-full font-medium text-md text-sm"
            // className="inline-flex items-center px-2.5 py-0.5 justify-center gap-1 rounded-full font-medium text-md border text-sm"
            // style={getStatusConfig(caseItem)?.style}
          >
            {getStatusConfig(caseItem)?.label}
          </span>
        </div>
      </div>
    );
  };

  // const getTimelineSteps = (
  //   // caseItem: CaseEntity
  // ) => {
  //   // const sopData = (selectedCaseForSop === caseItem.caseId) ? dispatchSOPsData?.data as CaseSop : undefined;
  //   const timelineSteps = CaseTimelineSteps(sopData || undefined, caseStatuses);
  //   return timelineSteps;
  // };

  // const OverviewTab: React.FC<{ caseItem: CaseEntity }> = ({ caseItem }) => {
  //   useEffect(() => {
  //     setSelectedCaseForAssignee(sopData?.unitLists?.length && sopData?.unitLists[0]?.createdBy || null);
  //   }, []);

  //   useEffect(() => {
  //     setSelectedCaseForSop(caseItem.caseId);
  //   }, [caseItem.caseId]);

  //   useEffect(() => {
  //     setSelectedCaseForUnit(sopData?.unitLists?.length && sopData?.unitLists[0]?.username || null);
  //   }, []);

  //   useEffect(() => {
  //     setSopData((selectedCaseForSop === caseItem.caseId) ? dispatchSOPsData?.data as CaseSop : null);
  //   }, [caseItem.caseId]);

  //   useEffect(() => {
  //     setAssigneeData((sopData?.unitLists?.length && selectedCaseForAssignee === sopData?.unitLists[0].createdBy) ? assigneesData?.data as unknown as UnitWithSop : null);
  //   }, [caseItem.caseId]);

  //   useEffect(() => {
  //     setUnitData((sopData?.unitLists?.length && selectedCaseForUnit === sopData?.unitLists[0].username) ? unitsData?.data as unknown as UnitWithSop : null);
  //   }, [caseItem.caseId]);

  //   // const dpcConfig = getAreaConfig(caseItem);
  //   const dpcConfig = getAreaConfig(sopData as CaseSop);
  //   // const dpcDisplay = `${dpcConfig.district || ""}-${dpcConfig.province || ""}-${dpcConfig.country || ""}`;
  //   const dpcDisplay = `${dpcConfig.country || ""}-${dpcConfig.province || ""}-${dpcConfig.district || ""}`;

  //   const progressSteps = useMemo(() => {
  //     return mapSopToOrderedProgress(sopData as CaseSop, language);
  //   }, []);
  //   const deptComStn = useMemo(() =>
  //     JSON.parse(localStorage.getItem("DeptCommandStations") ?? "[]") as DepartmentCommandStationDataMerged[], []
  //   );

  //   const assigneeStation = deptComStn?.find(items => {
  //     return items.commId === assigneesData?.data?.commId && items.stnId === assigneesData?.data?.stnId && items.deptId === assigneesData.data.deptId;
  //   }) || null;
  //   const userStation = deptComStn?.find(items => {
  //     return items.commId === unitsData?.data?.commId && items.stnId === unitsData?.data?.stnId && items.deptId === unitsData.data.deptId;
  //   }) || null;

  //   // const contactMethod = source?.find(cm => cm.id === caseItem.source) || { name: "Unknown" };
  //   const contactMethod = source?.find(cm => cm.id === sopData?.source) || { name: "-" };

  //   // const timelineSteps = getTimelineSteps();

  //   return (
  //     <>
  //       <PermissionGate module="case" action="view_timeline">
  //         {/* Progress Timeline and Progress Line */}
  //         <ProgressStepPreview progressSteps={progressSteps} />

  //         {/*
  //         <div className="bg-white dark:bg-gray-900 text-white p-6 mb-6">
  //           {
  //             // getTimelineSteps(caseItem).length
  //             timelineSteps.length
  //             > 0 ? (
  //             <>
  //               <div className="hidden xl:block">
  //                 <ProgressTimeline
  //                   // steps={getTimelineSteps(caseItem)}
  //                   steps={timelineSteps}
  //                   orientation="horizontal"
  //                   size="md"
  //                   showTimestamps={true}
  //                   showDescriptions={false}
  //                   showSLA={true}
  //                 />
  //               </div>
  //               <div className="block xl:hidden">
  //                 <ProgressTimeline
  //                   // steps={getTimelineSteps(caseItem)}
  //                   steps={timelineSteps}
  //                   orientation="vertical"
  //                   size="sm"
  //                   showTimestamps={true}
  //                   showDescriptions={false}
  //                   showSLA={true}
  //                   className="mb-2"
  //                 />
  //               </div>
  //             </>
  //           ) : ""}
  //         </div>
  //         */}
  //       </PermissionGate>

  //       {/* Content */}
  //       <div>
  //         <div className="grid grid-cols-1 gap-6">
  //           {/* Case Information */}
  //           <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
  //             <h4 className="font-medium text-blue-500 dark:text-blue-400 mb-4">
  //               {t("case.display.case_information")}
  //             </h4>
  //             <div className="grid grid-cols-1 space-y-3">
  //               <div className="xl:flex items-left justify-left gap-2">
  //                 <div className="flex items-center justify-left gap-1 text-gray-900 dark:text-white">
  //                   <Ticket className="w-4 h-4" />
  //                   <span className="text-sm font-medium">{t("case.display.no")}:</span>
  //                 </div>
  //                 <div className="text-gray-600 dark:text-gray-300 text-sm">
  //                   {caseItem.caseId || "-"}
  //                 </div>
  //               </div>
  //               <div className="xl:flex items-start justify-left gap-1">
  //                 <ChartColumnStacked className="xl:block hidden w-4 h-4 text-gray-900 dark:text-white" />
  //                 <div>
  //                   <div className="xl:flex items-center justify-left gap-1">
  //                     <div className="flex items-center justify-left gap-1 text-gray-900 dark:text-white">
  //                       <ChartColumnStacked className="block xl:hidden w-4 h-4" />
  //                       <div className="text-sm font-medium">{t("case.display.types")}:</div>
  //                     </div>
  //                     <div className="text-gray-600 dark:text-gray-300 text-sm">{caseTitle(caseItem) || "-"}</div>
  //                   </div>
  //                   <div className="xl:flex items-center justify-left gap-1 text-sm">
  //                     {sopData?.formAnswer && <FormViewer formData={sopData.formAnswer} /> || "-"}
  //                   </div>
  //                 </div>
  //               </div>
  //               <div className="xl:flex items-left justify-left gap-2">
  //                 <div className="flex items-center justify-left gap-1 text-gray-900 dark:text-white">
  //                   <MapPinHouse className="w-4 h-4" />
  //                   <span className="text-sm font-medium">{t("case.display.service_center")}:</span>
  //                 </div>
  //                 <div className="text-gray-600 dark:text-gray-300 text-sm">
  //                   {dpcDisplay || "-"}
  //                 </div>
  //               </div>
  //               <div className="xl:flex items-left justify-left gap-2">
  //                 <div className="flex items-center justify-left gap-1 text-gray-900 dark:text-white">
  //                   <Siren className="w-4 h-4" />
  //                   <span className="text-sm font-medium">{t("case.display.iot_alert_date")}:</span>
  //                 </div>
  //                 <div className="text-gray-600 dark:text-gray-300 text-sm">
  //                   {formatDate(sopData?.startedDate as string) || "-"}
  //                 </div>
  //               </div>
  //               <div className="xl:flex items-left justify-left gap-2">
  //                 <div className="flex items-center justify-left gap-1">
  //                   <ClockArrowUp className="w-4 h-4 text-gray-900 dark:text-white" />
  //                   <span className="text-red-500 dark:text-red-400 text-sm font-medium">{t("case.display.updateAt")}:</span>
  //                 </div>
  //                 <div className="text-gray-600 dark:text-gray-300 text-sm">
  //                   {/* {formatDate(sopData?.updatedAt as string) || ""} {t("case.display.updateBy")} {caseItem.updatedBy || ""} */}
  //                   {formatDate(sopData?.updatedAt as string) || ""} {t("userform.by")} {sopData?.updatedBy || "-"}
  //                 </div>
  //               </div>
  //               <div className="xl:flex items-left justify-left gap-1">
  //                 <AttachedFiles files={sopData?.attachments} editFormData={false} type={"case"} />
  //               </div>
  //             </div>
  //           </div>

  //           {/* Location */}
  //           <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
  //             <div className="xl:flex items-left justify-left gap-2 mb-4">
  //               <div className="flex items-center justify-left gap-1 font-medium text-blue-500 dark:text-blue-400">
  //                 <MapPin className="w-4 h-4" />
  //                 <h4>{t("case.display.area")}</h4>
  //               </div>
  //             </div>
  //             <div className="grid grid-cols-1 space-y-3">
  //               <div className="xl:flex items-left justify-left">
  //                 <div className="text-gray-600 dark:text-gray-300 text-sm">
  //                   {caseItem.caselocAddrDecs || caseItem.caselocAddr || caseItem.caseLocAddr || "-"}
  //                 </div>
  //               </div>
  //             </div>
  //           </div>

  //           {/* Contact */}
  //           <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
  //             <div className="xl:flex items-left justify-left gap-2 mb-4">
  //               <div className="flex items-center justify-left gap-1 font-medium text-blue-500 dark:text-blue-400">
  //                 <Contact className="w-4 h-4" />
  //                 <h4>{t("case.display.contact")}</h4>
  //               </div>
  //             </div>
  //             <div className="grid grid-cols-1 space-y-3">
  //               <div className="xl:flex items-left justify-left">
  //                 <div className="flex items-center justify-left gap-1 text-gray-900 dark:text-white">
  //                   <Phone className="w-4 h-4" />
  //                   <span className="text-sm font-medium xl:mr-2">{t("case.display.phone_number")}:</span>
  //                 </div>
  //                 <div className="text-gray-600 dark:text-gray-300 text-sm">
  //                   {/* {caseItem.phoneNo || "-"} */}
  //                   {sopData?.phoneNo || "-"}
  //                 </div>
  //               </div>
  //               <div className="xl:flex items-left justify-left">
  //                 <div className="flex items-center justify-left gap-1 text-gray-900 dark:text-white">
  //                   <Share2 className="w-4 h-4" />
  //                   <span className="text-sm font-medium xl:mr-2">{t("case.display.contact_method")}:</span>
  //                 </div>
  //                 <div className="text-gray-600 dark:text-gray-300 text-sm">
  //                   {contactMethod?.name || "-"}
  //                 </div>
  //               </div>
  //               <div className="xl:flex items-left justify-left">
  //                 <div className="flex items-center justify-left gap-1 text-gray-900 dark:text-white">
  //                   <Cpu className="w-4 h-4" />
  //                   <span className="text-sm font-medium xl:mr-2">{t("case.display.iot_device")}:</span>
  //                 </div>
  //                 <div className="text-gray-600 dark:text-gray-300 text-sm">
  //                   {/* {caseItem.deviceId || ""} */}
  //                   {sopData?.deviceId || "-"}
  //                 </div>
  //               </div>
  //             </div>
  //           </div>

  //           {/* Detail */}
  //           <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
  //             <h4 className="font-medium text-blue-500 dark:text-blue-400 mb-4">
  //               {t("case.display.detail")}
  //             </h4>
  //             <div className="grid grid-cols-1 space-y-3">
  //               <div className="xl:flex items-left justify-left">
  //                 <div className="text-gray-600 dark:text-gray-300 text-sm">
  //                   {caseItem.caseDetail || "-"}
  //                 </div>
  //               </div>
  //             </div>
  //           </div>

  //           {/* Unit Information */}
  //           <div className="relative my-4 text-center w-full">
  //             <div className="absolute bg-gray-300 dark:bg-gray-600 h-px w-full left-0 top-1/2 -translate-y-1/2" />
  //             <span className="relative bg-white dark:bg-gray-900 font-medium px-4 text-gray-600 dark:text-gray-300">
  //               {t("case.display.Assigned Officer")}
  //             </span>
  //           </div>

  //           <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
  //             <h4 className="font-medium text-blue-500 dark:text-blue-400 mb-4">
  //               {t("case.officer_detail.personal_title")}
  //             </h4>
  //             <div className="grid grid-cols-1 space-y-3">
  //               <div className="xl:flex items-left justify-left gap-2">
  //                 <div className="flex items-center justify-left gap-1 text-gray-900 dark:text-white">
  //                   <User className="w-4 h-4" />
  //                   <span className="text-sm font-medium">{t("case.officer_detail.fullname")}:</span>
  //                 </div>
  //                 <div className="text-gray-600 dark:text-gray-300 text-sm">
  //                   {sopData?.unitLists?.length && unitsData?.data?.firstName || ""}{" "}{sopData?.unitLists?.length && unitsData?.data?.lastName || ""}
  //                 </div>
  //               </div>
  //               <div className="xl:flex items-left justify-left gap-2">
  //                 <div className="flex items-center justify-left gap-1 text-gray-900 dark:text-white">
  //                   <Phone className="w-4 h-4" />
  //                   <span className="text-sm font-medium">{t("case.officer_detail.mobile_number")}:</span>
  //                 </div>
  //                 <div className="text-gray-600 dark:text-gray-300 text-sm">
  //                   {sopData?.unitLists?.length && unitsData?.data?.mobileNo || ""}
  //                 </div>
  //               </div>
  //               <div className="xl:flex items-left justify-left gap-2">
  //                 <div className="flex items-center justify-left gap-1 text-gray-900 dark:text-white">
  //                   {/* <AtSign className="w-4 h-4" /> */}
  //                   {/* <span className="text-sm font-medium">{t("case.officer_detail.username")}:</span> */}
  //                   <Tag className="w-4 h-4" />
  //                   <span className="text-sm font-medium">{t("case.officer_detail.vehicle")}:</span>
  //                 </div>
  //                 <div className="text-gray-600 dark:text-gray-300 text-sm">
  //                   {/* {unitsData?.data?.username || ""} */}
  //                   {sopData?.unitLists?.length && sopData?.unitLists[0]?.unitId || ""}
  //                 </div>
  //               </div>
  //               <div className="xl:flex items-left justify-left gap-2">
  //                 <div className="flex items-center justify-left gap-1 text-gray-900 dark:text-white">
  //                   {/* <Mail className="w-4 h-4" /> */}
  //                   {/* <span className="text-sm font-medium">{t("case.officer_detail.email")}:</span> */}
  //                   <Building className="w-4 h-4" />
  //                   <span className="text-sm font-medium">{t("userform.orgInfo")}:</span>
  //                 </div>
  //                 <div className="text-gray-600 dark:text-gray-300 text-sm">
  //                   {/* {unitsData?.data?.email || ""} */}
  //                   {sopData?.unitLists?.length && userStation && mergeDeptCommandStation(userStation) || ""}
  //                 </div>
  //               </div>
  //             </div>
  //           </div>

  //           <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
  //             <h4 className="font-medium text-blue-500 dark:text-blue-400 mb-4">
  //               {t("case.officer_detail.assignee_title")}
  //             </h4>
  //             <div className="grid grid-cols-1 space-y-3">
  //               <div className="xl:flex items-left justify-left gap-2">
  //                 <div className="flex items-center justify-left gap-1 text-gray-900 dark:text-white">
  //                   <User className="w-4 h-4" />
  //                   <span className="text-sm font-medium">{t("case.officer_detail.fullname")}:</span>
  //                 </div>
  //                 <div className="text-gray-600 dark:text-gray-300 text-sm">
  //                   {sopData?.unitLists?.length && assigneesData?.data?.firstName || ""}{" "}{sopData?.unitLists?.length && assigneesData?.data?.lastName || ""}
  //                 </div>
  //               </div>
  //               <div className="xl:flex items-left justify-left gap-2">
  //                 <div className="flex items-center justify-left gap-1 text-gray-900 dark:text-white">
  //                   <Phone className="w-4 h-4" />
  //                   <span className="text-sm font-medium">{t("case.officer_detail.mobile_number")}:</span>
  //                 </div>
  //                 <div className="text-gray-600 dark:text-gray-300 text-sm">
  //                   {sopData?.unitLists?.length && assigneesData?.data?.mobileNo || ""}
  //                 </div>
  //               </div>
  //               <div className="xl:flex items-left justify-left gap-2">
  //                 <div className="flex items-center justify-left gap-1 text-gray-900 dark:text-white">
  //                   <Building className="w-4 h-4" />
  //                   <span className="text-sm font-medium">{t("userform.orgInfo")}:</span>
  //                 </div>
  //                 <div className="text-gray-600 dark:text-gray-300 text-sm">
  //                   {sopData?.unitLists?.length && assigneeStation && mergeDeptCommandStation(assigneeStation) || ""}
  //                 </div>
  //               </div>
  //             </div>
  //           </div>

  //           <div className="bg-gray-50 dark:bg-gray-800 rounded-lg px-4 pt-4">
  //             <div className="xl:flex items-left justify-left gap-2 mb-4">
  //               <div className="flex items-center justify-left gap-1 font-medium text-blue-500 dark:text-blue-400">
  //                 <CheckCircle className="w-4 h-4" />
  //                 {t("case.officer_detail.service_progress_title")}
  //               </div>
  //             </div>
  //             <div className="grid grid-cols-1 space-y-3">
  //               <ProgressStepPreviewUnit progressSteps={progressSteps} sliceIndex={false} />
  //               <ProgressSummary progressSteps={progressSteps} sliceIndex={false} />
  //               <AttachedFiles files={sopData?.attachments} editFormData={false} type={"close"} />
  //             </div>
  //           </div>
  //         </div>

  //         {/* Attachments Section */}
  //         {/*
  //         {caseItem.attachments.length && (
  //           <div className="mt-6">
  //             <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
  //               <div className="flex items-center gap-2 mb-4">
  //                 <h4 className="font-medium text-blue-500 dark:text-blue-400">
  //                   Attachments ({caseItem.attachments.length})
  //                 </h4>
  //               </div>
                
  //               {caseItem.attachments.length > 0 ? (
  //                 <div className="space-y-2">
  //                   {caseItem.attachments.map(attachment => (
  //                     <div key={attachment.id} className="flex items-center justify-between p-3 bg-white dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600">
  //                       <div className="flex items-center gap-3">
  //                         <FileIcon className="w-4 h-4 text-gray-500" />
  //                         <div>
  //                           <div className="text-sm font-medium text-gray-900 dark:text-white">
  //                             {attachment.filename}
  //                           </div>
  //                           <div className="text-xs text-gray-500 dark:text-gray-400">
  //                             {(attachment.size / 1024).toFixed(1)} KB • {attachment.uploadedBy}
  //                           </div>
  //                         </div>
  //                       </div>
  //                       <Button variant="ghost" size="sm">
  //                         Download
  //                       </Button>
  //                     </div>
  //                   ))}
  //                 </div>
  //               ) : (
  //                 <p className="text-sm text-gray-500 dark:text-gray-400">No attachments</p>
  //               )}
  //             </div>
  //           </div>
  //         )}
  //         */}
  //       </div>
  //     </>
  //   );
  // };

  const ActivityTab: React.FC<{ caseItem: CaseEntity }> = ({ caseItem }) => {
    useEffect(() => {
      setSelectedCaseForHistory(caseItem.caseId);
    }, [caseItem.caseId]);

    return (<CaseHistoryActivity caseItem={caseItem} />)
  };

  const CaseHistoryActivity: React.FC<{ caseItem: CaseEntity }> = ({ caseItem }) => {
    const caseHistories = (selectedCaseForHistory === caseItem.caseId) 
      ? caseHistoriesData?.data as unknown as CaseHistory[] || []
      : [];

    return (
      <div className="space-y-6">
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-4">
            <ChatIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <h4 className="font-medium text-gray-900 dark:text-white">
              {t("case.sop_card.comment")} ({caseHistories?.length || 0})
            </h4>
          </div>
          
          {caseHistories?.length > 0 ? (
            <div className="space-y-3">
              {caseHistories.map((comment: CaseHistory) => (
                <div key={comment.id} className="border-l-4 border-blue-500 pl-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {comment.username || comment.createdBy || ""}
                    </span>
                    <div className="flex items-center gap-2">
                      {/*
                      {comment.isInternal && (
                        <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-100 rounded text-xs">
                          Internal
                        </span>
                      )}
                      */}
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {formatDate(comment.createdAt) || ""}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {comment.fullMsg || ""}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400">{t("crud.common.empty_table")}</p>
          )}
        </div>

        {/*
        {caseItem.estimatedHours && caseItem.actualHours && (
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 dark:text-white mb-4">Time Tracking</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {caseItem.estimatedHours || 0}h
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Estimated</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {caseItem.actualHours || 0}h
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Actual</div>
              </div>
            </div>

            <div className="mt-4">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-900 dark:text-white">Progress</span>
                <span className="text-gray-900 dark:text-white">{Math.round((caseItem.actualHours / caseItem.estimatedHours) * 100)}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min((caseItem.actualHours / caseItem.estimatedHours) * 100, 100)}%` }}
                />
              </div>
            </div>
          </div>
        )}
        */}
      </div>
    );
  }

  const previewConfig: PreviewConfig<CaseEntity> = {
    title: (caseItem: CaseEntity) => `${caseTitle(caseItem)}`,
    subtitle: (caseItem: CaseEntity) => <PreviewTitle caseItem={caseItem} />,
    // avatar: (caseItem: CaseEntity) => {
    //   const Icon = getPriorityConfig(caseItem).icon;
    //   return (
    //     <div className={`w-12 h-12 flex items-center justify-center rounded-lg ${getPriorityConfig(caseItem).color}`}>
    //       <Icon className="w-6 h-6" />  
    //     </div>
    //   );
    // },
    enableNavigation: true,
    size: "xl",
    tabs: [
      {
        key: "overview",
        label: t("crud.case_history.list.preview.tab.header.overview"),
        // icon: InfoIcon,
        // render: (caseItem: CaseEntity) => {
        //   return (<OverviewTab caseItem={caseItem} />)
        // }
        render: (caseItem) => (
          <OverviewTab caseItem={caseItem} areas={areas} caseTitle={caseTitle} />
        )
      },
      {
        key: "activity",
        label: t("crud.case_history.list.preview.tab.header.activity"),
        // icon: PieChartIcon,
        render: (caseItem: CaseEntity) => {
          return (<ActivityTab caseItem={caseItem} />)
        }
      }
    ],
    actions: [
      {
        key: "update",
        label: t("crud.common.update"),
        // icon: PencilIcon,
        variant: "warning",
        onClick: (caseItem: CaseEntity, closePreview: () => void) => {
          closePreview();
          navigate(`/cms/case/${caseItem.caseId}`);
        },
        // condition: () => permissions.hasPermission("case.update")
        condition: (caseItem: CaseEntity) => isEditAvailable(caseItem)
      },
      {
        key: "delete",
        label: t("crud.case_history.list.body.actions.cancel"),
        // icon: TimeIcon,
        variant: "outline",
        onClick: (caseItem: CaseEntity, closePreview: () => void) => {
          console.log("Canceling case:", caseItem.id);
          closePreview();
        },
        condition: (caseItem: CaseEntity) => isCancelAvailable(caseItem)
      }
    ]
  };

  // ===================================================================
  // Advanced Filters
  // ===================================================================

  const advancedFilters = [
    {
      key: "start_date",
      label: t("crud.case_history.list.toolbar.advanced_filter.start_date.label"),
      type: "date" as const,
    },
    {
      key: "end_date", 
      label: t("crud.case_history.list.toolbar.advanced_filter.end_date.label"),
      type: "date" as const,
    },
    {
      key: "caseType",
      label: t("crud.case_history.list.toolbar.advanced_filter.caseType.label"),
      type: "select" as const,
      options: caseTypesOptions?.length && caseTypesOptions || [],
      placeholder: t("crud.case_history.list.toolbar.advanced_filter.caseType.placeholder"),
    },
    {
      key: "caseSType",
      label: t("crud.case_history.list.toolbar.advanced_filter.caseSType.label"),
      type: "select" as const,
      // options: caseTypesSubTypesOptions,
      options: caseSubTypesOptions?.length && caseSubTypesOptions || [],
      placeholder: t("crud.case_history.list.toolbar.advanced_filter.caseSType.placeholder"),
    },
    {
      key: "countryId",
      label: t("crud.case_history.list.toolbar.advanced_filter.countryId.label"),
      type: "select" as const,
      options: countryIdOptions?.length && countryIdOptions || [],
      placeholder: t("crud.case_history.list.toolbar.advanced_filter.countryId.placeholder"),
    },
    {
      key: "provId",
      label: t("crud.case_history.list.toolbar.advanced_filter.provId.label"),
      type: "select" as const,
      options: provIdOptions?.length && provIdOptions || [],
      placeholder: t("crud.case_history.list.toolbar.advanced_filter.provId.placeholder"),
    },
    {
      key: "distId",
      label: t("crud.case_history.list.toolbar.advanced_filter.distId.label"),
      type: "select" as const,
      options: distIdOptions?.length && distIdOptions || [],
      placeholder: t("crud.case_history.list.toolbar.advanced_filter.distId.placeholder"),
    },
    // {
    //   key: "category",
    //   label: t("crud.case_history.list.toolbar.advanced_filter.category.label"),
    //   type: "text" as const,
    //   placeholder: t("crud.case_history.list.toolbar.advanced_filter.category.placeholder"),
    // },
    {
      key: "detail",
      label: t("crud.case_history.list.toolbar.advanced_filter.caseDetail.label"),
      type: "text" as const,
      placeholder: t("crud.case_history.list.toolbar.advanced_filter.caseDetail.placeholder"),
    },
    {
      key: "createBy",
      label: t("crud.case_history.list.toolbar.advanced_filter.createBy.label"),
      type: "select" as const,
      options: usersOptions?.length && usersOptions || [],
      placeholder: t("crud.case_history.list.toolbar.advanced_filter.createBy.placeholder"),
    },
  ];

  // ===================================================================
  // Bulk Actions
  // ===================================================================

  const bulkActions = [
    {
      key: "bulk-assign",
      label: "Bulk Assign",
      variant: "primary" as const,
      onClick: async (items: CaseEntity[]) => {
        console.log("Bulk assigning cases:", items.map(c => c.id));
      }
    },
    {
      key: "bulk-close",
      label: "Bulk Close",
      variant: "warning" as const,
      onClick: async (items: CaseEntity[]) => {
        console.log("Bulk closing cases:", items.map(c => c.id));
      },
      // condition: (items: CaseEntity[]) => items.some(c => c.status !== "closed"),
      confirmationRequired: true,
      confirmationMessage: (items: CaseEntity[]) => `Are you sure you want to close ${items.length} cases? This action will update their status to closed.`
    },
    {
      key: "bulk-priority",
      label: "Change Priority",
      variant: "primary" as const,
      onClick: async (items: CaseEntity[]) => {
        console.log("Changing priority for cases:", items.map(c => c.id));
      }
    }
  ];

  // ===================================================================
  // Export Options
  // ===================================================================

  const exportOptions = [
    {
      key: "csv-summary",
      label: "Summary Report (CSV)",
      format: "csv" as const,
      columns: ["caseNumber", "title", "status", "priority", "assignedTo", "createdAt"]
    },
    {
      key: "csv-detailed",
      label: "Detailed Report (CSV)",
      format: "csv" as const,
      columns: ["caseNumber", "title", "caseDetail", "status", "priority", "category", "assignedTo", "usercreate", "createdAt", "dueDate"]
    },
    {
      key: "json-full",
      label: "Complete Data (JSON)",
      format: "json" as const
    }
  ];

  // ===================================================================
  // Custom Filter Function for Enhanced MultiSelect Support
  // ===================================================================

  const customCaseFilterFunction = (caseItem: CaseEntity, filters: unknown): boolean => {
    return Object.entries(filters as Record<string, unknown>).every(([key, value]) => {
      if (!value) {
        return true;
      }

      // Handle sub-type values
      if (key === "caseSTypeId" && typeof value === "string") {
        return value.includes(caseItem.caseSTypeId);
      }

      // Handle status values
      if (key === "status" && typeof value === "string") {
        return value.includes(caseItem.statusId);
      }

      // Handle priority values
      if (key === "priority" && typeof value === "string") {
        const priority = { critical: [0], high: [1,2,3], medium: [4,5,6], low: [7,8,9] };
        return priority[value as keyof typeof priority].includes(caseItem.priority);
      }

      // Handle search
      if (key === "search" && typeof value === "string") {
        const searchTerm = value.toLowerCase();
        // return typeSubTypeConfigs?.find(c => c.subTypeTh.toLowerCase().includes(searchTerm) || c.subTypeEn.toLowerCase().includes(searchTerm))
        //   || caseItem.caseDetail.toLowerCase().includes(searchTerm)
        //   || caseItem.caselocAddr.toLowerCase().includes(searchTerm)
        //   || caseItem.caselocAddrDecs.toLowerCase().includes(searchTerm);
        return typeSubTypeConfigs?.find(c => c?.subTypeTh?.toLowerCase()?.includes(searchTerm) || c?.subTypeEn?.toLowerCase()?.includes(searchTerm))
          || caseItem?.caseId?.toLowerCase()?.includes(searchTerm)
          || caseItem?.caseDetail?.toLowerCase()?.includes(searchTerm)
          || caseItem?.caselocAddr?.toLowerCase()?.includes(searchTerm)
          || caseItem?.caselocAddrDecs?.toLowerCase()?.includes(searchTerm)
          || caseItem?.deviceId?.toLowerCase()?.includes(searchTerm)
          || caseItem?.phoneNo?.toLowerCase()?.includes(searchTerm);
      }

      // Handle regular values
      return caseItem[key as keyof CaseEntity] === value;
    });
  };

  // ===================================================================
  // Custom Card Rendering
  // ===================================================================

  const renderCard = (caseItem: CaseEntity) => {
    return (
      <>
        <div className="xl:flex items-start justify-between">
          <div className="xl:flex items-center gap-3 min-w-0 xl:flex-1">
            <div className="min-w-0 flex-1">
              <h4 className="text-gray-700 dark:text-gray-200">
                {caseItem.caseId}
              </h4>
            </div>
          </div>
        </div>

        <div className="xl:flex items-start justify-between mb-1">
          <div className="xl:flex items-center gap-3 min-w-0 xl:flex-1">
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                {caseTitle(caseItem)}
              </h3>
            </div>
          </div>
        </div>

        <div className="xl:flex gap-1 shrink-0 mb-2">
          <Badge className={`${getStatusConfig(caseItem)?.color} text-sm`}>
            {getStatusConfig(caseItem)?.label}
          </Badge>
          <span className={`py-1 text-sm font-medium ${getPriorityConfig(caseItem)?.color} ml-2`}>
            {getPriorityConfig(caseItem)?.label}
          </span>
        </div>
        
        <p className="text-gray-600 dark:text-gray-300 mb-2 text-sm line-clamp-2 truncate" title={caseItem.caseDetail}>
          {caseItem.caseDetail}
        </p>

        {/* Additional Info */}
        <div
          className="xl:flex items-center justify-between mb-2"
          title={caseItem.caselocAddrDecs || caseItem.caselocAddr || caseItem.caseLocAddr || ""}
        >
          <div className="xl:flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
            <div className="xl:flex items-start gap-1 min-h-8">
              {/* <MapPinIcon className="w-3 h-3" /> */}
              <span>{caseItem.caselocAddr || caseItem.caseLocAddr || caseItem.caselocAddrDecs || ""}</span>
            </div>
          </div>
        </div>
        
        <div className="xl:flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-1">
          <div className="xl:flex items-center gap-1">
            <UserIcon className="w-4 h-4 hidden xl:block" />
            <span>{caseItem.usercreate || caseItem.createdBy}</span>
          </div>
          <div className="xl:flex items-center gap-1">
            <CalenderIcon className="w-4 h-4 hidden xl:block" />
            <span>{formatDate(caseItem.createdAt as string)}</span>
          </div>
        </div>
      </>
    );
  };

  // ===================================================================
  // Event Handlers
  // ===================================================================

  // Handle deletion and other actions
  const handleAction = (actionKey: string, caseItem: CaseEntity) => {
    console.log(`Action ${actionKey} triggered for case:`, caseItem.id);
    // Add custom case-specific action handling
  };

  // Handle deletion
  const handleDelete = (caseId: string) => {
    console.log("Case canceled:", caseId);
    // Handle case cancel (update state, show notification, etc.)
    setTimeout(() => {
      window.location.replace(`/cms/case/history`);
    }, 1000);
  };

  // Handle view toggle
  // const handleViewToggle = () => {
  //   setViewOpen((prev) => (prev === "hidden" ? "block" : "hidden"));
  //   setCrudOpen("block");
  // };

  // ===================================================================
  // Render Component
  // ===================================================================

  return (
    <>
      <div className={crudOpen}>
        <PageBreadcrumb pageTitle={t("navigation.sidebar.main.case_management.nested.case_history.header")} />

        <EnhancedCrudContainer
          advancedFilters={advancedFilters}
          apiConfig={{
            baseUrl: "/api",
            endpoints: {
              list: "/case",
              create: "/case",
              read: "/case/:id",
              // update: "/case/:id",
              delete: "/case/:id",
              // bulkDelete: "/case/bulk",
              export: "/case/export"
            },
            serverSide: true,
            currentPage: currentPage,
            // pageSize: pageSize,
            pageSize: queryLength,
            totalFiltered: totalFiltered,
            totalPage: totalPages,
            totalRecords: totalRecords
            // currentPage: currentPage,
            // pageSize: pageSize,
            // serverSide: true,
            // totalFiltered: totalFiltered,
            // totalPage: totalPage,
            // totalRecords: totalRecords,
          }}
          bulkActions={bulkActions}
          config={config}
          customFilterFunction={customCaseFilterFunction}
          data={data}
          // data={caseHistoriesResponse?.data || []}
          displayModes={["card", "table"]}
          displayModeDefault="table"
          enableDebug={true} // Enable debug mode to troubleshoot
          // error={null}
          exportOptions={exportOptions}
          features={{
            search: true,
            sorting: true,
            filtering: true,
            pagination: true,
            bulkActions: false,
            export: false,
            realTimeUpdates: false, // Disabled for demo
            keyboardShortcuts: true
          }}
          // keyboardShortcuts={[]}
          // loading={false}
          loading={isLoading}
          module="case"
          previewConfig={previewConfig as PreviewConfig<CaseEntity & { id: string }>}
          // searchFields={["caseId", "caseDetail", "createdBy", "createdAt"]}
          searchFields={["caseId"]}
          // customFilterFunction={() => true}
          // onAdvancedFilter={handleAdvancedFilter}
          onChangePageSize={handlePageSizeChange}
          onClearFilters={clearFilters}
          onCreate={() => navigate("/cms/case/creation")}
          onDelete={handleDelete}
          onFilter={handleFilterChange}
          onGoToPage={handlePageChange}
          onItemAction={handleAction}
          // onItemClick={(item) => navigate(`/cms/case/${item.id}`)}
          onRefresh={() => window.location.reload()}
          onSearch={handleSearch}
          onSort={handleSort}
          // onUpdate={() => {}}
          renderCard={renderCard}
        />
      </div>
    </>
  );
};

export default CaseHistoryComponent;
