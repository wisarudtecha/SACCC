// /src/store/api/workflowApi.ts
/**
 * Workflow Management API Endpoints
 * Complete workflow designer, execution, and template management
 */

import { baseApi } from "@/core/store/api/baseApi";
import type { ApiResponse, WorkflowStep, WorkflowTrigger } from "@/cms/types";
import type { Workflow, WorkflowData, WorkflowCreateData, WorkflowQueryParams } from "@/cms/types/workflow";

export const workflowApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Workflow CRUD
    // getWorkflows: builder.query<ApiResponse<Workflow[]>, { 
    //   page?: number;
    //   limit?: number;
    //   category?: string;
    //   status?: "active" | "inactive";
    //   search?: string;
    // }>({
    //   query: (params) => {
    //     const searchParams = new URLSearchParams();
    //     Object.entries(params).forEach(([key, value]) => {
    //       if (value !== undefined) {
    //         searchParams.append(key, String(value));
    //       }
    //     });
    //     return `/workflows?${searchParams.toString()}`;
    //   },
    //   providesTags: ["Workflow"],
    // }),

    // getWorkflows: builder.query<ApiResponse<WorkflowData[]>, string>({
    //   query: () => `/workflows`,
    // }),

    getWorkflows: builder.query<ApiResponse<WorkflowData[]>, WorkflowQueryParams>({
      query: params => {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined) {
            searchParams.append(key, String(value));
          }
        });
        return `/workflows?${searchParams.toString()}`;
      },
      providesTags: ["Workflow"],
    }),

    getWorkflow: builder.query<ApiResponse<Workflow>, string>({
      query: (id) => `/workflows/${id}`,
    }),

    // createWorkflow: builder.mutation<ApiResponse<Workflow>, WorkflowCreateData>({
    //   query: (data) => ({
    //     url: "/workflows",
    //     method: "POST",
    //     body: data,
    //   }),
    //   invalidatesTags: ["Workflow"],
    // }),

    createWorkflow: builder.mutation<ApiResponse<Workflow>, WorkflowData>({
      query: (data) => ({
        url: "/workflows",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Workflow"],
    }),

    updateWorkflow: builder.mutation<ApiResponse<Workflow>, { id: string; data: WorkflowData }>({
      query: ({ id, data }) => ({
        url: `/workflows/${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: "Workflow", id }],
    }),

    deleteWorkflow: builder.mutation<ApiResponse<void>, string>({
      query: (id) => ({
        url: `/workflows/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Workflow"],
    }),

    // getWorkflowExecution: builder.query<WorkflowExecution, string>({
    //   query: (executionId) => `/workflows/executions/${executionId}`,
    // }),

    // getWorkflowExecutions: builder.query<ApiResponse<WorkflowExecution[]>, {
    //   workflowId?: string;
    //   status?: "pending" | "running" | "completed" | "failed";
    //   page?: number;
    //   limit?: number;
    // }>({
    //   query: (params) => {
    //     const searchParams = new URLSearchParams();
    //     Object.entries(params).forEach(([key, value]) => {
    //       if (value !== undefined) {
    //         searchParams.append(key, String(value));
    //       }
    //     });
    //     return `/workflows/executions?${searchParams.toString()}`;
    //   },
    // }),

    createWorkflowFromTemplate: builder.mutation<ApiResponse<Workflow>, {
      templateId: string;
      customizations?: Partial<WorkflowCreateData>;
    }>({
      query: (data) => ({
        url: "/workflows/from-template",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Workflow"],
    }),

    // Workflow validation
    validateWorkflow: builder.mutation<ApiResponse<{ isValid: boolean; errors: string[] }>, {
      steps: WorkflowStep[];
      triggers: WorkflowTrigger[];
    }>({
      query: (data) => ({
        url: "/workflows/validate",
        method: "POST",
        body: data,
      }),
    }),

    // Workflow analytics
    getWorkflowAnalytics: builder.query<ApiResponse<unknown>, {
      workflowId?: string;
      timeRange: { start: string; end: string };
    }>({
      query: (params) => ({
        url: "/workflows/analytics",
        method: "POST",
        body: params,
      }),
    }),

    getWorkflowMetrics: builder.query<ApiResponse<{
      totalExecutions: number;
      successRate: number;
      averageExecutionTime: number;
      bottlenecks: WorkflowStep[];
    }>, string>({
      query: (workflowId) => `/workflows/${workflowId}/metrics`,
    }),

    // Workflow versioning
    getWorkflowVersions: builder.query<ApiResponse<Workflow[]>, string>({
      query: (workflowId) => `/workflows/${workflowId}/versions`,
    }),

    createWorkflowVersion: builder.mutation<ApiResponse<Workflow>, {
      workflowId: string;
      changes: Partial<WorkflowCreateData>;
      comment?: string;
    }>({
      query: ({ workflowId, changes, comment }) => ({
        url: `/workflows/${workflowId}/versions`,
        method: "POST",
        body: { changes, comment },
      }),
      invalidatesTags: (_result, _error, { workflowId }) => [{ type: "Workflow", id: workflowId }],
    }),

    rollbackWorkflow: builder.mutation<ApiResponse<Workflow>, {
      workflowId: string;
      versionId: string;
    }>({
      query: ({ workflowId, versionId }) => ({
        url: `/workflows/${workflowId}/rollback/${versionId}`,
        method: "POST",
      }),
      invalidatesTags: (_result, _error, { workflowId }) => [{ type: "Workflow", id: workflowId }],
    }),
  }),
});

export const {
  useGetWorkflowsQuery,
  useLazyGetWorkflowsQuery,
  useGetWorkflowQuery,
  useCreateWorkflowMutation,
  useUpdateWorkflowMutation,
  useDeleteWorkflowMutation,
  // useExecuteWorkflowMutation,
  // useGetWorkflowExecutionQuery,
  // useGetWorkflowExecutionsQuery,
  useCreateWorkflowFromTemplateMutation,
  useValidateWorkflowMutation,
  useGetWorkflowAnalyticsQuery,
  useGetWorkflowMetricsQuery,
  useGetWorkflowVersionsQuery,
  useCreateWorkflowVersionMutation,
  useRollbackWorkflowMutation,
} = workflowApi;
