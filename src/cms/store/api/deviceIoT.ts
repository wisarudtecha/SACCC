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
});
export const {
    useGetDeviceIoTQuery,
} = deviceIoTApi;
