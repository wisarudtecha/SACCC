// Pure call-state machine for the softphone (`/cc/softphone`).
//
// Everything state-shaped lives here so it stays unit-testable in the repo's
// node-environment Vitest setup — no React, no websocket provider imports.
// Side effects (WS subscription, mock wiring) live in `useSoftphone.ts`.
//
// Semantics follow docs/CALL-Lifecycle-Websocket-Event-Contract.md §6:
//   - upsert per callId — the softphone must not depend on having seen the
//     CALL_INCOMING ring (or any earlier lifecycle event) for the leg;
//   - `ended` is sticky/terminal — a late hold/resume/answer for the same
//     callId is ignored, never resurrects the session;
//   - repeated events are safe to re-apply (idempotent state assertion).
// Monitor events additionally follow the contract's §6.5: sessions are keyed
// by (callId, supervisorId), escalation is an ENDED+STARTED pair, CALL_ENDED
// clears monitor state implicitly, and a monitor event after the leg's ENDED
// is ignored (no zombie sessions).
import {
  AGENT_STATE_CHANGED_WS_EVENT,
  CALL_ANSWERED_WS_EVENT,
  CALL_ENDED_WS_EVENT,
  CALL_MONITOR_ENDED_WS_EVENT,
  CALL_MONITOR_STARTED_WS_EVENT,
  CALL_ON_HOLD_WS_EVENT,
  CALL_RESUMED_WS_EVENT,
  CALL_TRANSFERRED_WS_EVENT,
  type CallLifecycleEvent,
} from "../../types/callEvents";

/** Lifecycle events scoped to a call leg (everything except agent state). */
export type CallScopedLifecycleEvent = Exclude<
  CallLifecycleEvent,
  { event: typeof AGENT_STATE_CHANGED_WS_EVENT }
>;

/** Status of one call leg as tracked by the softphone. */
export type CallSessionStatus = "active" | "on_hold" | "transferred" | "ended";

/**
 * A supervisor monitor session riding on a leg (contract §6.5). Q-S5 defaults
 * to one concurrent session per call — tracked as a single field; a STARTED
 * for a different supervisor overwrites (last-wins), matching the
 * event-derived model.
 */
export interface CallMonitorSession {
  supervisorId: string;
  mode: string;
}

/** One tracked call leg, keyed by `callId`. */
export interface CallSession {
  callId: string;
  status: CallSessionStatus;
  agentId?: string;
  customerId?: string;
  caseId?: string;
  /** Caller number (ANI) when provided by the adapter. */
  ani?: string;
  /** `toAgentId` of the last CALL_TRANSFERRED event, when transferred. */
  transferredTo?: string;
  /** `endReason` of the terminal CALL_ENDED event, when ended. */
  endReason?: string;
  /** Whole seconds reported by CALL_ENDED, when the adapter supplied it. */
  durationSeconds?: number;
  /** Active supervisor monitor session on this leg, when any (agent-side badge). */
  monitor?: CallMonitorSession;
  /** `timestamp` of the last applied event — drives "most recent" ordering. */
  lastTimestamp: string;
}

/** All tracked sessions, keyed by callId. */
export type SoftphoneCalls = Record<string, CallSession>;

export type SoftphoneCallAction =
  | { type: "apply"; event: CallScopedLifecycleEvent }
  | { type: "clearEnded"; callId: string };

/** Upper bound on tracked sessions — prunes oldest-ended first. */
export const MAX_TRACKED_CALLS = 20;

function baseSession(
  payload: { callId: string; agentId?: string; timestamp: string },
  existing?: CallSession
): Omit<CallSession, "status" | "transferredTo" | "endReason" | "durationSeconds"> {
  return {
    callId: payload.callId,
    agentId: payload.agentId ?? existing?.agentId,
    customerId: existing?.customerId,
    caseId: existing?.caseId,
    ani: existing?.ani,
    lastTimestamp: payload.timestamp,
  };
}

