// /src/store/api/productApi.ts
/**
 * Product Management API Endpoints
 * Product CRUD operations, etc.
 */
import { baseApiCrm } from "@/core/store/api/baseApi";
import type { ApiResponse } from "@/core/types";
import type { Product, ProductCreateData, ProductQueryParams, ProductUpdateData, ProductStock, ProductSerial } from "@/cms/types/product";
import type { PaginationParams } from "@/cms/types/dispatch";

export const productApi = baseApiCrm.injectEndpoints({
  endpoints: builder => ({
    // GET api/v1/product
    readProduct: builder.query<ApiResponse<Product[]>, ProductQueryParams>({
      query: params => {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined) {
            searchParams.append(key, String(value));
          }
        });
        return `/product?${searchParams.toString()}`;
      },
      providesTags: ["Product"],
    }),

    // POST api/v1/product
    createProduct: builder.mutation<ApiResponse<string>, ProductCreateData>({
      query: data => ({
        url: "/product",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Product"],
    }),

    // PUT api/v1/product/{productId}
    updateProduct: builder.mutation<ApiResponse<unknown>, { productId: string; data: ProductUpdateData }>({
      query: ({ productId, data }) => ({
        url: `/product/${productId}`,
        method: "PUT",
        body: data
      }),
      invalidatesTags: ["Product"],
    }),

    // DELETE api/v1/product/{productId}
    deleteProduct: builder.mutation<ApiResponse<void>, string>({
      query: productId => ({
        url: `/product/${productId}`,
        method: "DELETE"
      }),
      invalidatesTags: ["Product"],
    }),

    getProductStock: builder.query<ApiResponse<ProductStock[]>, PaginationParams, & { productId: string ,  isBought?:boolean}>({
      query: (params) => ({
        url: "/product_stock",
        params,
      }),
      providesTags: ["Product"],
    }),

    getProductSerial: builder.query<ApiResponse<ProductSerial[]>, PaginationParams, & { productId: string , orderBy?: string;direction?: string,  isBought?:boolean}>({
      query: (params) => ({
        url: "/product_serial",
        params,
      }),
      providesTags: ["Product"],
    }),
  }),
  // Vite HMR re-runs this module without a full page reload, which calls injectEndpoints a
  // second time. Without this, RTK Query keeps the definitions registered by the previous
  // run and an edit to a `query` silently has no effect until the page is reloaded.
  overrideExisting: import.meta.env.DEV,
});

export const {
  useReadProductQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
  useGetProductStockQuery,
  useLazyGetProductStockQuery,
  useGetProductSerialQuery,
  useLazyGetProductSerialQuery,
  useLazyReadProductQuery
} = productApi;
