// src/cms/store/api/caseResultApi.ts
/**
 * Case Result API Endpoints
 * Admin management of org-curated close-reason codes shown in the case
 * close/cancel form (src/cms/components/case/CaseDetailView.tsx).
 *
 * Mirrors placesApi.ts: same baseApi injection, same { id, data } PATCH
 * convention, and the "CaseResult" cache tag IS wired so a create/update/delete
 * refreshes the list in place - no window.location.replace.
 *
 * The GraphQL mapping lives in src/cms/store/api/graphql/caseResultQueries.ts
 * (GQL_CASE_RESULT) - required, since every environment runs
 * VITE_USE_GRAPHQL="true" with no REST fallback. The list URL keeps its trailing
 * slash ("/case/result/") to match the existing GQL_CASE_RESULT key.
 *
 * Also feeds src/cms/components/case/uitls/CaseApiManager.tsx (fetchCaseResults),
 * which snapshots the list into localStorage at login for the close-case picker.
 */
import { baseApi } from "@/core/store/api/baseApi";
import type { ApiResponse } from "@/core/types";
import type {
  CaseResult, CaseResultCreateData, CaseResultQueryParams, CaseResultUpdateData,
} from "@/cms/types/caseResult";

export const caseResultApi = baseApi.injectEndpoints({
  endpoints: builder => ({
    // POST /case/result/add
    createCaseResult: builder.mutation<ApiResponse<CaseResult>, CaseResultCreateData>({
      query: data => ({
        url: "/case/result/add",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["CaseResult"],
    }),

    // GET /case/result/
    getCaseResults: builder.query<ApiResponse<CaseResult[]>, CaseResultQueryParams>({
      query: params => ({
        url: "/case/result/",
        params,
      }),
      providesTags: ["CaseResult"],
    }),

    // GET /case/result/{id}
    getCaseResultById: builder.query<ApiResponse<CaseResult>, string>({
      query: id => `/case/result/${id}`,
      providesTags: ["CaseResult"],
    }),

    // PATCH /case/result/{id}
    updateCaseResult: builder.mutation<ApiResponse<CaseResult>, { id: string; data: CaseResultUpdateData }>({
      query: ({ id, data }) => ({
        url: `/case/result/${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: ["CaseResult"],
    }),

    // DELETE /case/result/{id}
    deleteCaseResult: builder.mutation<ApiResponse<void>, string>({
      query: id => ({
        url: `/case/result/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["CaseResult"],
    }),
  }),
  // Vite HMR re-runs this module without a full page reload, which calls injectEndpoints a
  // second time. Without this, RTK Query keeps the definitions registered by the previous
  // run and an edit to a `query` silently has no effect until the page is reloaded.
  overrideExisting: import.meta.env.DEV,
});

export const {
  useCreateCaseResultMutation,
  useGetCaseResultsQuery,
  useGetCaseResultByIdQuery,
  useUpdateCaseResultMutation,
  useDeleteCaseResultMutation,
} = caseResultApi;
