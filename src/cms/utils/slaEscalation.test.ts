import { describe, expect, it } from "vitest";
import { deriveSlaState, escalationDedupeKey, slaStateToBadgeColor } from "./slaEscalation";

// Fixed reference clock: 2026-10-01T12:00:00.000Z
const NOW = new Date("2026-10-01T12:00:00.000Z").getTime();
const MINUTE_MS = 60 * 1000;

/** createdAt such that `elapsedMin` of a `slaMin` window has passed at NOW. */
function createdAtFor(elapsedMin: number): string {
  return new Date(NOW - elapsedMin * MINUTE_MS).toISOString();
}

describe("deriveSlaState", () => {
  it("returns normal early in the SLA window", () => {
    // 50% of a 60-minute SLA elapsed, threshold 80%
    expect(deriveSlaState(createdAtFor(30), 60, 80, NOW)).toBe("normal");
  });

  it("returns warning exactly at the threshold boundary", () => {
    // 48 of 60 minutes = exactly 80%
    expect(deriveSlaState(createdAtFor(48), 60, 80, NOW)).toBe("warning");
  });

  it("returns warning past the threshold but before the due time", () => {
    // 54 of 60 minutes = 90%
    expect(deriveSlaState(createdAtFor(54), 60, 80, NOW)).toBe("warning");
  });

  it("returns breached at the exact due time", () => {
    expect(deriveSlaState(createdAtFor(60), 60, 80, NOW)).toBe("breached");
  });

  it("returns breached past the due time", () => {
    expect(deriveSlaState(createdAtFor(60 * 24 * 11), 60, 80, NOW)).toBe("breached");
  });

  it("uses the 80% default when no threshold is given", () => {
    expect(deriveSlaState(createdAtFor(47), 60, undefined, NOW)).toBe("normal");
    expect(deriveSlaState(createdAtFor(48), 60, undefined, NOW)).toBe("warning");
  });

  it("honours a custom threshold", () => {
    // 30 of 60 = 50%
    expect(deriveSlaState(createdAtFor(30), 60, 50, NOW)).toBe("warning");
    expect(deriveSlaState(createdAtFor(30), 60, 51, NOW)).toBe("normal");
  });

  it("clamps an out-of-range threshold instead of mis-firing", () => {
    // threshold 0 would warn at 0% elapsed; clamped to 1% instead
    expect(deriveSlaState(createdAtFor(0), 60, 0, NOW)).toBe("normal");
    // threshold 100 would never warn before breach; clamped to 99%
    expect(deriveSlaState(createdAtFor(59.5), 60, 100, NOW)).toBe("warning");
  });

  it("returns normal for missing or invalid inputs, never a false breach", () => {
    expect(deriveSlaState(null, 60, 80, NOW)).toBe("normal");
    expect(deriveSlaState(undefined, 60, 80, NOW)).toBe("normal");
    expect(deriveSlaState(createdAtFor(30), null, 80, NOW)).toBe("normal");
    expect(deriveSlaState(createdAtFor(30), undefined, 80, NOW)).toBe("normal");
    expect(deriveSlaState("not-a-date", 60, 80, NOW)).toBe("normal");
    expect(deriveSlaState(createdAtFor(30), 0, 80, NOW)).toBe("normal");
    expect(deriveSlaState(createdAtFor(30), -10, 80, NOW)).toBe("normal");
    expect(deriveSlaState(createdAtFor(30), Number.NaN, 80, NOW)).toBe("normal");
  });

  it("accepts epoch numbers and Date objects for createdAt", () => {
    const createdMs = NOW - 54 * MINUTE_MS;
    expect(deriveSlaState(createdMs, 60, 80, NOW)).toBe("warning");
    expect(deriveSlaState(new Date(createdMs), 60, 80, NOW)).toBe("warning");
  });
});

describe("slaStateToBadgeColor", () => {
  it("maps states to the existing Badge color names", () => {
    expect(slaStateToBadgeColor("normal")).toBe("primary");
    expect(slaStateToBadgeColor("warning")).toBe("warning");
    expect(slaStateToBadgeColor("breached")).toBe("error");
  });
});

describe("escalationDedupeKey", () => {
  it("is stable per (caseId, level) pair", () => {
    expect(escalationDedupeKey("CASE-1", 1)).toBe("CASE-1#1");
    expect(escalationDedupeKey("CASE-1", 1)).toBe(escalationDedupeKey("CASE-1", 1));
    expect(escalationDedupeKey("CASE-1", 2)).not.toBe(escalationDedupeKey("CASE-1", 1));
    expect(escalationDedupeKey("CASE-2", 1)).not.toBe(escalationDedupeKey("CASE-1", 1));
  });
});
