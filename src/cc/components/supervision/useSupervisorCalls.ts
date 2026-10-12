// Orchestration for the supervisor roster page (`/cc/supervision`):
// websocket subscription, the roster/session state machine, reconnect reset,
// and the (mock-only, for now) supervisor commands.
//
// Same discipline as `useSoftphone.ts`:
//   1. The `onMessage` subscription registers once for the component's
//      lifetime — `onMessage` is recreated on every WebSocketProvider render.
//   2. Everything state-shaped lives in the pure `supervisorCallState.ts`.
//
// Roster feed mechanism is lifecycle-contract open question Q-S7; this hook
// implements the FE default (a): org-scoped lifecycle events delivered to
// the supervisor's connection. A polled `GET /call-control/live-calls`
// fallback would slot in behind the same return shape if Q-S7 decides that
// way. Monitor-session state is derived from the dual-targeted
// CALL_MONITOR_* events filtered to the viewing supervisor.
//
// Supervisor commands follow the softphone toolbar pattern: the mock emits
// the confirming events in dev + mock mode, and the buttons are disabled
// otherwise until the 3CX adapter lands (then they call the
// `callControlApi` monitoring mutations — see that file's banner).
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useWebSocket } from "@/core/components/websocket/websocket";
import type { WebSocketMessage } from "@/core/components/websocket/websocket";
import {
  AGENT_STATE_CHANGED_WS_EVENT,
  parseCallLifecycleMessage,
} from "../../types/callEvents";
import {
  useBargeInCallMutation,
  useHangUpCallMutation,
  useListenCallMutation,
  useStopMonitorCallMutation,
  useWhisperCallMutation,
} from "../../store/api/callControlApi";
import { extractRejectionMessage } from "../../utils/commandRejection";
import {
  attachMockCallConsoleUtil,
  createMockCallControls,
  type MockCallControls,
} from "../softphone/mockCallLifecycle";
import {
  selectRosterCalls,
  supervisorCallsReducer,
  type RosterCall,
  type SupervisorMonitorSession,
  type SupervisorCallState,
} from "./supervisorCallState";

/** Supervisor call-control commands. No-ops until the backend adapter lands. */
export interface SupervisorControls {
  /** Starts (or re-targets) a listen session on the leg. */
  listen: (callId: string) => void;
  /** Escalates to (or starts in) whisper mode. */
  whisper: (callId: string) => void;
  /** Escalates to (or starts in) barge mode. */
  barge: (callId: string) => void;
  /** Ends the supervisor's monitor session on the leg. */
  stopMonitor: (callId: string) => void;
  /** Force-terminates the agent's live call (confirm first — destructive). */
  forceEnd: (callId: string) => void;
}

export interface SupervisorCallsApi {
  /** Live agent calls, oldest-first (longest-running on top). */
  roster: RosterCall[];
  /** The viewing supervisor's own monitor sessions, keyed by callId. */
  sessions: Record<string, SupervisorMonitorSession>;
  /** True when supervisor commands do something (dev + mock mode only). */
  controlsEnabled: boolean;
  controls: SupervisorControls;
  /** Single entry point for call events — WS subscription and the dev mock. */
  handleMessage: (message: WebSocketMessage) => void;
}

