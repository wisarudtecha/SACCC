import { baseApiCrm } from "@/core/store/api/baseApi";
import type { ApiResponse } from "@/core/types";
import { OrderComment } from "@/cms/types/orderComment";

export const orderCommentApi = baseApiCrm.injectEndpoints({
    endpoints: builder => ({

        orderCommentList: builder.query<ApiResponse<OrderComment[]>, string>({
            query: (orderId) => ({
                url: `/orders/${orderId}/comments`,
                method: "GET",
            }),
            providesTags: ["OrderComment"],
        }),

        createOrderComment: builder.mutation<ApiResponse<string>, { remark: string, orderId: string }>({
            query: ({ orderId, ...body }) => ({
                url: `/orders/${orderId}/comments`,
                method: "POST",
                body,
            }),
            invalidatesTags: ["OrderComment"],
        }),

        updateOrderComment: builder.mutation<ApiResponse<string>, { remark: string, orderId: string, id: string }>({
            query: ({ orderId, id, ...body }) => ({
                url: `/orders/${orderId}/comments/${id}`,
                method: "PUT",
                body,
            }),
            invalidatesTags: ["OrderComment"],
        }),


        deleteOrderComment: builder.mutation<ApiResponse<string>, { orderId: string, id: string }>({
            query: ({ orderId, id }) => ({
                url: `/orders/${orderId}/comments/${id}`,
                method: "DELETE",
            }),
            invalidatesTags: ["OrderComment"],
        }),
    }),
});

export const {
    useCreateOrderCommentMutation,
    useDeleteOrderCommentMutation,
    useLazyOrderCommentListQuery,
    useOrderCommentListQuery,
    useUpdateOrderCommentMutation,
} = orderCommentApi;