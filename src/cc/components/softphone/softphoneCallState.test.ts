import { describe, expect, it } from "vitest";
import {
  formatCallDuration,
  MAX_TRACKED_CALLS,
  selectActiveCall,
  selectLatestEndedCall,
  softphoneCallsReducer,
  type SoftphoneCalls,
} from "./softphoneCallState";
import type { CallScopedLifecycleEvent } from "./softphoneCallState";
import type {
  CallAnsweredEvent,
  CallEndedEvent,
  CallMonitorEndedEvent,
  CallMonitorStartedEvent,
  CallTransferredEvent,
} from "../../types/callEvents";

function answered(callId: string, timestamp: string, extra?: Partial<CallAnsweredEvent>): CallScopedLifecycleEvent {
  return {
    event: "CALL_ANSWERED",
    payload: { callId, timestamp, ...extra },
  };
}

function onHold(callId: string, timestamp: string): CallScopedLifecycleEvent {
  return { event: "CALL_ON_HOLD", payload: { callId, timestamp } };
}

function resumed(callId: string, timestamp: string): CallScopedLifecycleEvent {
  return { event: "CALL_RESUMED", payload: { callId, timestamp } };
}

function transferred(
  callId: string,
  timestamp: string,
  toAgentId?: string
): CallScopedLifecycleEvent {
  const payload: CallTransferredEvent = { callId, timestamp };
  if (toAgentId !== undefined) {
    payload.toAgentId = toAgentId;
  }
  return { event: "CALL_TRANSFERRED", payload };
}

function ended(
  callId: string,
  timestamp: string,
  extra?: Partial<CallEndedEvent>
): CallScopedLifecycleEvent {
  return {
    event: "CALL_ENDED",
    payload: { callId, endReason: "completed", timestamp, ...extra },
  };
}

function monitorStarted(
  callId: string,
  timestamp: string,
  extra?: Partial<CallMonitorStartedEvent>
): CallScopedLifecycleEvent {
  return {
    event: "CALL_MONITOR_STARTED",
    payload: { callId, supervisorId: "user-9", mode: "listen", timestamp, ...extra },
  };
}

function monitorEnded(
  callId: string,
  timestamp: string,
  extra?: Partial<CallMonitorEndedEvent>
): CallScopedLifecycleEvent {
  return {
    event: "CALL_MONITOR_ENDED",
    payload: {
      callId,
      supervisorId: "user-9",
      mode: "listen",
      timestamp,
      ...extra,
    },
  };
}

describe("softphoneCallsReducer — lifecycle", () => {
  it("creates an active session from CALL_ANSWERED", () => {
    const calls = softphoneCallsReducer({}, {
      type: "apply",
      event: answered("call-1", "2026-10-05T10:00:00.000Z"),
    });
    expect(calls["call-1"]).toEqual({
      callId: "call-1",
      status: "active",
      lastTimestamp: "2026-10-05T10:00:00.000Z",
    });
  });

  it("records backend-resolved linkage ids on CALL_ANSWERED", () => {
    const calls = softphoneCallsReducer({}, {
      type: "apply",
      event: answered("call-1", "2026-10-05T10:00:00.000Z", {
        agentId: "agent-101",
        customerId: "42",
        caseId: "D260708-00001",
      }),
    });
    expect(calls["call-1"]).toMatchObject({
      agentId: "agent-101",
      customerId: "42",
      caseId: "D260708-00001",
    });
  });

  it("transitions active → on_hold → active on hold/resume", () => {
    let calls: SoftphoneCalls = {};
    calls = softphoneCallsReducer(calls, { type: "apply", event: answered("call-1", "t1") });
    calls = softphoneCallsReducer(calls, { type: "apply", event: onHold("call-1", "t2") });
    expect(calls["call-1"]?.status).toBe("on_hold");
    calls = softphoneCallsReducer(calls, { type: "apply", event: resumed("call-1", "t3") });
    expect(calls["call-1"]?.status).toBe("active");
  });

  it("marks a session transferred with the target agent", () => {
    let calls: SoftphoneCalls = {};
    calls = softphoneCallsReducer(calls, { type: "apply", event: answered("call-1", "t1") });
    calls = softphoneCallsReducer(calls, {
      type: "apply",
      event: transferred("call-1", "t2", "agent-202"),
    });
    expect(calls["call-1"]).toMatchObject({ status: "transferred", transferredTo: "agent-202" });
  });

  it("ends a session with reason and duration", () => {
    let calls: SoftphoneCalls = {};
    calls = softphoneCallsReducer(calls, { type: "apply", event: answered("call-1", "t1") });
    calls = softphoneCallsReducer(calls, {
      type: "apply",
      event: ended("call-1", "t2", { endReason: "abandoned", durationSeconds: 31 }),
    });
    expect(calls["call-1"]).toMatchObject({
      status: "ended",
      endReason: "abandoned",
      durationSeconds: 31,
    });
  });

  it("preserves linkage ids across later lifecycle events", () => {
    let calls: SoftphoneCalls = {};
    calls = softphoneCallsReducer(calls, {
      type: "apply",
      event: answered("call-1", "t1", { customerId: "42", caseId: "D260708-00001" }),
    });
    calls = softphoneCallsReducer(calls, { type: "apply", event: onHold("call-1", "t2") });
    expect(calls["call-1"]).toMatchObject({ customerId: "42", caseId: "D260708-00001" });
  });
});

