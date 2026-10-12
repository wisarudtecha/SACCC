// Call-control endpoints for the 3CX integration adapter — capability-matrix
// Phase 2 (Track B4).
//
// ─────────────────────────────────────────────────────────────────────────────
// PRE-ADAPTER BY DESIGN — READ BEFORE WIRING MORE OF THESE TO THE UI
// ─────────────────────────────────────────────────────────────────────────────
// The backend 3CX integration adapter does not exist yet (see
// `docs/3CX-Integration-Capability-Matrix.md` §3.2 + Decision 3, and
// `docs/CALL-Lifecycle-Websocket-Event-Contract.md` §10, which keeps call
// control out of the websocket contract on purpose). Current consumers:
//   - `answerCall` is wired to the incoming-call screen pop's Answer button
//     (`src/cc/components/incomingCall/useIncomingCallPopups.ts`), with a
//     mock stand-in while the adapter is absent.
//   - every other command here is still mock-driven: the softphone toolbar,
//     dialpad, and agent-state selector run through the dev-only mock
//     lifecycle (`src/cc/components/softphone/mockCallLifecycle.ts`).
//
// 1. URL paths are the FE's *proposal* for the internal BFF surface
//    (`/call-control/…`), modeled on the 3CX Call Control API operations the
//    capability matrix lists (make call, answer, hold, resume, transfer,
//    terminate). The backend adapter owns the actual 3CX mapping; only the
//    paths may change at sign-off — the FE consumer should be unaffected.
//
// 2. GraphQL: PLACEHOLDER mappings exist in
//    `src/cc/store/api/graphql/callControlQueries.ts` (registered in
//    `GQL_MAP`), added ahead of the BFF adapter that would serve them.
//    Operation names, input types, and the `CallControl` root are FE
//    proposals pending sign-off. Until the BFF ships these operations, a
//    call in a `VITE_USE_GRAPHQL === "true"` environment fails at the BFF —
//    the hybrid base query (`src/core/store/api/hybridBaseQuery.ts`) has no
//    REST fallback. The four leg commands below carry an explicit
//    `body: { callId }` because `buildGraphQLQuery` bails out on a POST
//    mutation with no body (hard error in GraphQL mode) — the same pattern
//    as `area.ts` / `areaTemplateApi.ts`.
//
// 3. Response shape is provisional (`ApiResponse<null>`, the standard
//    command-envelope used by e.g. `insertCustommers`). Command *results* are
//    not polled: the authoritative call state arrives as websocket lifecycle
//    events (`src/cc/types/callEvents.ts`), so these mutations carry no
//    invalidatesTags.
//
// The `setAgentState` mutation below follows the same rules with its own
// contract: `docs/Agent-State-Command-Contract.md` (agent-selectable presence
// commands `ready`/`not_ready`/`break`; confirmation is the existing
// `AGENT_STATE_CHANGED` event, never the command response). Its path
// (`/call-control/agent-state`) and the command→event state mapping are
// proposals pending that contract's sign-off (its Q1/Q2).
//
// `makeCall` also has its own contract: `docs/Make-Call-Command-Contract.md`
// (actual-calling plan FE-1.2). Unlike every other command here, its response
// carries data — the new leg's `callId`, the correlation key for the dialed
// leg's lifecycle events (its §3.2; shape proposed, open question Q2). The
// events remain the only state source: a successful response means "dial
// accepted", never "connected" (its §4).
//
// The four supervisor monitoring commands (listen/whisper/barge/stop-monitor)
// follow the same rules with their own contract:
// `docs/Supervisor-Call-Control-Command-Contract.md` (supervisor-call-control
// plan). Responses are envelope-only — no session id, no mode: monitor
// sessions are derived from `CALL_MONITOR_STARTED`/`CALL_MONITOR_ENDED`
// events (lifecycle contract v0.2 §6.5) keyed by (callId, supervisorId). The
// supervisor roster + action UI (`src/cc/pages/Supervision/`) is mock-driven
// until the adapter lands, same posture as the softphone toolbar.
//
// When the backend adapter contract lands:
//   - confirm/adjust the URL paths AND the placeholder GraphQL operation
//     names / input types in `graphql/callControlQueries.ts` against the
//     signed-off contract (monitoring paths are that contract's Q-S1),
//   - wire `useSoftphone`'s remaining controls to these hooks (keep the mock
//     for dev + `VITE_MOCK_API` demos), and
//   - wire the supervisor UI's commands to the monitoring hooks (same split),
//   - remove this banner.
// ─────────────────────────────────────────────────────────────────────────────

