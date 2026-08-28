import { ApiResponse } from "@/core/types";
import { baseApi } from "@/core/store/api/baseApi";
import { deleteFileInput, UploadFileInput, UploadFileRes } from "@/core/types/file";


export const fileApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({

        postUploadFile: builder.query<ApiResponse<UploadFileRes>, UploadFileInput>({
            query: (params) => ({
                url: "/upload/case",
                params,
                method: "POST"
            }),
            providesTags: ["Files"],
        }),

        deleteFile: builder.query<ApiResponse<UploadFileRes>, deleteFileInput>({
            query: (params) => ({
                url: "/delete/",
                body: params,
                method: "DELETE"
            }),
            providesTags: ["Files"],
        }),

        postUploadFileMutation: builder.mutation<ApiResponse<UploadFileRes>, UploadFileInput>({
            query: (params) => {
                const formData = new FormData();
                formData.append('file', params.file);
                if (params.caseId) {
                    formData.append('caseId', params.caseId);
                }
                return {
                    url: `/upload/${params.path}`,
                    method: "POST",
                    body: formData,
                };
            },
            invalidatesTags: ["Files"],
        }),

        deleteFileMutation: builder.mutation<ApiResponse<UploadFileRes>, deleteFileInput>({
            query: (params) => ({
                url: `/delete/`,
                body: params,
                method: "DELETE"
            }),
            invalidatesTags: ["Files"],
        }),


    }),
    // Vite HMR re-runs this module without a full page reload, which calls injectEndpoints a
    // second time. Without this, RTK Query keeps the definitions registered by the previous
    // run and an edit to a `query` silently has no effect until the page is reloaded.
    overrideExisting: import.meta.env.DEV,
});

export const {
    useDeleteFileQuery,
    useDeleteFileMutationMutation,
    usePostUploadFileMutationMutation,
    usePostUploadFileQuery,
} = fileApi;