describe("softphoneCallsReducer — contract §6 semantics", () => {
  it("applies events for an unseen callId (upsert — must not depend on the ring)", () => {
    const calls = softphoneCallsReducer({}, { type: "apply", event: onHold("call-9", "t1") });
    expect(calls["call-9"]?.status).toBe("on_hold");
  });

  it("ignores non-terminal events after ENDED (terminal sticky)", () => {
    let calls: SoftphoneCalls = {};
    calls = softphoneCallsReducer(calls, { type: "apply", event: ended("call-1", "t1") });
    const before = calls;
    calls = softphoneCallsReducer(calls, { type: "apply", event: answered("call-1", "t2") });
    calls = softphoneCallsReducer(calls, { type: "apply", event: onHold("call-1", "t3") });
    calls = softphoneCallsReducer(calls, { type: "apply", event: resumed("call-1", "t4") });
    expect(calls).toBe(before);
  });

  it("lets a repeated ENDED re-assert (idempotent terminal update)", () => {
    let calls: SoftphoneCalls = {};
    calls = softphoneCallsReducer(calls, { type: "apply", event: ended("call-1", "t1") });
    calls = softphoneCallsReducer(calls, {
      type: "apply",
      event: ended("call-1", "t2", { endReason: "failed", durationSeconds: 5 }),
    });
    expect(calls["call-1"]).toMatchObject({
      status: "ended",
      endReason: "failed",
      durationSeconds: 5,
      lastTimestamp: "t2",
    });
  });

  it("does not mutate the input state", () => {
    const initial: SoftphoneCalls = {};
    const afterAnswer = softphoneCallsReducer(initial, {
      type: "apply",
      event: answered("call-1", "t1"),
    });
    expect(initial).toEqual({});
    expect(afterAnswer).not.toBe(initial);
  });
});

