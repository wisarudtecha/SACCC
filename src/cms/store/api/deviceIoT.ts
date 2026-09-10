import { ApiResponse } from "@/cms/types";
import { baseApi } from "@/core/store/api/baseApi";
import { Device, DeviceBoundsRequest, DeviceCreateData, DeviceUpdateData } from "@/cms/types/deviceIoT";
import { PaginationParams } from "./custommerApi";




export const deviceIoTApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({

        getDeviceIoT: builder.query<ApiResponse<Device[]>, PaginationParams>({
            query: (params) => ({
                url: "/devices",
                params,
            }),
            providesTags: ["Device Iot"],
        }),

        // GET /devices/within-bounds?minLat=&minLon=&maxLat=&maxLon=
        //
        // Viewport-scoped fetch for the case-map Device layer (P5). A dedicated
        // path, kept separate from getDeviceIoT (CasePanel's paginated fetch) so
        // the two never share a cache entry or a GraphQL op. NO deviceType filter
        // param: deviceType is free text with no enum (stakeholder decision 3),
        // so category matching is done client-side against resolveDeviceCategory
        // - the FE fetches every device in the box and filters locally, same as
        // the Place layer. FE-first: the BFF resolver does not exist yet (see
        // deviceIoTQueries.ts); until it does, this errors against a GraphQL
        // environment and callers can stub it via buildStubDevicesInBounds when
        // VITE_MOCK_API="true".
        getDevicesInBounds: builder.query<ApiResponse<Device[]>, DeviceBoundsRequest>({
            query: (bounds) => ({
                url: "/devices/within-bounds",
                params: bounds,
            }),
            providesTags: ["Device Iot"],
        }),

        // ── Device Management admin CRUD (CAD-FE-Device-Management) ──────────
        // Both mutations invalidate "Device Iot", so getDeviceIoT AND
        // getDevicesInBounds (the case-map layer) refetch after an edit.
        // GraphQL ops are still PROVISIONAL - see deviceIoTQueries.ts.

        // POST /devices/add
        createDevice: builder.mutation<ApiResponse<Device>, DeviceCreateData>({
            query: (data) => ({
                url: "/devices/add",
                method: "POST",
                body: data,
            }),
            invalidatesTags: ["Device Iot"],
        }),

        // PATCH /devices/{id} - also serves the soft-delete path (body { active: false }).
        updateDevice: builder.mutation<ApiResponse<Device>, { id: string; data: DeviceUpdateData }>({
            query: ({ id, data }) => ({
                url: `/devices/${id}`,
                method: "PATCH",
                body: data,
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
    useGetDevicesInBoundsQuery,
    useLazyGetDevicesInBoundsQuery,
    useCreateDeviceMutation,
    useUpdateDeviceMutation,
} = deviceIoTApi;
