import { describe, expect, it } from "vitest";
import {
  AGENT_STATE_CHANGED_WS_EVENT,
  CALL_ANSWERED_WS_EVENT,
  CALL_ENDED_WS_EVENT,
  CALL_LIFECYCLE_WS_EVENTS,
  CALL_MONITOR_ENDED_WS_EVENT,
  CALL_MONITOR_STARTED_WS_EVENT,
  CALL_ON_HOLD_WS_EVENT,
  CALL_RESUMED_WS_EVENT,
  CALL_TRANSFERRED_WS_EVENT,
  isAgentStateChangedEvent,
  isCallAnsweredEvent,
  isCallEndedEvent,
  isCallLifecycleEventName,
  isCallMonitorEndedEvent,
  isCallMonitorStartedEvent,
  isCallTransferredEvent,
  parseCallLifecycleMessage,
  type WebSocketMessageLike,
} from "./callEvents";

/** Builds a websocket message envelope the same shape the provider delivers. */
function wsMessage(event: string, additionalJson: unknown): WebSocketMessageLike {
  return { data: { EVENT: event, additionalJson } };
}

describe("parseCallLifecycleMessage — CALL_ANSWERED", () => {
  it("accepts a full payload and returns the discriminated variant", () => {
    const parsed = parseCallLifecycleMessage(
      wsMessage(CALL_ANSWERED_WS_EVENT, {
        callId: "call-1001",
        agentId: "agent-101",
        customerId: "42",
        caseId: "D260708-00001",
        timestamp: "2026-10-05T09:00:00.000Z",
      })
    );
    expect(parsed).toEqual({
      event: "CALL_ANSWERED",
      payload: {
        callId: "call-1001",
        agentId: "agent-101",
        customerId: "42",
        caseId: "D260708-00001",
        timestamp: "2026-10-05T09:00:00.000Z",
      },
    });
  });

  it("accepts the minimal payload (no optional ids)", () => {
    const parsed = parseCallLifecycleMessage(
      wsMessage(CALL_ANSWERED_WS_EVENT, {
        callId: "call-1002",
        timestamp: "2026-10-05T09:01:00.000Z",
      })
    );
    expect(parsed?.event).toBe("CALL_ANSWERED");
    expect(parsed?.payload.callId).toBe("call-1002");
  });

  it("drops the event when an optional id is null (the classic integration bug)", () => {
    expect(
      parseCallLifecycleMessage(
        wsMessage(CALL_ANSWERED_WS_EVENT, {
          callId: "call-1003",
          customerId: null,
          timestamp: "2026-10-05T09:02:00.000Z",
        })
      )
    ).toBeNull();
  });
});

describe("parseCallLifecycleMessage — hold / resume", () => {
  it("accepts CALL_ON_HOLD and CALL_RESUMED with the base payload", () => {
    const base = { callId: "call-1001", agentId: "agent-101" };
    const held = parseCallLifecycleMessage(
      wsMessage(CALL_ON_HOLD_WS_EVENT, {
        ...base,
        timestamp: "2026-10-05T09:03:00.000Z",
      })
    );
    const resumed = parseCallLifecycleMessage(
      wsMessage(CALL_RESUMED_WS_EVENT, {
        ...base,
        timestamp: "2026-10-05T09:04:00.000Z",
      })
    );
    expect(held).toEqual({
      event: "CALL_ON_HOLD",
      payload: { ...base, timestamp: "2026-10-05T09:03:00.000Z" },
    });
    expect(resumed).toEqual({
      event: "CALL_RESUMED",
      payload: { ...base, timestamp: "2026-10-05T09:04:00.000Z" },
    });
  });

  it("drops hold/resume events missing the callId", () => {
    expect(
      parseCallLifecycleMessage(
        wsMessage(CALL_ON_HOLD_WS_EVENT, {
          timestamp: "2026-10-05T09:05:00.000Z",
        })
      )
    ).toBeNull();
    expect(
      parseCallLifecycleMessage(
        wsMessage(CALL_RESUMED_WS_EVENT, {
          callId: "   ",
          timestamp: "2026-10-05T09:05:00.000Z",
        })
      )
    ).toBeNull();
  });
});

describe("parseCallLifecycleMessage — CALL_TRANSFERRED", () => {
  it("accepts a transfer with from/to agent ids", () => {
    const parsed = parseCallLifecycleMessage(
      wsMessage(CALL_TRANSFERRED_WS_EVENT, {
        callId: "call-1001",
        fromAgentId: "agent-101",
        toAgentId: "agent-202",
        timestamp: "2026-10-05T09:06:00.000Z",
      })
    );
    expect(parsed?.event).toBe("CALL_TRANSFERRED");
    expect(parsed?.payload).toMatchObject({
      fromAgentId: "agent-101",
      toAgentId: "agent-202",
    });
  });

  it("drops a transfer with a null toAgentId", () => {
    expect(
      parseCallLifecycleMessage(
        wsMessage(CALL_TRANSFERRED_WS_EVENT, {
          callId: "call-1001",
          toAgentId: null,
          timestamp: "2026-10-05T09:07:00.000Z",
        })
      )
    ).toBeNull();
  });
});

