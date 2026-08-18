// src/cms/store/api/inventoryRequestApi.ts
/**
 * Inventory Requesting API Endpoints
 * Request Inventory CRUD operations, etc.
 */
import { baseApiCrm } from "@/core/store/api/baseApi";
import type { ApiResponse } from "@/core/types";
import type {
  InventoryRequest,
  InventoryRequestQueryParams,
  InventoryRequestUpdateData,
  OrderStatus,
  OrderStatusQueryParams,
  RequestStatus,
  RequestStatusQueryParams
} from "@/cms/types/inventoryRequest";

export interface insertRequestSparePart {
  billTo: string,
  requestBy: string,
  billAddr: string,
  requests: [{
    active: true
    partId: string,
    productId: string,
    quantity: number
  }]
  shipTo: string,
  shipBy: string,
  shipAddr: string,
}

export const inventoryRequestApi = baseApiCrm.injectEndpoints({
  endpoints: builder => ({
    // POST api/v1/request_spare_part
    createInventoryRequest: builder.mutation<ApiResponse<string>, insertRequestSparePart>({
      query: data => ({
        url: "/request_spare_part",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["InventoryRequest"],
    }),

    // GET api/v1/request_spare_part
    readInventoryRequest: builder.query<ApiResponse<InventoryRequest[]>, InventoryRequestQueryParams>({
      query: params => {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined) {
            searchParams.append(key, String(value));
          }
        });
        return `/request_spare_part?${searchParams.toString()}`;
      },
      providesTags: ["InventoryRequest"],
    }),

    // PUT api/v1/request_spare_part/{requestId}
    updateInventoryRequest: builder.mutation<ApiResponse<unknown>, { requestId: string; data: InventoryRequestUpdateData }>({
      query: ({ requestId, data }) => ({
        url: `/request_spare_part/${requestId}`,
        method: "PUT",
        body: data
      }),
      invalidatesTags: ["InventoryRequest"],
    }),

    // DELETE api/v1/request_spare_part/{requestId}
    deleteInventoryRequest: builder.mutation<ApiResponse<void>, string>({
      query: requestId => ({
        url: `/request_spare_part/${requestId}`,
        method: "DELETE"
      }),
      invalidatesTags: ["InventoryRequest"],
    }),

    // approveInventoryRequest: builder.mutation<void, { requestId: string }>({
    //   query: ({ requestId }) => ({
    //     url: `/request_spare_part/${requestId}/approve`,
    //     method: "POST"
    //   }),
    //   invalidatesTags: ["InventoryRequest"]
    // }),

    // rejectInventoryRequest: builder.mutation<void, { requestId: string }>({
    //   query: ({ requestId }) => ({
    //     url: `/request_spare_part/${requestId}/reject`,
    //     method: "POST"
    //   }),
    //   invalidatesTags: ["InventoryRequest"]
    // }),

    // GET api/v1/request_status
    readRequestStatus: builder.query<ApiResponse<RequestStatus[]>, RequestStatusQueryParams>({
      query: params => {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined) {
            searchParams.append(key, String(value));
          }
        });
        return `/request_status?${searchParams.toString()}`;
      },
      providesTags: ["InventoryRequest"],
    }),

    // GET api/v1/order_status
    readOrderStatus: builder.query<ApiResponse<OrderStatus[]>, OrderStatusQueryParams>({
      query: params => {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined) {
            searchParams.append(key, String(value));
          }
        });
        return `/order_status?${searchParams.toString()}`;
      },
      providesTags: ["InventoryRequest"],
    }),
  })
})

export const {
  useCreateInventoryRequestMutation,
  useReadInventoryRequestQuery,
  useUpdateInventoryRequestMutation,
  useDeleteInventoryRequestMutation,
  // useApproveInventoryRequestMutation,
  // useRejectInventoryRequestMutation,
  useReadRequestStatusQuery,
  useReadOrderStatusQuery,
} = inventoryRequestApi;
