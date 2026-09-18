import { ApiResponse } from "@/cms/types";
import { baseApi } from "@/core/store/api/baseApi";
import {
  Device, DeviceCreateData, DeviceQueryParams, DeviceUpdateData
} from "@/cms/types/deviceIoT";
export const deviceIoTApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({

        getDeviceIoT: builder.query<ApiResponse<Device[]>, DeviceQueryParams>({
            query: (params) => ({
                url: "/devices",
                params,
            }),
            providesTags: ["Device Iot"],
        }),

        // GET /devices/{id} - fetch by deviceId, NOT filtered by active (the
        // edit/reactivate form must be able to load a soft-deleted device's
        // current values).
        getDeviceById: builder.query<ApiResponse<Device>, string>({
            query: (id) => `/devices/${id}`,
            providesTags: ["Device Iot"],
        }),

        // ── Device Management admin CRUD (CAD-FE-Device-Management) ──────────
        // Both mutations invalidate "Device Iot", so getDeviceIoT (also used by
        // the case-map Device layer, bbox-filtered) refetches after an edit.

        // POST /devices
        createDevice: builder.mutation<ApiResponse<Device>, DeviceCreateData>({
            query: (data) => ({
                url: "/devices",
                method: "POST",
                body: data,
            }),
            invalidatesTags: ["Device Iot"],
        }),

        // PATCH /devices/{id}
        updateDevice: builder.mutation<ApiResponse<Device>, { id: string; data: DeviceUpdateData }>({
            query: ({ id, data }) => ({
                url: `/devices/${id}`,
                method: "PATCH",
                body: data,
            }),
            invalidatesTags: ["Device Iot"],
        }),

        // DELETE /devices/{id} - soft delete (sets active=false server-side).
        deleteDevice: builder.mutation<ApiResponse<void>, string>({
            query: (id) => ({
                url: `/devices/${id}`,
                method: "DELETE",
            }),
            invalidatesTags: ["Device Iot"],
        }),

    }),
    // Vite HMR re-runs this module without a full page reload, which calls injectEndpoints a
    // second time. Without this, RTK Query keeps the definitions registered by the previous
    // run and an edit to a `query` silently has no effect until the page is reloaded.
    overrideExisting: import.meta.env.DEV,
});
export const {
    useGetDeviceIoTQuery,
    useGetDeviceByIdQuery,
    useCreateDeviceMutation,
    useUpdateDeviceMutation,
    useDeleteDeviceMutation,
} = deviceIoTApi;
