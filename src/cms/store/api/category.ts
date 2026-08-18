
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
});

export const {
    useCategoryListQuery,
    useLazyCategoryListQuery
} = categoryApi;
