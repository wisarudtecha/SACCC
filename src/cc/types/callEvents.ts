// Call-lifecycle domain types (FE softphone / 3CX) — capability-matrix Phase 2.
//
// ─────────────────────────────────────────────────────────────────────────────
// BACKEND CONTRACT — READ BEFORE WIRING TO A LIVE ENDPOINT
// ─────────────────────────────────────────────────────────────────────────────
// Full wire-level contract (targeting, idempotency, validation table, test
// vectors, open questions): docs/CALL-Lifecycle-Websocket-Event-Contract.md —
// keep this file and that document in sync when the contract changes.
// (v0.2 monitoring extension adds the CALL_MONITOR_* supervisor events —
// docs/supervisor-call-control-plan.md; the commands that cause them are
// specified by docs/Supervisor-Call-Control-Command-Contract.md.)
//
// This module EXTENDS the CALL_INCOMING contract (`./incomingCall.ts`,
// `docs/CALL_INCOMING-Websocket-Event-Contract.md`) with the post-ring call
// lifecycle and agent-state events the softphone consumes. CALL_INCOMING
// remains the ringing-phase event and is NOT parsed here — the screen pop
// owns it. Per `docs/3CX-Integration-Capability-Matrix.md` Decision 4 the FE
// consumes a *normalized internal* event model only, never raw 3CX payloads.
//
// The backend 3CX integration adapter is not built yet; the FE is built
// against the dev-only mock emitter (`VITE_MOCK_API="true"`) until it lands.
// ─────────────────────────────────────────────────────────────────────────────

import type { WebSocketMessageLike } from "./incomingCall";

/** Websocket `message.data.EVENT` value: the ringing leg was picked up. */
export const CALL_ANSWERED_WS_EVENT = "CALL_ANSWERED" as const;
/** Websocket `message.data.EVENT` value: the active leg was placed on hold. */
export const CALL_ON_HOLD_WS_EVENT = "CALL_ON_HOLD" as const;
/** Websocket `message.data.EVENT` value: a held leg was taken off hold. */
export const CALL_RESUMED_WS_EVENT = "CALL_RESUMED" as const;
/** Websocket `message.data.EVENT` value: the leg moved to another agent. */
export const CALL_TRANSFERRED_WS_EVENT = "CALL_TRANSFERRED" as const;
/** Websocket `message.data.EVENT` value: terminal — the leg is over. */
export const CALL_ENDED_WS_EVENT = "CALL_ENDED" as const;
/** Websocket `message.data.EVENT` value: telephony presence for one agent. */
export const AGENT_STATE_CHANGED_WS_EVENT = "AGENT_STATE_CHANGED" as const;
/** Websocket `message.data.EVENT` value: a supervisor began/escalated monitoring the leg. */
export const CALL_MONITOR_STARTED_WS_EVENT = "CALL_MONITOR_STARTED" as const;
/** Websocket `message.data.EVENT` value: a supervisor's monitor session on the leg ended. */
export const CALL_MONITOR_ENDED_WS_EVENT = "CALL_MONITOR_ENDED" as const;

/** All event names this module parses, as a readonly tuple. */
export const CALL_LIFECYCLE_WS_EVENTS = [
  CALL_ANSWERED_WS_EVENT,
  CALL_ON_HOLD_WS_EVENT,
  CALL_RESUMED_WS_EVENT,
  CALL_TRANSFERRED_WS_EVENT,
  CALL_ENDED_WS_EVENT,
  AGENT_STATE_CHANGED_WS_EVENT,
  CALL_MONITOR_STARTED_WS_EVENT,
  CALL_MONITOR_ENDED_WS_EVENT,
] as const;

/** Union of the lifecycle event names, derived from the tuple above. */
export type CallLifecycleEventName = (typeof CALL_LIFECYCLE_WS_EVENTS)[number];

