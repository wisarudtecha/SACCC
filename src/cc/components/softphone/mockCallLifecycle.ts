// Deterministic stand-in for the not-yet-built 3CX backend adapter's
// call-lifecycle + agent-state events (contract in
// `src/cc/types/callEvents.ts`, wire spec in
// `docs/CALL-Lifecycle-Websocket-Event-Contract.md`).
//
// Used ONLY in dev / when VITE_MOCK_API="true" — same gating discipline as
// `incomingCall/mockIncomingCallEmitter.ts`: imported unconditionally, but
// every function no-ops outside `import.meta.env.DEV` + mock mode so Vite's
// constant folding tree-shakes the whole module out of production builds.
//
// Manual injection (devtools console, dev + mock mode), all operating on the
// most recent mock call:
//
//   window.mockCall.start()                       // CALL_ANSWERED with a fresh callId
//   window.mockCall.start({ customerId: "42" })   // with backend-resolved linkage
//   window.mockCall.hold() / .resume()
//   window.mockCall.transfer("agent-202")
//   window.mockCall.end("abandoned")
//   window.mockCall.agentState("break")
import type { WebSocketMessage } from "@/core/components/websocket/websocket";
import { DEV_CONFIG } from "@/core/utils/constants";
import {
  AGENT_STATE_CHANGED_WS_EVENT,
  CALL_ANSWERED_WS_EVENT,
  CALL_ENDED_WS_EVENT,
  CALL_ON_HOLD_WS_EVENT,
  CALL_RESUMED_WS_EVENT,
  CALL_TRANSFERRED_WS_EVENT,
  type CallLifecycleEvent,
} from "../../types/callEvents";

/** Agent id the mock events claim to concern. */
const MOCK_AGENT_ID = "mock-agent";

let mockLegCounter = 0;

function nextMockLegId(): string {
  mockLegCounter += 1;
  return `mock-leg-${Date.now().toString(36)}-${mockLegCounter}`;
}

/** Wraps a lifecycle event in the websocket envelope the provider dispatches. */
export function buildMockCallLifecycleWsMessage(
  event: CallLifecycleEvent
): WebSocketMessage {
  return {
    type: "notification",
    timestamp: Date.now(),
    data: {
      EVENT: event.event,
      additionalJson: { ...event.payload },
    },
  };
}

/** True when the dev-only mock is active (constant-folded out of prod). */
export function isMockCallLifecycleActive(): boolean {
  return import.meta.env.DEV && DEV_CONFIG.MOCK_API;
}

export interface MockCallStartOptions {
  customerId?: string;
  caseId?: string;
}

/**
 * Call-control commands for the mock lifecycle. Each command emits the
 * lifecycle event a real 3CX adapter would publish after the corresponding
 * Call Control REST operation succeeds — so the softphone's demo path is its
 * production event path. All commands target the most recent `start()` call.
 */
export interface MockCallControls {
  /** Emits CALL_ANSWERED for a fresh call leg; returns the new callId. */
  start(options?: MockCallStartOptions): string;
  /** Emits CALL_ON_HOLD for the active mock call. */
  hold(): void;
  /** Emits CALL_RESUMED for the held mock call. */
  resume(): void;
  /** Emits CALL_TRANSFERRED to `toAgentId` (default "mock-agent-2"). */
  transfer(toAgentId?: string): void;
  /** Emits CALL_ENDED with `endReason` (default "completed"). */
  end(endReason?: string): void;
  /** Emits AGENT_STATE_CHANGED for the mock agent. */
  agentState(state: string): void;
}

/**
 * Creates mock call controls emitting through `emit`. Returns null outside
 * dev + mock mode (constant condition — tree-shaken from production).
 */
export function createMockCallControls(
  emit: (message: WebSocketMessage) => void
): MockCallControls | null {
  if (!isMockCallLifecycleActive()) {
    return null;
  }
  let currentCallId: string | null = null;
  const now = (): string => new Date().toISOString();
  const fire = (event: CallLifecycleEvent): void => {
    emit(buildMockCallLifecycleWsMessage(event));
  };
  return {
    start(options) {
      currentCallId = nextMockLegId();
      fire({
        event: CALL_ANSWERED_WS_EVENT,
        payload: {
          callId: currentCallId,
          agentId: MOCK_AGENT_ID,
          customerId: options?.customerId,
          caseId: options?.caseId,
          timestamp: now(),
        },
      });
      return currentCallId;
    },
    hold() {
      if (currentCallId === null) return;
      fire({
        event: CALL_ON_HOLD_WS_EVENT,
        payload: { callId: currentCallId, agentId: MOCK_AGENT_ID, timestamp: now() },
      });
    },
    resume() {
      if (currentCallId === null) return;
      fire({
        event: CALL_RESUMED_WS_EVENT,
        payload: { callId: currentCallId, agentId: MOCK_AGENT_ID, timestamp: now() },
      });
    },
    transfer(toAgentId = "mock-agent-2") {
      if (currentCallId === null) return;
      fire({
        event: CALL_TRANSFERRED_WS_EVENT,
        payload: {
          callId: currentCallId,
          fromAgentId: MOCK_AGENT_ID,
          toAgentId,
          timestamp: now(),
        },
      });
    },
    end(endReason = "completed") {
      if (currentCallId === null) return;
      fire({
        event: CALL_ENDED_WS_EVENT,
        payload: {
          callId: currentCallId,
          agentId: MOCK_AGENT_ID,
          endReason,
          timestamp: now(),
        },
      });
    },
    agentState(state) {
      fire({
        event: AGENT_STATE_CHANGED_WS_EVENT,
        payload: { agentId: MOCK_AGENT_ID, state, timestamp: now() },
      });
    },
  };
}

declare global {
  interface Window {
    /** Dev/mock-mode only — installed by `attachMockCallConsoleUtil`. */
    mockCall?: MockCallControls;
  }
}

/**
 * Installs `window.mockCall` for manual testing in dev + mock mode. Shares
 * the controls instance created by the softphone hook so console commands
 * and toolbar buttons drive the same mock call. Returns a cleanup function.
 */
export function attachMockCallConsoleUtil(
  controls: MockCallControls
): () => void {
  if (!isMockCallLifecycleActive()) {
    return () => undefined;
  }
  window.mockCall = controls;
  return () => {
    delete window.mockCall;
  };
}
