// Session-spanning callId memory for the incoming-call screen pop.
//
// Why it exists: the backend may redeliver `CALL_INCOMING` after a websocket
// reconnect (contract §5.2 — redelivery must be safe). The reducer-level
// dedupe only covers *active* cards; once a card is dismissed or expired it
// leaves the queue, so without a session-scoped memory a redelivery would
// resurrect it. This module owns that memory, capped so a long shift cannot
// grow it without bound (oldest id evicted first).
//
// Extracted from `useIncomingCallPopups.ts` as a pure module so the eviction
// semantics are unit-testable — the hook itself has no DOM-free test harness.
// Pure functions/state only — no React imports.

/** Seen-callId memory cap — bounds the dedupe set in long-lived sessions. */
export const CALL_ID_DEDUPE_MAX = 100;

export interface SeenCallIds {
  /** True when the callId was already seen this session. */
  has(callId: string): boolean;
  /**
   * Records a callId. Mirrors the hook's original order exactly: an already-
   * seen id is a no-op, and when the memory is full the oldest id is evicted
   * *before* the new one is added, so the size never exceeds the cap.
   */
  add(callId: string): void;
  /** Current number of remembered ids (tests/diagnostics). */
  readonly size: number;
}

export function createSeenCallIds(max: number = CALL_ID_DEDUPE_MAX): SeenCallIds {
  const ids = new Set<string>();
  return {
    has: (callId: string) => ids.has(callId),
    add: (callId: string) => {
      if (ids.has(callId)) {
        return;
      }
      if (ids.size >= max) {
        const oldest = ids.values().next().value;
        if (oldest !== undefined) {
          ids.delete(oldest);
        }
      }
      ids.add(callId);
    },
    get size() {
      return ids.size;
    },
  };
}
