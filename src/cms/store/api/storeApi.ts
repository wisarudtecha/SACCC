// src/cms/store/api/storeApi.ts
/**
 * Store Management API Endpoints
 * Store CRUD operations, etc.
 */
import { baseApiCrm } from "@/core/store/api/baseApi";
import type { ApiResponse } from "@/core/types";
import type { Store, StoreCreateData, StoreQueryParams, StoreUpdateData } from "@/cms/types/store";

export const storeApi = baseApiCrm.injectEndpoints({
  endpoints: builder => ({
    // POST api/v1/store
    // Body is plain JSON, not FormData: Store carries no attachment, StoreCreateData already
    // described this shape, and the GraphQL mapping types create and update alike as StoreInput!.
    createStore: builder.mutation<ApiResponse<string>, StoreCreateData>({
      query: data => ({
        url: "/store",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Store"],
    }),

    // GET api/v1/store
    readStore: builder.query<ApiResponse<Store[]>, StoreQueryParams>({
      query: params => {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined) {
            searchParams.append(key, String(value));
          }
        });
        return `/store?${searchParams.toString()}`;
      },
      providesTags: ["Store"],
    }),

    // PUT api/v1/store/{storeId}
    updateStore: builder.mutation<ApiResponse<unknown>, { storeId: string; data: StoreUpdateData }>({
      query: ({ storeId, data }) => ({
        url: `/store/${storeId}`,
        method: "PUT",
        body: data
      }),
      invalidatesTags: ["Store"],
    }),

    // DELETE api/v1/store/{storeId}
    deleteStore: builder.mutation<ApiResponse<void>, string>({
      query: storeId => ({
        url: `/store/${storeId}`,
        method: "DELETE"
      }),
      invalidatesTags: ["Store"],
    }),
  }),
});

export const {
  useReadStoreQuery,
  useCreateStoreMutation,
  useUpdateStoreMutation,
  useDeleteStoreMutation
} = storeApi;
