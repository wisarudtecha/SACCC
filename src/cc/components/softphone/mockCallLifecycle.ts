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
//   window.mockCall.dial("0811223344")            // outbound connect (make-call stand-in)
//   window.mockCall.hold() / .resume()
//   window.mockCall.transfer("agent-202")
//   window.mockCall.end("abandoned")
//   window.mockCall.agentState("break")
//
// Supervisor monitoring (docs/Supervisor-Call-Control-Command-Contract.md;
// second persona MOCK_SUPERVISOR_ID stands in for the supervisor, so per-
// agent targeting — agent badge vs supervisor session strip — is
// demonstrable from one console):
//
//   window.mockCall.monitorListen()               // CALL_MONITOR_STARTED (listen) on the current leg
//   window.mockCall.monitorListen("mock-leg-…")   // …or an explicit leg
//   window.mockCall.monitorWhisper()              // escalation pair: ENDED(escalated) + STARTED(whisper)
//   window.mockCall.monitorBarge()
//   window.mockCall.monitorStop()
//
// `dial` is the stand-in for the make-call command contract
// (docs/Make-Call-Command-Contract.md): it returns the new leg's callId — the
// correlation key a real adapter's POST /call-control/calls response would
// carry (its §3.2) — and immediately emits the outbound connect
// (`CALL_ANSWERED`, per its §4: never CALL_INCOMING; the softphone renders the
// leg without a prior ring, lifecycle contract §6.4).
import type { WebSocketMessage } from "@/core/components/websocket/websocket";
import { DEV_CONFIG } from "@/core/utils/constants";
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
  type CallMonitorEndedEvent,
  type CallMonitorStartedEvent,
} from "../../types/callEvents";

/** Agent id the mock events claim to concern. */
const MOCK_AGENT_ID = "mock-agent";

/**
 * Supervisor persona for the mock monitoring commands — a *second* mock user
 * so the dual-targeted monitor events carry a supervisorId distinct from the
 * monitored agent (command contract §5.1; lifecycle contract §6.1).
 */
export const MOCK_SUPERVISOR_ID = "mock-supervisor";

let mockLegCounter = 0;

function nextMockLegId(prefix = "mock-leg"): string {
  mockLegCounter += 1;
  return `${prefix}-${Date.now().toString(36)}-${mockLegCounter}`;
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
  ani?: string;
}

/** Monitor modes the mock supervisor commands can drive (canonical values). */
export type MockMonitorMode = "listen" | "whisper" | "barge";

/** Monitor commands — one per supervisor command-contract operation. */
export type MockMonitorCommand = MockMonitorMode | "stop";

/** The mock supervisor's monitor session state, as tracked between commands. */
export interface MockMonitorSessionState {
  /** Leg being monitored. */
  callId: string;
  /** Agent the leg belongs to (kept so implicit stops emit the right agentId). */
  agentId: string;
  /** Current mode. */
  mode: MockMonitorMode;
}

/** Result of planning a mock monitor command: the events to emit + next state. */
export interface MockMonitorPlan {
  events: CallLifecycleEvent[];
  /** Session state after the command (null = no active session). */
  next: MockMonitorSessionState | null;
}

/**
 * Pure planner for the mock monitor commands — the exact event sequence a
 * real adapter would publish per the command contract §4.1 and lifecycle
 * contract §6.5 (kept pure so it is unit-testable in the node Vitest setup,
 * same discipline as `softphoneCallState.ts`):
 *
 *   - start (no session on the leg)      → STARTED(mode)
 *   - re-issue of the current mode       → no events (idempotent, contract §4.3)
 *   - escalate/de-escalate on the leg    → ENDED(reason "escalated") + STARTED(new mode)
 *   - stop                               → ENDED(reason "stopped")
 *   - stop with no session on the leg    → no events (real backend: business
 *                                          rejection; the mock keeps the demo simple)
 *   - command for a different leg while
 *     another is monitored               → implicit ENDED("stopped") for the old
 *                                          leg, then STARTED for the new one
 */
