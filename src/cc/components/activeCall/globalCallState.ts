// Pure reducer for the global active-call indicator bar.
//
// Tracks call legs from CALL_ANSWERED through CALL_ENDED. Deliberately
// simpler than softphoneCallState.ts — it does not track monitor sessions
// and does not keep ended calls (they are removed immediately so the bar
// disappears on end).
import {
  CALL_ANSWERED_WS_EVENT,
  CALL_ENDED_WS_EVENT,
  CALL_ON_HOLD_WS_EVENT,
  CALL_RESUMED_WS_EVENT,
  CALL_TRANSFERRED_WS_EVENT,
  type CallLifecycleEvent,
} from "../../types/callEvents";

/** Lifecycle events scoped to a call leg (excludes agent-state and monitor events). */
type CallScopedLifecycleEvent = Extract<
  CallLifecycleEvent,
  { event: typeof CALL_ANSWERED_WS_EVENT | typeof CALL_ON_HOLD_WS_EVENT | typeof CALL_RESUMED_WS_EVENT | typeof CALL_TRANSFERRED_WS_EVENT | typeof CALL_ENDED_WS_EVENT }
>;

export type GlobalCallStatus = "active" | "on_hold" | "transferred";

export interface GlobalCallSession {
  callId: string;
  status: GlobalCallStatus;
  agentId?: string;
  customerId?: string;
  caseId?: string;
  ani?: string;
  transferredTo?: string;
  /** ISO timestamp when the call became active (CALL_ANSWERED). */
  startedAt: string;
  /** ISO timestamp of the most recent event (for sorting). */
  lastEventAt: string;
}

export type GlobalCalls = Record<string, GlobalCallSession>;

export type GlobalCallAction =
  | { type: "apply"; event: CallScopedLifecycleEvent }
  | { type: "remove"; callId: string };

export function globalCallsReducer(
  calls: GlobalCalls,
  action: GlobalCallAction
): GlobalCalls {
  switch (action.type) {
    case "apply":
      return applyEvent(calls, action.event);
    case "remove": {
      if (!(action.callId in calls)) {
        return calls;
      }
      const next = { ...calls };
      delete next[action.callId];
      return next;
    }
  }
}

function applyEvent(
  calls: GlobalCalls,
  event: CallScopedLifecycleEvent
): GlobalCalls {
  const { payload, event: kind } = event;
  const existing = calls[payload.callId];

  switch (kind) {
    case CALL_ANSWERED_WS_EVENT: {
      const session: GlobalCallSession = {
        callId: payload.callId,
        status: "active",
        agentId: payload.agentId ?? existing?.agentId,
        customerId:
          (payload as { customerId?: string }).customerId ??
          existing?.customerId,
        caseId: (payload as { caseId?: string }).caseId ?? existing?.caseId,
        ani: (payload as { ani?: string }).ani ?? existing?.ani,
        startedAt: existing?.startedAt ?? payload.timestamp,
        lastEventAt: payload.timestamp,
      };
      return { ...calls, [payload.callId]: session };
    }
    case CALL_ON_HOLD_WS_EVENT:
      if (!existing) return calls;
      return {
        ...calls,
        [payload.callId]: {
          ...existing,
          status: "on_hold",
          lastEventAt: payload.timestamp,
        },
      };
    case CALL_RESUMED_WS_EVENT:
      if (!existing) return calls;
      return {
        ...calls,
        [payload.callId]: {
          ...existing,
          status: "active",
          lastEventAt: payload.timestamp,
        },
      };
    case CALL_TRANSFERRED_WS_EVENT:
      if (!existing) return calls;
      return {
        ...calls,
        [payload.callId]: {
          ...existing,
          status: "transferred",
          transferredTo:
            (payload as { toAgentId?: string }).toAgentId ??
            existing.transferredTo,
          lastEventAt: payload.timestamp,
        },
      };
    case CALL_ENDED_WS_EVENT: {
      if (!existing) return calls;
      const next = { ...calls };
      delete next[payload.callId];
      return next;
    }
    default:
      return calls;
  }
}

/** All non-ended calls, newest first. */
export function selectGlobalActiveCalls(calls: GlobalCalls): GlobalCallSession[] {
  return Object.values(calls).sort(
    (a, b) => b.lastEventAt.localeCompare(a.lastEventAt)
  );
}

/** The most recent active call, or null when none. */
export function selectPrimaryActiveCall(
  calls: GlobalCalls
): GlobalCallSession | null {
  const active = selectGlobalActiveCalls(calls);
  return active[0] ?? null;
}

/** Renders a whole-second duration as e.g. "4m 05s" / "1h 02m 03s". */
export function formatCallDuration(totalSeconds: number): string {
  if (!Number.isFinite(totalSeconds) || totalSeconds < 0) {
    return "";
  }
  const seconds = Math.floor(totalSeconds);
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const rest = seconds % 60;
  const mm = minutes.toString().padStart(2, "0");
  const ss = rest.toString().padStart(2, "0");
  return hours > 0 ? `${hours}h ${mm}m ${ss}s` : `${minutes}m ${ss}s`;
}
