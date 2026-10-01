import { describe, expect, it } from "vitest";
import type { SlaEscalationEvent } from "@/cms/types/escalation";
import {
  buildEscalationNotification,
  escalationAlertKey,
  escalationCaseDeepLink,
  SLA_ESCALATION_EVENT_TYPE,
} from "./slaEscalationNotification";

const COPY = {
  warningMessage: "is approaching its SLA target",
  breachMessage: "has breached its SLA target",
};

function makeEvent(overrides: Partial<SlaEscalationEvent> = {}): SlaEscalationEvent {
  return {
    eventId: "ESC-1",
    caseId: "CASE-1001",
    caseNumber: "WO-1001",
    level: 1,
    type: "warning",
    targetRole: "Supervisor",
    occurredAt: "2026-10-01T11:00:00.000Z",
    slaDueAt: "2026-10-01T12:00:00.000Z",
    ...overrides,
  };
}

describe("escalationAlertKey", () => {
  it("prefers the backend idempotency key", () => {
    expect(escalationAlertKey(makeEvent({ eventId: "ESC-9" }))).toBe("ESC-9");
  });

  it("falls back to the (caseId, level, type) composite when eventId is empty", () => {
    expect(escalationAlertKey(makeEvent({ eventId: "" }))).toBe("CASE-1001#1#warning");
  });

  it("distinguishes warning and breach at the same level", () => {
    const warning = escalationAlertKey(makeEvent({ eventId: "", type: "warning" }));
    const breach = escalationAlertKey(makeEvent({ eventId: "", type: "breach" }));
    expect(warning).not.toBe(breach);
  });
});

describe("escalationCaseDeepLink", () => {
  it("points at the case detail route", () => {
    expect(escalationCaseDeepLink("CASE-1001")).toBe("/case/CASE-1001");
  });
});

describe("buildEscalationNotification", () => {
  it("maps a warning to the amber (delay=1) tier with medium sender priority", () => {
    const noti = buildEscalationNotification(makeEvent({ type: "warning" }), COPY);
    expect(noti.eventType).toBe(SLA_ESCALATION_EVENT_TYPE);
    expect(noti.senderType).toBe("medium");
    expect(noti.data.find((d) => d.key === "delay")?.value).toBe("1");
    expect(noti.message).toBe("WO-1001 is approaching its SLA target");
    expect(noti.read).toBe(false);
  });

  it("maps a breach to the red pulsing (delay=2) tier with high sender priority", () => {
    const noti = buildEscalationNotification(makeEvent({ type: "breach" }), COPY);
    expect(noti.senderType).toBe("high");
    expect(noti.data.find((d) => d.key === "delay")?.value).toBe("2");
    expect(noti.message).toBe("WO-1001 has breached its SLA target");
  });

  it("deep-links to the case and carries the case id in data", () => {
    const noti = buildEscalationNotification(makeEvent(), COPY);
    expect(noti.redirectURL).toBe("/case/CASE-1001");
    expect(noti.data.find((d) => d.key === "redirectURL")?.value).toBe("/case/CASE-1001");
    expect(noti.data.find((d) => d.key === "caseId")?.value).toBe("CASE-1001");
  });

  it("uses the server timestamp and targets the role recipient", () => {
    const noti = buildEscalationNotification(makeEvent(), COPY);
    expect(noti.createdAt).toBe("2026-10-01T11:00:00.000Z");
    expect(noti.recipients).toEqual([{ type: "role", value: "Supervisor" }]);
    expect(noti.sender).toBe("Supervisor");
  });

  it("falls back to the case id when no case number is supplied", () => {
    const noti = buildEscalationNotification(makeEvent({ caseNumber: undefined }), COPY);
    expect(noti.message).toContain("CASE-1001");
  });
});
