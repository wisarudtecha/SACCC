
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

        insertAppointmentType: builder.query<ApiResponse<null>, AppointmentTypeInsert>({
            query: (params) => ({
                url: "/appointment_types",
                method: "POST",
                body:params
            }),
            providesTags: ["AppointmentType"],
        }),

        updateAppointmentType: builder.query<ApiResponse<null>, AppointmentTypeUpdate>({
            query: (params) => ({
                url: "/appointment_types/"+params.appointmentTypeId,
                method: "PUT",
                body:params
            }),
            providesTags: ["AppointmentType"],
        }),

        deleteAppointmentType: builder.query<ApiResponse<null>, {appointmentTypeId:string}>({
            query: (params) => ({
                url: "/appointment_types/"+params.appointmentTypeId,
                method: "DELETE",
            }),
            providesTags: ["AppointmentType"],
        }),







    }),
});
export const {
    useGetAppointmentTypeQuery,
    useInsertAppointmentTypeQuery,
    useLazyGetAppointmentTypeQuery,
    useLazyInsertAppointmentTypeQuery,

} = appointmentTypeApi;
