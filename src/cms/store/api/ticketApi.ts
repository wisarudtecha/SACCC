// /src/store/api/ticketApi.ts
/**
 * Ticket Management API Endpoints
 * Complete CRUD operations with advanced filtering and real-time updates
 */

import { baseApi } from "@/core/store/api/baseApi";
import type { 
  Ticket, 
  Comment, 
  Attachment,
  TicketStatus,
  TicketPriority,
  Filter,
  // PaginationInfo,
  ApiResponse,
  TimelineEvent,
  // BulkUpdateData,
  // TicketAssignment
} from "@/cms/types";

export interface TicketCreateData {
  title: string;
  description: string;
  priority: TicketPriority;
  category: string;
  tags?: string[];
  customFields?: Record<string, unknown>;
  attachments?: File[];
  assigneeId?: string;
  location?: { latitude: number; longitude: number; address?: string };
}

export interface TicketUpdateData extends Partial<TicketCreateData> {
  status?: TicketStatus;
}

export interface TicketQueryParams {
  page?: number;
  limit?: number;
  status?: TicketStatus;
  priority?: TicketPriority;
  assigneeId?: string;
  reporterId?: string;
  category?: string;
  tags?: string[];
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  dateFrom?: string;
  dateTo?: string;
  customFilters?: Filter[];
}

export interface BulkOperationData {
  ticketIds: string[];
  operation: "status_change" | "assignment" | "priority_change" | "tag_add" | "tag_remove" | "delete";
  data: unknown;
}

