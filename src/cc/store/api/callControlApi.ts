// Call-control endpoints for the 3CX integration adapter — capability-matrix
// Phase 2 (Track B4).
//
// ─────────────────────────────────────────────────────────────────────────────
// DORMANT BY DESIGN — READ BEFORE WIRING THESE TO THE UI
// ─────────────────────────────────────────────────────────────────────────────
// The backend 3CX integration adapter does not exist yet (see
// `docs/3CX-Integration-Capability-Matrix.md` §3.2 + Decision 3, and
// `docs/CALL-Lifecycle-Websocket-Event-Contract.md` §10, which keeps call
// control out of the websocket contract on purpose). Nothing in the UI calls
// these hooks today: the softphone's toolbar commands run through the dev-only
// mock lifecycle (`src/cc/components/softphone/mockCallLifecycle.ts`) until
// the adapter lands.
//
// 1. URL paths are the FE's *proposal* for the internal BFF surface
//    (`/call-control/…`), modeled on the 3CX Call Control API operations the
//    capability matrix lists (make call, answer, hold, transfer, terminate).
//    The backend adapter owns the actual 3CX mapping; only the paths may
//    change at sign-off — the FE consumer (useSoftphone controls) should be
//    unaffected.
//
// 2. NO GQL_MAP ENTRIES ON PURPOSE. The hybrid base query
//    (`src/core/store/api/hybridBaseQuery.ts`) auto-converts every request
//    when `VITE_USE_GRAPHQL === "true"`, and a URL with no entry in
//    `GQL_MAP` (`src/core/utils/gqlMapper.ts`) fails HARD — there is no REST
//    fallback. These endpoints must NOT be called in any GraphQL-enabled
//    environment until the BFF exposes equivalents and entries are added to
//    a `graphql/callControlQueries.ts` file.
//
// 3. Response shape is provisional (`ApiResponse<null>`, the standard
//    command-envelope used by e.g. `insertCustommers`). Command *results* are
//    not polled: the authoritative call state arrives as websocket lifecycle
//    events (`src/cc/types/callEvents.ts`), so these mutations carry no
//    invalidatesTags.
//
// When the backend adapter contract lands:
//   - confirm/adjust the URL paths against the signed-off contract,
//   - add GQL_MAP entries if the BFF provides GraphQL equivalents,
//   - wire `useSoftphone`'s controls to these hooks (keep the mock for
//     dev + `VITE_MOCK_API` demos), and
//   - remove this DORMANT banner.
// ─────────────────────────────────────────────────────────────────────────────

import { baseApi } from "@/core/store/api/baseApi";
import { ApiResponse } from "@/cms/types";

/** Click-to-call: ask the adapter to dial `destination` from the agent's extension. */
export interface MakeCallRequest {
  /** Destination number exactly as the agent/customer provided it. */
  destination: string;
}

/** Transfer the connected leg to another agent or queue. */
export interface TransferCallRequest {
  callId: string;
  /** Target agent id or extension, per the backend adapter's addressing. */
  target: string;
}

/** Command on one call leg, identified by the same callId the lifecycle events use. */
export interface CallLegRequest {
  callId: string;
}

export const callControlApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    makeCall: builder.mutation<ApiResponse<null>, MakeCallRequest>({
      query: (data) => ({
        url: "/call-control/calls",
        method: "POST",
        body: data,
      }),
    }),

    answerCall: builder.mutation<ApiResponse<null>, CallLegRequest>({
      query: ({ callId }) => ({
        url: `/call-control/calls/${encodeURIComponent(callId)}/answer`,
        method: "POST",
      }),
    }),

    holdCall: builder.mutation<ApiResponse<null>, CallLegRequest>({
      query: ({ callId }) => ({
        url: `/call-control/calls/${encodeURIComponent(callId)}/hold`,
        method: "POST",
      }),
    }),

    resumeCall: builder.mutation<ApiResponse<null>, CallLegRequest>({
      query: ({ callId }) => ({
        url: `/call-control/calls/${encodeURIComponent(callId)}/resume`,
        method: "POST",
      }),
    }),

    transferCall: builder.mutation<ApiResponse<null>, TransferCallRequest>({
      query: ({ callId, target }) => ({
        url: `/call-control/calls/${encodeURIComponent(callId)}/transfer`,
        method: "POST",
        body: { target },
      }),
    }),

    hangUpCall: builder.mutation<ApiResponse<null>, CallLegRequest>({
      query: ({ callId }) => ({
        url: `/call-control/calls/${encodeURIComponent(callId)}/terminate`,
        method: "POST",
      }),
    }),
  }),
  // Vite HMR re-runs this module without a full page reload, which calls
  // injectEndpoints a second time. Without this, RTK Query keeps the
  // definitions registered by the previous run and an edit to a `query`
  // silently has no effect until the page is reloaded.
  overrideExisting: import.meta.env.DEV,
});

export const {
  useMakeCallMutation,
  useAnswerCallMutation,
  useHoldCallMutation,
  useResumeCallMutation,
  useTransferCallMutation,
  useHangUpCallMutation,
} = callControlApi;
