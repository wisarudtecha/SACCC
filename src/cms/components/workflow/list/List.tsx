// src/cms/components/workflow/list/List.tsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { EnhancedCrudContainer } from "@/core/components/crud/EnhancedCrudContainer";
import { Modal } from "@/core/components/ui/modal";
import {
  // BoltIcon,
  CheckLineIcon,
  CloseIcon,
  CloseLineIcon,
  GroupIcon, 
  // ListIcon,
  LockIcon,
  // PencilIcon,
  TimeIcon,
  VideoIcon
} from "@/core/icons";
import { usePermissions } from "@/core/hooks/usePermissions";
import { useIsSystemAdmin } from "@/core/hooks/useIsSystemAdmin";
import { useTranslation } from "@/core/hooks/useTranslation";
import { useGetCaseTypesSubTypesQuery } from "@/cms/store/api/serviceApi";
import {
  useDeleteWorkflowMutation,
  useGetWorkflowsQuery,
  useLazyGetWorkflowsQuery
} from "@/cms/store/api/workflowApi";
// import { AuthService } from "@/cms/utils/authService";
import { formatDate } from "@/core/utils/crud";
import type { CaseTypeSubType } from "@/cms/types/case";
import type { PreviewConfig } from "@/core/types/enhanced-crud";
import type {
  Workflow,
  WorkflowAnalytics,
  // WorkflowData,
  WorkflowPagination,
  WorkflowQueryParams
} from "@/cms/types/workflow";
import MetricsView from "@/core/components/admin/MetricsView";
// import Badge from "@/core/components/ui/badge/Badge";
import Button from "@/core/components/ui/button/Button";
// import workflowList from "@/mocks/workflowList.json";