export function planMockMonitorEvents(input: {
  command: MockMonitorCommand;
  /** Leg to monitor (or stop monitoring). */
  callId: string;
  /** Agent the monitored leg belongs to (payload `agentId`). */
  agentId: string;
  /** Supervisor issuing the command (payload `supervisorId`). */
  supervisorId: string;
  /** Session state before the command, or null. */
  current: MockMonitorSessionState | null;
  /** ISO timestamp stamped on every emitted event. */
  timestamp: string;
}): MockMonitorPlan {
  const { command, callId, agentId, supervisorId, current, timestamp } = input;

  const started = (mode: MockMonitorMode): CallLifecycleEvent => ({
    event: CALL_MONITOR_STARTED_WS_EVENT,
    payload: { callId, agentId, supervisorId, mode, timestamp } satisfies CallMonitorStartedEvent,
  });
  const ended = (
    target: MockMonitorSessionState,
    reason: CallMonitorEndedEvent["reason"]
  ): CallLifecycleEvent => ({
    event: CALL_MONITOR_ENDED_WS_EVENT,
    payload: {
      callId: target.callId,
      agentId: target.agentId,
      supervisorId,
      mode: target.mode,
      reason,
      timestamp,
    } satisfies CallMonitorEndedEvent,
  });

  if (command === "stop") {
    if (current === null || current.callId !== callId) {
      return { events: [], next: current };
    }
    return { events: [ended(current, "stopped")], next: null };
  }

  const mode = command;
  if (current !== null && current.callId === callId) {
    if (current.mode === mode) {
      // Idempotent re-issue of the current mode (command contract §4.3).
      return { events: [], next: current };
    }
    return {
      events: [ended(current, "escalated"), started(mode)],
      next: { callId, agentId, mode },
    };
  }

  const events: CallLifecycleEvent[] = [];
  if (current !== null) {
    // One mock supervisor persona monitors one leg at a time — switching
    // legs implicitly stops the previous session (its leg keeps running).
    events.push(ended(current, "stopped"));
  }
  events.push(started(mode));
  return { events, next: { callId, agentId, mode } };
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
  /**
   * Outbound dial (make-call command stand-in, contract
   * docs/Make-Call-Command-Contract.md §4): emits CALL_ANSWERED — the
   * outbound connect — for a fresh leg, makes it the toolbar's current call,
   * and returns the new callId (the response correlation key). The wire
   * payload carries no destination field: the lifecycle event schema is
   * unchanged.
   */
  dial(destination: string): string;
  /** Emits CALL_ON_HOLD for the active mock call. */
  hold(): void;
  /** Emits CALL_RESUMED for the held mock call. */
  resume(): void;
  /** Emits CALL_TRANSFERRED to `toAgentId` (default "mock-agent-2"). */
  transfer(toAgentId?: string): void;
  /**
   * Emits CALL_ENDED with `endReason` (default "completed"). Optional
   * `callId` targets a specific leg — the supervisor force-terminate demo
   * ends another agent's leg this way; default is the most recent call.
   */
  end(endReason?: string, callId?: string): void;
  /** Emits AGENT_STATE_CHANGED for the mock agent. */
  agentState(state: string): void;
  /**
   * Supervisor monitor commands (command contract §3.1): each emits the
   * `CALL_MONITOR_*` sequence `planMockMonitorEvents` derives — the demo path
   * for the supervisor roster/action UI. Default target is the most recent
   * `start()`/`dial()` leg; pass the leg id explicitly to target another.
   */
  monitorListen(agentCallId?: string): void;
  monitorWhisper(agentCallId?: string): void;
  monitorBarge(agentCallId?: string): void;
  /** Emits CALL_MONITOR_ENDED (reason "stopped") for the monitored leg. */
  monitorStop(agentCallId?: string): void;
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
  let monitorSession: MockMonitorSessionState | null = null;
  const now = (): string => new Date().toISOString();
  const fire = (event: CallLifecycleEvent): void => {
    emit(buildMockCallLifecycleWsMessage(event));
  };
  const runMonitor = (command: MockMonitorCommand, agentCallId?: string): void => {
    const callId = agentCallId ?? currentCallId;
    if (callId === null || callId === undefined || callId.trim() === "") {
      return;
    }
    const plan = planMockMonitorEvents({
      command,
      callId,
      agentId: MOCK_AGENT_ID,
      supervisorId: MOCK_SUPERVISOR_ID,
      current: monitorSession,
      timestamp: now(),
    });
    for (const event of plan.events) {
      fire(event);
    }
    monitorSession = plan.next;
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
          ani: options?.ani,
          timestamp: now(),
        },
      });
      return currentCallId;
    },
    // The destination is deliberately unused here: the mock stands in for the
    // adapter, which consumes `destination` server-side; the lifecycle event
    // payload itself carries no destination field (schema unchanged).
    dial() {
      currentCallId = nextMockLegId("mock-out");
      fire({
        event: CALL_ANSWERED_WS_EVENT,
        payload: {
          callId: currentCallId,
          agentId: MOCK_AGENT_ID,
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
    end(endReason = "completed", callId) {
      const targetCallId = callId ?? currentCallId;
      if (targetCallId === null) return;
      fire({
        event: CALL_ENDED_WS_EVENT,
        payload: {
          callId: targetCallId,
          agentId: MOCK_AGENT_ID,
          endReason,
          timestamp: now(),
        },
      });
      // CALL_ENDED implies CALL_MONITOR_ENDED for the leg (lifecycle contract
      // §6.5) — clear the mock session without emitting a separate event.
      if (monitorSession?.callId === targetCallId) {
        monitorSession = null;
      }
    },
    agentState(state) {
      fire({
        event: AGENT_STATE_CHANGED_WS_EVENT,
        payload: { agentId: MOCK_AGENT_ID, state, timestamp: now() },
      });
    },
    monitorListen(agentCallId) {
      runMonitor("listen", agentCallId);
    },
    monitorWhisper(agentCallId) {
      runMonitor("whisper", agentCallId);
    },
    monitorBarge(agentCallId) {
      runMonitor("barge", agentCallId);
    },
    monitorStop(agentCallId) {
      runMonitor("stop", agentCallId);
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
 * Installs `window.mockCall` for manual testing in dev + mock mode. The page
 * that mounts last wins (softphone and supervision pages each own an
 * instance); cleanup only removes the util if it is still *this* instance —
 * a co-mounting page's util must survive another page's unmount. Returns a
 * cleanup function.
 */
export function attachMockCallConsoleUtil(
  controls: MockCallControls
): () => void {
  if (!isMockCallLifecycleActive()) {
    return () => undefined;
  }
  window.mockCall = controls;
  return () => {
    if (window.mockCall === controls) {
      delete window.mockCall;
    }
  };
}
