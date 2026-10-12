// Unit tests for the supervisor-roster state machine — mirrors the
// softphoneCallState.test.ts discipline (pure reducer, node environment).
import { describe, expect, it } from "vitest";
import {
  EMPTY_SUPERVISOR_CALL_STATE,
  selectMonitorSession,
  selectRosterCalls,
  supervisorCallsReducer,
  type SupervisorCallState,
} from "./supervisorCallState";
import type { CallScopedLifecycleEvent } from "../softphone/softphoneCallState";
import type {
  CallAnsweredEvent,
  CallMonitorEndedEvent,
  CallMonitorStartedEvent,
} from "../../types/callEvents";

const ME = "user-9";
const OTHER = "user-10";

function answered(
  callId: string,
  timestamp: string,
  extra?: Partial<CallAnsweredEvent>
): CallScopedLifecycleEvent {
  return { event: "CALL_ANSWERED", payload: { callId, timestamp, ...extra } };
}

function ended(callId: string, timestamp: string): CallScopedLifecycleEvent {
  return {
    event: "CALL_ENDED",
    payload: { callId, endReason: "completed", timestamp },
  };
}

function monitorStarted(
  callId: string,
  timestamp: string,
  extra?: Partial<CallMonitorStartedEvent>
): CallScopedLifecycleEvent {
  return {
    event: "CALL_MONITOR_STARTED",
    payload: {
      callId,
      supervisorId: ME,
      mode: "listen",
      timestamp,
      ...extra,
    },
  };
}

function monitorEnded(
  callId: string,
  timestamp: string,
  extra?: Partial<CallMonitorEndedEvent>
): CallScopedLifecycleEvent {
  return {
    event: "CALL_MONITOR_ENDED",
    payload: { callId, supervisorId: ME, mode: "listen", timestamp, ...extra },
  };
}

function apply(
  state: SupervisorCallState,
  event: CallScopedLifecycleEvent,
  supervisorId: string | null = ME
): SupervisorCallState {
  return supervisorCallsReducer(state, { type: "apply", event, supervisorId });
}

describe("supervisorCallsReducer — roster rows", () => {
  it("creates a row from CALL_ANSWERED with linkage and start time", () => {
    const state = apply(
      EMPTY_SUPERVISOR_CALL_STATE,
      answered("call-1", "t1", { agentId: "agent-101", customerId: "42", ani: "+66811223344" })
    );
    expect(state.calls["call-1"]).toEqual({
      callId: "call-1",
      status: "active",
      agentId: "agent-101",
      customerId: "42",
      caseId: undefined,
      ani: "+66811223344",
      startedAt: "t1",
      lastTimestamp: "t1",
    });
  });

  it("upserts a row from a mid-call event for an unseen leg (no ring dependency)", () => {
    const state = apply(EMPTY_SUPERVISOR_CALL_STATE, {
      event: "CALL_ON_HOLD",
      payload: { callId: "call-9", agentId: "agent-202", timestamp: "t1" },
    });
    expect(state.calls["call-9"]).toMatchObject({ status: "on_hold", agentId: "agent-202" });
  });

  it("tracks hold/resume and follows the receiving agent on transfer", () => {
    let state = apply(EMPTY_SUPERVISOR_CALL_STATE, answered("call-1", "t1", { agentId: "agent-101" }));
    state = apply(state, { event: "CALL_ON_HOLD", payload: { callId: "call-1", timestamp: "t2" } });
    expect(state.calls["call-1"]?.status).toBe("on_hold");
    state = apply(state, { event: "CALL_RESUMED", payload: { callId: "call-1", timestamp: "t3" } });
    expect(state.calls["call-1"]?.status).toBe("active");
    state = apply(state, {
      event: "CALL_TRANSFERRED",
      payload: { callId: "call-1", toAgentId: "agent-202", timestamp: "t4" },
    });
    expect(state.calls["call-1"]).toMatchObject({ status: "transferred", agentId: "agent-202" });
  });

  it("preserves the original start time across later events", () => {
    let state = apply(EMPTY_SUPERVISOR_CALL_STATE, answered("call-1", "t1"));
    state = apply(state, { event: "CALL_ON_HOLD", payload: { callId: "call-1", timestamp: "t9" } });
    expect(state.calls["call-1"]?.startedAt).toBe("t1");
    expect(state.calls["call-1"]?.lastTimestamp).toBe("t9");
  });

  it("prunes the row on CALL_ENDED", () => {
    let state = apply(EMPTY_SUPERVISOR_CALL_STATE, answered("call-1", "t1"));
    state = apply(state, ended("call-1", "t2"));
    expect(state.calls).toEqual({});
  });

  it("returns the same reference when CALL_ENDED arrives for an unknown leg", () => {
    const before = EMPTY_SUPERVISOR_CALL_STATE;
    const after = apply(before, ended("ghost", "t1"));
    expect(after).toBe(before);
  });
});

