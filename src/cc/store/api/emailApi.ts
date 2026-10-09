// Email workspace API endpoints — FE-10
// `docs/task-breakdown.md` §FE-10 / §BE-09
//
// ─────────────────────────────────────────────────────────────────────────────
// PRE-ADAPTER BY DESIGN — READ BEFORE WIRING TO THE UI
// ─────────────────────────────────────────────────────────────────────────────
// The backend email integration adapter does not exist yet (backend task BE-09).
// URL paths, request/response shapes, and GraphQL mappings below are the FE's
// *proposal* pending backend sign-off.
//
// Until the BFF ships these operations:
//   - These endpoints must NOT be called in any `VITE_USE_GRAPHQL === "true"`
//     environment unless the corresponding GQL_MAP entries are confirmed against
//     the shipped BFF schema.
//   - Use `VITE_MOCK_API="true"` + the fixture facade (`useEmailData`) for dev
//     demos and local development.
//
// When the backend contract lands:
//   - confirm/adjust the URL paths AND the placeholder GraphQL operation names /
//     input types in `graphql/emailQueries.ts` against the signed-off contract,
//   - wire the Email workspace to these hooks (keep the mock for dev +
//     `VITE_MOCK_API` demos), and
//   - remove this banner.
// ─────────────────────────────────────────────────────────────────────────────

import { baseApi } from "@/core/store/api/baseApi";
import type { ApiResponse } from "@/cms/types";
import type {
  EmailInboxResponse,
  EmailMessage,
  AiSuggestion,
  EmailTab,
} from "@/cc/types/email";

/** Query params for the inbox list. */
export interface ReadEmailInboxParams {
  folder: EmailTab;
  search?: string;
}

/** Request body for sending a reply. */
export interface SendEmailReplyRequest {
  id: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  body: string;
  attachments?: string[];
  inReplyTo?: string;
}

/** Request body for AI suggestion. */
export interface GenerateAiSuggestionRequest {
  emailId: string;
  context?: string;
}

export const emailApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // GET /email/inbox?folder=inbox&search=...
    readEmailInbox: builder.query<
      ApiResponse<EmailInboxResponse>,
      ReadEmailInboxParams
    >({
      query: (params) => ({
        url: "/email/inbox",
        params: {
          folder: params.folder,
          ...(params.search ? { search: params.search } : {}),
        },
      }),
      providesTags: ["EmailInbox"],
    }),

    // GET /email/:id
    readEmailDetail: builder.query<ApiResponse<EmailMessage>, string>({
      query: (id) => ({
        url: `/email/${encodeURIComponent(id)}`,
      }),
      providesTags: (_result, _error, id) => [{ type: "Email", id }],
    }),

    // POST /email/:id/reply
    sendEmailReply: builder.mutation<
      ApiResponse<null>,
      SendEmailReplyRequest
    >({
      query: ({ id, ...body }) => ({
        url: `/email/${encodeURIComponent(id)}/reply`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["EmailInbox"],
    }),

    // POST /email/:id/read
    markEmailRead: builder.mutation<ApiResponse<null>, string>({
      query: (id) => ({
        url: `/email/${encodeURIComponent(id)}/read`,
        method: "POST",
      }),
      invalidatesTags: ["EmailInbox", "Email"],
    }),

    // POST /email/:id/star
    starEmail: builder.mutation<ApiResponse<null>, { id: string; starred: boolean }>({
      query: ({ id, starred }) => ({
        url: `/email/${encodeURIComponent(id)}/star`,
        method: "POST",
        body: { starred },
      }),
      invalidatesTags: ["EmailInbox", "Email"],
    }),

    // POST /email/:id/archive
    archiveEmail: builder.mutation<ApiResponse<null>, string>({
      query: (id) => ({
        url: `/email/${encodeURIComponent(id)}/archive`,
        method: "POST",
      }),
      invalidatesTags: ["EmailInbox", "Email"],
    }),

    // POST /email/:id/trash
    trashEmail: builder.mutation<ApiResponse<null>, string>({
      query: (id) => ({
        url: `/email/${encodeURIComponent(id)}/trash`,
        method: "POST",
      }),
      invalidatesTags: ["EmailInbox", "Email"],
    }),

    // POST /email/ai-suggest
    generateAiSuggestion: builder.mutation<
      ApiResponse<AiSuggestion>,
      GenerateAiSuggestionRequest
    >({
      query: (body) => ({
        url: "/email/ai-suggest",
        method: "POST",
        body,
      }),
    }),
  }),
  overrideExisting: import.meta.env.DEV,
});

export const {
  useReadEmailInboxQuery,
  useReadEmailDetailQuery,
  useSendEmailReplyMutation,
  useMarkEmailReadMutation,
  useStarEmailMutation,
  useArchiveEmailMutation,
  useTrashEmailMutation,
  useGenerateAiSuggestionMutation,
} = emailApi;