const WorkflowListComponent: React.FC<{ workflows: Workflow[], workflowsPagination: WorkflowPagination }> = ({ workflows, workflowsPagination }) => {
  const [deleteWorkflow] = useDeleteWorkflowMutation();
  const { refetch: getWorkflows } = useGetWorkflowsQuery({ wfType: "case" }, { skip: true });
  // const isSystemAdmin = AuthService.isSystemAdmin();
  const isSystemAdmin = useIsSystemAdmin();
  const navigate = useNavigate();
  const permissions = usePermissions();
  const { language, t } = useTranslation();

  const [data, setData] = useState<(Workflow & { id: string })[]>([]);
  const [
    // pagination,
    ,
    setPagination
  ] = useState<WorkflowPagination>({
    currentPage: workflowsPagination?.currentPage || 1,
    pageSize: workflowsPagination?.pageSize || 1,
    totalFiltered: workflowsPagination?.totalFiltered || 0,
    totalPage: workflowsPagination?.totalPage || 1,
    totalRecords: workflowsPagination?.totalRecords || 0,
  });
  const [isOpen, setIsOpen] = useState(false);
  const [workflowData, setWorkflowData] = useState<{ wfId: string, title: string, subTypeName: string }>(
    { wfId: "", title: "", subTypeName: "" }
  );
  const [workflowAnalytics, setWorkflowAnalytics] = useState<WorkflowAnalytics>();

  const isDeleteAvailable = (
    // publish: boolean
  ) => {
    // const canDelete = permissions.hasPermission("workflow.delete") && !publish;
    const canDelete = permissions.hasPermission("workflow.delete");
    // console.log("🚀 ~ isDeleteAvailable ~ canDelete:", canDelete);
    // console.log("🚀 ~ isDeleteAvailable ~ publish:", publish);
    return canDelete || isSystemAdmin;
  }

  const isEditAvailable = (
    // publish: boolean
  ) => {
    // const canEdit = permissions.hasPermission("workflow.update") && !publish;
    const canEdit = permissions.hasPermission("workflow.update");
    // console.log("🚀 ~ isEditAvailable ~ canEdit:", canEdit);
    // console.log("🚀 ~ isEditAvailable ~ publish:", publish);
    return canEdit || isSystemAdmin;
  }

  const isViewAvailable = () => {
    const canView = permissions.hasPermission("workflow.view");
    // console.log("🚀 ~ isDeleteAvailable ~ canView:", canView);
    return canView || isSystemAdmin;
  }

  const [queryParams, setQueryParams] = useState<WorkflowQueryParams>({
    start: 0,
    length: 10,
    search: "",
    wfType: ""
  });

  const [trigger, { data: response, isLoading }] = useLazyGetWorkflowsQuery();
  
  useEffect(() => {
    setQueryParams(prev => ({
      ...prev,
    }));
  }, []);

  useEffect(() => {
    // if (queryParams?.wfType) {
    //   trigger(queryParams);
    // }
    trigger(queryParams);
  }, [queryParams, trigger]);

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
      search: "",
      wfType: ""
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
      search: searchText,
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

  // ===================================================================
  // Mock Data
  // ===================================================================

  // const data: Workflow[] = workflowList as Workflow[];

  // ===================================================================
  // Real Functionality Data
  // ===================================================================

  // const data: Workflow[] = workflows as Workflow[];
  const tmp: (Workflow & { id: string })[] = workflows.map(w => ({
    ...w,
    id: typeof w.id === "string" ? w.id : w.wfId?.toString?.() ?? w.id?.toString?.() ?? "",
  }));

  useEffect(() => {
    setData(tmp);
    setPagination(workflowsPagination);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workflows]);

  useEffect(() => {
    setWorkflowAnalytics({
      totalWorkflows: data.length,
      activeWorkflows: data.filter(r => r.active).length,
      publishedWorkflows: data.filter(r => r.publish).length,
      draftWorkflows: data.filter(r => r.versions).length,
      lockedWorkflows: data.filter(r => r.locks).length
    });
  }, [data]);

  const statusConfig = [
    {
      active: true,
      color: "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100",
      icon: <CheckLineIcon className="w-4 h-4" />
    },
    {
      active: false,
      color: "bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100",
      icon: <CloseLineIcon className="w-4 h-4" />
    }
  ];
  const publicationConfig = [
    {
      publish: true,
      color: "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100",
      icon: <VideoIcon className="w-4 h-4" />
    },
    {
      publish: false,
      color: "bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100",
      icon: <TimeIcon className="w-4 h-4" />
    }
  ];
  const lockConfig = {
    locks: true,
    color: "bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100",
    icon: <LockIcon className="w-4 h-4" />
  };

  const safeTrimToEllipsis = (str: string, maxLength: number) => {
    if (maxLength < 3) {
      throw new Error("maxLength must be at least 3 to fit ellipsis.");
    };
    if (str.length <= maxLength) {
      return str;
    }
    return str.slice(0, maxLength - 3) + "...";
  }

  const { data: caseTypesSubTypesData } = useGetCaseTypesSubTypesQuery(null);
  const caseTypesSubTypes = caseTypesSubTypesData?.data as unknown as CaseTypeSubType[] || [];

  const wfExistInSubTypes = (wfId: string) => {
    const wfSubTypes = caseTypesSubTypes.find(st => st.wfId === wfId);
    return language === "th" && wfSubTypes?.th || wfSubTypes?.en;
  }
    
  // ===================================================================
  // CRUD Configuration
  // ===================================================================

  const config = {
    entityName: t("crud.workflow.name"),
    entityNamePlural: t("crud.workflow.name"),
    apiEndpoints: {
      list: "/workflows",
      create: "/workflows",
      read: "/workflows/:id",
      update: "/workflows/:id",
      delete: "/workflows/:id",
      bulkDelete: "/workflows/bulk",
      export: "/workflows/export"
    },
    columns: [
      {
        key: "name",
        label: t("crud.workflow.list.header.title"),
        sortable: true,
        render: (workflow: Workflow) => (
          <div className="flex items-center gap-3">
            {/* <VideoIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" /> */}
            <div>
              <div className="font-medium text-gray-900 dark:text-white">
                {workflow.title}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">
                {workflow.desc}
              </div>
            </div>
          </div>
        )
      },
      {
        key: "status",
        label: t("crud.workflow.list.header.active"),
        sortable: true,
        render: (workflow: Workflow) => {
          return (
            <div className="text-lg font-medium text-gray-900 dark:text-white capitalize">
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mr-1
                ${statusConfig.find(s => s.active === workflow.active)?.color || ""}
              `}>
                {statusConfig.find(s => s.active === workflow.active)?.icon || ""}
                {workflow.active ? t("common.active") : t("common.inactive")}
              </span>
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mr-1
                ${publicationConfig.find(p => p.publish === workflow.publish)?.color || ""}
              `}>
                {publicationConfig.find(p => p.publish === workflow.publish)?.icon || ""}
                {workflow.publish ? t("common.publish") : t("common.draft")}
              </span>
              {workflow.locks && (
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mr-1 ${lockConfig.color}`}>
                  <LockIcon className="w-3 h-4" />
                  {t("common.locked")}
                </span>
              )}
            </div>
          );
        }
      },
      {
        key: "createdAt",
        label: t("crud.workflow.list.header.createdAt"),
        sortable: true,
        render: (workflow: Workflow) => (
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {formatDate(workflow.createdAt)} {t("common.by")} {workflow.createdBy}
          </span>
        )
      },
    ],
    filters: [
      // {
      //   key: "status",
      //   label: "Status",
      //   type: "select" as const,
      //   options: [
      //     { value: "active", label: "Active" },
      //     { value: "inactive", label: "Inactive" },
      //     { value: "draft", label: "Draft" },
      //     { value: "testing", label: "Testing" }
      //   ]
      // },
      {
        key: "wfType",
        label: "Type",
        type: "select" as const,
        options: [
          { value: "", label: "All" },
          { value: "case", label: "Case" },
          { value: "request", label: "Request" }
        ]
      }
    ],
    actions: [
      {
        key: "view",
        label: t("crud.common.read"),
        variant: "primary" as const,
        // icon: EyeIcon,
        onClick: (workflow: Workflow) => navigate(`/cms/workflow/editor/v3/${workflow.wfId}`),
        // condition: () => permissions.hasPermission("workflow.view")
        condition: () => isViewAvailable()
      },
      {
        key: "update",
        label: t("crud.common.update"),
        variant: "warning" as const,
        // icon: PencilIcon,
        // onClick: (workflow: Workflow) => navigate(`/cms/workflow/editor/v3/${workflow.wfId}/edit`),
        onClick: (workflow: Workflow) => {
          const subTypeName = wfExistInSubTypes(workflow.wfId);
          if (subTypeName) {
            setWorkflowData({ wfId: workflow.wfId, title: workflow.title, subTypeName: subTypeName });
            setIsOpen(true);
          }
          else {
            navigate(`/cms/workflow/editor/v3/${workflow.wfId}/edit`);
          }
        },
        // condition: (workflow: Workflow) => ((permissions.hasPermission("workflow.update") && !workflow.publish) || isSystemAdmin) as boolean
        // condition: (workflow: Workflow) => isEditAvailable(workflow.publish)
        condition: () => isEditAvailable()
      },
      {
        key: "delete",
        label: t("crud.common.delete"),
        variant: "outline" as const,
        // icon: TrashBinIcon,
        onClick: (workflow: Workflow) => {
          // This will be intercepted by the container"s handleItemAction
          console.log("Delete action triggered for:", workflow.wfId);
        },
        // condition: (workflow: Workflow) => ((permissions.hasPermission("workflow.delete") && !workflow.publish) || isSystemAdmin) as boolean
        // condition: (workflow: Workflow) => isDeleteAvailable(workflow.publish)
        condition: () => isDeleteAvailable()
      }
    ]
  };

  // ===================================================================
  // Preview Configuration
  // ===================================================================

  // Preview Configuration
  const previewConfig: PreviewConfig<Workflow> = {
    title: (workflow: Workflow) => workflow.title,
    // subtitle: (workflow: Workflow) => safeTrimToEllipsis(workflow.desc, 50),
    // avatar: (workflow: Workflow) => {},
    size: "lg" as const,
    enableNavigation: true,
    tabs: [
      {
        key: "overview",
        label: t("crud.workflow.list.preview.tab.header.overview"),
        // icon: InfoIcon,
        fields: [
          {
            key: "desc",
            label: t("crud.workflow.list.preview.tab.overview.desc"),
            type: "text" as const,
          },
          {
            key: "active",
            label: "Status",
            type: "custom",
            render: value => value ? t("common.active") : t("common.inactive")
          },
          {
            key: "publish",
            label: "Publish",
            type: "custom",
            render: value => value ? t("common.yes") : t("common.no")
          },
          {
            key: "locks",
            label: "Locks",
            type: "custom",
            render: value => value ? t("common.yes") : t("common.no")
          },
          {
            key: "versions",
            label: t("crud.workflow.list.preview.tab.overview.versions"),
            type: "text" as const,
          },
          {
            key: "createdAt",
            label: t("crud.workflow.list.preview.tab.overview.createdAt"),
            type: "date" as const,
            render: value => value ? formatDate(value) : ""
          },
          {
            key: "createdBy",
            label: t("crud.workflow.list.preview.tab.overview.createdBy"),
            type: "text" as const
          },
          {
            key: "updatedAt",
            label: t("crud.workflow.list.preview.tab.overview.updatedAt"),
            type: "date" as const,
            render: value => value ? formatDate(value) : ""
          },
          {
            key: "updatedBy",
            label: t("crud.workflow.list.preview.tab.overview.updatedBy"),
            type: "text" as const
          }
        ]
      },
      {
        key: "configuration",
        label: t("crud.workflow.list.preview.tab.header.configuration"),
        // icon: PencilIcon,
        // fields: [
        //   {
        //     key: "config",
        //     label: "Configuration",
        //     type: "json" as const
        //   }
        // ]
      },
      {
        key: "activity",
        label: t("crud.workflow.list.preview.tab.header.activity"),
        render: (
          // item: unknown
        ) => {
          // const workflow = item as Workflow;
          return (
            <div className="space-y-4">
              {/*
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Recent Activity</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-gray-600 dark:text-gray-300">
                      Workflow executed successfully
                    </span>
                    <span className="text-gray-400 dark:text-gray-500 ml-auto">
                      2 hours ago
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-gray-600 dark:text-gray-300">
                      Configuration updated
                    </span>
                    <span className="text-gray-400 dark:text-gray-500 ml-auto">
                      1 day ago
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <span className="text-gray-600 dark:text-gray-300">
                      Workflow created
                    </span>
                    <span className="text-gray-400 dark:text-gray-500 ml-auto">
                      {formatDate(workflow.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
              */}

              {/*
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Performance</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {workflow.runCount}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Total Runs</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                      98.5%
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Success Rate</div>
                  </div>
                </div>
              </div>
              */}
            </div>);
        },
        fields: []
      }
    ],
    actions: [
      {
        key: "edit",
        label: t("crud.common.update"),
        // icon: PencilIcon,
        variant: "warning",
        onClick: (workflow: Workflow, closePreview: () => void) => {
          closePreview();
          // navigate(`/cms/workflow/editor/v3/${workflow.wfId}/edit`);
          const subTypeName = wfExistInSubTypes(workflow.wfId);
          if (subTypeName) {
            setWorkflowData({ wfId: workflow.wfId, title: workflow.title, subTypeName: subTypeName });
            setIsOpen(true);
          }
          else {
            navigate(`/cms/workflow/editor/v3/${workflow.wfId}/edit`);
          }
        },
        // condition: (workflow: Workflow) => ((permissions.hasPermission("workflow.update") && !workflow.publish) || isSystemAdmin) as boolean
        // condition: (workflow: Workflow) => isEditAvailable(workflow.publish)
        condition: () => isEditAvailable()
      },
      // {
      //   key: "duplicate",
      //   label: "Duplicate",
      //   // icon: CopyIcon,
      //   variant: "light",
      //   onClick: (workflow: Workflow, closePreview: () => void) => {
      //     console.log("Duplicating workflow:", workflow.wfId);
      //     closePreview();
      //   },
      //   condition: () => permissions.hasPermission("workflow.create")
      // },
      {
        key: "delete",
        label: t("crud.common.delete"),
        // icon: TrashBinIcon,
        variant: "outline",
        onClick: (workflow: Workflow, closePreview: () => void) => {
          console.log("Deleting workflow:", workflow.wfId);
          closePreview();
        },
        // condition: (workflow: Workflow) => ((permissions.hasPermission("workflow.delete") && !workflow.publish) || isSystemAdmin) as boolean
        // condition: (workflow: Workflow) => isDeleteAvailable(workflow.publish)
        condition: () => isDeleteAvailable()
      }
    ]
  };

  // ===================================================================
  // Advanced Filters
  // ===================================================================

  // const advancedFilters = [
  //   {
  //     key: "category",
  //     label: "Category",
  //     type: "select" as const,
  //     options: [
  //       { value: "Customer Management", label: "Customer Management" },
  //       { value: "Finance", label: "Finance" },
  //       { value: "Operations", label: "Operations" },
  //       { value: "Marketing", label: "Marketing" }
  //     ]
  //   },
  //   {
  //     key: "runCount",
  //     label: "Run Count",
  //     type: "number-range" as const,
  //     min: 0,
  //     max: 10000
  //   },
  //   {
  //     key: "createdAt",
  //     label: "Created Date",
  //     type: "date-range" as const
  //   }
  // ];

  // ===================================================================
  // Bulk Actions
  // ===================================================================

  // const bulkActions = [
  //   {
  //     key: "activate",
  //     label: "Activate Selected",
  //     variant: "primary" as const,
  //     onClick: async (items: Workflow[]) => {
  //       // API call to activate
  //       console.log("Activating workflows:", items.map(w => w.id));
  //     },
  //     condition: (items: Workflow[]) => items.some(w => w.active === false)
  //   },
  //   {
  //     key: "deactivate",
  //     label: "Deactivate Selected",
  //     variant: "warning" as const,
  //     onClick: async (items: Workflow[]) => {
  //       // API call to deactivate
  //       console.log("Deactivating workflows:", items.map(w => w.id));
  //     },
  //     condition: (items: Workflow[]) => items.some(w => w.active === true)
  //   }
  // ];

  // ===================================================================
  // Export Options
  // ===================================================================

  // const exportOptions = [
  //   {
  //     key: "csv-selected",
  //     label: "Export Selected (CSV)",
  //     format: "csv" as const,
  //     columns: ["name", "status", "createdAt", "runCount"]
  //   },
  //   {
  //     key: "json-all",
  //     label: "Export All (JSON)",
  //     format: "json" as const
  //   }
  // ];

  // ===================================================================
  // Custom Card Rendering
  // ===================================================================

  const renderCard = (workflow: Workflow) => {
    // const statusConfig = {
    //   active: { icon: VideoIcon, color: "text-green-600 dark:text-green-300 bg-green-100 dark:bg-green-800", label: "Active" },
    //   inactive: { icon: ListIcon, color: "text-red-600 dark:text-red-300 bg-red-100 dark:bg-red-800", label: "Inactive" },
    //   draft: { icon: TimeIcon, color: "text-yellow-600 dark:text-yellow-300 bg-yellow-100 dark:bg-yellow-800", label: "Draft" },
    //   testing: { icon: BoltIcon, color: "text-blue-600 dark:text-blue-300 bg-blue-100 dark:bg-blue-800", label: "Testing" }
    // }[workflow.status];

    // const Icon = statusConfig.icon;

    return (
      <>
        <div className="items-start justify-left mb-4">
          <div className="items-center gap-3 mb-3">
            {/* <Icon className="lg:hidden w-5 h-5 text-gray-500 dark:text-gray-400" /> */}
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {workflow.title}
            </h3>
          </div>
          <span className={`inline-flex mr-2 items-center px-2 py-1 rounded-full text-xs font-medium
            ${statusConfig.find(s => s.active === workflow.active)?.color || ""}
          `}>
            {statusConfig.find(s => s.active === workflow.active)?.icon || ""}
            {workflow.active ? "Active" : "Inactive"}
          </span>
          <span className={`inline-flex mr-2 items-center px-2 py-1 rounded-full text-xs font-medium
            ${publicationConfig.find(p => p.publish === workflow.publish)?.color || ""}
          `}>
            {publicationConfig.find(p => p.publish === workflow.publish)?.icon || ""}
            {workflow.publish ? "Publish" : "Draft"}
          </span>
          {workflow.locks && (
            <span className={`inline-flex mr-2 items-center px-2 py-1 rounded-full text-xs font-medium ${lockConfig.color}`}>
              <LockIcon className="w-4 h-4" />
              Lock
            </span>
          )}

          {/*
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}>
            {statusConfig.label}
          </span>
          */}
        </div>
        
        <p className="text-gray-600 dark:text-gray-300 mb-4 text-sm lg:min-h-15 xl:min-h-5 truncate">
          {safeTrimToEllipsis(workflow.desc, 50)}
        </p>

        <div className="xl:flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-3">
          <div className="flex items-center gap-1">
            {formatDate(workflow.createdAt)}
          </div>
        </div>

        {/*
        <div className="xl:flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-3">
          <div className="flex items-center gap-1">
            {formatDate(workflow.createdAt)}
          </div>
          <div className="font-medium">{workflow.runCount} runs</div>
        </div>
        */}
      </>
    );
  };

  // ===================================================================
  // Event Handlers
  // ===================================================================

  // Handle deletion and other actions
  const handleAction = (actionKey: string, workflow: Workflow) => {
    console.log(`Action ${actionKey} triggered for workflow:`, workflow.wfId);
    // Add any custom action handling here
  };

  // Handle deletion
  // Runs after the delete has already succeeded, and the container calls it inside its own
  // try/catch - so anything thrown here surfaces as a "delete failed" toast on a delete that
  // actually worked. getWorkflows is the refetch of a skip:true query, which RTK Query rejects
  // with "Cannot refetch a query that has not been started yet", hence the guard. The list still
  // refreshes: deleteWorkflow invalidates the "Workflow" tag that getWorkflows provides.
  const handleDelete = async (workflowId: string) => {
    console.log("Workflow deleted:", workflowId);
    // In a real app, might want to update local state or refetch data
    // setData(prevData => prevData.filter(w => w.id !== workflowId));
    try {
      const workflowsData = await getWorkflows().unwrap();
      const workflows = (workflowsData?.data as unknown as Workflow[]) || [];
      setData(
        workflows.map((w) => ({ ...w, id: w.wfId?.toString() ?? w.id?.toString() ?? '' })),
      );
      setPagination({
        currentPage: workflowsData?.currentPage || 1,
        pageSize: workflowsData?.pageSize || 1,
        totalFiltered: workflowsData?.totalFiltered || 0,
        totalPage: workflowsData?.totalPage || 1,
        totalRecords: workflowsData?.totalRecords || 0,
      })
    }
    catch (error) {
      console.warn("Post-delete workflow refresh skipped:", error);
    }
  };

  // ===================================================================
  // Render Component
  // ===================================================================

  const attrMetrics = [
    { key: "totalWorkflows", title: t("crud.workflow.metrics.total"), icon: GroupIcon, color: "blue", className: "text-blue-600" },
    { key: "activeWorkflows", title: t("crud.workflow.metrics.active"), icon: CheckLineIcon, color: "green", className: "text-green-600" },
    { key: "publishedWorkflows", title: t("crud.workflow.metrics.published"), icon: VideoIcon, color: "green", className: "text-green-600" },
    // { key: "draftWorkflows", title: "Draft", icon: PencilIcon, color: "yellow", className: "text-yellow-600" },
    { key: "lockedWorkflows", title: t("crud.workflow.metrics.locked"), icon: LockIcon, color: "red", className: "text-red-600" },
  ];

  return (
    <>
      <MetricsView metrics={workflowAnalytics} attrMetrics={attrMetrics} />

      <EnhancedCrudContainer
        // advancedFilters={advancedFilters}
        apiConfig={{
          baseUrl: "/api",
          endpoints: {
            list: "/workflows",
            create: "/workflows",
            read: "/workflows/:id",
            update: "/workflows/:id",
            delete: "/workflows/:id",
            bulkDelete: "/workflows/bulk",
            export: "/workflows/export"
          },
          serverSide: true,
          currentPage: currentPage,
          pageSize: queryLength,
          totalFiltered: totalFiltered,
          totalPage: totalPages,
          totalRecords: totalRecords
        }}
        // bulkActions={bulkActions}
        config={config}
        // data={data}
        data={(response?.data as unknown as (Workflow & { id: string })[]) || data}
        // Goes through RTK Query -> createHybridBaseQuery, so DELETE /workflows/:id becomes the
        // DeleteWorkflow mutation under GraphQL. The container's apiService fallback is a raw
        // fetch that would always speak REST.
        deleteItem={(id: string) => deleteWorkflow(id).unwrap()}
        displayModes={["card", "table"]}
        displayModeDefault="table"
        enableDebug={true} // Enable debug mode to troubleshoot
        // error={null}
        // exportOptions={exportOptions}
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
        module="workflow"
        // previewConfig={previewConfig}
        previewConfig={previewConfig as PreviewConfig<Workflow & { id: string }>}
        searchFields={["title", "desc"]}
        // customFilterFunction={() => true}
        onChangePageSize={handlePageSizeChange}
        onClearFilters={clearFilters}
        onCreate={() => navigate("/cms/workflow/editor/v3")}
        onDelete={handleDelete}
        onFilter={handleFilterChange}
        onGoToPage={handlePageChange}
        onItemAction={handleAction}
        // onItemAction={handleAction as (action: string, item: { wfId: string }) => void}
        // onItemClick={(item) => navigate(`/cms/workflow/${item.id}`)}
        onRefresh={() => window.location.reload()}
        onSearch={handleSearch}
        onSort={handleSort}
        // onUpdate={() => {}}
        renderCard={renderCard}
        // renderCard={renderCard as (item: Workflow) => React.ReactNode}
      />

      {workflowData.wfId && (
        <Modal
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          className="max-w-4xl p-6 max-h-[80vh] overflow-y-auto"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white cursor-default">
              {t("crud.workflow.list.confirm.warning.title")}
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
            {
              t("crud.workflow.list.confirm.warning.message")
                .replace("_WORKFLOW_", `"${workflowData.title || ""}"`)
                .replace("_SUB_TYPE_", `"${workflowData.subTypeName || ""}"`)
            }
          </div>
          <div className="flex items-center justify-end mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="flex gap-3">
              <Button
                onClick={() => setIsOpen(false)}
                variant="outline"
              >
                {t("crud.skill.confirm.button.cancel")}
              </Button>
              <Button onClick={() => navigate(`/cms/workflow/editor/v3/${workflowData.wfId}/edit`)} variant="warning">
                {t("crud.skill.confirm.button.confirm")}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
};

export default WorkflowListComponent;
