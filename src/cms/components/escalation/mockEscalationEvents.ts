// Deterministic stand-in for the not-yet-built SLA breach backend: the
// "SLA-ESCALATION" websocket event, the per-case escalation list, the org-wide
// open-breach list, and the acknowledge endpoint (contract in
// `src/cms/types/escalation.ts`).
//
// Used ONLY in dev / when VITE_MOCK_API="true". It exists so the SLA warning /
// breach visual states, the `sla.escalation` notification, the case-timeline
// escalation entries with Acknowledge, and the SLA monitor widget can be built
// and demoed end-to-end before the backend scheduler exists. It is NOT wired
// to any live data and MUST NOT be imported by production code paths — the
// emitter is additionally gated on `import.meta.env.DEV` so it tree-shakes out
// of production builds.
//
// Escalation records live in a session-scoped in-memory store, so an
// Acknowledge inside mock mode persists for the rest of the session and the
// open-breach list shrinks accordingly. Record derivation is a pure function
// of the case id (djb2 hash, same trick as unitWorkloadStub.ts), so a given
// case shows the same escalation history on every visit.
import type { WebSocketMessage } from "@/core/components/websocket/websocket";
import type {
  EscalationRecord,
  SlaEscalationEvent,
  SlaEscalationEventType,
} from "@/cms/types/escalation";
import {
  DEFAULT_ESCALATION_TARGET_ROLE,
  DEFAULT_WARNING_THRESHOLD_PCT,
} from "@/cms/utils/escalationRules";

/** Websocket `message.data.EVENT` value for escalation events (CAD contract). */
export const SLA_ESCALATION_WS_EVENT = "SLA-ESCALATION";

/** Demo case set shared by the mock emitter and the SLA monitor widget. */
export const MOCK_ESCALATION_CASE_IDS: readonly string[] = [
  "SLA-DEMO-1001",
  "SLA-DEMO-1002",
  "SLA-DEMO-1003",
  "SLA-DEMO-1004",
  "SLA-DEMO-1005",
];

/** Small, fast string hash (djb2). Stable across sessions and machines. */
function hashString(input: string): number {
  let hash = 5381;
  for (let index = 0; index < input.length; index += 1) {
    hash = (hash * 33) ^ input.charCodeAt(index);
  }
  // >>> 0 folds it back into an unsigned 32-bit int.
  return hash >>> 0;
}

const MINUTE_MS = 60 * 1000;

const store = new Map<string, EscalationRecord>();

function escalationKey(caseId: string, level: number, type: SlaEscalationEventType): string {
  return `${caseId}:${level}:${type}`;
}

/**
 * Builds the deterministic escalation record for a (caseId, level, type) triple.
 * `slaDueAt` sits a hash-derived distance in the past so demo cases look
 * breached; warnings sit proportionally earlier than breaches.
 */
function buildStubEscalationRecord(
  caseId: string,
  level: number,
  type: SlaEscalationEventType
): EscalationRecord {
  const seed = hashString(escalationKey(caseId, level, type));
  const caseSeed = hashString(caseId);
  const slaWindowMin = 30 + (caseSeed % 450);
  const occurredOffsetMin =
    type === "breach"
      ? Math.round((slaWindowMin * DEFAULT_WARNING_THRESHOLD_PCT) / 100) - slaWindowMin - (seed % 20)
      : Math.round((slaWindowMin * DEFAULT_WARNING_THRESHOLD_PCT) / 100) - slaWindowMin;
  const slaDueAt = new Date(Date.now() + occurredOffsetMin * MINUTE_MS + (seed % 15) * MINUTE_MS);
  const occurredAt = new Date(slaDueAt.getTime() - (5 + (seed % 25)) * MINUTE_MS);
  return {
    id: `ESC-${seed.toString(36).toUpperCase()}`,
    caseId,
    caseNumber: `CASE-${(caseSeed % 900000) + 100000}`,
    level,
    type,
    targetRole: DEFAULT_ESCALATION_TARGET_ROLE,
    occurredAt: occurredAt.toISOString(),
    slaDueAt: slaDueAt.toISOString(),
    status: "open",
    acknowledgedBy: null,
    acknowledgedAt: null,
  };
}