describe("supervisorCallsReducer — monitor sessions", () => {
  it("opens a session on own CALL_MONITOR_STARTED", () => {
    let state = apply(EMPTY_SUPERVISOR_CALL_STATE, answered("call-1", "t1"));
    state = apply(state, monitorStarted("call-1", "t2", { mode: "whisper" }));
    expect(state.sessions["call-1"]).toEqual({
      callId: "call-1",
      supervisorId: ME,
      mode: "whisper",
      startedAt: "t2",
    });
  });

  it("escalation pair updates the mode in place (ENDED clears, STARTED re-opens)", () => {
    let state = apply(EMPTY_SUPERVISOR_CALL_STATE, answered("call-1", "t1"));
    state = apply(state, monitorStarted("call-1", "t2"));
    state = apply(state, monitorEnded("call-1", "t3", { reason: "escalated" }));
    expect(state.sessions["call-1"]).toBeUndefined();
    state = apply(state, monitorStarted("call-1", "t4", { mode: "barge" }));
    expect(state.sessions["call-1"]).toMatchObject({ mode: "barge", startedAt: "t4" });
  });

  it("stops the session on own CALL_MONITOR_ENDED", () => {
    let state = apply(EMPTY_SUPERVISOR_CALL_STATE, answered("call-1", "t1"));
    state = apply(state, monitorStarted("call-1", "t2"));
    state = apply(state, monitorEnded("call-1", "t3", { reason: "stopped" }));
    expect(state.sessions).toEqual({});
  });

  it("ignores monitor events for other supervisors", () => {
    let state = apply(EMPTY_SUPERVISOR_CALL_STATE, answered("call-1", "t1"));
    state = apply(state, monitorStarted("call-1", "t2", { supervisorId: OTHER }));
    expect(state.sessions).toEqual({});
    state = apply(state, monitorStarted("call-1", "t3"));
    state = apply(state, monitorEnded("call-1", "t4", { supervisorId: OTHER }));
    expect(state.sessions["call-1"]).toBeDefined();
  });

  it("ignores monitor events when no supervisor id is known", () => {
    let state = apply(EMPTY_SUPERVISOR_CALL_STATE, answered("call-1", "t1"));
    state = apply(state, monitorStarted("call-1", "t2"), null);
    expect(state.sessions).toEqual({});
  });

  it("CALL_ENDED clears the row and the session together (no zombies)", () => {
    let state = apply(EMPTY_SUPERVISOR_CALL_STATE, answered("call-1", "t1"));
    state = apply(state, monitorStarted("call-1", "t2"));
    state = apply(state, ended("call-1", "t3"));
    expect(state.calls).toEqual({});
    expect(state.sessions).toEqual({});
  });

  it("keeps a session for a leg that left the roster view (state stays consistent)", () => {
    // A session opened via events remains tracked even if the leg's row was
    // never seen (e.g. socket was down during CALL_ANSWERED) — CALL_ENDED
    // for the leg still clears it.
    let state = apply(EMPTY_SUPERVISOR_CALL_STATE, monitorStarted("call-1", "t1"));
    expect(state.sessions["call-1"]).toBeDefined();
    state = apply(state, ended("call-1", "t2"));
    expect(state.sessions).toEqual({});
  });
});

describe("supervisorCallsReducer — reset & selectors", () => {
  it("reset returns the empty state (websocket reconnect — no ghost rows)", () => {
    let state = apply(EMPTY_SUPERVISOR_CALL_STATE, answered("call-1", "t1"));
    state = apply(state, monitorStarted("call-1", "t2"));
    state = supervisorCallsReducer(state, { type: "reset" });
    expect(state).toEqual(EMPTY_SUPERVISOR_CALL_STATE);
  });

  it("does not mutate the input state", () => {
    const initial = apply(EMPTY_SUPERVISOR_CALL_STATE, answered("call-1", "t1"));
    const snapshot = JSON.stringify(initial);
    apply(initial, { event: "CALL_ON_HOLD", payload: { callId: "call-1", timestamp: "t2" } });
    expect(JSON.stringify(initial)).toBe(snapshot);
  });

  it("selectRosterCalls sorts oldest-first", () => {
    let state = apply(EMPTY_SUPERVISOR_CALL_STATE, answered("b", "t2"));
    state = apply(state, answered("a", "t1"));
    state = apply(state, answered("c", "t3"));
    expect(selectRosterCalls(state).map((row) => row.callId)).toEqual(["a", "b", "c"]);
  });

  it("selectMonitorSession returns the session or null", () => {
    let state = apply(EMPTY_SUPERVISOR_CALL_STATE, answered("call-1", "t1"));
    expect(selectMonitorSession(state, "call-1")).toBeNull();
    state = apply(state, monitorStarted("call-1", "t2"));
    expect(selectMonitorSession(state, "call-1")?.mode).toBe("listen");
  });
});