describe("parseCallLifecycleMessage — CALL_ENDED", () => {
  it("accepts an ended event with reason and duration", () => {
    const parsed = parseCallLifecycleMessage(
      wsMessage(CALL_ENDED_WS_EVENT, {
        callId: "call-1001",
        agentId: "agent-101",
        endReason: "completed",
        durationSeconds: 245,
        timestamp: "2026-10-05T09:08:00.000Z",
      })
    );
    expect(parsed).toEqual({
      event: "CALL_ENDED",
      payload: {
        callId: "call-1001",
        agentId: "agent-101",
        endReason: "completed",
        durationSeconds: 245,
        timestamp: "2026-10-05T09:08:00.000Z",
      },
    });
  });

  it("accepts any non-empty endReason string (forward compatibility)", () => {
    const parsed = parseCallLifecycleMessage(
      wsMessage(CALL_ENDED_WS_EVENT, {
        callId: "call-1001",
        endReason: "some-future-3cx-reason",
        timestamp: "2026-10-05T09:09:00.000Z",
      })
    );
    expect(parsed?.payload.endReason).toBe("some-future-3cx-reason");
  });

  it("drops ended events without an endReason", () => {
    expect(
      parseCallLifecycleMessage(
        wsMessage(CALL_ENDED_WS_EVENT, {
          callId: "call-1001",
          timestamp: "2026-10-05T09:10:00.000Z",
        })
      )
    ).toBeNull();
  });

  it("drops ended events with a non-finite durationSeconds", () => {
    expect(
      parseCallLifecycleMessage(
        wsMessage(CALL_ENDED_WS_EVENT, {
          callId: "call-1001",
          endReason: "completed",
          durationSeconds: Number.POSITIVE_INFINITY,
          timestamp: "2026-10-05T09:11:00.000Z",
        })
      )
    ).toBeNull();
  });
});

describe("parseCallLifecycleMessage — AGENT_STATE_CHANGED", () => {
  it("accepts a state change", () => {
    const parsed = parseCallLifecycleMessage(
      wsMessage(AGENT_STATE_CHANGED_WS_EVENT, {
        agentId: "agent-101",
        state: "on_call",
        timestamp: "2026-10-05T09:12:00.000Z",
      })
    );
    expect(parsed).toEqual({
      event: "AGENT_STATE_CHANGED",
      payload: {
        agentId: "agent-101",
        state: "on_call",
        timestamp: "2026-10-05T09:12:00.000Z",
      },
    });
  });

  it("drops state changes with an empty state or agentId", () => {
    expect(
      parseCallLifecycleMessage(
        wsMessage(AGENT_STATE_CHANGED_WS_EVENT, {
          agentId: "agent-101",
          state: "  ",
          timestamp: "2026-10-05T09:13:00.000Z",
        })
      )
    ).toBeNull();
    expect(
      parseCallLifecycleMessage(
        wsMessage(AGENT_STATE_CHANGED_WS_EVENT, {
          state: "available",
          timestamp: "2026-10-05T09:13:00.000Z",
        })
      )
    ).toBeNull();
  });
});

