// src/core/store/api/dashboardLayoutApi.ts
/**
 * Dashboard Layout API Endpoints
 * Saved layouts for the customizable dashboard (CRUD).
 *
 * Contract confirmed against `src/cms/mocks/layoutConfigCURL.sh` (the BFF's own
 * GraphQL examples for this domain). Endpoints target the shared
 * `/layout_configurations` resource, scoped to `type: "dashboard"` — see
 * `DASHBOARD_LAYOUT_TYPE` in the types file for why that constant isn't part of
 * the public request DTOs.
 *
 * Note the asymmetry versus most CRUD files in this codebase: create posts to
 * `/layout_configurations/add` (not the list URL), and update is PATCH (not PUT).
 * Both are as specified in layoutConfigCURL.sh, not a repo-convention choice.
 *
 * GraphQL mapping lives in `graphql/dashboardLayoutQueries.ts` (root "Layout",
 * operations GetListLayout/GetLayoutById/CreateLayout/UpdateLayout/DeleteLayout),
 * registered in `src/core/utils/gqlMapper.ts` as `GQL_DASHBOARD_LAYOUT`.
 *
 * "Dashboard" is already present in `commonTagTypes`, so no tagTypes change is needed.
 */
import { baseApi } from "@/core/store/api/baseApi";
import type { ApiResponse } from "@/core/types";
import {
  DASHBOARD_LAYOUT_TYPE,
  type DashboardLayout,
  type DashboardLayoutCreateData,
  type DashboardLayoutQueryParams,
  type DashboardLayoutSummary,
  type DashboardLayoutUpdateData,
} from "@/core/types/dashboardLayout";

const DEFAULT_START = 0;
const DEFAULT_LENGTH = 100;

export const dashboardLayoutApi = baseApi.injectEndpoints({
  endpoints: builder => ({
    // GET /layout_configurations
    //
    // Returns metadata only — the live response carries no `widgets`. Typed as summaries so
    // a list row can never be mistaken for a full layout; use readDashboardLayoutById for that.
    readDashboardLayout: builder.query<ApiResponse<DashboardLayoutSummary[]>, DashboardLayoutQueryParams | void>({
      query: params => {
        const searchParams: Record<string, string | number | boolean> = {
          type: DASHBOARD_LAYOUT_TYPE,
          start: params?.start ?? DEFAULT_START,
          length: params?.length ?? DEFAULT_LENGTH,
        };
        if (params?.isShared !== undefined) {
          searchParams.isShared = params.isShared;
        }
        if (params?.isDefault !== undefined) {
          searchParams.isDefault = params.isDefault;
        }

        return {
          url: "/layout_configurations",
          params: searchParams,
        };
      },
      providesTags: ["Dashboard"],
    }),

    // GET /layout_configurations/{id}
    readDashboardLayoutById: builder.query<ApiResponse<DashboardLayout>, string>({
      query: layoutId => `/layout_configurations/${layoutId}`,
      providesTags: ["Dashboard"],
    }),

    // POST /layout_configurations/add
    createDashboardLayout: builder.mutation<ApiResponse<DashboardLayout>, DashboardLayoutCreateData>({
      query: data => ({
        url: "/layout_configurations/add",
        method: "POST",
        body: { type: DASHBOARD_LAYOUT_TYPE, ...data },
      }),
      invalidatesTags: ["Dashboard"],
    }),

    // PATCH /layout_configurations/{id}
    updateDashboardLayout: builder.mutation<
      ApiResponse<DashboardLayout>,
      { layoutId: string; data: DashboardLayoutUpdateData }
    >({
      query: ({ layoutId, data }) => ({
        url: `/layout_configurations/${layoutId}`,
        method: "PATCH",
        body: { type: DASHBOARD_LAYOUT_TYPE, ...data },
      }),
      invalidatesTags: ["Dashboard"],
    }),

    // DELETE /layout_configurations/{id}
    deleteDashboardLayout: builder.mutation<ApiResponse<void>, string>({
      query: layoutId => ({
        url: `/layout_configurations/${layoutId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Dashboard"],
    }),
  }),
  // Vite HMR re-runs this module without a full page reload, which calls injectEndpoints a
  // second time. Without this, RTK Query keeps the definitions registered by the previous
  // run and an edit to a `query` silently has no effect until the page is reloaded.
  overrideExisting: import.meta.env.DEV,
});

export const {
  useReadDashboardLayoutQuery,
  useReadDashboardLayoutByIdQuery,
  // Imperative re-read, used to adopt a fresh baseline after a save.
  useLazyReadDashboardLayoutByIdQuery,
  useCreateDashboardLayoutMutation,
  useUpdateDashboardLayoutMutation,
  useDeleteDashboardLayoutMutation,
} = dashboardLayoutApi;