export function useSupervisorCalls(
  supervisorId: string | null,
  /**
   * Surfaces business-rejection msgs (200 + "-1") from the real command
   * path; null means the failure carried no readable envelope.
   */
  onCommandError?: (message: string | null) => void
): SupervisorCallsApi {
  const [state, setState] = useState<SupervisorCallState>({
    calls: {},
    sessions: {},
  });
  const { onMessage, isConnected } = useWebSocket();
  const [listenCall] = useListenCallMutation();
  const [whisperCall] = useWhisperCallMutation();
  const [bargeInCall] = useBargeInCallMutation();
  const [stopMonitorCall] = useStopMonitorCallMutation();
  const [hangUpCall] = useHangUpCallMutation();

  // `supervisorId` is read through a ref so `handleMessage` stays dep-free —
  // the subscribe-once discipline below requires a stable callback, and an
  // auth-hydration id change (null → id) must not leave the subscriber set
  // holding a stale closure that filters every CALL_MONITOR_* event out.
  const supervisorIdRef = useRef(supervisorId);
  useEffect(() => {
    supervisorIdRef.current = supervisorId;
  }, [supervisorId]);

  const handleMessage = useCallback((message: WebSocketMessage) => {
    const event = parseCallLifecycleMessage(message);
    if (event === null || event.event === AGENT_STATE_CHANGED_WS_EVENT) {
      return;
    }
    setState((previous) =>
      supervisorCallsReducer(previous, {
        type: "apply",
        event,
        supervisorId: supervisorIdRef.current,
      })
    );
  }, []);

  // Registered once for the component's lifetime — see discipline note above.
  // `handleMessage` is dep-free (supervisorId rides in a ref), and
  // `onMessage` is recreated on every WebSocketProvider render, so including
  // it here would resubscribe on every provider render for no benefit.
  useEffect(() => {
    const unsubscribe = onMessage(handleMessage);
    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handleMessage]);

  // No replay on reconnect (lifecycle contract §6.3): calls that ended while
  // the socket was down would stay as ghost rows forever. On any reconnect
  // after the first connection, rebuild the roster from scratch.
  const hadConnectedRef = useRef(false);
  useEffect(() => {
    if (!isConnected) {
      return;
    }
    if (hadConnectedRef.current) {
      setState((previous) => supervisorCallsReducer(previous, { type: "reset" }));
    }
    hadConnectedRef.current = true;
  }, [isConnected]);

  // Dev/mock wiring (VITE_MOCK_API + dev only, tree-shaken from production):
  // the supervisor page owns its controls instance so the roster's action
  // buttons and the `window.mockCall` console util drive the same mock.
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

  const controls = useMemo<SupervisorControls>(() => {
    // The mock emits the CALL_MONITOR_* pair a real adapter would publish
    // after the corresponding command succeeds (command contract §4.1) —
    // the roster's session strip still only moves on events.
    const run = (promise: Promise<unknown>): void => {
      void promise.then(undefined, (error: unknown) => {
        // Business rejections carry the envelope's `msg` (e.g. "already
        // monitored"); transport failures carry none — the caller renders
        // its own fallback text for those.
        onCommandError?.(extractRejectionMessage(error));
      });
    };
    return {
      listen: (callId) => {
        if (mockControls) {
          mockControls.monitorListen(callId);
          return;
        }
        run(listenCall({ callId }).unwrap());
      },
      whisper: (callId) => {
        if (mockControls) {
          mockControls.monitorWhisper(callId);
          return;
        }
        run(whisperCall({ callId }).unwrap());
      },
      barge: (callId) => {
        if (mockControls) {
          mockControls.monitorBarge(callId);
          return;
        }
        run(bargeInCall({ callId }).unwrap());
      },
      stopMonitor: (callId) => {
        if (mockControls) {
          mockControls.monitorStop(callId);
          return;
        }
        run(stopMonitorCall({ callId }).unwrap());
      },
      // Force-terminate reuses the existing terminate command under the
      // cc.supervision.force_terminate permission (command contract Q-S6).
      forceEnd: (callId) => {
        if (mockControls) {
          mockControls.end("completed", callId);
          return;
        }
        run(hangUpCall({ callId }).unwrap());
      },
    };
  }, [
    mockControls,
    listenCall,
    whisperCall,
    bargeInCall,
    stopMonitorCall,
    hangUpCall,
    onCommandError,
  ]);

  const roster = useMemo(() => selectRosterCalls(state), [state]);

  return {
    roster,
    sessions: state.sessions,
    controlsEnabled: mockControls !== null,
    controls,
    handleMessage,
  };
}
