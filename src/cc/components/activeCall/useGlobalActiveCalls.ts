// Global active-call lifecycle hook.
//
// Subscribes to WebSocket lifecycle events and maintains a global view of
// active calls for the indicator bar. Any page can mount the bar; the hook
// itself is page-agnostic.
import { useCallback, useEffect, useMemo, useState } from "react";
import { useWebSocket } from "@/core/components/websocket/websocket";
import type { WebSocketMessage } from "@/core/components/websocket/websocket";
import { parseCallLifecycleMessage } from "../../types/callEvents";
import {
  globalCallsReducer,
  selectGlobalActiveCalls,
  selectPrimaryActiveCall,
  type GlobalCallSession,
  type GlobalCalls,
} from "./globalCallState";
import { useHangUpCallMutation } from "../../store/api/callControlApi";
import { DEV_CONFIG } from "@/core/utils/constants";
import {
  buildMockCallLifecycleWsMessage,
} from "../softphone/mockCallLifecycle";
import { CALL_ENDED_WS_EVENT } from "../../types/callEvents";
import type { CallEndedEvent } from "../../types/callEvents";

export interface GlobalActiveCallsApi {
  activeCalls: GlobalCallSession[];
  hasActiveCalls: boolean;
  primaryCall: GlobalCallSession | null;
  endCall: (callId: string) => void;
}

export function useGlobalActiveCalls(): GlobalActiveCallsApi {
  const [calls, setCalls] = useState<GlobalCalls>({});
  const { onMessage, broadcast } = useWebSocket();
  const [hangUpCall] = useHangUpCallMutation();

  const handleMessage = useCallback((message: WebSocketMessage) => {
    const event = parseCallLifecycleMessage(message);
    if (event === null) {
      return;
    }
    // Ignore agent-state events and monitor events — the bar only cares
    // about the agent's own call legs.
    if (
      event.event === "AGENT_STATE_CHANGED" ||
      event.event === "CALL_MONITOR_STARTED" ||
      event.event === "CALL_MONITOR_ENDED"
    ) {
      return;
    }
    setCalls((previous) => globalCallsReducer(previous, { type: "apply", event }));
  }, []);

  useEffect(() => {
    const unsubscribe = onMessage(handleMessage);
    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const endCall = useCallback(
    (callId: string) => {
      if (import.meta.env.DEV && DEV_CONFIG.MOCK_API) {
        // Mock path: broadcast CALL_ENDED so all subscribers clean up.
        const event: CallEndedEvent = {
          callId,
          timestamp: new Date().toISOString(),
          endReason: "completed",
        };
        broadcast(
          buildMockCallLifecycleWsMessage({
            event: CALL_ENDED_WS_EVENT,
            payload: event,
          })
        );
        return;
      }
      void hangUpCall({ callId })
        .unwrap()
        .then(undefined, (error: unknown) => {
          console.error("Global active call: hang-up failed", error);
        });
    },
    [broadcast, hangUpCall]
  );

  const activeCalls = useMemo(() => selectGlobalActiveCalls(calls), [calls]);
  const primaryCall = useMemo(() => selectPrimaryActiveCall(calls), [calls]);

  return {
    activeCalls,
    hasActiveCalls: activeCalls.length > 0,
    primaryCall,
    endCall,
  };
}
