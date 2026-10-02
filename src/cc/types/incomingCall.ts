// Incoming-call screen pop domain types (FE Incoming Call Screen Pop / 3CX).
//
// ─────────────────────────────────────────────────────────────────────────────
// BACKEND CONTRACT — READ BEFORE WIRING TO A LIVE ENDPOINT
// ─────────────────────────────────────────────────────────────────────────────
// Full wire-level contract (targeting, idempotency, validation table, test
// vectors, open questions): docs/CALL_INCOMING-Websocket-Event-Contract.md —
// keep this file and that document in sync when the contract changes.
//
// No websocket event in this repo today announces an incoming call — the 3CX
// integration adapter lives on the backend and is not built yet (see
// `docs/3CX-Integration-Capability-Matrix.md` §4 "Custom CRM / Case screen
// pop" and Decision 4: the FE must consume a *normalized internal* event
// model, never raw 3CX payloads). This ticket needs, from the backend:
//
//   1. Websocket event, one per incoming call leg (idempotent per callId):
//
//        EVENT: "CALL_INCOMING"
//        additionalJson: IncomingCallEvent   // see below
//
//      delivered over the existing notifications socket
//      (`/api/v1/notifications/register`, see `core/components/websocket`).
//      NOTE: optional fields must be OMITTED when unknown — a JSON null for
//      customerId/caseId/agentId fails the guard below and the whole event
//      is silently dropped.
//
// The FE is built against `mockIncomingCallEmitter.ts` (dev +
// VITE_MOCK_API="true") until the adapter lands. When the backend already
// resolved the caller, it sends `customerId`/`caseId` and the FE skips its
// own lookup; otherwise the FE resolves via the existing
// `GET /customer/byPhoneNo/{phoneNo}` and `GET /case/customer/{id}`
// endpoints (both already mapped for GraphQL environments).
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Minimal structural stand-in for `WebSocketMessage`
 * (`core/components/websocket/websocket.tsx`). Declared locally so this
 * contract module stays free of React/provider imports and remains
 * unit-testable in the repo's node-environment Vitest setup.
 */
export interface WebSocketMessageLike {
  data?: unknown;
  timestamp?: number;
  type?: string;
}

/** Websocket `message.data.EVENT` value for the incoming-call screen pop. */
export const CALL_INCOMING_WS_EVENT = "CALL_INCOMING" as const;

/**
 * Normalized internal payload for `EVENT: "CALL_INCOMING"`, carried in
 * `message.data.additionalJson` (same envelope as CASE-CREATE /
 * SLA-ESCALATION), published by the backend 3CX integration adapter.
 * The FE resolves customer + recent cases via existing APIs when the
 * optional ids are absent.
 */
export interface IncomingCallEvent {
  /** Backend idempotency key; unique per call leg. The FE dedupes on this. */
  callId: string;
  /** Raw caller number as delivered (E.164, national, spaced/dashed — FE normalizes). */
  ani: string;
  /** Backend-resolved customer id, when the adapter already matched one. */
  customerId?: string;
  /** Backend-resolved existing case id, when the adapter already linked one. */
  caseId?: string;
  /** Target agent (informational — the socket subscription already routes per-user). */
  agentId?: string;
  /** ISO timestamp of the call event (server clock). */
  timestamp: string;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isOptionalString(value: unknown): boolean {
  return value === undefined || typeof value === "string";
}

/** True when `value` is the incoming-call payload shape. */
export function isIncomingCallEvent(value: unknown): value is IncomingCallEvent {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  return (
    isNonEmptyString(candidate.callId) &&
    isNonEmptyString(candidate.ani) &&
    typeof candidate.timestamp === "string" &&
    isOptionalString(candidate.customerId) &&
    isOptionalString(candidate.caseId) &&
    isOptionalString(candidate.agentId)
  );
}

/**
 * Extracts and validates the incoming-call payload from a raw websocket
 * message. Returns null for anything that is not a well-formed
 * `CALL_INCOMING` event — defensive by design, never throws.
 */
export function parseIncomingCallMessage(
  message: WebSocketMessageLike | null | undefined
): IncomingCallEvent | null {
  if (message === null || message === undefined) {
    return null;
  }
  const data = message.data as Record<string, unknown> | null | undefined;
  if (data === null || typeof data !== "object") {
    return null;
  }
  if (data.EVENT !== CALL_INCOMING_WS_EVENT) {
    return null;
  }
  const payload = data.additionalJson;
  return isIncomingCallEvent(payload) ? payload : null;
}