describe("softphoneCallsReducer — clearEnded & pruning", () => {
  it("clearEnded removes the session and no-ops for unknown ids", () => {
    let calls: SoftphoneCalls = {};
    calls = softphoneCallsReducer(calls, { type: "apply", event: ended("call-1", "t1") });
    calls = softphoneCallsReducer(calls, { type: "clearEnded", callId: "call-1" });
    expect(calls).toEqual({});
    const same = softphoneCallsReducer(calls, { type: "clearEnded", callId: "nope" });
    expect(same).toBe(calls);
  });

  it("prunes oldest ended sessions first when over the cap", () => {
    let calls: SoftphoneCalls = {};
    for (let i = 0; i < MAX_TRACKED_CALLS + 3; i += 1) {
      calls = softphoneCallsReducer(calls, {
        type: "apply",
        event: ended(`call-${i.toString().padStart(2, "0")}`, `t${i.toString().padStart(2, "0")}`),
      });
    }
    const ids = Object.keys(calls);
    expect(ids).toHaveLength(MAX_TRACKED_CALLS);
    // Oldest three ended sessions were dropped; newest kept.
    expect(ids).not.toContain("call-00");
    expect(ids).toContain(`call-${(MAX_TRACKED_CALLS + 2).toString().padStart(2, "0")}`);
  });

  it("keeps non-ended sessions when pruning (only drops them as a last resort)", () => {
    let calls: SoftphoneCalls = {};
    // One old active leg…
    calls = softphoneCallsReducer(calls, { type: "apply", event: answered("old-active", "t00") });
    // …followed by enough ended legs to exceed the cap.
    for (let i = 1; i <= MAX_TRACKED_CALLS; i += 1) {
      calls = softphoneCallsReducer(calls, {
        type: "apply",
        event: ended(`call-${i.toString().padStart(2, "0")}`, `t${i.toString().padStart(2, "0")}`),
      });
    }
    expect(Object.keys(calls)).toHaveLength(MAX_TRACKED_CALLS);
    expect(calls["old-active"]?.status).toBe("active");
  });
});

describe("softphoneCallsReducer — monitor events (contract §6.5)", () => {
  it("starts a monitor session on an active leg (agent-side badge state)", () => {
    let calls: SoftphoneCalls = {};
    calls = softphoneCallsReducer(calls, { type: "apply", event: answered("call-1", "t1") });
    calls = softphoneCallsReducer(calls, {
      type: "apply",
      event: monitorStarted("call-1", "t2", { mode: "whisper" }),
    });
    expect(calls["call-1"]).toMatchObject({
      status: "active",
      monitor: { supervisorId: "user-9", mode: "whisper" },
    });
  });

  it("stops the monitor session on CALL_MONITOR_ENDED for the same supervisor", () => {
    let calls: SoftphoneCalls = {};
    calls = softphoneCallsReducer(calls, { type: "apply", event: answered("call-1", "t1") });
    calls = softphoneCallsReducer(calls, { type: "apply", event: monitorStarted("call-1", "t2") });
    calls = softphoneCallsReducer(calls, {
      type: "apply",
      event: monitorEnded("call-1", "t3", { reason: "stopped" }),
    });
    expect(calls["call-1"]?.status).toBe("active");
    expect(calls["call-1"]?.monitor).toBeUndefined();
  });

  it("applies the escalation pair as a discrete mode transition", () => {
    let calls: SoftphoneCalls = {};
    calls = softphoneCallsReducer(calls, { type: "apply", event: answered("call-1", "t1") });
    calls = softphoneCallsReducer(calls, { type: "apply", event: monitorStarted("call-1", "t2") });
    // Escalation = ENDED(escalated) + STARTED(new mode), per contract §6.5.
    calls = softphoneCallsReducer(calls, {
      type: "apply",
      event: monitorEnded("call-1", "t3", { reason: "escalated" }),
    });
    expect(calls["call-1"]?.monitor).toBeUndefined();
    calls = softphoneCallsReducer(calls, {
      type: "apply",
      event: monitorStarted("call-1", "t4", { mode: "barge" }),
    });
    expect(calls["call-1"]?.monitor).toEqual({ supervisorId: "user-9", mode: "barge" });
    expect(calls["call-1"]?.status).toBe("active");
  });

  it("drops monitor state when the leg ends (sticky-terminal clears the badge)", () => {
    let calls: SoftphoneCalls = {};
    calls = softphoneCallsReducer(calls, { type: "apply", event: answered("call-1", "t1") });
    calls = softphoneCallsReducer(calls, { type: "apply", event: monitorStarted("call-1", "t2") });
    calls = softphoneCallsReducer(calls, { type: "apply", event: ended("call-1", "t3") });
    expect(calls["call-1"]?.status).toBe("ended");
    expect(calls["call-1"]?.monitor).toBeUndefined();
  });

  it("ignores monitor events arriving after the leg's CALL_ENDED (no zombies)", () => {
    let calls: SoftphoneCalls = {};
    calls = softphoneCallsReducer(calls, { type: "apply", event: answered("call-1", "t1") });
    calls = softphoneCallsReducer(calls, { type: "apply", event: ended("call-1", "t2") });
    const before = calls;
    calls = softphoneCallsReducer(calls, { type: "apply", event: monitorStarted("call-1", "t3") });
    calls = softphoneCallsReducer(calls, { type: "apply", event: monitorEnded("call-1", "t4") });
    expect(calls).toBe(before);
  });

  it("creates an active session when monitor-started is the first event for the leg (upsert)", () => {
    const calls = softphoneCallsReducer({}, {
      type: "apply",
      event: monitorStarted("call-9", "t1"),
    });
    expect(calls["call-9"]).toMatchObject({
      status: "active",
      monitor: { supervisorId: "user-9", mode: "listen" },
    });
  });

  it("does not create a session for a monitor-ended on an unseen leg", () => {
    const calls = softphoneCallsReducer({}, {
      type: "apply",
      event: monitorEnded("call-9", "t1"),
    });
    expect(calls).toEqual({});
  });

  it("keeps another supervisor's session when a different supervisor's ENDED arrives", () => {
    let calls: SoftphoneCalls = {};
    calls = softphoneCallsReducer(calls, { type: "apply", event: answered("call-1", "t1") });
    calls = softphoneCallsReducer(calls, {
      type: "apply",
      event: monitorStarted("call-1", "t2", { supervisorId: "user-9", mode: "listen" }),
    });
    calls = softphoneCallsReducer(calls, {
      type: "apply",
      event: monitorEnded("call-1", "t3", { supervisorId: "user-10", mode: "listen" }),
    });
    expect(calls["call-1"]?.monitor).toEqual({ supervisorId: "user-9", mode: "listen" });
  });

  it("keeps the leg status unchanged when monitoring starts (monitoring is not a leg transition)", () => {
    let calls: SoftphoneCalls = {};
    calls = softphoneCallsReducer(calls, { type: "apply", event: answered("call-1", "t1") });
    calls = softphoneCallsReducer(calls, { type: "apply", event: onHold("call-1", "t2") });
    calls = softphoneCallsReducer(calls, { type: "apply", event: monitorStarted("call-1", "t3") });
    expect(calls["call-1"]?.status).toBe("on_hold");
  });
});

