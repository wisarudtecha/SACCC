// Unit tests for the mock monitor command planner (`planMockMonitorEvents`)
// and the envelope builder — the pure halves of `mockCallLifecycle.ts`, kept
// node-testable per the repo's softphoneCallState.ts discipline. The env-
// gated shell (`createMockCallControls`) is exercised manually in dev +
// mock mode (docs/CC-Integration-Dev-Test-Guide.md).
import { describe, expect, it } from "vitest";
import {
  buildMockCallLifecycleWsMessage,
  MOCK_SUPERVISOR_ID,
  planMockMonitorEvents,
  type MockMonitorSessionState,
} from "./mockCallLifecycle";
import { parseCallLifecycleMessage } from "../../types/callEvents";
import type { CallLifecycleEvent, CallMonitorEndedEvent, CallMonitorStartedEvent } from "../../types/callEvents";

const LEG = "mock-leg-1";
const OTHER_LEG = "mock-leg-2";
const AGENT = "mock-agent";
const TS = "2026-10-12T09:00:00.000Z";

function session(
  callId: string,
  mode: MockMonitorSessionState["mode"]
): MockMonitorSessionState {
  return { callId, agentId: AGENT, mode };
}

function plan(
  command: Parameters<typeof planMockMonitorEvents>[0]["command"],
  callId: string,
  current: MockMonitorSessionState | null
) {
  return planMockMonitorEvents({
    command,
    callId,
    agentId: AGENT,
    supervisorId: MOCK_SUPERVISOR_ID,
    current,
    timestamp: TS,
  });
}

function monitorPayload(
  event: CallLifecycleEvent
): CallMonitorStartedEvent | CallMonitorEndedEvent {
  if (
    event.event !== "CALL_MONITOR_STARTED" &&
    event.event !== "CALL_MONITOR_ENDED"
  ) {
    throw new Error(`expected a monitor event, got ${event.event}`);
  }
  return event.payload;
}

describe("planMockMonitorEvents — start", () => {
  it("starts a listen session with a single STARTED event", () => {
    const result = plan("listen", LEG, null);
    expect(result.events).toHaveLength(1);
    const payload = monitorPayload(result.events[0]);
    expect(result.events[0].event).toBe("CALL_MONITOR_STARTED");
    expect(payload).toEqual({
      callId: LEG,
      agentId: AGENT,
      supervisorId: MOCK_SUPERVISOR_ID,
      mode: "listen",
      timestamp: TS,
    });
    expect(result.next).toEqual(session(LEG, "listen"));
  });

  it("starts directly in whisper or barge when no session exists", () => {
    const whisper = plan("whisper", LEG, null);
    const barge = plan("barge", LEG, null);
    expect(monitorPayload(whisper.events[0]).mode).toBe("whisper");
    expect(monitorPayload(barge.events[0]).mode).toBe("barge");
  });
});

describe("planMockMonitorEvents — idempotency (command contract §4.3)", () => {
  it("re-issuing the current mode emits no events and keeps the session", () => {
    const current = session(LEG, "listen");
    const result = plan("listen", LEG, current);
    expect(result.events).toEqual([]);
    expect(result.next).toBe(current);
  });
});

describe("planMockMonitorEvents — escalation pair (lifecycle contract §6.5)", () => {
  it("escalating listen → whisper emits ENDED(escalated) + STARTED(whisper)", () => {
    const result = plan("whisper", LEG, session(LEG, "listen"));
    expect(result.events).toHaveLength(2);
    const [endedEvent, startedEvent] = result.events;
    expect(endedEvent.event).toBe("CALL_MONITOR_ENDED");
    const endedPayload = monitorPayload(endedEvent) as CallMonitorEndedEvent;
    expect(endedPayload).toMatchObject({
      callId: LEG,
      supervisorId: MOCK_SUPERVISOR_ID,
      mode: "listen",
      reason: "escalated",
    });
    expect(startedEvent.event).toBe("CALL_MONITOR_STARTED");
    expect(monitorPayload(startedEvent)).toMatchObject({ mode: "whisper" });
    expect(result.next).toEqual(session(LEG, "whisper"));
  });

  it("de-escalating barge → listen emits the same discrete pair", () => {
    const result = plan("listen", LEG, session(LEG, "barge"));
    expect(result.events).toHaveLength(2);
    expect(monitorPayload(result.events[0])).toMatchObject({
      mode: "barge",
      reason: "escalated",
    });
    expect(monitorPayload(result.events[1])).toMatchObject({ mode: "listen" });
    expect(result.next).toEqual(session(LEG, "listen"));
  });
});

describe("planMockMonitorEvents — stop", () => {
  it("stopping emits a single ENDED(stopped) and clears the session", () => {
    const result = plan("stop", LEG, session(LEG, "whisper"));
    expect(result.events).toHaveLength(1);
    expect(result.events[0].event).toBe("CALL_MONITOR_ENDED");
    expect(monitorPayload(result.events[0])).toMatchObject({
      callId: LEG,
      mode: "whisper",
      reason: "stopped",
    });
    expect(result.next).toBeNull();
  });

  it("stopping with no session is a no-op", () => {
    const result = plan("stop", LEG, null);
    expect(result.events).toEqual([]);
    expect(result.next).toBeNull();
  });

  it("stopping a different leg leaves the active session untouched", () => {
    const current = session(LEG, "listen");
    const result = plan("stop", OTHER_LEG, current);
    expect(result.events).toEqual([]);
    expect(result.next).toBe(current);
  });
});

describe("planMockMonitorEvents — leg switch", () => {
  it("monitoring a different leg implicitly stops the previous session", () => {
    const result = plan("listen", OTHER_LEG, session(LEG, "whisper"));
    expect(result.events).toHaveLength(2);
    const [endedEvent, startedEvent] = result.events;
    expect(endedEvent.event).toBe("CALL_MONITOR_ENDED");
    expect(monitorPayload(endedEvent)).toMatchObject({
      callId: LEG,
      mode: "whisper",
      reason: "stopped",
    });
    expect(startedEvent.event).toBe("CALL_MONITOR_STARTED");
    expect(monitorPayload(startedEvent)).toMatchObject({
      callId: OTHER_LEG,
      mode: "listen",
    });
    expect(result.next).toEqual(session(OTHER_LEG, "listen"));
  });
});

describe("buildMockCallLifecycleWsMessage — monitor events", () => {
  it("wraps monitor events in the envelope the provider dispatches", () => {
    const { events } = plan("whisper", LEG, session(LEG, "listen"));
    for (const event of events) {
      const message = buildMockCallLifecycleWsMessage(event);
      expect(message.data.EVENT).toBe(event.event);
      expect(message.data.additionalJson).toEqual(event.payload);
    }
  });

  it("emits events the production parser accepts (demo path = production path)", () => {
    const { events } = plan("barge", LEG, session(LEG, "whisper"));
    for (const event of events) {
      const parsed = parseCallLifecycleMessage(
        buildMockCallLifecycleWsMessage(event)
      );
      expect(parsed).toEqual(event);
    }
  });
});
