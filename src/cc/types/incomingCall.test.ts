import { describe, expect, it } from "vitest";
import {
  CALL_INCOMING_WS_EVENT,
  isIncomingCallEvent,
  parseIncomingCallMessage,
} from "./incomingCall";

const VALID_EVENT = {
  callId: "call-1001",
  ani: "+66811223344",
  customerId: "cust-42",
  caseId: "D260708-00001",
  agentId: "agent-101",
  timestamp: "2026-10-02T10:30:00.000Z",
};

function wsMessage(event: unknown, eventName = CALL_INCOMING_WS_EVENT) {
  return {
    type: "notification",
    timestamp: 12345,
    data: { EVENT: eventName, additionalJson: event },
  };
}

describe("isIncomingCallEvent", () => {
  it("accepts a fully populated payload", () => {
    expect(isIncomingCallEvent(VALID_EVENT)).toBe(true);
  });

  it("accepts a payload with only the required fields", () => {
    const minimal = {
      callId: "call-1001",
      ani: "0811223344",
      timestamp: "2026-10-02T10:30:00.000Z",
    };
    expect(isIncomingCallEvent(minimal)).toBe(true);
  });

  it("rejects a payload missing callId", () => {
    expect(isIncomingCallEvent({ ...VALID_EVENT, callId: undefined })).toBe(false);
  });

  it("rejects a payload with a non-string callId", () => {
    expect(isIncomingCallEvent({ ...VALID_EVENT, callId: 1001 })).toBe(false);
  });

  it("rejects a payload missing ani", () => {
    expect(isIncomingCallEvent({ ...VALID_EVENT, ani: undefined })).toBe(false);
  });

  it("rejects a payload with a blank ani", () => {
    expect(isIncomingCallEvent({ ...VALID_EVENT, ani: "   " })).toBe(false);
  });

  it("rejects a payload missing the timestamp", () => {
    expect(isIncomingCallEvent({ ...VALID_EVENT, timestamp: undefined })).toBe(false);
  });

  it("rejects a payload with non-string optional ids", () => {
    expect(isIncomingCallEvent({ ...VALID_EVENT, customerId: 42 })).toBe(false);
    expect(isIncomingCallEvent({ ...VALID_EVENT, caseId: null })).toBe(false);
  });

  it("rejects null, arrays and primitives", () => {
    expect(isIncomingCallEvent(null)).toBe(false);
    expect(isIncomingCallEvent([])).toBe(false);
    expect(isIncomingCallEvent("CALL_INCOMING")).toBe(false);
    expect(isIncomingCallEvent(42)).toBe(false);
  });
});

describe("parseIncomingCallMessage", () => {
  it("extracts the payload from a CALL_INCOMING websocket message", () => {
    const parsed = parseIncomingCallMessage(wsMessage(VALID_EVENT));
    expect(parsed).toEqual(VALID_EVENT);
  });

  it("returns null for other EVENT values", () => {
    expect(parseIncomingCallMessage(wsMessage(VALID_EVENT, "CASE-CREATE"))).toBeNull();
    expect(parseIncomingCallMessage(wsMessage(VALID_EVENT, "SLA-ESCALATION"))).toBeNull();
    expect(parseIncomingCallMessage({ type: "notification", data: {} })).toBeNull();
  });

  it("returns null when the message has no data", () => {
    expect(parseIncomingCallMessage({ type: "notification", data: null })).toBeNull();
    expect(parseIncomingCallMessage({ type: "notification" })).toBeNull();
  });

  it("returns null when additionalJson is malformed", () => {
    expect(parseIncomingCallMessage(wsMessage("not-an-object"))).toBeNull();
    expect(parseIncomingCallMessage(wsMessage({ callId: "x" }))).toBeNull();
  });

  it("returns null for a null or undefined message", () => {
    expect(parseIncomingCallMessage(null)).toBeNull();
    expect(parseIncomingCallMessage(undefined)).toBeNull();
  });
});
