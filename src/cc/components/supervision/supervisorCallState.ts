// Pure call-state machine for the supervisor live-call roster
// (`/cc/supervision`).
//
// Same discipline as `softphoneCallState.ts`: everything state-shaped lives
// here so it stays unit-testable in the repo's node-environment Vitest
// setup — no React, no websocket provider imports. Side effects (WS
// subscription, mock wiring, reconnect reset) live in `useSupervisorCalls.ts`.
//
// Semantics follow the lifecycle contract (v0.2):
//   - roster rows upsert per callId from any call-scoped event (§6.4 — the
//     roster must not depend on having seen the leg's earlier events);
//   - `CALL_ENDED` removes the row AND the supervisor's monitor session for
//     that leg (sticky-terminal — CALL_ENDED implies CALL_MONITOR_ENDED,
//     §6.5);
//   - monitor events are only applied for the *viewing* supervisor (the
//     roster is org-scoped data, monitor sessions are personal state —
//     keyed by (callId, supervisorId) per the command contract's Q-S2).
import {
  CALL_ANSWERED_WS_EVENT,
  CALL_ENDED_WS_EVENT,
  CALL_MONITOR_ENDED_WS_EVENT,
  CALL_MONITOR_STARTED_WS_EVENT,
  CALL_ON_HOLD_WS_EVENT,
  CALL_RESUMED_WS_EVENT,
  CALL_TRANSFERRED_WS_EVENT,
} from "../../types/callEvents";
import type {
  CallMonitorSession,
  CallSessionStatus,
  CallScopedLifecycleEvent,
} from "../softphone/softphoneCallState";

/** Live statuses a roster row can show (ended legs are pruned, not tracked). */
export type RosterCallStatus = Exclude<CallSessionStatus, "ended">;

/** One live agent call in the supervisor's roster, keyed by `callId`. */
export interface RosterCall {
  callId: string;
  status: RosterCallStatus;
  /** Agent currently involved in the leg (`toAgentId` after a transfer). */
  agentId?: string;
  /** Backend-resolved customer id, when known. */
  customerId?: string;
  /** Backend-resolved linked case id, when known. */
  caseId?: string;
  /** Caller number (ANI), when known. */
  ani?: string;
  /** Timestamp of the first event seen for the leg (drives duration + ordering). */
  startedAt: string;
  /** `timestamp` of the last applied event. */
  lastTimestamp: string;
}

/** The viewing supervisor's own monitor session on one leg. */
export type SupervisorMonitorSession = CallMonitorSession & {
  /** The monitored leg. */
  callId: string;
  /** Timestamp of the CALL_MONITOR_STARTED that opened the session. */
  startedAt: string;
};

/** All supervisor-roster state. */
export interface SupervisorCallState {
  /** Live calls, keyed by callId. */
  calls: Record<string, RosterCall>;
  /** The viewing supervisor's monitor sessions, keyed by callId. */
  sessions: Record<string, SupervisorMonitorSession>;
}

export const EMPTY_SUPERVISOR_CALL_STATE: SupervisorCallState = {
  calls: {},
  sessions: {},
};

export type SupervisorCallAction =
  | {
      type: "apply";
      event: CallScopedLifecycleEvent;
      /** The viewing supervisor's id — monitor events for others are ignored. */
      supervisorId: string | null;
    }
  | { type: "reset" };

function withCall(
  state: SupervisorCallState,
  callId: string,
  build: (previous: RosterCall | undefined) => RosterCall
): SupervisorCallState {
  return {
    ...state,
    calls: { ...state.calls, [callId]: build(state.calls[callId]) },
  };
}

