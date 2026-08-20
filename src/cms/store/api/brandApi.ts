// src/cms/store/api/brandApi.ts
/**
 * Brand of Product Management API Endpoints
 * Brand of Product CRUD operations, etc.
 */
import { baseApiCrm } from "@/core/store/api/baseApi";
import type { ApiResponse } from "@/core/types";
import type { Brand, BrandCreateData, BrandQueryParams, BrandUpdateData } from "@/cms/types/brand";


export const brandApi = baseApiCrm.injectEndpoints({
  endpoints: builder => ({
    // GET api/v1/brand
    readBrand: builder.query<ApiResponse<Brand[]>, BrandQueryParams>({
      query: params => {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined) {
            searchParams.append(key, String(value));
          }
        });
        return `/brand?${searchParams.toString()}`;
      },
      providesTags: ["Product"],
    }),

    // POST api/v1/brand
    createBrand: builder.mutation<ApiResponse<Brand>, BrandCreateData>({
      query: data => ({
        url: "/brand",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Product"],
    }),

    // PUT api/v1/brand/{brandId}
    updateBrand: builder.mutation<ApiResponse<Brand>, { brandId: string; data: BrandUpdateData }>({
      query: ({ brandId, data }) => ({
        url: `/brand/${brandId}`,
        method: "PUT",
        body: data
      }),
      invalidatesTags: ["Product"],
    }),

    // DELETE api/v1/brand/{brandId}
    deleteBrand: builder.mutation<ApiResponse<void>, string>({
      query: brandId => ({
        url: `/brand/${brandId}`,
        method: "DELETE"
      }),
      invalidatesTags: ["Product"],
    }),
  }),
});

export const {
  useReadBrandQuery,
  useCreateBrandMutation,
  useUpdateBrandMutation,
  useDeleteBrandMutation,
} = brandApi;