describe("parseCallLifecycleMessage — CALL_MONITOR_STARTED / CALL_MONITOR_ENDED", () => {
  it("accepts a full monitor-started payload", () => {
    const parsed = parseCallLifecycleMessage(
      wsMessage(CALL_MONITOR_STARTED_WS_EVENT, {
        callId: "call-1001",
        agentId: "agent-101",
        supervisorId: "user-9",
        mode: "listen",
        timestamp: "2026-10-12T09:00:00.000Z",
      })
    );
    expect(parsed).toEqual({
      event: "CALL_MONITOR_STARTED",
      payload: {
        callId: "call-1001",
        agentId: "agent-101",
        supervisorId: "user-9",
        mode: "listen",
        timestamp: "2026-10-12T09:00:00.000Z",
      },
    });
  });

  it("accepts the minimal monitor-started payload (agentId is optional base field)", () => {
    const parsed = parseCallLifecycleMessage(
      wsMessage(CALL_MONITOR_STARTED_WS_EVENT, {
        callId: "call-1001",
        supervisorId: "user-9",
        mode: "barge",
        timestamp: "2026-10-12T09:01:00.000Z",
      })
    );
    expect(parsed?.event).toBe("CALL_MONITOR_STARTED");
    expect(parsed?.payload.mode).toBe("barge");
  });

  it("accepts any non-empty mode string (forward compatibility)", () => {
    const parsed = parseCallLifecycleMessage(
      wsMessage(CALL_MONITOR_STARTED_WS_EVENT, {
        callId: "call-1001",
        supervisorId: "user-9",
        mode: "some-future-3cx-mode",
        timestamp: "2026-10-12T09:02:00.000Z",
      })
    );
    expect(parsed?.payload.mode).toBe("some-future-3cx-mode");
  });

  it("accepts a monitor-ended payload with the escalation reason", () => {
    const parsed = parseCallLifecycleMessage(
      wsMessage(CALL_MONITOR_ENDED_WS_EVENT, {
        callId: "call-1001",
        supervisorId: "user-9",
        mode: "listen",
        reason: "escalated",
        timestamp: "2026-10-12T09:00:30.000Z",
      })
    );
    expect(parsed?.event).toBe("CALL_MONITOR_ENDED");
    expect(parsed?.payload.reason).toBe("escalated");
  });

  it("drops a monitor-ended event with a null reason (classic integration bug)", () => {
    expect(
      parseCallLifecycleMessage(
        wsMessage(CALL_MONITOR_ENDED_WS_EVENT, {
          callId: "call-1001",
          supervisorId: "user-9",
          mode: "listen",
          reason: null,
          timestamp: "2026-10-12T09:03:00.000Z",
        })
      )
    ).toBeNull();
  });

  it("drops a monitor-ended event with an empty-string reason", () => {
    expect(
      parseCallLifecycleMessage(
        wsMessage(CALL_MONITOR_ENDED_WS_EVENT, {
          callId: "call-1001",
          supervisorId: "user-9",
          mode: "listen",
          reason: "  ",
          timestamp: "2026-10-12T09:03:30.000Z",
        })
      )
    ).toBeNull();
  });

  it("drops monitor events missing supervisorId or mode", () => {
    expect(
      parseCallLifecycleMessage(
        wsMessage(CALL_MONITOR_STARTED_WS_EVENT, {
          callId: "call-1001",
          mode: "listen",
          timestamp: "2026-10-12T09:04:00.000Z",
        })
      )
    ).toBeNull();
    expect(
      parseCallLifecycleMessage(
        wsMessage(CALL_MONITOR_STARTED_WS_EVENT, {
          callId: "call-1001",
          supervisorId: "user-9",
          mode: "",
          timestamp: "2026-10-12T09:04:30.000Z",
        })
      )
    ).toBeNull();
    expect(
      parseCallLifecycleMessage(
        wsMessage(CALL_MONITOR_ENDED_WS_EVENT, {
          callId: "call-1001",
          supervisorId: "user-9",
          mode: "listen",
          timestamp: "2026-10-12T09:05:00.000Z",
        })
      )
    ).not.toBeNull();
  });
});

describe("parseCallLifecycleMessage — envelope handling", () => {
  it("does not consume CALL_INCOMING (owned by parseIncomingCallMessage)", () => {
    expect(
      parseCallLifecycleMessage(
        wsMessage("CALL_INCOMING", {
          callId: "call-1001",
          ani: "+66811223344",
          timestamp: "2026-10-05T09:14:00.000Z",
        })
      )
    ).toBeNull();
  });

  it("returns null for unknown event names", () => {
    expect(
      parseCallLifecycleMessage(
        wsMessage("CALL-ANSWERED", {
          callId: "call-1001",
          timestamp: "2026-10-05T09:15:00.000Z",
        })
      )
    ).toBeNull();
    expect(parseCallLifecycleMessage(wsMessage("CASE-CREATE", {}))).toBeNull();
  });

  it("returns null for null/undefined messages and malformed envelopes", () => {
    expect(parseCallLifecycleMessage(null)).toBeNull();
    expect(parseCallLifecycleMessage(undefined)).toBeNull();
    expect(parseCallLifecycleMessage({})).toBeNull();
    expect(parseCallLifecycleMessage({ data: null })).toBeNull();
    expect(parseCallLifecycleMessage({ data: "text" })).toBeNull();
    expect(
      parseCallLifecycleMessage({ data: { EVENT: CALL_ANSWERED_WS_EVENT } })
    ).toBeNull();
    // additionalJson must be a JSON object, not a JSON-encoded string.
    expect(
      parseCallLifecycleMessage(
        wsMessage(
          CALL_ANSWERED_WS_EVENT,
          '{"callId":"call-1001","timestamp":"2026-10-05T09:16:00.000Z"}'
        )
      )
    ).toBeNull();
  });

  it("parses every event name in CALL_LIFECYCLE_WS_EVENTS", () => {
    const payloads: Record<string, Record<string, unknown>> = {
      [CALL_ANSWERED_WS_EVENT]: { callId: "c", timestamp: "t" },
      [CALL_ON_HOLD_WS_EVENT]: { callId: "c", timestamp: "t" },
      [CALL_RESUMED_WS_EVENT]: { callId: "c", timestamp: "t" },
      [CALL_TRANSFERRED_WS_EVENT]: { callId: "c", timestamp: "t" },
      [CALL_ENDED_WS_EVENT]: { callId: "c", endReason: "completed", timestamp: "t" },
      [AGENT_STATE_CHANGED_WS_EVENT]: { agentId: "a", state: "available", timestamp: "t" },
      [CALL_MONITOR_STARTED_WS_EVENT]: { callId: "c", supervisorId: "s", mode: "listen", timestamp: "t" },
      [CALL_MONITOR_ENDED_WS_EVENT]: { callId: "c", supervisorId: "s", mode: "listen", timestamp: "t" },
    };
    for (const eventName of CALL_LIFECYCLE_WS_EVENTS) {
      expect(
        parseCallLifecycleMessage(wsMessage(eventName, payloads[eventName]))
          ?.event
      ).toBe(eventName);
    }
  });
});

