// src/cms/components/mention/mentionEvent.ts
// Transient, per-agent websocket push fired when another user @mentions you in a
// case comment (Option A - no notification-center persistence on the backend, so
// the frontend bell is the only durable-ish surface). Contract: welcome-case
// docs/events/mention-event-contract.md.
export const MENTION_WS_EVENT = "MENTION";

export interface MentionEvent {
  EVENT: typeof MENTION_WS_EVENT;
  orgId: string;
  caseId: string;
  /** Stringified bigserial (tix_case_history_events.id). Live payloads carry
   * numeric strings (e.g. "227294"), not the UUIDs the contract doc claims. */
  commentId: string;
  /** Numeric string in live payloads - treat as opaque. */
  mentionedByUserId: string;
  mentionedByUsername: string;
  mentionedByDisplayName: string;
  /** Numeric string in live payloads - treat as opaque. */
  mentionedUserId: string;
  mentionedUsername: string;
  timestamp: string;
}

export const isMentionEvent = (data: unknown): data is MentionEvent => {
  if (typeof data !== "object" || data === null) {
    return false;
  }
  const candidate = data as Record<string, unknown>;
  return (
    candidate.EVENT === MENTION_WS_EVENT &&
    typeof candidate.caseId === "string" &&
    candidate.caseId !== ""
  );
};