/**
 * Fields shared by every call-scoped lifecycle payload. `callId` correlates
 * the leg with the `CALL_INCOMING` event that announced it (backend
 * idempotency key, unique per call leg — same value, same semantics).
 */
export interface CallLifecycleEventBase {
  /** Backend idempotency key; unique per call leg. Correlates with CALL_INCOMING. */
  callId: string;
  /** Agent the event concerns. Informational — the backend targets delivery. */
  agentId?: string;
  /** ISO timestamp of the event (server clock). */
  timestamp: string;
}

/** `CALL_ANSWERED` payload — the ringing leg was picked up. */
export type CallAnsweredEvent = CallLifecycleEventBase & {
  /** Backend-resolved customer id (same semantics as on CALL_INCOMING). */
  customerId?: string;
  /** Backend-resolved linked case id. */
  caseId?: string;
  /** Caller number (ANI) when provided by the backend adapter. */
  ani?: string;
};

/** `CALL_ON_HOLD` payload — the active leg was placed on hold. */
export type CallOnHoldEvent = CallLifecycleEventBase;

/** `CALL_RESUMED` payload — a held leg was taken off hold. */
export type CallResumedEvent = CallLifecycleEventBase;

/** `CALL_TRANSFERRED` payload — the leg moved to another agent. */
export type CallTransferredEvent = CallLifecycleEventBase & {
  /** Agent the leg was transferred away from. */
  fromAgentId?: string;
  /** Agent the leg was transferred to. */
  toAgentId?: string;
};

/** `CALL_ENDED` payload — terminal; the leg is over. */
export type CallEndedEvent = CallLifecycleEventBase & {
  /**
   * Free-form non-empty reason. Canonical values the FE renders explicitly:
   * "completed" | "abandoned" | "missed" | "failed" | "transferred".
   * Unknown values fall back to a generic ended state (forward compatible).
   */
  endReason: string;
  /** Whole seconds from CALL_INCOMING to CALL_ENDED (server clock), when known. */
  durationSeconds?: number;
};

/**
 * `AGENT_STATE_CHANGED` payload — telephony presence for one agent. Grouped
 * with the call lifecycle because it shares the transport, envelope, and
 * softphone consumer, even though it is not scoped to a call leg.
 */
export interface AgentStateChangedEvent {
  /** Agent whose telephony state changed. */
  agentId: string;
  /**
   * Free-form non-empty state. Canonical values: "available" | "on_call" |
   * "busy" | "break" | "after_call_work" | "offline". Unknown values are
   * rendered as-is (forward compatible).
   */
  state: string;
  /** ISO timestamp of the change (server clock). */
  timestamp: string;
}

/**
 * Fields shared by the `CALL_MONITOR_*` payloads (lifecycle contract v0.2
 * §5.2). A monitor session is identified by (`callId`, `supervisorId`) — no
 * session id exists on the wire (command contract Q-S2: event-derived).
 */
export interface CallMonitorEventBase extends CallLifecycleEventBase {
  /** The monitoring supervisor's user id. Non-empty. */
  supervisorId: string;
  /**
   * Free-form non-empty mode. Canonical values: "listen" | "whisper" |
   * "barge". Unknown values render a generic monitoring badge (forward
   * compatible).
   */
  mode: string;
}

/** `CALL_MONITOR_STARTED` payload — a supervisor began/escalated monitoring. */
export type CallMonitorStartedEvent = CallMonitorEventBase;

/** `CALL_MONITOR_ENDED` payload — a supervisor's monitor session ended. */
export type CallMonitorEndedEvent = CallMonitorEventBase & {
  /**
   * Free-form non-empty reason when present. Canonical values: "stopped" |
   * "escalated" | "call_ended". Omit when unknown — never null (contract
   * §5.2 sharp edge #6). Display-only.
   */
  reason?: string;
};

/**
 * Discriminated union the softphone consumes: one variant per lifecycle
 * event, narrowed on `event`.
 */
