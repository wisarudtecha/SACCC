// src/cms/store/api/productStockApi.ts
/**
 * Product Stocking API Endpoints
 * Stock Product CRUD operations, etc.
 */
import { baseApiCrm } from "@/core/store/api/baseApi";
import type { ApiResponse } from "@/core/types";
import type { ProductSerialNumber, ProductStock, ProductStockCreateData, ProductStockQueryParams, ProductStockUpdateData } from "@/cms/types/productStock";

export const productStockApi = baseApiCrm.injectEndpoints({
  endpoints: builder => ({
    // POST api/v1/product_stock/add
    createProductStock: builder.mutation<ApiResponse<string>, ProductStockCreateData>({
      query: data => ({
        url: "/product_stock/add",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["ProductStock"],
    }),

    // GET api/v1/product_serial
    readProductSerialNumber: builder.query<ApiResponse<ProductSerialNumber[]>, ProductStockQueryParams>({
      query: params => {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined) {
            searchParams.append(key, String(value));
          }
        });
        return `/product_serial?${searchParams.toString()}`;
      },
      providesTags: ["ProductStock"],
    }),

    // GET api/v1/product_stock
    readProductStock: builder.query<ApiResponse<ProductStock[]>, ProductStockQueryParams>({
      query: params => {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined) {
            searchParams.append(key, String(value));
          }
        });
        return `/product_stock?${searchParams.toString()}`;
      },
      providesTags: ["ProductStock"],
    }),

    // PUT api/v1/product_stock/{productId}/{serialNumber}
    updateProductStock: builder.mutation<ApiResponse<unknown>, { productId: string; serialNumber : string; data: ProductStockUpdateData }>({
      query: ({ productId, serialNumber, data }) => ({
        url: `/product_stock/${productId}/${serialNumber}`,
        method: "PUT",
        body: data
      }),
      invalidatesTags: ["ProductStock"],
    }),

    // DELETE api/v1/product_stock?productId={productId}&serialNumber={serialNumber}
    deleteProductStock: builder.mutation<ApiResponse<void>, { productId: string; serialNumber : string; }>({
      query: ({ productId, serialNumber }) => ({
        url: "/product_stock",
        method: "DELETE",
        params: { productId, serialNumber },
      }),
      invalidatesTags: ["ProductStock"],
    }),
  }),
  // Vite HMR re-runs this module without a full page reload, which calls injectEndpoints a
  // second time. Without this, RTK Query keeps the definitions registered by the previous
  // run and an edit to a `query` silently has no effect until the page is reloaded.
  overrideExisting: import.meta.env.DEV,
})

export const {
  useCreateProductStockMutation,
  useReadProductSerialNumberQuery,
  useReadProductStockQuery,
  useUpdateProductStockMutation,
  useDeleteProductStockMutation
} = productStockApi;