function applyEvent(
  calls: SoftphoneCalls,
  event: CallScopedLifecycleEvent
): SoftphoneCalls {
  const { payload, event: kind } = event;
  const existing = calls[payload.callId];

  // Terminal-sticky (contract §6.4): a non-terminal event for an ended leg
  // never resurrects or mutates the session. ENDED itself may re-assert.
  if (existing?.status === "ended" && kind !== CALL_ENDED_WS_EVENT) {
    return calls;
  }

  let session: CallSession;
  switch (kind) {
    case CALL_ANSWERED_WS_EVENT:
      session = {
        ...baseSession(payload, existing),
        customerId: payload.customerId ?? existing?.customerId,
        caseId: payload.caseId ?? existing?.caseId,
        ani: payload.ani ?? existing?.ani,
        status: "active",
      };
      break;
    case CALL_ON_HOLD_WS_EVENT:
      session = { ...baseSession(payload, existing), status: "on_hold" };
      break;
    case CALL_RESUMED_WS_EVENT:
      session = { ...baseSession(payload, existing), status: "active" };
      break;
    case CALL_TRANSFERRED_WS_EVENT:
      session = {
        ...baseSession(payload, existing),
        status: "transferred",
        transferredTo: payload.toAgentId ?? existing?.transferredTo,
      };
      break;
    case CALL_ENDED_WS_EVENT:
      session = {
        ...baseSession(payload, existing),
        status: "ended",
        endReason: payload.endReason,
        durationSeconds: payload.durationSeconds,
      };
      break;
    case CALL_MONITOR_STARTED_WS_EVENT:
      // Upsert discipline (§6.4): a monitor event may be the first event the
      // agent's softphone sees for the leg — a monitored leg is necessarily
      // live, so an unseen leg starts as active; a seen leg keeps its status
      // (monitoring never changes leg status, contract §6.5).
      session = {
        ...baseSession(payload, existing),
        status: existing?.status ?? "active",
        monitor: { supervisorId: payload.supervisorId, mode: payload.mode },
      };
      break;
    case CALL_MONITOR_ENDED_WS_EVENT:
      // ENDED clears only the matching supervisor's session and never creates
      // a session for an unseen leg; other supervisors' sessions (multi-
      // monitor deployments) and non-monitored legs are left untouched.
      if (
        existing === undefined ||
        existing.monitor?.supervisorId !== payload.supervisorId
      ) {
        return calls;
      }
      session = {
        ...baseSession(payload, existing),
        status: existing.status,
        transferredTo: existing.transferredTo,
        endReason: existing.endReason,
        durationSeconds: existing.durationSeconds,
      };
      break;
  }

  return prune({ ...calls, [payload.callId]: session });
}

function prune(calls: SoftphoneCalls): SoftphoneCalls {
  const ids = Object.keys(calls);
  if (ids.length <= MAX_TRACKED_CALLS) {
    return calls;
  }
  const next = { ...calls };
  const byAge = [...ids].sort((a, b) =>
    calls[a].lastTimestamp.localeCompare(calls[b].lastTimestamp)
  );
  let excess = ids.length - MAX_TRACKED_CALLS;
  // Oldest ended sessions go first; active/held/transferred legs are only
  // dropped when there is nothing ended left to prune.
  for (const id of byAge) {
    if (excess <= 0) break;
    if (next[id]?.status === "ended") {
      delete next[id];
      excess -= 1;
    }
  }
  for (const id of byAge) {
    if (excess <= 0) break;
    if (id in next) {
      delete next[id];
      excess -= 1;
    }
  }
  return next;
}

/** Applies lifecycle events and ended-call dismissal to the tracked sessions. */
export function softphoneCallsReducer(
  calls: SoftphoneCalls,
  action: SoftphoneCallAction
): SoftphoneCalls {
  switch (action.type) {
    case "apply":
      return applyEvent(calls, action.event);
    case "clearEnded": {
      if (!(action.callId in calls)) {
        return calls;
      }
      const next = { ...calls };
      delete next[action.callId];
      return next;
    }
  }
}

function newestOf(sessions: CallSession[]): CallSession | null {
  return sessions.reduce<CallSession | null>(
    (newest, session) =>
      newest === null ||
      session.lastTimestamp.localeCompare(newest.lastTimestamp) > 0
        ? session
        : newest,
    null
  );
}

/** The most recent session that is not over, or null when none exists. */
export function selectActiveCall(calls: SoftphoneCalls): CallSession | null {
  return newestOf(
    Object.values(calls).filter((session) => session.status !== "ended")
  );
}

/** The most recently ended session, or null when none exists. */
export function selectLatestEndedCall(calls: SoftphoneCalls): CallSession | null {
  return newestOf(
    Object.values(calls).filter((session) => session.status === "ended")
  );
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
