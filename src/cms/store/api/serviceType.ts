// src/cms/store/api/serviceType.ts
/**
 * Service Type Management API Endpoints
 * Service Type CRUD operations, etc.
 */
import { baseApiCrm } from "@/core/store/api/baseApi";
import type { ApiResponse } from "@/core/types";
import type { ServiceInsert, ServiceType, ServiceUpdate } from "@/cms/types/serviceType";
import type { PaginationParams } from "@/cms/types/dispatch";

export const serviceTypeApi = baseApiCrm.injectEndpoints({
  endpoints: builder => ({
    insertServiceType: builder.mutation<ApiResponse<null>, ServiceInsert>({
      query: params => ({
        url: "/service_type",
        method: "POST",
        body: params
      }),
      invalidatesTags: ["ServiceType"]
    }),

    getServiceType: builder.query<ApiResponse<ServiceType[]>, PaginationParams & {orderBy?: string,direction?: string}>({
      query: params => ({
        url: "/service_type",
        params
      }),
      providesTags: ["ServiceType"]
    }),

    updateServiceType: builder.mutation<ApiResponse<null>, ServiceUpdate>({
      // The BFF ServiceTypeInput identifies the record by `id`, whose VALUE is the
      // service-type UUID (`serviceId`); `ServiceType.id` is the integer PK and is not
      // what the API wants. Same shape as appointmentType.ts / commit a7c4182.
      query: ({ serviceId, active, en, th, priority, price, image }) => ({
        url: "/service_type/" + serviceId,
        method: "PUT",
        body: { id: serviceId, active, en, th, priority, price, image }
      }),
      invalidatesTags: ["ServiceType"]
    }),

    deleteServiceType: builder.mutation<ApiResponse<null>, { serviceId: string }>({
      query: ({ serviceId }) => ({
        url: "/service_type/" + serviceId,
        method: "DELETE"
      }),
      invalidatesTags: ["ServiceType"]
    })
  }),
  // Vite HMR re-runs this module without a full page reload, which calls injectEndpoints a
  // second time. Without this, RTK Query keeps the definitions registered by the previous
  // run and an edit to a `query` silently has no effect until the page is reloaded.
  overrideExisting: import.meta.env.DEV,
});

export const {
  useDeleteServiceTypeMutation,
  useGetServiceTypeQuery,
  useInsertServiceTypeMutation,
  // useLazyDeleteServiceTypeMutation,
  useLazyGetServiceTypeQuery,
  // useLazyInsertServiceTypeMutation,
  // useLazyUpdateServiceTypeMutation,
  useUpdateServiceTypeMutation
} = serviceTypeApi;
