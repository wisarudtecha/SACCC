// Pins the two staff cadences the org can configure (Phase C1/C3).
//
// Every case here is a wrong value that "works": a 0ms interval is a busy loop,
// a 15s poll is 4x the requests the server was sized for, and a "manual"
// tracking setting that still sets a timer keeps spending a request per case
// after the dispatcher explicitly turned it off.
import { describe, expect, it } from "vitest";
import type { AutoManualSetting } from "@/core/types/organization";
import {
  ETA_TTL_DEFAULT_TICK_MS,
  TRACKING_DEFAULT_POLL_MS,
  TRACKING_MIN_POLL_MS,
  resolveEtaTtlTickMs,
  resolveTrackingEffectiveSeconds,
  resolveTrackingPollMs,
} from "./staffCadence";

const auto = (autoIntervalSeconds: number | null): AutoManualSetting => ({
  mode: "auto",
  autoIntervalSeconds,
});

const manual: AutoManualSetting = { mode: "manual", autoIntervalSeconds: null };

describe("resolveEtaTtlTickMs", () => {
  it("keeps the 30s tick under manual mode - the countdown is display-only", () => {
    expect(resolveEtaTtlTickMs(manual)).toBe(ETA_TTL_DEFAULT_TICK_MS);
  });

  it("uses the configured interval under auto mode", () => {
    expect(resolveEtaTtlTickMs(auto(60))).toBe(60_000);
    expect(resolveEtaTtlTickMs(auto(15))).toBe(15_000);
  });

  it("falls back to 30s for a malformed interval instead of busy-looping", () => {
    // 0 / negative / NaN must never reach setInterval: a 0ms timer re-renders the
    // dashboard as fast as the CPU allows.
    expect(resolveEtaTtlTickMs(auto(0))).toBe(ETA_TTL_DEFAULT_TICK_MS);
    expect(resolveEtaTtlTickMs(auto(-5))).toBe(ETA_TTL_DEFAULT_TICK_MS);
    expect(resolveEtaTtlTickMs(auto(null))).toBe(ETA_TTL_DEFAULT_TICK_MS);
    expect(resolveEtaTtlTickMs(auto(Number.NaN))).toBe(ETA_TTL_DEFAULT_TICK_MS);
  });

  it("falls back to 30s below the schema floor", () => {
    expect(resolveEtaTtlTickMs(auto(5))).toBe(ETA_TTL_DEFAULT_TICK_MS);
    expect(resolveEtaTtlTickMs(auto(14.9))).toBe(ETA_TTL_DEFAULT_TICK_MS);
  });

  it("survives a missing setting", () => {
    expect(resolveEtaTtlTickMs(null)).toBe(ETA_TTL_DEFAULT_TICK_MS);
    expect(resolveEtaTtlTickMs(undefined)).toBe(ETA_TTL_DEFAULT_TICK_MS);
  });
});

describe("resolveTrackingPollMs", () => {
  it("sets no timer under manual mode (D6)", () => {
    expect(resolveTrackingPollMs(manual)).toBeNull();
  });

  it("polls at the configured interval under auto mode", () => {
    expect(resolveTrackingPollMs(auto(60))).toBe(60_000);
    expect(resolveTrackingPollMs(auto(120))).toBe(120_000);
  });

  it("raises a too-fast interval to the 30s floor (D7)", () => {
    // The schema accepts 15s; the server does not.
    expect(resolveTrackingPollMs(auto(15))).toBe(TRACKING_MIN_POLL_MS);
    expect(resolveTrackingPollMs(auto(29))).toBe(TRACKING_MIN_POLL_MS);
    expect(resolveTrackingPollMs(auto(30))).toBe(TRACKING_MIN_POLL_MS);
  });

  it("keeps the default cadence when the interval is malformed", () => {
    expect(resolveTrackingPollMs(auto(null))).toBe(TRACKING_DEFAULT_POLL_MS);
    expect(resolveTrackingPollMs(auto(0))).toBe(TRACKING_DEFAULT_POLL_MS);
    expect(resolveTrackingPollMs(auto(Number.NaN))).toBe(TRACKING_DEFAULT_POLL_MS);
  });

  it("sets no timer when the setting is missing", () => {
    expect(resolveTrackingPollMs(null)).toBeNull();
    expect(resolveTrackingPollMs(undefined)).toBeNull();
  });
});

describe("resolveTrackingEffectiveSeconds", () => {
  it("quotes the clamped value back to the admin", () => {
    expect(resolveTrackingEffectiveSeconds(auto(15))).toBe(30);
    expect(resolveTrackingEffectiveSeconds(auto(120))).toBe(120);
  });

  it("reports no interval under manual mode", () => {
    expect(resolveTrackingEffectiveSeconds(manual)).toBeNull();
  });
});
