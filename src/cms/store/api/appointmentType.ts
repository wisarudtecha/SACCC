// src/cms/store/api/appointmentType.ts
/**
 * Appointment Type Management API Endpoints
 * Appointment Type CRUD operations.
 */
import { AppointmentType, AppointmentTypeInsert, AppointmentTypeUpdate } from "@/cms/types/appointmentType";
import { PaginationParams } from "@/cms/types/dispatch";
import { baseWelcomeCrmApi } from "@/core/store/api/baseApi";
import { ApiResponse } from "@/core/types";

export const appointmentTypeApi = baseWelcomeCrmApi.injectEndpoints({
    endpoints: (builder) => ({

        getAppointmentType: builder.query<ApiResponse<AppointmentType[]>, PaginationParams>({
            query: (params) => ({
                url: "/appointment_types",
                params,
            }),
            providesTags: ["AppointmentType"],
        }),

        insertAppointmentType: builder.mutation<ApiResponse<null>, AppointmentTypeInsert>({
            query: (params) => ({
                url: "/appointment_types",
                method: "POST",
                body: params
            }),
            invalidatesTags: ["AppointmentType"],
        }),

        updateAppointmentType: builder.mutation<ApiResponse<null>, AppointmentTypeUpdate>({
            query: (params) => ({
                url: "/appointment_types/" + params.appointmentTypeId,
                method: "PUT",
                body: params
            }),
            invalidatesTags: ["AppointmentType"],
        }),

        deleteAppointmentType: builder.mutation<ApiResponse<null>, { appointmentTypeId: string }>({
            query: (params) => ({
                url: "/appointment_types/" + params.appointmentTypeId,
                method: "DELETE",
            }),
            invalidatesTags: ["AppointmentType"],
        }),

    }),
});

export const {
    useGetAppointmentTypeQuery,
    useLazyGetAppointmentTypeQuery,
    useInsertAppointmentTypeMutation,
    useUpdateAppointmentTypeMutation,
    useDeleteAppointmentTypeMutation,
} = appointmentTypeApi;
