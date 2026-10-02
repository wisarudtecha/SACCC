// Pure reducer + item types for the incoming-call screen pop queue.
//
// The reducer owns everything the popup cards need between "event arrived"
// and "agent acted / card expired": the dedupe/cap rules for concurrent
// calls, the caller-resolution state machine, and the per-card expiry. It is
// deliberately framework-free — the orchestration hook
// (`useIncomingCallPopups.ts`) subscribes to the websocket, drives the lazy
// lookups, and dispatches into this reducer; the card components only render
// the resulting items.
//
// Timing note: `INCOMING_CALL_AUTO_DISMISS_MS` intentionally deviates from
// `POPUP_AUTO_DISMISS_MS` (10s, tuned for passive notification cards) — an
// incoming call is actionable and the agent may be mid-wrap-up, so the card
// lives longer. The slide animation still reuses `POPUP_TRANSITION_MS`.

import type { AniNormalization } from "../../utils/ani";
import type { IncomingCallEvent } from "../../types/incomingCall";
import type { CaseSummary, CustomerSummary } from "../../utils/incomingCallPayload";

/** How long an incoming-call card stays on screen without agent interaction. */
export const INCOMING_CALL_AUTO_DISMISS_MS = 30_000;

/** Granularity of the expiry sweep driven by the orchestration hook. */
export const INCOMING_CALL_EXPIRY_TICK_MS = 1_000;

/** Maximum concurrently visible call cards — overflow is dropped, not queued. */
export const INCOMING_CALL_MAX_ACTIVE = 4;

/** Recent-case rows a single card renders. */
export const RECENT_CASES_SHOWN = 3;

/** Where the caller-resolution state machine currently sits for a card. */
export type LookupStatus = "pending" | "resolving" | "resolved" | "unknown" | "error";

/** Case-list load state for a card; only meaningful once a customer resolved. */
export type CasesStatus = "idle" | "loading" | "loaded" | "error";

/** One visible incoming-call card. */
export interface IncomingCallPopupItem {
  call: IncomingCallEvent;
  ani: AniNormalization;
  lookup: LookupStatus;
  customer?: CustomerSummary;
  cases: CaseSummary[];
  casesStatus: CasesStatus;
  enqueuedAt: number;
  expiresAt: number;
}

export type IncomingCallPopupAction =
  | { type: "enqueue"; call: IncomingCallEvent; ani: AniNormalization; now: number }
  | { type: "resolutionStarted"; callId: string }
  | { type: "customerResolved"; callId: string; customer: CustomerSummary }
  | { type: "customerUnknown"; callId: string }
  | { type: "customerLookupFailed"; callId: string }
  | { type: "casesLoading"; callId: string }
  | { type: "casesLoaded"; callId: string; cases: CaseSummary[] }
  | { type: "casesFailed"; callId: string }
  | { type: "dismiss"; callId: string }
  | { type: "expire"; now: number };

function patchItem(
  state: IncomingCallPopupItem[],
  callId: string,
  patch: (item: IncomingCallPopupItem) => IncomingCallPopupItem
): IncomingCallPopupItem[] {
  let changed = false;
  const next = state.map((item) => {
    if (item.call.callId !== callId) {
      return item;
    }
    changed = true;
    return patch(item);
  });
  return changed ? next : state;
}

function removeByCallId(state: IncomingCallPopupItem[], callId: string): IncomingCallPopupItem[] {
  const next = state.filter((item) => item.call.callId !== callId);
  return next.length === state.length ? state : next;
}

/**
 * Reduces the popup queue. Every action returns a new array when anything
 * changed and the identical reference otherwise; input items are never
 * mutated. Unknown callIds are ignored so late transitions for dismissed
 * cards cannot resurrect them.
 */
export function incomingCallPopupReducer(
  state: IncomingCallPopupItem[],
  action: IncomingCallPopupAction
): IncomingCallPopupItem[] {
  switch (action.type) {
    case "enqueue": {
      const isDuplicate = state.some((item) => item.call.callId === action.call.callId);
      const isFull = state.length >= INCOMING_CALL_MAX_ACTIVE;
      if (isDuplicate || isFull) {
        return state;
      }
      const item: IncomingCallPopupItem = {
        call: action.call,
        ani: action.ani,
        lookup: action.call.customerId ? "resolving" : "pending",
        cases: [],
        casesStatus: "idle",
        enqueuedAt: action.now,
        expiresAt: action.now + INCOMING_CALL_AUTO_DISMISS_MS,
      };
      return [...state, item];
    }
    case "resolutionStarted":
      return patchItem(state, action.callId, (item) => ({ ...item, lookup: "resolving" }));
    case "customerResolved":
      return patchItem(state, action.callId, (item) => ({
        ...item,
        lookup: "resolved",
        customer: action.customer,
      }));
    case "customerUnknown":
      return patchItem(state, action.callId, (item) => ({ ...item, lookup: "unknown" }));
    case "customerLookupFailed":
      return patchItem(state, action.callId, (item) => ({ ...item, lookup: "error" }));
    case "casesLoading":
      return patchItem(state, action.callId, (item) => ({ ...item, casesStatus: "loading" }));
    case "casesLoaded":
      return patchItem(state, action.callId, (item) => ({
        ...item,
        casesStatus: "loaded",
        cases: action.cases,
      }));
    case "casesFailed":
      return patchItem(state, action.callId, (item) => ({ ...item, casesStatus: "error" }));
    case "dismiss":
      return removeByCallId(state, action.callId);
    case "expire": {
      const next = state.filter((item) => item.expiresAt > action.now);
      return next.length === state.length ? state : next;
    }
    default:
      return state;
  }
}
