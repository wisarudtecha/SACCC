// Deterministic stand-in for the not-yet-built 3CX backend adapter: the
// "CALL_INCOMING" websocket event (contract in `src/cc/types/incomingCall.ts`).
//
// Used ONLY in dev / when VITE_MOCK_API="true". It exists so the screen-pop
// card, the caller resolution, the recent-case list, and the Create Case
// prefill can be built and demoed end-to-end before the backend adapter
// exists. It is NOT wired to any live telephony data and MUST NOT be imported
// by production code paths — the emitter is additionally gated on
// `import.meta.env.DEV` so it tree-shakes out of production builds.
//
// Manual injection (devtools console, dev + mock mode):
//
//   window.emitMockIncomingCall()                                  // unknown caller demo
//   window.emitMockIncomingCall({ ani: "081-234-5678" })           // spaced/dashed national
//   window.emitMockIncomingCall({ customerId: "42" })              // backend-resolved customer
//   window.emitMockIncomingCall({ callId: "x" }); twice            // dedupe demo
import type { WebSocketMessage } from "@/core/components/websocket/websocket";
import { DEV_CONFIG } from "@/core/utils/constants";
import { CALL_INCOMING_WS_EVENT, type IncomingCallEvent } from "../../types/incomingCall";

/** Dev-only ANI the auto-demo fires when the caller supplies nothing else. */
const MOCK_DEMO_ANI = "+66811223344";

/** Delay before the one-shot login demo call fires. */
const MOCK_DEMO_DELAY_MS = 8_000;

let mockCallCounter = 0;

function nextMockCallId(): string {
  mockCallCounter += 1;
  return `mock-call-${Date.now().toString(36)}-${mockCallCounter}`;
}

/** Builds a complete mock event from user-supplied partials. */
function buildMockIncomingCallEvent(partial?: Partial<IncomingCallEvent>): IncomingCallEvent {
  return {
    callId: partial?.callId ?? nextMockCallId(),
    ani: partial?.ani ?? MOCK_DEMO_ANI,
    customerId: partial?.customerId,
    caseId: partial?.caseId,
    agentId: partial?.agentId,
    timestamp: new Date().toISOString(),
  };
}

/** Wraps an incoming-call event in the websocket envelope the provider dispatches. */
export function buildMockIncomingCallWsMessage(event: IncomingCallEvent): WebSocketMessage {
  return {
    type: "notification",
    timestamp: Date.now(),
    data: {
      EVENT: CALL_INCOMING_WS_EVENT,
      additionalJson: { ...event },
    },
  };
}

/**
 * Dev-only one-shot demo: fires a single unknown-caller event a few seconds
 * after mount so the screen pop is discoverable without reading any docs.
 * Returns a stop function. No-op outside `import.meta.env.DEV` (the constant
 * condition lets Vite tree-shake the whole emitter out of production).
 */
export function startMockIncomingCallEmitter(
  onEvent: (message: WebSocketMessage) => void
): () => void {
  if (!import.meta.env.DEV || !DEV_CONFIG.MOCK_API) {
    return () => undefined;
  }
  const timeout = setTimeout(() => {
    onEvent(buildMockIncomingCallWsMessage(buildMockIncomingCallEvent()));
  }, MOCK_DEMO_DELAY_MS);
  return () => {
    clearTimeout(timeout);
  };
}

declare global {
  interface Window {
    /** Dev/mock-mode only — installed by `attachMockIncomingCallConsoleUtil`. */
    emitMockIncomingCall?: (partial?: Partial<IncomingCallEvent>) => string;
  }
}

/**
 * Installs `window.emitMockIncomingCall(partial?)` for manual testing in
 * dev + mock mode. Returns a cleanup function that removes it. The return
 * value is the generated callId, so callers can re-fire the same id to
 * exercise the dedupe path.
 */
export function attachMockIncomingCallConsoleUtil(
  onEvent: (message: WebSocketMessage) => void
): () => void {
  if (!import.meta.env.DEV || !DEV_CONFIG.MOCK_API) {
    return () => undefined;
  }
  window.emitMockIncomingCall = (partial?: Partial<IncomingCallEvent>): string => {
    const event = buildMockIncomingCallEvent(partial);
    onEvent(buildMockIncomingCallWsMessage(event));
    return event.callId;
  };
  return () => {
    delete window.emitMockIncomingCall;
  };
}