export type CallLifecycleEvent =
  | { event: typeof CALL_ANSWERED_WS_EVENT; payload: CallAnsweredEvent }
  | { event: typeof CALL_ON_HOLD_WS_EVENT; payload: CallOnHoldEvent }
  | { event: typeof CALL_RESUMED_WS_EVENT; payload: CallResumedEvent }
  | { event: typeof CALL_TRANSFERRED_WS_EVENT; payload: CallTransferredEvent }
  | { event: typeof CALL_ENDED_WS_EVENT; payload: CallEndedEvent }
  | { event: typeof AGENT_STATE_CHANGED_WS_EVENT; payload: AgentStateChangedEvent }
  | { event: typeof CALL_MONITOR_STARTED_WS_EVENT; payload: CallMonitorStartedEvent }
  | { event: typeof CALL_MONITOR_ENDED_WS_EVENT; payload: CallMonitorEndedEvent };

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isOptionalString(value: unknown): boolean {
  return value === undefined || typeof value === "string";
}

function isOptionalFiniteNumber(value: unknown): boolean {
  return (
    value === undefined || (typeof value === "number" && Number.isFinite(value))
  );
}

/**
 * Narrows `unknown` to a plain record, or null for non-objects. Guards below
 * all read fields through this record instead of casting a narrowed interface
 * — `Interface as Record<string, unknown>` fails strict `tsc` (no index
 * signature), whereas `unknown`/`object` casts are fine.
 */
function toRecord(value: unknown): Record<string, unknown> | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }
  return value as Record<string, unknown>;
}

/** True when `candidate` carries the required base fields of a call event. */
function hasCallEventBaseFields(candidate: Record<string, unknown>): boolean {
  return (
    isNonEmptyString(candidate.callId) &&
    isOptionalString(candidate.agentId) &&
    typeof candidate.timestamp === "string"
  );
}

/** True when `value` is a `CALL_ANSWERED` payload shape. */
export function isCallAnsweredEvent(value: unknown): value is CallAnsweredEvent {
  const candidate = toRecord(value);
  return (
    candidate !== null &&
    hasCallEventBaseFields(candidate) &&
    isOptionalString(candidate.customerId) &&
    isOptionalString(candidate.caseId) &&
    isOptionalString(candidate.ani)
  );
}

/** True when `value` is a `CALL_ON_HOLD` payload shape. */
export function isCallOnHoldEvent(value: unknown): value is CallOnHoldEvent {
  const candidate = toRecord(value);
  return candidate !== null && hasCallEventBaseFields(candidate);
}

/** True when `value` is a `CALL_RESUMED` payload shape. */
export function isCallResumedEvent(value: unknown): value is CallResumedEvent {
  const candidate = toRecord(value);
  return candidate !== null && hasCallEventBaseFields(candidate);
}

/** True when `value` is a `CALL_TRANSFERRED` payload shape. */
export function isCallTransferredEvent(
  value: unknown
): value is CallTransferredEvent {
  const candidate = toRecord(value);
  return (
    candidate !== null &&
    hasCallEventBaseFields(candidate) &&
    isOptionalString(candidate.fromAgentId) &&
    isOptionalString(candidate.toAgentId)
  );
}

/** True when `value` is a `CALL_ENDED` payload shape. */
export function isCallEndedEvent(value: unknown): value is CallEndedEvent {
  const candidate = toRecord(value);
  return (
    candidate !== null &&
    hasCallEventBaseFields(candidate) &&
    isNonEmptyString(candidate.endReason) &&
    isOptionalFiniteNumber(candidate.durationSeconds)
  );
}

/** True when `value` is an `AGENT_STATE_CHANGED` payload shape. */
export function isAgentStateChangedEvent(
  value: unknown
): value is AgentStateChangedEvent {
  const candidate = toRecord(value);
  return (
    candidate !== null &&
    isNonEmptyString(candidate.agentId) &&
    isNonEmptyString(candidate.state) &&
    typeof candidate.timestamp === "string"
  );
}

