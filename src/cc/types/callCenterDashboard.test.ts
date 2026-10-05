import { describe, expect, it } from "vitest";
import fixture from "@/cc/mocks/callCenterDashboard.json";
import {
  extractDashboardSnapshot,
  formatDashboardPeriod,
  isCallCenterDashboardSnapshot,
  isSnapshotEmpty,
  normalizeDashboardPeriod,
} from "./callCenterDashboard";

/** Canonical fixture — contract §10 test vector (arch-doc §06 mock numbers). */
const canonicalSnapshot = {
  period: "2026-10",
  summary: {
    totalCalls: 331,
    answeredCalls: 315,
    answeredRatePct: 95.2,
    avgDurationSeconds: 754,
    satisfactionPct: 91,
    totalCallsDeltaPct: 5.0,
  },
  dailyVolume: [
    { date: "2026-10-05", totalCalls: 45, answeredCalls: 42 },
    { date: "2026-10-06", totalCalls: 52, answeredCalls: 50 },
  ],
  callTypeDistribution: [
    { typeKey: "technical_support", label: "Technical Support", count: 35 },
    { typeKey: "billing_inquiry", label: "Billing Inquiry", count: 25 },
    { typeKey: "service_request", label: "Service Request", count: 30 },
    { typeKey: "other", label: "Other", count: 10 },
  ],
  agentPerformance: [
    {
      agentId: "agent-101",
      agentName: "John Smith",
      callsHandled: 125,
      efficiencyPct: 88,
      satisfactionPct: 92,
    },
    {
      agentId: "agent-102",
      agentName: "Jane Doe",
      callsHandled: 118,
      efficiencyPct: 91,
      satisfactionPct: 95,
    },
  ],
};

/** Contract §6 empty snapshot — a valid payload, not an error. */
const emptySnapshot = {
  period: "2026-12",
  summary: {
    totalCalls: 0,
    answeredCalls: 0,
    answeredRatePct: 0,
    avgDurationSeconds: 0,
  },
  dailyVolume: [],
  callTypeDistribution: [],
  agentPerformance: [],
};

describe("isCallCenterDashboardSnapshot", () => {
  it("accepts the canonical contract fixture", () => {
    expect(isCallCenterDashboardSnapshot(canonicalSnapshot)).toBe(true);
  });

  it("accepts the empty snapshot (valid, not an error)", () => {
    expect(isCallCenterDashboardSnapshot(emptySnapshot)).toBe(true);
  });

  it("accepts a snapshot with every optional field omitted (no CSAT yet — contract Q2)", () => {
    const noCsat = {
      period: "2026-10",
      summary: {
        totalCalls: 331,
        answeredCalls: 315,
        answeredRatePct: 95.2,
        avgDurationSeconds: 754,
      },
      dailyVolume: [{ date: "2026-10-05", totalCalls: 45, answeredCalls: 42 }],
      callTypeDistribution: [],
      agentPerformance: [
        { agentId: "agent-101", agentName: "John Smith", callsHandled: 125 },
      ],
    };
    expect(isCallCenterDashboardSnapshot(noCsat)).toBe(true);
  });

  it("rejects null optionals (the classic integration bug — contract sharp edge)", () => {
    expect(
      isCallCenterDashboardSnapshot({
        ...canonicalSnapshot,
        summary: { ...canonicalSnapshot.summary, satisfactionPct: null },
      })
    ).toBe(false);
    expect(
      isCallCenterDashboardSnapshot({
        ...canonicalSnapshot,
        agentPerformance: [
          { ...canonicalSnapshot.agentPerformance[0], efficiencyPct: null },
        ],
      })
    ).toBe(false);
  });

  it("rejects the [] that normalizeToApiResponse substitutes for absent data", () => {
    expect(isCallCenterDashboardSnapshot([])).toBe(false);
  });

  it("rejects a snapshot with a missing or malformed summary", () => {
    const withoutSummary = {
      period: canonicalSnapshot.period,
      dailyVolume: canonicalSnapshot.dailyVolume,
      callTypeDistribution: canonicalSnapshot.callTypeDistribution,
      agentPerformance: canonicalSnapshot.agentPerformance,
    };
    expect(isCallCenterDashboardSnapshot(withoutSummary)).toBe(false);
    expect(
      isCallCenterDashboardSnapshot({
        ...canonicalSnapshot,
        summary: { totalCalls: 331 },
      })
    ).toBe(false);
  });

  it("rejects malformed collection entries", () => {
    expect(
      isCallCenterDashboardSnapshot({
        ...canonicalSnapshot,
        dailyVolume: [{ date: "2026-10-05", totalCalls: "45", answeredCalls: 42 }],
      })
    ).toBe(false);
    expect(
      isCallCenterDashboardSnapshot({
        ...canonicalSnapshot,
        callTypeDistribution: [{ typeKey: "  ", count: 10 }],
      })
    ).toBe(false);
    expect(
      isCallCenterDashboardSnapshot({
        ...canonicalSnapshot,
        agentPerformance: [{ agentId: "agent-101", callsHandled: 125 }],
      })
    ).toBe(false);
  });

  it("rejects non-objects and null", () => {
    expect(isCallCenterDashboardSnapshot(null)).toBe(false);
    expect(isCallCenterDashboardSnapshot("snapshot")).toBe(false);
    expect(isCallCenterDashboardSnapshot(42)).toBe(false);
  });
});

