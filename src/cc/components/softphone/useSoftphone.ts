// Orchestration for the softphone page: websocket subscription, call-state
// machine, agent presence, and the (mock-only, for now) call-control actions.
//
// Same discipline rules as `useIncomingCallPopups.ts`:
//   1. The `onMessage` subscription registers once for the component's
//      lifetime — `onMessage` is recreated on every WebSocketProvider render.
//   2. Everything state-shaped lives in the pure `softphoneCallState.ts`.
//
// Call control (hold/resume/transfer/hang-up commands) is a backend REST
// concern that does not exist yet (capability-matrix Phase 2 / B4). Until it
// lands, the actions emit the corresponding mock lifecycle events in dev +
// mock mode, and are disabled otherwise — the toolbar's *state* always
// reflects real (or mock) events, only the *commands* are stubbed.
import { useCallback, useEffect, useMemo, useState } from "react";
import { useWebSocket } from "@/core/components/websocket/websocket";
import type { WebSocketMessage } from "@/core/components/websocket/websocket";
import { AGENT_STATE_CHANGED_WS_EVENT, parseCallLifecycleMessage } from "../../types/callEvents";
import type { AgentStateCommand } from "../../types/agentStateCommand";
import {
  attachMockCallConsoleUtil,
  createMockCallControls,
  type MockCallControls,
} from "./mockCallLifecycle";
import {
  selectActiveCall,
  selectLatestEndedCall,
  softphoneCallsReducer,
  type CallSession,
  type SoftphoneCalls,
} from "./softphoneCallState";

/** Call-control commands the toolbar offers. No-ops until the backend lands. */
export interface SoftphoneControls {
  hold: () => void;
  resume: () => void;
  transfer: () => void;
  hangUp: () => void;
  /** Requests an agent presence change (command contract: docs/Agent-State-Command-Contract.md). */
  setAgentState: (state: AgentStateCommand) => void;
  /**
   * Dials `destination` (make-call command contract:
   * docs/Make-Call-Command-Contract.md). Returns the new leg's `callId` — the
   * correlation key from the command response — or null when the command is
   * unavailable (non-mock mode, before the adapter lands). The dialpad uses
   * the callId for its "Calling…/Connected" indicator only; call state itself
   * still arrives exclusively as lifecycle events (contract §4).
   */
  dial: (destination: string) => string | null;
}

export interface SoftphoneApi {
  /** Most recent session that is not over, or null. */
  activeCall: CallSession | null;
  /** Most recently ended session, or null. */
  lastEndedCall: CallSession | null;
  /** Latest agent telephony state, or null before any event. */
  agentState: string | null;
  /** True when call-control commands do something (dev + mock mode only). */
  controlsEnabled: boolean;
  controls: SoftphoneControls;
  /** Dismisses the ended-call notice. */
  clearEnded: (callId: string) => void;
  /** Single entry point for call events — WS subscription and the dev mock. */
  handleMessage: (message: WebSocketMessage) => void;
}

export function useSoftphone(): SoftphoneApi {
  const [calls, setCalls] = useState<SoftphoneCalls>({});
  const [agentState, setAgentState] = useState<string | null>(null);
  const { onMessage } = useWebSocket();

  const handleMessage = useCallback((message: WebSocketMessage) => {
    const event = parseCallLifecycleMessage(message);
    if (event === null) {
      return;
    }
    if (event.event === AGENT_STATE_CHANGED_WS_EVENT) {
      setAgentState(event.payload.state);
      return;
    }
    setCalls((previous) =>
      softphoneCallsReducer(previous, { type: "apply", event })
    );
  }, []);

  // Registered once for the component's lifetime — see discipline note above.
  useEffect(() => {
    const unsubscribe = onMessage(handleMessage);
    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Dev/mock wiring (VITE_MOCK_API + dev only, tree-shaken from production):
  // one controls instance shared by the toolbar buttons and the
  // `window.mockCall` console util.
  const mockControls = useMemo<MockCallControls | null>(
    () => createMockCallControls(handleMessage),
    [handleMessage]
  );
  useEffect(() => {
    if (mockControls === null) {
      return () => undefined;
    }
    return attachMockCallConsoleUtil(mockControls);
  }, [mockControls]);

  const controls = useMemo<SoftphoneControls>(
    () => ({
      hold: () => mockControls?.hold(),
      resume: () => mockControls?.resume(),
      transfer: () => mockControls?.transfer(),
      hangUp: () => mockControls?.end("completed"),
      // Same command/confirm split as the toolbar: the command emits the
      // AGENT_STATE_CHANGED event a real adapter would publish, and the pill
      // above still only moves on the event (contract §4).
      setAgentState: (state) => mockControls?.agentState(state),
      // The mock emits the outbound connect directly (its stand-in for the
      // adapter's "dial accepted" response + CALL_ANSWERED sequence, contract
      // §4). When the adapter lands, this calls `useMakeCallMutation` and
      // returns the response's `data.callId` instead — same shape.
      dial: (destination) => mockControls?.dial(destination) ?? null,
    }),
    [mockControls]
  );

  const clearEnded = useCallback((callId: string) => {
    setCalls((previous) => softphoneCallsReducer(previous, { type: "clearEnded", callId }));
  }, []);

  const activeCall = useMemo(() => selectActiveCall(calls), [calls]);
  const lastEndedCall = useMemo(() => selectLatestEndedCall(calls), [calls]);

  return {
    activeCall,
    lastEndedCall,
    agentState,
    controlsEnabled: mockControls !== null,
    controls,
    clearEnded,
    handleMessage,
  };
}
