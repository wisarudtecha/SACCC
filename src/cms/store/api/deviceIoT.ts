import { ApiResponse } from "@/cms/types";
import { baseApi } from "@/core/store/api/baseApi";
import { Device } from "@/cms/types/deviceIoT";
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






    }),
    // Vite HMR re-runs this module without a full page reload, which calls injectEndpoints a
    // second time. Without this, RTK Query keeps the definitions registered by the previous
    // run and an edit to a `query` silently has no effect until the page is reloaded.
    overrideExisting: import.meta.env.DEV,
});
export const {
    useGetDeviceIoTQuery,
} = deviceIoTApi;
