import { ApiResponse } from "@/cms/types";
import { baseApi } from "@/core/store/api/baseApi";
// import { FormFieldWithNode } from "@/cms/components/interface/FormField";
import { Commands, CaseSop, CaseSopParams, dispatchInterface, CancelCase, CancelUnit, Unit } from "@/cms/types/dispatch";
import { Station } from "@/core/types/organization";
import { Department } from "@/core/types/user";
import { PaginationParams } from "./custommerApi";


export const dispantchApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({

        getCommands: builder.query<ApiResponse<Commands[]>, PaginationParams>({
            query: (params) => ({
                url: "/commands",
                params,
            }),
            providesTags: ["Dispatch"],
        }),

        getDepartment: builder.query<ApiResponse<Department[]>, PaginationParams>({
            query: (params) => ({
                url: "/departments",
                params,
            }),
            providesTags: ["Dispatch"],
        }),

        getStations: builder.query<ApiResponse<Station[]>, PaginationParams>({
            query: (params) => ({
                url: "/stations",
                params,
            }),
            providesTags: ["Dispatch"],
        }),

        getCaseSop: builder.query<ApiResponse<CaseSop>, CaseSopParams>({
            query: (params) => ({
                url: `/dispatch/${params.caseId}/SOP`,
            }),
            providesTags: ["Dispatch"],
        }),

        getUnit: builder.query<ApiResponse<Unit[]>, { caseId: string }>({
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
    useGetCommandsQuery,
    useGetDepartmentQuery,
    useGetStationsQuery,
    useGetCaseSopQuery,
    useGetUnitQuery,
    usePostDispacthQuery,
    usePostDispacthMutationMutation,
    useGetSopUnitMutationMutation,
    useGetSopUnitQuery,
    useLazyGetSopUnitQuery,
    usePostCancelCaseMutationMutation,
    usePostCancelUnitMutationMutation
} = dispantchApi;