describe("extractDashboardSnapshot", () => {
  it("extracts the snapshot from a resolved ApiResponse envelope", () => {
    const extracted = extractDashboardSnapshot({
      status: "1",
      msg: "success",
      data: canonicalSnapshot,
    });
    expect(extracted).toEqual(canonicalSnapshot);
  });

  it("returns null when data is absent (coerced to [] upstream)", () => {
    expect(extractDashboardSnapshot({ status: "1", msg: "success" })).toBeNull();
  });

  it("returns null when data is explicitly null", () => {
    expect(
      extractDashboardSnapshot({ status: "1", msg: "success", data: null })
    ).toBeNull();
  });

  it("returns null when data has the wrong shape", () => {
    expect(
      extractDashboardSnapshot({ status: "1", data: { period: "2026-10" } })
    ).toBeNull();
  });

  it("returns null for a non-object response", () => {
    expect(extractDashboardSnapshot(undefined)).toBeNull();
    expect(extractDashboardSnapshot("error")).toBeNull();
  });
});

describe("isSnapshotEmpty", () => {
  it("classifies the contract §6 empty snapshot as empty", () => {
    expect(isSnapshotEmpty(emptySnapshot)).toBe(true);
  });

  it("classifies the canonical fixture as non-empty", () => {
    expect(isSnapshotEmpty(canonicalSnapshot)).toBe(false);
  });

  it("treats a snapshot with any activity as non-empty", () => {
    expect(
      isSnapshotEmpty({ ...emptySnapshot, callTypeDistribution: [{ typeKey: "other", count: 1 }] })
    ).toBe(false);
  });
});

describe("mock fixture (contract §10 vector)", () => {
  it("passes the snapshot guard — the demo data can never poison the UI with a cast", () => {
    expect(isCallCenterDashboardSnapshot(fixture)).toBe(true);
  });

  it("extracts cleanly through the ApiResponse envelope reader", () => {
    expect(extractDashboardSnapshot({ status: "1", data: fixture })).toEqual(fixture);
  });
});

describe("formatDashboardPeriod", () => {
  it("formats a single-digit month with a leading zero", () => {
    expect(formatDashboardPeriod(new Date(2026, 9, 5))).toBe("2026-10");
  });

  it("formats January and December correctly", () => {
    expect(formatDashboardPeriod(new Date(2026, 0, 15))).toBe("2026-01");
    expect(formatDashboardPeriod(new Date(2026, 11, 31))).toBe("2026-12");
  });
});

describe("normalizeDashboardPeriod", () => {
  it("passes a valid period through unchanged", () => {
    expect(normalizeDashboardPeriod("2026-10")).toBe("2026-10");
    expect(normalizeDashboardPeriod("2026-01")).toBe("2026-01");
    expect(normalizeDashboardPeriod("2026-12")).toBe("2026-12");
  });

  it("falls back to the current month for a cleared month input", () => {
    expect(normalizeDashboardPeriod("", new Date(2026, 9, 5))).toBe("2026-10");
  });

  it("rejects months outside 01–12 and malformed strings", () => {
    const fallback = new Date(2026, 8, 1);
    expect(normalizeDashboardPeriod("2026-13", fallback)).toBe("2026-09");
    expect(normalizeDashboardPeriod("2026-00", fallback)).toBe("2026-09");
    expect(normalizeDashboardPeriod("2026-1", fallback)).toBe("2026-09");
    expect(normalizeDashboardPeriod("26-10", fallback)).toBe("2026-09");
    expect(normalizeDashboardPeriod("2026/10", fallback)).toBe("2026-09");
    expect(normalizeDashboardPeriod("2026-10-05", fallback)).toBe("2026-09");
  });
});
