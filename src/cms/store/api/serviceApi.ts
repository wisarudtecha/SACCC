// /src/cms/store/api/serviceApi.ts
/**
 * Service Management API Endpoints
 * Case Status, etc.
 */
import { ApiResponse } from "@/cms/types";
import { CaseStatus, CaseStatusQueryParams, CaseTypeSubType, EnhancedCaseType, CaseTypesCreateData, CaseTypesQueryParams, CaseTypesUpdateData, EnhancedCaseSubType, CaseSubTypesCreateData, CaseSubTypesQueryParams, CaseSubTypesUpdateData } from "@/cms/types/case";
import { baseApi } from "@/core/store/api/baseApi";

export const serviceApi = baseApi.injectEndpoints({
  endpoints: builder => ({
    // Case Status Management
    getCaseStatuses: builder.query<ApiResponse<CaseStatus[]>, CaseStatusQueryParams>({
      query: params => {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined) {
            searchParams.append(key, String(value));
          }
        });
        return `/case_status?${searchParams.toString()}`;
      },
      providesTags: ["Cases"],
    }),

    // Case Type and Sub-Type Management
    getCaseTypesSubTypes: builder.query<ApiResponse<CaseTypeSubType[]>, null>({
      query: () => {
        return "/casetypes_with_subtype";
      },
      providesTags: ["Cases"],
    }),

    // ===================================================================
    // Case Type
    // ===================================================================

    // POST api/v1/casetypes/add
    createCaseTypes: builder.mutation<ApiResponse<EnhancedCaseType>, CaseTypesCreateData>({
      query: data => ({
        url: "/casetypes/add",
        method: "POST",
        body: data,
      }),
      // providesTags: ["Cases"],
    }),

    // GET api/v1/casetypes
    getCaseTypes: builder.query<ApiResponse<EnhancedCaseType[]>, CaseTypesQueryParams>({
      query: params => {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined) {
            searchParams.append(key, String(value));
          }
        });
        return `/casetypes?${searchParams.toString()}`;
      },
      // providesTags: ["Cases"],
    }),

    // PATCH api/v1/casetypes/{id}
    updateCaseTypes: builder.mutation<ApiResponse<EnhancedCaseType>, { id: string; data: CaseTypesUpdateData }>({
      query: ({ id, data }) => ({
        url: `/casetypes/${id}`,
        method: "PATCH",
        body: data
      }),
      // providesTags: ["Cases"],
    }),

    // DELETE api/v1/casetypes/{id}
    deleteCaseTypes: builder.mutation<ApiResponse<void>, number | string>({
      query: id => ({
        url: `/casetypes/${id}`,
        method: "DELETE"
      }),
      // providesTags: ["Cases"],
    }),

    // ===================================================================
    // Case Sub-Type
    // ===================================================================

    // POST api/v1/casesubtypes/add
    createCaseSubTypes: builder.mutation<ApiResponse<EnhancedCaseSubType>, CaseSubTypesCreateData>({
      query: data => ({
        url: "/casesubtypes/add",
        method: "POST",
        body: data,
      }),
      // providesTags: ["Cases"],
    }),

    // GET api/v1/casesubtypes
    getCaseSubTypes: builder.query<ApiResponse<EnhancedCaseSubType[]>, CaseSubTypesQueryParams>({
      query: params => {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined) {
            searchParams.append(key, String(value));
          }
        });
        return `/casesubtypes?${searchParams.toString()}`;
      },
      // providesTags: ["Cases"],
    }),

    // PATCH api/v1/casesubtypes/{id}
    updateCaseSubTypes: builder.mutation<ApiResponse<EnhancedCaseSubType>, { id: string; data: CaseSubTypesUpdateData }>({
      query: ({ id, data }) => ({
        url: `/casesubtypes/${id}`,
        method: "PATCH",
        body: data
      })
    }),

    // DELETE api/v1/casesubtypes/{id}
    deleteCaseSubTypes: builder.mutation<ApiResponse<void>, number | string>({
      query: id => ({
        url: `/casesubtypes/${id}`,
        method: "DELETE"
      }),
      // providesTags: ["Cases"],
    }),

  }),
});

export const {
  useGetCaseStatusesQuery,
  useGetCaseTypesSubTypesQuery,
  useCreateCaseTypesMutation,
  useGetCaseTypesQuery,
  useUpdateCaseTypesMutation,
  useDeleteCaseTypesMutation,
  useCreateCaseSubTypesMutation,
  useGetCaseSubTypesQuery,
  useUpdateCaseSubTypesMutation,
  useDeleteCaseSubTypesMutation,
} = serviceApi;
