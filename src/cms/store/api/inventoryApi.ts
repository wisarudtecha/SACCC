// src/cms/store/api/inventoryApi.ts
/**
 * Inventory Management API Endpoints
 * Inventory CRUD operations, etc.
 */
import { baseApiCrm } from "@/core/store/api/baseApi";
import type { ApiResponse } from "@/core/types";
import type { Inventory, InventoryCreateData, InventoryQueryParams, InventoryUpdateData } from "@/cms/types/inventory";

export const inventoryApi = baseApiCrm.injectEndpoints({
  endpoints: builder => ({
    // POST api/v1/spare_part
    createInventory: builder.mutation<ApiResponse<string>, InventoryCreateData>({
      query: data => ({
        url: "/spare_part",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Product"],
    }),

    // GET api/v1/spare_part
    readInventory: builder.query<ApiResponse<Inventory[]>, InventoryQueryParams>({
      query: params => {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined) {
            searchParams.append(key, String(value));
          }
        });
        return `/spare_part?${searchParams.toString()}`;
      },
      providesTags: ["Product"],
    }),

    // PUT api/v1/spare_part/{partId}
    updateInventory: builder.mutation<ApiResponse<unknown>, { partId: string; data: InventoryUpdateData }>({
      query: ({ partId, data }) => ({
        url: `/spare_part/${partId}`,
        method: "PUT",
        body: data
      }),
      invalidatesTags: ["Product"],
    }),

    // DELETE api/v1/spare_part/{partId}
    deleteInventory: builder.mutation<ApiResponse<void>, string>({
      query: partId => ({
        url: `/spare_part/${partId}`,
        method: "DELETE"
      }),
      invalidatesTags: ["Product"],
    }),
  }),
});

export const {
  useReadInventoryQuery,
  useCreateInventoryMutation,
  useUpdateInventoryMutation,
  useDeleteInventoryMutation,
} = inventoryApi;