export const ticketApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Ticket CRUD operations
    getTickets: builder.query<ApiResponse<Ticket[]>, TicketQueryParams>({
      query: (params) => {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined) {
            if (Array.isArray(value)) {
              value.forEach(v => searchParams.append(key, v));
            } else {
              searchParams.append(key, String(value));
            }
          }
        });
        return `/tickets?${searchParams.toString()}`;
      },
      providesTags: ["Ticket"],
    }),

    getTicket: builder.query<Ticket, string>({
      query: (id) => `/tickets/${id}`,
      providesTags: (_result, _error, id) => [{ type: "Ticket", id }],
    }),

    createTicket: builder.mutation<ApiResponse<Ticket>, TicketCreateData>({
      query: (data) => ({
        url: "/tickets",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Ticket"],
    }),

    updateTicket: builder.mutation<ApiResponse<Ticket>, { id: string; data: TicketUpdateData }>({
      query: ({ id, data }) => ({
        url: `/tickets/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: "Ticket", id }],
    }),

    deleteTicket: builder.mutation<ApiResponse<void>, string>({
      query: (id) => ({
        url: `/tickets/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Ticket"],
    }),

    // Ticket status management
    updateTicketStatus: builder.mutation<ApiResponse<Ticket>, { id: string; status: TicketStatus; comment?: string }>({
      query: ({ id, status, comment }) => ({
        url: `/tickets/${id}/status`,
        method: "PUT",
        body: { status, comment },
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: "Ticket", id }, "Timeline"],
    }),

    // Ticket assignment
    // assignTicket: builder.mutation<ApiResponse<Ticket>, TicketAssignment>({
    //   query: ({ ticketId, assigneeId, comment }) => ({
    //     url: `/tickets/${ticketId}/assign`,
    //     method: "PUT",
    //     body: { assigneeId, comment },
    //   }),
    //   invalidatesTags: (_result, _error, { ticketId }) => [{ type: "Ticket", id: ticketId }],
    // }),

    transferTicket: builder.mutation<ApiResponse<Ticket>, { id: string; departmentId: string; reason: string }>({
      query: ({ id, departmentId, reason }) => ({
        url: `/tickets/${id}/transfer`,
        method: "PUT",
        body: { departmentId, reason },
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: "Ticket", id }],
    }),

    // Comments system
    getTicketComments: builder.query<ApiResponse<Comment[]>, { ticketId: string; page?: number; limit?: number }>({
      query: ({ ticketId, page = 1, limit = 20 }) => 
        `/tickets/${ticketId}/comments?page=${page}&limit=${limit}`,
      providesTags: ["Comment"],
    }),

    addComment: builder.mutation<ApiResponse<Comment>, { ticketId: string; content: string; isInternal?: boolean; attachments?: File[] }>({
      query: ({ ticketId, content, isInternal = false, attachments }) => ({
        url: `/tickets/${ticketId}/comments`,
        method: "POST",
        body: { content, isInternal, attachments },
      }),
      invalidatesTags: ["Comment", "Timeline"],
    }),

    updateComment: builder.mutation<ApiResponse<Comment>, { commentId: string; content: string }>({
      query: ({ commentId, content }) => ({
        url: `/comments/${commentId}`,
        method: "PUT",
        body: { content },
      }),
      invalidatesTags: ["Comment"],
    }),

    deleteComment: builder.mutation<ApiResponse<void>, string>({
      query: (commentId) => ({
        url: `/comments/${commentId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Comment"],
    }),

    // File attachments
    uploadAttachment: builder.mutation<ApiResponse<Attachment>, { ticketId: string; file: File }>({
      query: ({ ticketId, file }) => {
        const formData = new FormData();
        formData.append("file", file);
        return {
          url: `/tickets/${ticketId}/attachments`,
          method: "POST",
          body: formData,
        };
      },
      invalidatesTags: (_result, _error, { ticketId }) => [{ type: "Ticket", id: ticketId }],
    }),

    deleteAttachment: builder.mutation<ApiResponse<void>, { ticketId: string; attachmentId: string }>({
      query: ({ ticketId, attachmentId }) => ({
        url: `/tickets/${ticketId}/attachments/${attachmentId}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, { ticketId }) => [{ type: "Ticket", id: ticketId }],
    }),

    // Timeline and history
    getTicketTimeline: builder.query<ApiResponse<TimelineEvent[]>, { ticketId: string; page?: number; limit?: number }>({
      query: ({ ticketId, page = 1, limit = 50 }) => 
        `/tickets/${ticketId}/timeline?page=${page}&limit=${limit}`,
      providesTags: ["Timeline"],
    }),

    // Bulk operations
    bulkUpdateTickets: builder.mutation<ApiResponse<{ successful: string[]; failed: string[] }>, BulkOperationData>({
      query: (data) => ({
        url: "/tickets/bulk",
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["Ticket"],
    }),

    // Analytics and reports
    getTicketAnalytics: builder.query<ApiResponse<unknown>, { 
      timeRange: { start: string; end: string };
      groupBy?: string[];
      filters?: Filter[];
    }>({
      query: (params) => ({
        url: "/tickets/analytics",
        method: "POST",
        body: params,
      }),
    }),

    exportTickets: builder.mutation<Blob, { 
      format: "csv" | "excel" | "pdf";
      filters?: TicketQueryParams;
      fields?: string[];
    }>({
      query: (params) => ({
        url: "/tickets/export",
        method: "POST",
        body: params,
        responseHandler: (response) => response.blob(),
      }),
    }),

    // Search and filtering
    searchTickets: builder.query<ApiResponse<Ticket[]>, { 
      query: string;
      filters?: Filter[];
      limit?: number;
    }>({
      query: ({ query, filters, limit = 10 }) => ({
        url: "/tickets/search",
        method: "POST",
        body: { query, filters, limit },
      }),
    }),

    getSavedSearches: builder.query<ApiResponse<unknown[]>, void>({
      query: () => "/tickets/saved-searches",
    }),

    saveSearch: builder.mutation<ApiResponse<unknown>, { name: string; query: TicketQueryParams }>({
      query: (data) => ({
        url: "/tickets/saved-searches",
        method: "POST",
        body: data,
      }),
    }),
  }),
  // Vite HMR re-runs this module without a full page reload, which calls injectEndpoints a
  // second time. Without this, RTK Query keeps the definitions registered by the previous
  // run and an edit to a `query` silently has no effect until the page is reloaded.
  overrideExisting: import.meta.env.DEV,
});

export const {
  useGetTicketsQuery,
  useGetTicketQuery,
  useCreateTicketMutation,
  useUpdateTicketMutation,
  useDeleteTicketMutation,
  useUpdateTicketStatusMutation,
  // useAssignTicketMutation,
  useTransferTicketMutation,
  useGetTicketCommentsQuery,
  useAddCommentMutation,
  useUpdateCommentMutation,
  useDeleteCommentMutation,
  useUploadAttachmentMutation,
  useDeleteAttachmentMutation,
  useGetTicketTimelineQuery,
  useBulkUpdateTicketsMutation,
  useGetTicketAnalyticsQuery,
  useExportTicketsMutation,
  useSearchTicketsQuery,
  useGetSavedSearchesQuery,
  useSaveSearchMutation,
} = ticketApi;