describe("selectors", () => {
  it("selectActiveCall returns the newest non-ended session", () => {
    let calls: SoftphoneCalls = {};
    calls = softphoneCallsReducer(calls, { type: "apply", event: answered("a", "t1") });
    calls = softphoneCallsReducer(calls, { type: "apply", event: answered("b", "t2") });
    calls = softphoneCallsReducer(calls, { type: "apply", event: ended("b", "t3") });
    expect(selectActiveCall(calls)?.callId).toBe("a");
  });

  it("selectActiveCall returns null when every session ended", () => {
    let calls: SoftphoneCalls = {};
    calls = softphoneCallsReducer(calls, { type: "apply", event: ended("a", "t1") });
    expect(selectActiveCall(calls)).toBeNull();
  });

  it("selectLatestEndedCall returns the newest ended session", () => {
    let calls: SoftphoneCalls = {};
    calls = softphoneCallsReducer(calls, { type: "apply", event: ended("a", "t1") });
    calls = softphoneCallsReducer(calls, { type: "apply", event: ended("b", "t2") });
    expect(selectLatestEndedCall(calls)?.callId).toBe("b");
    expect(selectLatestEndedCall({})).toBeNull();
  });
});

describe("formatCallDuration", () => {
  it("formats seconds and minutes with zero padding", () => {
    expect(formatCallDuration(0)).toBe("0m 00s");
    expect(formatCallDuration(65)).toBe("1m 05s");
    expect(formatCallDuration(245)).toBe("4m 05s");
  });

  it("includes hours only past 60 minutes", () => {
    expect(formatCallDuration(3723)).toBe("1h 02m 03s");
  });

  it("returns an empty string for unusable values", () => {
    expect(formatCallDuration(Number.NaN)).toBe("");
    expect(formatCallDuration(Number.POSITIVE_INFINITY)).toBe("");
    expect(formatCallDuration(-5)).toBe("");
  });
});
