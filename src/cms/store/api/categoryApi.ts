// src/cms/store/api/categoryApi.ts
/**
 * Category of Product Management API Endpoints
 * Category of Product CRUD operations, etc.
 */
import { baseApiCrm } from "@/core/store/api/baseApi";
import type { ApiResponse } from "@/core/types";
import type { Category, CategoryCreateData, CategoryQueryParams, CategoryUpdateData } from "@/cms/types/category";


export const categoryApi = baseApiCrm.injectEndpoints({
  endpoints: builder => ({
    // GET api/v1/category
    readCategory: builder.query<ApiResponse<Category[]>, CategoryQueryParams>({
      query: params => {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined) {
            searchParams.append(key, String(value));
          }
        });
        return `/category?${searchParams.toString()}`;
      },
      providesTags: ["Product"],
    }),

    // POST api/v1/category
    createCategory: builder.mutation<ApiResponse<Category>, CategoryCreateData>({
      query: data => ({
        url: "/category",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Product"],
    }),

    // PUT api/v1/category/{categoryId}
    updateCategory: builder.mutation<ApiResponse<Category>, { categoryId: string; data: CategoryUpdateData }>({
      query: ({ categoryId, data }) => ({
        url: `/category/${categoryId}`,
        method: "PUT",
        body: data
      }),
      invalidatesTags: ["Product"],
    }),

    // DELETE api/v1/category/{categoryId}
    deleteCategory: builder.mutation<ApiResponse<void>, string>({
      query: categoryId => ({
        url: `/category/${categoryId}`,
        method: "DELETE"
      }),
      invalidatesTags: ["Product"],
    }),
  }),
  // Vite HMR re-runs this module without a full page reload, which calls injectEndpoints a
  // second time. Without this, RTK Query keeps the definitions registered by the previous
  // run and an edit to a `query` silently has no effect until the page is reloaded.
  overrideExisting: import.meta.env.DEV,
});

export const {
  useReadCategoryQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
} = categoryApi;
