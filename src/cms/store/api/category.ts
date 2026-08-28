
import { Category, CategoryQueryParams } from "@/cms/types/category";
import { baseWelcomeCrmApi } from "@/core/store/api/baseApi";
import { ApiResponse } from "@/core/types";





export const categoryApi = baseWelcomeCrmApi.injectEndpoints({
    endpoints: builder => ({


        categoryList: builder.query<ApiResponse<Category[]>, CategoryQueryParams >({
            query: (params) => ({
                url: `/category`,
                method: "GET",
                params,
            }),
            providesTags: ["Category"],
        }),

    }),
    // Vite HMR re-runs this module without a full page reload, which calls injectEndpoints a
    // second time. Without this, RTK Query keeps the definitions registered by the previous
    // run and an edit to a `query` silently has no effect until the page is reloaded.
    overrideExisting: import.meta.env.DEV,
});

export const {
    useCategoryListQuery,
    useLazyCategoryListQuery
} = categoryApi;