describe("exported guards", () => {
  it("isCallLifecycleEventName matches only the six lifecycle names", () => {
    for (const eventName of CALL_LIFECYCLE_WS_EVENTS) {
      expect(isCallLifecycleEventName(eventName)).toBe(true);
    }
    expect(isCallLifecycleEventName("CALL_INCOMING")).toBe(false);
    expect(isCallLifecycleEventName("")).toBe(false);
    expect(isCallLifecycleEventName(42)).toBe(false);
    expect(isCallLifecycleEventName(undefined)).toBe(false);
  });

  it("isCallAnsweredEvent validates optional linkage ids", () => {
    expect(
      isCallAnsweredEvent({ callId: "c", timestamp: "t" })
    ).toBe(true);
    expect(
      isCallAnsweredEvent({ callId: "c", customerId: "42", timestamp: "t" })
    ).toBe(true);
    expect(
      isCallAnsweredEvent({ callId: "c", customerId: null, timestamp: "t" })
    ).toBe(false);
  });

  it("isCallTransferredEvent validates optional agent ids", () => {
    expect(
      isCallTransferredEvent({ callId: "c", timestamp: "t" })
    ).toBe(true);
    expect(
      isCallTransferredEvent({ callId: "c", toAgentId: "agent-202", timestamp: "t" })
    ).toBe(true);
    expect(
      isCallTransferredEvent({ callId: "c", fromAgentId: null, timestamp: "t" })
    ).toBe(false);
  });

  it("isCallEndedEvent requires a non-empty endReason", () => {
    expect(
      isCallEndedEvent({ callId: "c", endReason: "abandoned", timestamp: "t" })
    ).toBe(true);
    expect(isCallEndedEvent({ callId: "c", timestamp: "t" })).toBe(false);
    expect(
      isCallEndedEvent({ callId: "c", endReason: "", timestamp: "t" })
    ).toBe(false);
  });

  it("isAgentStateChangedEvent requires agentId, state and timestamp", () => {
    expect(
      isAgentStateChangedEvent({ agentId: "a", state: "break", timestamp: "t" })
    ).toBe(true);
    expect(isAgentStateChangedEvent({ agentId: "a", timestamp: "t" })).toBe(false);
    expect(isAgentStateChangedEvent("available")).toBe(false);
  });

  it("isCallMonitorStartedEvent requires supervisorId, mode and the base fields", () => {
    expect(
      isCallMonitorStartedEvent({
        callId: "c",
        supervisorId: "user-9",
        mode: "whisper",
        timestamp: "t",
      })
    ).toBe(true);
    expect(
      isCallMonitorStartedEvent({ callId: "c", mode: "whisper", timestamp: "t" })
    ).toBe(false);
    expect(
      isCallMonitorStartedEvent({
        callId: "c",
        supervisorId: "user-9",
        mode: 7,
        timestamp: "t",
      })
    ).toBe(false);
  });

  it("isCallMonitorEndedEvent additionally enforces omit-or-non-empty reason", () => {
    expect(
      isCallMonitorEndedEvent({
        callId: "c",
        supervisorId: "user-9",
        mode: "listen",
        timestamp: "t",
      })
    ).toBe(true);
    expect(
      isCallMonitorEndedEvent({
        callId: "c",
        supervisorId: "user-9",
        mode: "listen",
        reason: "stopped",
        timestamp: "t",
      })
    ).toBe(true);
    expect(
      isCallMonitorEndedEvent({
        callId: "c",
        supervisorId: "user-9",
        mode: "listen",
        reason: null,
        timestamp: "t",
      })
    ).toBe(false);
    expect(
      isCallMonitorEndedEvent({
        callId: "c",
        supervisorId: "user-9",
        mode: "listen",
        reason: "",
        timestamp: "t",
      })
    ).toBe(false);
  });
});
