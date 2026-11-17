import { ApiResponse } from "@/cms/types";
import { baseApi } from "@/core/store/api/baseApi";
// import { FormFieldWithNode } from "@/cms/components/interface/FormField";
import { CaseSop, CaseSopParams, dispatchInterface, CancelCase, CancelUnit, UnitWithWorkload } from "@/cms/types/dispatch";

// NOTE (2026-11-16) — do not reintroduce getCommands / getStations / getDepartment here.
//
// endpoint names are GLOBAL to `baseApi`: RTK Query keeps exactly one definition per name, and
// a second `injectEndpoints` call only replaces it when `overrideExisting === true` — which
// every api slice in this repo sets to `import.meta.env.DEV`. So the winner is "last module
// evaluated" in dev and "first module evaluated" in a production build: the same duplicate
// silently resolves to a different definition per environment.
//
// These three used to live here with `providesTags: ["Dispatch"]`, colliding with
// `@/core/store/api/organizationApi`'s versions (`providesTags: ["Organization"]`). Whichever
// won, the other caller's invalidation stopped matching: the Organization admin page's deletes
// invalidated "Organization" while the running `getCommands`/`getStations` provided only
// "Dispatch", so the deleted row stayed on screen until a full browser reload.
//
// `/departments`, `/commands` and `/stations` are owned by `@/core/store/api/organizationApi`
// (all three providers are exported from there and every consumer imports that module). Dispatch
// only needs the case/unit endpoints below.
export const dispantchApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({

        getCaseSop: builder.query<ApiResponse<CaseSop>, CaseSopParams>({
            query: (params) => ({
                url: `/dispatch/${params.caseId}/SOP`,
            }),
            providesTags: ["Dispatch"],
        }),

        getUnit: builder.query<ApiResponse<UnitWithWorkload[]>, { caseId: string }>({
            query: (params) => ({
                url: `/dispatch/${params.caseId}/units`,
            }),
            providesTags: ["Dispatch"],
        }),

        postDispacth: builder.query<ApiResponse<null>, dispatchInterface>({
            query: (params) => ({
                url: `/dispatch/event`,
                method: "POST",
                body: params
            }),
            providesTags: ["Dispatch"],
        }),

        postDispacthMutation: builder.mutation<ApiResponse<null>, dispatchInterface>({
            query: (params) => ({
                url: `/dispatch/event`,
                method: "POST",
                body: params
            }),
            // getUnit / getCaseSop both provide "Dispatch"; without this every
            // caller has to refetch by hand after dispatching.
            invalidatesTags: ["Dispatch"],
        }),

        getSopUnitMutation: builder.mutation<ApiResponse<null>, { caseId: string, unitId: string }>({
            query: (params) => ({
                url: `/dispatch/${params.caseId}/SOP/unit/${params.unitId}`,
                method: "GET",
                body: params
            }),
        }),

        getSopUnit: builder.query<ApiResponse<CaseSop>, { caseId: string, unitId: string }>({
            query: (params) => ({
                url: `/dispatch/${params.caseId}/SOP/unit/${params.unitId}`,
                method: "GET",
            }),
        }),

        postCancelCaseMutation: builder.mutation<ApiResponse<null>, CancelCase>({
            query: (params) => ({
                url: `/dispatch/cancel/case`,
                method: "POST",
                body: params
            }),
        }),

        postCancelUnitMutation: builder.mutation<ApiResponse<null>, CancelUnit>({
            query: (params) => ({
                url: `/dispatch/cancel/unit`,
                method: "POST",
                body: params
            }),
            // Same reason as postDispacthMutation: withdrawing a unit changes
            // both the unit list and the case SOP.
            invalidatesTags: ["Dispatch"],
        }),
    }),
    // Vite HMR re-runs this module without a full page reload, which calls injectEndpoints a
    // second time. Without this, RTK Query keeps the definitions registered by the previous
    // run and an edit to a `query` silently has no effect until the page is reloaded.
    overrideExisting: import.meta.env.DEV,
});

export const {
    useGetCaseSopQuery,
    useLazyGetCaseSopQuery,
    useGetUnitQuery,
    usePostDispacthQuery,
    usePostDispacthMutationMutation,
    useGetSopUnitMutationMutation,
    useGetSopUnitQuery,
    useLazyGetSopUnitQuery,
    usePostCancelCaseMutationMutation,
    usePostCancelUnitMutationMutation
} = dispantchApi;



