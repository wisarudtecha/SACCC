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
            // The BFF mutation takes AppointmentTypeInput { id, active, en, th } - the record is
            // identified by "id", not "appointmentTypeId", so the caller-side field name is
            // translated here rather than leaked into the request body.
            query: ({ appointmentTypeId, active, en, th }) => ({
                url: "/appointment_types/" + appointmentTypeId,
                method: "PUT",
                body: { id: appointmentTypeId, active, en, th }
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
