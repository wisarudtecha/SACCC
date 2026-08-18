import { baseApiCrm } from "@/core/store/api/baseApi";
import type { ApiResponse } from "@/core/types";
import { PaginationParams } from "@/cms/types/dispatch";
import { insertOrder, Order, OrderData, OrderUpdateInfo } from "@/cms/types/order";

export const orderApi = baseApiCrm.injectEndpoints({
    endpoints: builder => ({

        orderList: builder.query<ApiResponse<Order[]>, PaginationParams>({
            query: (params) => ({
                url: "/orders",
                method: "GET",
                params,
            }),
            providesTags: ["Order"],
        }),

        orderListMutation: builder.mutation<ApiResponse<Order[]>, PaginationParams>({
            query: (params) => ({
                url: "/orders",
                method: "GET",
                params,
            }),
            invalidatesTags: ["Order"],
        }),

        getOrderData: builder.query<ApiResponse<OrderData>, string>({
            query: (orderId) => ({
                url: `/orders/${orderId}`,
                method: "GET",
            }),
            providesTags: ["Order"],
        }),

        getOrderDataMutation: builder.mutation<ApiResponse<OrderData>, string>({
            query: (orderId) => ({
                url: `/orders/${orderId}`,
                method: "GET",
            }),
            invalidatesTags: ["Order"],
        }),


        createOrder: builder.mutation<ApiResponse<string>, insertOrder>({
            query: (data) => ({
                url: "/orders",
                method: "POST",
                body: data,
            }),
            invalidatesTags: ["Order"],
        }),

        // updateOrder: builder.mutation<ApiResponse<string>, insertOrder & { orderId: string }>({
        //     query: ({ orderId, ...body }) => ({
        //         url: `/orders/${orderId}`,
        //         method: "PUT",
        //         body,
        //     }),
        //     invalidatesTags: ["Order"],
        // }),

        updateOrderInfo: builder.mutation<ApiResponse<string>, OrderUpdateInfo & { orderId: string }>({
            query: ({ orderId, ...body }) => ({
                url: `/orders/${orderId}/info`,
                method: "PUT",
                body,
            }),
            invalidatesTags: ["Order"],
        }),

        controlOrder: builder.mutation<ApiResponse<string>, { statusId: string; orderId: string ,exitPoint?:string}>({
            query: ({ orderId, ...body }) => ({
                url: `/orders/${orderId}/control`,
                method: "POST",
                body,
            }),
            invalidatesTags: ["Order"],
        }),

        cancelOrder: builder.mutation<ApiResponse<string>, { remark: string; orderId: string }>({
            query: ({ orderId, ...body }) => ({
                url: `/orders/${orderId}/cancel`,
                method: "POST",
                body,
            }),
            invalidatesTags: ["Order"],
        }),

        addOrderItem: builder.mutation<ApiResponse<string>, { orderId: string; partId?: string; productId?: string; quantity: number }>({
            query: ({ orderId, ...body }) => ({
                url: `/orders/${orderId}/items`,
                method: "POST",
                body,
            }),
            invalidatesTags: ["Order"],
        }),

        deleteOrderItem: builder.mutation<ApiResponse<string>, { orderId: string; itemId: string | number }>({
            query: ({ orderId, itemId }) => ({
                url: `/orders/${orderId}/items/${itemId}`,
                method: "DELETE",
            }),
            invalidatesTags: ["Order"],
        }),
    }),
});

export const {
    useOrderListQuery,
    useGetOrderDataQuery,
    useOrderListMutationMutation,
    useGetOrderDataMutationMutation,
    useCreateOrderMutation,
    // useUpdateOrderMutation,
    useControlOrderMutation,
    useCancelOrderMutation,
    useAddOrderItemMutation,
    useDeleteOrderItemMutation,
    useLazyGetOrderDataQuery,
    useLazyOrderListQuery,
    useUpdateOrderInfoMutation
} = orderApi;