function getOrSeedRecord(
  caseId: string,
  level: number,
  type: SlaEscalationEventType
): EscalationRecord {
  const key = escalationKey(caseId, level, type);
  const existing = store.get(key);
  if (existing) {
    return existing;
  }
  const seeded = buildStubEscalationRecord(caseId, level, type);
  store.set(key, seeded);
  return seeded;
}

/** Mirrors GET /cases/{caseId}/escalations: deterministic history for one case. */
export function readCaseEscalationsStub(caseId: string): EscalationRecord[] {
  const records = [
    getOrSeedRecord(caseId, 1, "warning"),
    getOrSeedRecord(caseId, 1, "breach"),
  ];
  return [...records].sort((a, b) => a.occurredAt.localeCompare(b.occurredAt));
}

/** Mirrors GET /organizations/{orgId}/escalations?status=open for the given cases. */
export function readOpenEscalationsStub(caseIds: readonly string[]): EscalationRecord[] {
  return caseIds
    .flatMap((caseId) => readCaseEscalationsStub(caseId))
    .filter((record) => record.status === "open");
}

/**
 * Same open-escalation list expressed as websocket events — used by the
 * reconnect-refetch path to replay whatever fired while the socket was down.
 */
export function readOpenEscalationEventsStub(caseIds: readonly string[]): SlaEscalationEvent[] {
  return readOpenEscalationsStub(caseIds).map(toEscalationEvent);
}

/**
 * Mirrors POST /cases/{caseId}/escalations/{escalationId}/ack: marks the stored
 * record acknowledged and returns the updated copy. Unknown ids resolve to
 * null so callers can surface an error state.
 */
export function acknowledgeEscalationStub(
  caseId: string,
  escalationId: string,
  acknowledgedBy: string
): EscalationRecord | null {
  const record = readCaseEscalationsStub(caseId).find((entry) => entry.id === escalationId);
  if (!record) {
    return null;
  }
  const updated: EscalationRecord = {
    ...record,
    status: "acknowledged",
    acknowledgedBy,
    acknowledgedAt: new Date().toISOString(),
  };
  store.set(escalationKey(caseId, record.level, record.type), updated);
  return updated;
}

/** Wraps an escalation event in the websocket envelope the provider dispatches. */
export function buildMockEscalationWsMessage(event: SlaEscalationEvent): WebSocketMessage {
  return {
    type: "notification",
    timestamp: Date.now(),
    data: {
      EVENT: SLA_ESCALATION_WS_EVENT,
      additionalJson: { ...event },
    },
  };
}

function toEscalationEvent(record: EscalationRecord): SlaEscalationEvent {
  return {
    eventId: record.id,
    caseId: record.caseId,
    caseNumber: record.caseNumber,
    level: record.level,
    type: record.type,
    targetRole: record.targetRole,
    occurredAt: record.occurredAt,
    slaDueAt: record.slaDueAt,
  };
}

/**
 * Dev-only mock emitter: replays the deterministic warning then breach event
 * for each given case through the same handler the real websocket feeds, on a
 * short staggered timer. Returns a stop function. No-op outside
 * `import.meta.env.DEV`, and the constant condition lets Vite tree-shake the
 * whole emitter out of production builds.
 */
export function startMockEscalationEmitter(
  caseIds: readonly string[],
  onEvent: (message: WebSocketMessage) => void
): () => void {
  if (!import.meta.env.DEV) {
    return () => undefined;
  }
  const timeouts: ReturnType<typeof setTimeout>[] = [];
  caseIds.forEach((caseId, index) => {
    const warning = getOrSeedRecord(caseId, 1, "warning");
    const breach = getOrSeedRecord(caseId, 1, "breach");
    timeouts.push(
      setTimeout(() => onEvent(buildMockEscalationWsMessage(toEscalationEvent(warning))), (index + 1) * 3000),
      setTimeout(() => onEvent(buildMockEscalationWsMessage(toEscalationEvent(breach))), (index + 1) * 6000)
    );
  });
  return () => {
    timeouts.forEach(clearTimeout);
  };
}
