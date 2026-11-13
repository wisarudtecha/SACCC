// src/core/config/featureFlags.test.ts
//
// Pins the DEFAULT-ON contract of the two presentation flags.
//
// Why this test exists: the flag is read as `!== "false"`, not `=== "true"`,
// because `.env` / `.env.*` are gitignored in this repo — most environments that
// run this build have never been given the key. If someone "tidies" the read
// into `=== "true"`, every one of those environments silently loses the IoT
// case form and every entitlement notice, with nothing failing to compile.
//
// The second half asserts the same thing through the real module entry points:
// an absent variable must resolve to ON, an explicit "false" to OFF.
import { afterEach, describe, expect, it, vi } from "vitest";
import { readFlag } from "./featureFlags";

describe("readFlag (default ON)", () => {
  it("treats an absent value as ON", () => {
    expect(readFlag(undefined)).toBe(true);
  });

  it("treats an empty value as ON", () => {
    expect(readFlag("")).toBe(true);
  });

  it("treats an unrecognised value as ON", () => {
    // Only the literal "false" turns a surface off - a typo keeps today's UI.
    expect(readFlag("0")).toBe(true);
    expect(readFlag("off")).toBe(true);
    expect(readFlag("no")).toBe(true);
  });

  it("treats the literal false (any case, padded) as OFF", () => {
    expect(readFlag("false")).toBe(false);
    expect(readFlag("FALSE")).toBe(false);
    expect(readFlag(" false ")).toBe(false);
  });

  it("treats the literal true as ON", () => {
    expect(readFlag("true")).toBe(true);
  });
});

describe("feature flag constants", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("resolves both flags ON when the variables are absent", async () => {
    vi.stubEnv("VITE_SHOW_CASE_IOT", "");
    vi.stubEnv("VITE_SHOW_ENTITLEMENT_UPSELL", "");
    vi.resetModules();

    const flags = await import("./featureFlags");

    expect(flags.CASE_IOT_ENABLED).toBe(true);
    expect(flags.ENTITLEMENT_UPSELL_ENABLED).toBe(true);
  });

  it("resolves both flags OFF when the variables are the literal false", async () => {
    vi.stubEnv("VITE_SHOW_CASE_IOT", "false");
    vi.stubEnv("VITE_SHOW_ENTITLEMENT_UPSELL", "false");
    vi.resetModules();

    const flags = await import("./featureFlags");

    expect(flags.CASE_IOT_ENABLED).toBe(false);
    expect(flags.ENTITLEMENT_UPSELL_ENABLED).toBe(false);
  });
});