function applyEvent(
  state: SupervisorCallState,
  event: CallScopedLifecycleEvent,
  supervisorId: string | null
): SupervisorCallState {
  const { payload, event: kind } = event;

  switch (kind) {
    case CALL_ANSWERED_WS_EVENT:
      return withCall(state, payload.callId, (prev) => ({
        callId: payload.callId,
        status: "active",
        agentId: payload.agentId ?? prev?.agentId,
        customerId: payload.customerId ?? prev?.customerId,
        caseId: payload.caseId ?? prev?.caseId,
        ani: payload.ani ?? prev?.ani,
        startedAt: prev?.startedAt ?? payload.timestamp,
        lastTimestamp: payload.timestamp,
      }));
    case CALL_ON_HOLD_WS_EVENT:
      return withCall(state, payload.callId, (prev) => ({
        callId: payload.callId,
        status: "on_hold",
        agentId: payload.agentId ?? prev?.agentId,
        customerId: prev?.customerId,
        caseId: prev?.caseId,
        ani: prev?.ani,
        startedAt: prev?.startedAt ?? payload.timestamp,
        lastTimestamp: payload.timestamp,
      }));
    case CALL_RESUMED_WS_EVENT:
      return withCall(state, payload.callId, (prev) => ({
        callId: payload.callId,
        status: "active",
        agentId: payload.agentId ?? prev?.agentId,
        customerId: prev?.customerId,
        caseId: prev?.caseId,
        ani: prev?.ani,
        startedAt: prev?.startedAt ?? payload.timestamp,
        lastTimestamp: payload.timestamp,
      }));
    case CALL_TRANSFERRED_WS_EVENT:
      return withCall(state, payload.callId, (prev) => ({
        callId: payload.callId,
        status: "transferred",
        // The leg continues under the receiving agent — the roster follows it.
        agentId: payload.toAgentId ?? prev?.agentId,
        customerId: prev?.customerId,
        caseId: prev?.caseId,
        ani: prev?.ani,
        startedAt: prev?.startedAt ?? payload.timestamp,
        lastTimestamp: payload.timestamp,
      }));
    case CALL_ENDED_WS_EVENT: {
      if (!(payload.callId in state.calls) && !(payload.callId in state.sessions)) {
        return state;
      }
      const calls = { ...state.calls };
      delete calls[payload.callId];
      const sessions = { ...state.sessions };
      // CALL_ENDED implies CALL_MONITOR_ENDED (contract §6.5) — no zombie
      // sessions for legs that are over.
      delete sessions[payload.callId];
      return { calls, sessions };
    }
    case CALL_MONITOR_STARTED_WS_EVENT:
      // Only the viewing supervisor's own sessions matter here (personal
      // state); other supervisors' sessions are invisible by design.
      if (supervisorId === null || payload.supervisorId !== supervisorId) {
        return state;
      }
      return {
        ...state,
        sessions: {
          ...state.sessions,
          [payload.callId]: {
            callId: payload.callId,
            supervisorId: payload.supervisorId,
            mode: payload.mode,
            startedAt: payload.timestamp,
          },
        },
      };
    case CALL_MONITOR_ENDED_WS_EVENT: {
      if (supervisorId === null || payload.supervisorId !== supervisorId) {
        return state;
      }
      if (!(payload.callId in state.sessions)) {
        return state;
      }
      const sessions = { ...state.sessions };
      delete sessions[payload.callId];
      return { ...state, sessions };
    }
  }
}

/** Applies lifecycle events and roster resets to the supervisor call state. */
export function supervisorCallsReducer(
  state: SupervisorCallState,
  action: SupervisorCallAction
): SupervisorCallState {
  switch (action.type) {
    case "apply":
      return applyEvent(state, action.event, action.supervisorId);
    case "reset":
      return EMPTY_SUPERVISOR_CALL_STATE;
  }
}

/**
 * Roster rows sorted oldest-first — the longest-running call sits on top.
 * Compares parsed instants (ISO strings may mix `Z` and `+07:00` forms);
 * unparseable timestamps fall back to the lexicographic compare.
 */
export function selectRosterCalls(state: SupervisorCallState): RosterCall[] {
  return Object.values(state.calls).sort((a, b) => {
    const aTime = Date.parse(a.startedAt);
    const bTime = Date.parse(b.startedAt);
    if (Number.isFinite(aTime) && Number.isFinite(bTime)) {
      return aTime - bTime;
    }
    return a.startedAt.localeCompare(b.startedAt);
  });
}

/** The viewing supervisor's monitor session on a leg, or null. */
export function selectMonitorSession(
  state: SupervisorCallState,
  callId: string
): SupervisorMonitorSession | null {
  return state.sessions[callId] ?? null;
}
