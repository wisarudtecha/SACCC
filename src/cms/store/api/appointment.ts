

import { Appointment, AppointmentInsert, AppointmentStatusCount, AppointmentUpdate } from "@/cms/types/appointment";

import { PaginationParams } from "@/cms/types/dispatch";
import { baseWelcomeCrmApi } from "@/core/store/api/baseApi";
import { ApiResponse } from "@/core/types";




export const appointmentApi = baseWelcomeCrmApi.injectEndpoints({
    endpoints: (builder) => ({

        getAppointment: builder.query<ApiResponse<Appointment[]>, PaginationParams & { search?: string, start_date?: string, end_date?: string, done?: boolean }>({
            query: (params) => ({
                url: "/appointment",
                params,
            }),
            providesTags: ["Appointment"],
        }),

        getAppointmentByCustomerId: builder.query<ApiResponse<Appointment[]>, PaginationParams & { id: string, done?: boolean }>({
            query: (params) => ({
                url: "/appointment/" + params.id,
                params,
            }),
            providesTags: ["Appointment"],
        }),

        getAppointmentByCustomerNumberMutation: builder.mutation<ApiResponse<Appointment[]>, PaginationParams & { customerId: string }>({
            query: (params) => ({
                url: "/appointment/" + params.customerId,
                params,
            }),
            invalidatesTags: ["Appointment"],
        }),

        insertAppointment: builder.query<ApiResponse<null>, AppointmentInsert>({
            query: (params) => ({
                url: "/appointment",
                method: "POST",
                body: params
            }),
            providesTags: ["Appointment"],
        }),

        insertAppointmentMutation: builder.mutation<ApiResponse<null>, AppointmentInsert>({
            query: (params) => ({
                url: "/appointment",
                method: "POST",
                body: params
            }),
            invalidatesTags: ["Appointment"],
        }),

        updateAppointment: builder.mutation<ApiResponse<null>, AppointmentUpdate>({
            query: (params) => ({
                url: "/appointment/" + params.appointmentId,
                method: "PUT",
                body: params
            }),
            invalidatesTags: ["Appointment"],
        }),

        changeAppointmentStatus: builder.mutation<ApiResponse<null>, string>({
            query: (appointmentId) => ({
                url: `/appointment/next_stage/${appointmentId}`,
                method: "PATCH",
            }),
            invalidatesTags: ["Appointment"],
        }),

        deleteAppointment: builder.mutation<ApiResponse<null>, { appointmentId: string }>({
            query: (params) => ({
                url: "/appointment/" + params.appointmentId,
                method: "DELETE",
            }),
            invalidatesTags: ["Appointment"],
        }),

        getAppointmentStatusCount: builder.query<ApiResponse<AppointmentStatusCount[]>, string>({
            query: (customerId) => ({
                url: `/appointment/status_count/${customerId}`,
            }),
            providesTags: ["Appointment"],
        }),

        getMyAppointmentStatusCount: builder.query<ApiResponse<AppointmentStatusCount[]>, void>({
            query: () => ({
                url: `/appointment/status_count`,
            }),
            providesTags: ["Appointment"],
        }),

    }),
    // Vite HMR re-runs this module without a full page reload, which calls injectEndpoints a
    // second time. Without this, RTK Query keeps the definitions registered by the previous
    // run and an edit to a `query` silently has no effect until the page is reloaded.
    overrideExisting: import.meta.env.DEV,
});
export const {
    useGetAppointmentQuery,
    useInsertAppointmentQuery,
    useLazyGetAppointmentQuery,
    useLazyInsertAppointmentQuery,
    useInsertAppointmentMutationMutation,
    useDeleteAppointmentMutation,
    useUpdateAppointmentMutation,
    useGetAppointmentByCustomerNumberMutationMutation,
    useChangeAppointmentStatusMutation,
    useGetAppointmentByCustomerIdQuery,
    useLazyGetAppointmentByCustomerIdQuery,
    useGetAppointmentStatusCountQuery,
    useGetMyAppointmentStatusCountQuery,
} = appointmentApi;