import { describe, it, expect } from "vitest";
import {
  ENTITLEMENT_FIXTURES,
  FIXTURE_TENANT_NAMES,
  isTenantEntitlements,
  resolveFixture,
} from "./index";

describe("entitlement fixture registry", () => {
  it("every registered fixture satisfies the TenantEntitlements shape", () => {
    for (const [key, fixture] of Object.entries(ENTITLEMENT_FIXTURES)) {
      expect(isTenantEntitlements(fixture), `fixture ${key}`).toBe(true);
    }
  });

  it("resolves fixtures by organization name", () => {
    expect(resolveFixture("BMA").plan).toBe("enterprise");
    expect(resolveFixture("SIH").plan).toBe("professional");
    expect(resolveFixture("SKY-AI").plan).toBe("essential");
  });

  it("matches organization names trim + case-insensitively", () => {
    expect(resolveFixture("bma").plan).toBe("enterprise");
    expect(resolveFixture(" BMA ").plan).toBe("enterprise");
    expect(resolveFixture("Sih").plan).toBe("professional");
    expect(resolveFixture("sky-ai").plan).toBe("essential");
  });

  it("falls back to the Essential default for unknown or missing orgs", () => {
    expect(resolveFixture("UNKNOWN-ORG").plan).toBe("essential");
    expect(resolveFixture(undefined).plan).toBe("essential");
    expect(resolveFixture(null).plan).toBe("essential");
  });

  it("stamps the requesting org key onto the resolved payload", () => {
    expect(resolveFixture("UNKNOWN-ORG").orgId).toBe("UNKNOWN-ORG");
    expect(resolveFixture("BMA").orgId).toBe("BMA");
  });

  it("does not share mutable state between resolutions", () => {
    const first = resolveFixture("SIH");
    first.seats.used = 9999;
    first.features.length = 0;
    const second = resolveFixture("SIH");
    expect(second.seats.used).toBe(80);
    expect(second.features.length).toBeGreaterThan(0);
  });

  it("exposes tenant display names for the login selector", () => {
    expect(FIXTURE_TENANT_NAMES).toEqual(
      expect.arrayContaining(["BMA", "SIH", "SKY-AI"]),
    );
  });
});

describe("isTenantEntitlements", () => {
  it("rejects truthy-but-wrong payloads", () => {
    expect(isTenantEntitlements([])).toBe(false);
    expect(isTenantEntitlements({ status: "-1", msg: "failed", data: null })).toBe(false);
    expect(isTenantEntitlements({ orgId: "X", plan: "essential" })).toBe(false);
  });
});