import { baseApi } from "@/core/store/api/baseApi";
import { ApiResponse } from "@/cms/types";
import type { AgentStateCommand } from "../../types/agentStateCommand";

/** Click-to-call: ask the adapter to dial `destination` from the agent's extension. */
export interface MakeCallRequest {
  /** Destination number exactly as the agent/customer provided it. */
  destination: string;
}

/**
 * Make-call response data (contract §3.2, proposed): the new leg's `callId` —
 * the correlation key for the dialed leg's lifecycle events. Dial accepted,
 * NOT connected: connect arrives as the `CALL_ANSWERED` event.
 */
export interface MakeCallResponse {
  callId: string;
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

/** Agent-state command (BRD FR-07; contract §3.1 — state is the command vocabulary, not the event vocabulary). */
export interface SetAgentStateRequest {
  state: AgentStateCommand;
}

export const callControlApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    makeCall: builder.mutation<ApiResponse<MakeCallResponse>, MakeCallRequest>({
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
        body: { callId },
      }),
    }),

    holdCall: builder.mutation<ApiResponse<null>, CallLegRequest>({
      query: ({ callId }) => ({
        url: `/call-control/calls/${encodeURIComponent(callId)}/hold`,
        method: "POST",
        body: { callId },
      }),
    }),

    resumeCall: builder.mutation<ApiResponse<null>, CallLegRequest>({
      query: ({ callId }) => ({
        url: `/call-control/calls/${encodeURIComponent(callId)}/resume`,
        method: "POST",
        body: { callId },
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
        body: { callId },
      }),
    }),

    // ── Supervisor monitoring commands (Supervisor-Call-Control-Command-
    // Contract.md). All four target another agent's live leg; authorization
    // is the backend's (`cc.supervision.*` keys) — the FE gates visibility
    // only. Responses are envelope-only; monitor state arrives exclusively
    // as CALL_MONITOR_* events. A re-issue of the current mode is an
    // idempotent no-op success (contract §4.3). The supervisor variant of
    // `terminate` (force-terminate) reuses `hangUpCall` above under the
    // `cc.supervision.force_terminate` key — no new route (contract Q-S6).

    listenCall: builder.mutation<ApiResponse<null>, CallLegRequest>({
      query: ({ callId }) => ({
        url: `/call-control/calls/${encodeURIComponent(callId)}/listen`,
        method: "POST",
        body: { callId },
      }),
    }),

    whisperCall: builder.mutation<ApiResponse<null>, CallLegRequest>({
      query: ({ callId }) => ({
        url: `/call-control/calls/${encodeURIComponent(callId)}/whisper`,
        method: "POST",
        body: { callId },
      }),
    }),

    bargeInCall: builder.mutation<ApiResponse<null>, CallLegRequest>({
      query: ({ callId }) => ({
        url: `/call-control/calls/${encodeURIComponent(callId)}/barge-in`,
        method: "POST",
        body: { callId },
      }),
    }),

    stopMonitorCall: builder.mutation<ApiResponse<null>, CallLegRequest>({
      query: ({ callId }) => ({
        url: `/call-control/calls/${encodeURIComponent(callId)}/stop-monitor`,
        method: "POST",
        body: { callId },
      }),
    }),

    setAgentState: builder.mutation<ApiResponse<null>, SetAgentStateRequest>({
      query: ({ state }) => ({
        url: "/call-control/agent-state",
        method: "POST",
        body: { state },
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
  useListenCallMutation,
  useWhisperCallMutation,
  useBargeInCallMutation,
  useStopMonitorCallMutation,
  useSetAgentStateMutation,
} = callControlApi;
