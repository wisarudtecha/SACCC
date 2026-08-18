import { baseApiCrm } from "@/core/store/api/baseApi";
import type { ApiResponse } from "@/core/types";
import { CreateOrderItem } from "@/cms/types/orderItem";

export const orderItemApi = baseApiCrm.injectEndpoints({
    endpoints: builder => ({

        getOrderItem: builder.query<ApiResponse<string>, string>({
            query: (orderId) => ({
                url: `/orders/${orderId}/items`,
                method: "GET",
            }),
            providesTags: ["Order"],
        }),

        insertOrderItemMutation: builder.mutation<ApiResponse<string>, CreateOrderItem & { orderId: string }>({
            query: ({ orderId, ...body }) => ({
                url: `/orders/${orderId}/items`,
                method: "POST",
                body: body
            }),
            invalidatesTags: ["Order"],
        }),

        getOrderItemByRequestMutation: builder.mutation<ApiResponse<string>,  { orderId: string ,requestId:string}>({
            query: ({ orderId, requestId }) => ({
                url: `/orders/${orderId}/items/${requestId}`,
                method: "GET",
            }),
            invalidatesTags: ["Order"],
        }),

        updateOrderItemByRequestMutation: builder.mutation<ApiResponse<string>, CreateOrderItem & { orderId: string ,requestId:string}>({
            query: ({ orderId, requestId,...body }) => ({
                url: `/orders/${orderId}/items/${requestId}`,
                method: "PUT",
                body: body
            }),
            invalidatesTags: ["Order"],
        }),

        deleteOrderItemByRequestMutation: builder.mutation<ApiResponse<string>,  { orderId: string ,requestId:string}>({
            query: ({ orderId, requestId }) => ({
                url: `/orders/${orderId}/items/${requestId}`,
                method: "DELETE",
            }),
            invalidatesTags: ["Order"],
        }),

        

    }),
});

export const {
    useDeleteOrderItemByRequestMutationMutation,
    useGetOrderItemByRequestMutationMutation,
    useGetOrderItemQuery,
    useInsertOrderItemMutationMutation,
    useLazyGetOrderItemQuery,
    useUpdateOrderItemByRequestMutationMutation
} = orderItemApi;