// src/cms/store/api/inventoryStockApi.ts
/**
 * Inventory Stocking API Endpoints
 * Stock Inventory CRUD operations, etc.
 */
import { baseApiCrm } from "@/core/store/api/baseApi";
import type { ApiResponse } from "@/core/types";
import type { InventorySerialNumber, InventoryStock, InventoryStockCreateData, InventoryStockQueryParams, InventoryStockUpdateData } from "@/cms/types/inventoryStock";

export const inventoryStockApi = baseApiCrm.injectEndpoints({
  endpoints: builder => ({
    // POST api/v1/spare_part_stock/add
    createInventoryStock: builder.mutation<ApiResponse<string>, InventoryStockCreateData>({
      query: data => ({
        url: "/spare_part_stock/add",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["InventoryStock"],
    }),

    // GET api/v1/spare_part_serial
    readInventorySerialNumber: builder.query<ApiResponse<InventorySerialNumber[]>, InventoryStockQueryParams>({
      query: params => {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined) {
            searchParams.append(key, String(value));
          }
        });
        return `/spare_part_serial?${searchParams.toString()}`;
      },
      providesTags: ["InventoryStock"],
    }),

    // GET api/v1/spare_part_stock
    readInventoryStock: builder.query<ApiResponse<InventoryStock[]>, InventoryStockQueryParams>({
      query: params => {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined) {
            searchParams.append(key, String(value));
          }
        });
        return `/spare_part_stock?${searchParams.toString()}`;
      },
      providesTags: ["InventoryStock"],
    }),

    // PUT api/v1/spare_part_stock/{partId}/{serialNumber}
    updateInventoryStock: builder.mutation<ApiResponse<unknown>, { partId: string; serialNumber : string; data: InventoryStockUpdateData }>({
      query: ({ partId, serialNumber, data }) => ({
        url: `/spare_part_stock/${partId}/${serialNumber}`,
        method: "PUT",
        body: data
      }),
      invalidatesTags: ["InventoryStock"],
    }),

    // DELETE api/v1/spare_part_stock?partId={partId}&serialNumber={serialNumber}
    deleteInventoryStock: builder.mutation<ApiResponse<void>, { partId: string; serialNumber : string; }>({
      query: ({ partId, serialNumber }) => ({
        url: "/spare_part_stock",
        method: "DELETE",
        params: { partId, serialNumber },
      }),
      invalidatesTags: ["InventoryStock"],
    }),
  }),
  // Vite HMR re-runs this module without a full page reload, which calls injectEndpoints a
  // second time. Without this, RTK Query keeps the definitions registered by the previous
  // run and an edit to a `query` silently has no effect until the page is reloaded.
  overrideExisting: import.meta.env.DEV,
})

export const {
  useCreateInventoryStockMutation,
  useReadInventorySerialNumberQuery,
  useReadInventoryStockQuery,
  useUpdateInventoryStockMutation,
  useDeleteInventoryStockMutation
} = inventoryStockApi;