/** True when `value` carries the fields shared by every CALL_MONITOR_* payload. */
function hasCallMonitorEventFields(candidate: Record<string, unknown>): boolean {
  return (
    hasCallEventBaseFields(candidate) &&
    isNonEmptyString(candidate.supervisorId) &&
    isNonEmptyString(candidate.mode)
  );
}

/** True when `value` is a `CALL_MONITOR_STARTED` payload shape. */
export function isCallMonitorStartedEvent(
  value: unknown
): value is CallMonitorStartedEvent {
  const candidate = toRecord(value);
  return candidate !== null && hasCallMonitorEventFields(candidate);
}

/** True when `value` is a `CALL_MONITOR_ENDED` payload shape. */
export function isCallMonitorEndedEvent(
  value: unknown
): value is CallMonitorEndedEvent {
  const candidate = toRecord(value);
  return (
    candidate !== null &&
    hasCallMonitorEventFields(candidate) &&
    // `reason` is omit-or-non-empty — null/empty drops the event (contract
    // §5.2 sharp edge #6), unlike the plain-optional string fields.
    (candidate.reason === undefined || isNonEmptyString(candidate.reason))
  );
}

/** True when `value` is one of the event names this module parses. */
export function isCallLifecycleEventName(
  value: unknown
): value is CallLifecycleEventName {
  return (
    typeof value === "string" &&
    (CALL_LIFECYCLE_WS_EVENTS as readonly string[]).includes(value)
  );
}

/**
 * Extracts and validates a call-lifecycle or agent-state event from a raw
 * websocket message. Returns null for anything that is not a well-formed
 * lifecycle event — including `CALL_INCOMING` (owned by
 * `parseIncomingCallMessage`) and unknown future event names — defensive by
 * design, never throws.
 */
export function parseCallLifecycleMessage(
  message: WebSocketMessageLike | null | undefined
): CallLifecycleEvent | null {
  if (message === null || message === undefined) {
    return null;
  }
  const data = message.data as Record<string, unknown> | null | undefined;
  if (data === null || typeof data !== "object") {
    return null;
  }
  const payload = data.additionalJson;
  switch (data.EVENT) {
    case CALL_ANSWERED_WS_EVENT:
      return isCallAnsweredEvent(payload)
        ? { event: CALL_ANSWERED_WS_EVENT, payload }
        : null;
    case CALL_ON_HOLD_WS_EVENT:
      return isCallOnHoldEvent(payload)
        ? { event: CALL_ON_HOLD_WS_EVENT, payload }
        : null;
    case CALL_RESUMED_WS_EVENT:
      return isCallResumedEvent(payload)
        ? { event: CALL_RESUMED_WS_EVENT, payload }
        : null;
    case CALL_TRANSFERRED_WS_EVENT:
      return isCallTransferredEvent(payload)
        ? { event: CALL_TRANSFERRED_WS_EVENT, payload }
        : null;
    case CALL_ENDED_WS_EVENT:
      return isCallEndedEvent(payload)
        ? { event: CALL_ENDED_WS_EVENT, payload }
        : null;
    case AGENT_STATE_CHANGED_WS_EVENT:
      return isAgentStateChangedEvent(payload)
        ? { event: AGENT_STATE_CHANGED_WS_EVENT, payload }
        : null;
    case CALL_MONITOR_STARTED_WS_EVENT:
      return isCallMonitorStartedEvent(payload)
        ? { event: CALL_MONITOR_STARTED_WS_EVENT, payload }
        : null;
    case CALL_MONITOR_ENDED_WS_EVENT:
      return isCallMonitorEndedEvent(payload)
        ? { event: CALL_MONITOR_ENDED_WS_EVENT, payload }
        : null;
    default:
      return null;
  }
}
