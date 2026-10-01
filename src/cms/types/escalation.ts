// SLA breach escalation domain types (CAD-FE-SLA-Breach-Escalation).
//
// ─────────────────────────────────────────────────────────────────────────────
// BACKEND CONTRACT — READ BEFORE WIRING TO A LIVE ENDPOINT
// ─────────────────────────────────────────────────────────────────────────────
// No endpoint or websocket event in this repo today answers "this case breached
// (or is about to breach) its SLA" — the SLA clock exists only as the
// client-computed countdown in `countDownSla.tsx`. Breach detection is a backend
// responsibility (CAD assumption A1: FE-side timers die when the browser
// closes). This ticket needs, from the backend:
//
//   1. Websocket event, one per escalation level per case (idempotent):
//
//        EVENT: "SLA-ESCALATION"
//        additionalJson: SlaEscalationEvent   // see below
//
//      delivered over the existing notifications socket
//      (`/api/v1/notifications/register`, see `core/components/websocket`).
//
//   2. Escalation records per case + org-wide open list:
//
//        GET /cases/{caseId}/escalations      -> ApiResponse<EscalationRecord[]>
//        GET /organizations/{orgId}/escalations?status=open
//                                             -> ApiResponse<EscalationRecord[]>
//
//   3. Acknowledge:
//
//        POST /cases/{caseId}/escalations/{escalationId}/ack
//                                             -> ApiResponse<EscalationRecord>
//
//   4. Escalation rule configuration (per SLA policy, role-based recipient):
//
//        GET   /organizations/{orgId}/escalation-rules
//                                             -> ApiResponse<OrgEscalationRuleSettings>
//        PATCH /organizations/{orgId}/escalation-rules
//              body: OrgEscalationRulesUpdateData
//                                             -> ApiResponse<OrgEscalationRuleSettings>
//
// The FE is built against `escalationRulesStub.ts` + `mockEscalationEvents.ts`
// (VITE_MOCK_API="true") until these land. Server timestamps (`occurredAt`,
// `slaDueAt`) are the source of truth — the client clock only animates
// countdowns (clock-skew mitigation, CAD risk table).
//
// GraphQL: if an environment runs with VITE_USE_GRAPHQL="true", the REST urls
// need matching entries in a `graphql/*Queries.ts` file and in `GQL_MAP`
// (`src/core/utils/gqlMapper.ts`) — there is no REST fallback once GraphQL is
// enabled. See CLAUDE.md → "Hybrid REST/GraphQL query layer".
// ─────────────────────────────────────────────────────────────────────────────

/** Escalation event severity: pre-breach warning (e.g. 80% of SLA) or breach (100%). */
export type SlaEscalationEventType = "warning" | "breach";

/** Visual SLA state rendered by countdowns, case lists and the SLA monitor widget. */
export type SlaVisualState = "normal" | "warning" | "breached";

/** Lifecycle of one escalation record. MVP clears on acknowledge or case resolve. */
export type EscalationStatus = "open" | "acknowledged" | "resolved";

/**
 * Websocket payload for `EVENT: "SLA-ESCALATION"` (carried in
 * `message.data.additionalJson`, same envelope as CASE-CREATE / CASE-UPDATE).
 * One event per (caseId, level) — the FE dedupes on that pair.
 */
export interface SlaEscalationEvent {
  /** Backend idempotency key; unique per (caseId, level, type). */
  eventId: string;
  caseId: string;
  /** Human-facing case number for the notification body, if cheap to supply. */
  caseNumber?: string;
  /** Escalation level; MVP is single-level (always 1). */
  level: number;
  type: SlaEscalationEventType;
  /** Role-based recipient (CAD decision 3: roles, not named users). */
  targetRole: string;
  /** ISO timestamp the event occurred (server clock). */
  occurredAt: string;
  /** ISO timestamp the SLA target expires (server clock). */
  slaDueAt: string;
}

/** A persisted escalation, shown in the case timeline and the open-breach list. */
export interface EscalationRecord {
  /** Escalation id (`eid` in the ack endpoint path). */
  id: string;
  caseId: string;
  caseNumber?: string;
  level: number;
  type: SlaEscalationEventType;
  targetRole: string;
  /** ISO timestamp the escalation fired (server clock). */
  occurredAt: string;
  /** ISO timestamp the SLA target expired / expires (server clock). */
  slaDueAt: string;
  status: EscalationStatus;
  acknowledgedBy?: string | null;
  acknowledgedAt?: string | null;
}

/**
 * One escalation rule bound to an SLA policy. MVP fields only (CAD decisions
 * 3-4): warning threshold %, role-based recipient, on/off.
 */
export interface EscalationRule {
  /** SLA policy identifier the rule applies to. */
  policyId: string;
  /** Display name, if the backend can supply it cheaply. Display-only. */
  policyName?: string;
  enabled: boolean;
  /** Percent of the SLA window at which a pre-breach warning fires (1-99). Default 80. */
  warningThresholdPct: number;
  /** Role that receives the escalation (e.g. "Supervisor"). */
  targetRole: string;
}

/** Partial PATCH body for the escalation-rules endpoint. */
export interface OrgEscalationRulesUpdateData {
  rules?: EscalationRule[];
}

/** GET / PATCH response `data` — always fully populated. */
export interface OrgEscalationRuleSettings {
  orgId: string;
  rules: EscalationRule[];
  updatedAt?: string;
  updatedBy?: string | null;
}

const ESCALATION_EVENT_TYPES: readonly SlaEscalationEventType[] = ["warning", "breach"];
const ESCALATION_STATUSES: readonly EscalationStatus[] = ["open", "acknowledged", "resolved"];

/** True when `value` is the websocket escalation payload shape. */
export function isSlaEscalationEvent(value: unknown): value is SlaEscalationEvent {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.eventId === "string" &&
    typeof candidate.caseId === "string" &&
    typeof candidate.level === "number" &&
    ESCALATION_EVENT_TYPES.includes(candidate.type as SlaEscalationEventType) &&
    typeof candidate.targetRole === "string" &&
    typeof candidate.occurredAt === "string" &&
    typeof candidate.slaDueAt === "string"
  );
}

/** True when `value` is one persisted escalation record. */
export function isEscalationRecord(value: unknown): value is EscalationRecord {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.id === "string" &&
    typeof candidate.caseId === "string" &&
    typeof candidate.level === "number" &&
    ESCALATION_EVENT_TYPES.includes(candidate.type as SlaEscalationEventType) &&
    typeof candidate.targetRole === "string" &&
    typeof candidate.occurredAt === "string" &&
    typeof candidate.slaDueAt === "string" &&
    ESCALATION_STATUSES.includes(candidate.status as EscalationStatus)
  );
}

/** True when `value` is the escalation-list payload shape. */
export function isEscalationRecordArray(value: unknown): value is EscalationRecord[] {
  return Array.isArray(value) && value.every(isEscalationRecord);
}

function isEscalationRule(value: unknown): value is EscalationRule {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.policyId === "string" &&
    typeof candidate.enabled === "boolean" &&
    typeof candidate.warningThresholdPct === "number" &&
    typeof candidate.targetRole === "string"
  );
}

/** True when `value` is the escalation-rules settings payload shape. */
export function isOrgEscalationRuleSettings(
  value: unknown
): value is OrgEscalationRuleSettings {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.orgId === "string" &&
    Array.isArray(candidate.rules) &&
    candidate.rules.every(isEscalationRule)
  );
}
