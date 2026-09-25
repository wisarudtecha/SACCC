import { describe, it, expect } from "vitest";
import type { TenantEntitlements } from "@/core/types/entitlement";
import {
  getLimit,
  hasAnyFeature,
  hasFeature,
  minTierForFeature,
  resolveFeatures,
  resolveSkusForPlan,
  tierMeetsRequirement,
} from "./resolveEntitlements";

const entitlementSet = (
  overrides: Partial<TenantEntitlements> = {},
): TenantEntitlements => ({
  orgId: "org-1",
  plan: "professional",
  skus: ["CC-CORE", "CC-AGENT", "CC-KB", "CC-CHAT", "CC-CHANNEL"],
  features: resolveFeatures("professional"),
  limits: {
    maxAgents: 250,
    maxStorageGB: 100,
    maxCasesPerMonth: 50000,
    maxAPICallsPerDay: 100000,
  },
  seats: { used: 80, max: 250 },
  ...overrides,
});

describe("resolveSkusForPlan", () => {
  it("expands the essential tier to core, agent, and KB SKUs", () => {
    expect(resolveSkusForPlan("essential")).toEqual([
      "CC-CORE",
      "CC-AGENT",
      "CC-KB",
    ]);
  });

  it("is cumulative — professional includes the essential SKUs", () => {
    const skus = resolveSkusForPlan("professional");
    expect(skus).toEqual(expect.arrayContaining(["CC-CORE", "CC-AGENT", "CC-KB"]));
    expect(skus).toEqual(expect.arrayContaining(["CC-CHAT", "CC-CHANNEL"]));
  });

  it("enterprise adds GIS, CAD, and BOT", () => {
    const skus = resolveSkusForPlan("enterprise");
    expect(skus).toEqual(expect.arrayContaining(["CC-GIS", "CC-CAD", "CC-BOT"]));
  });
});

describe("resolveFeatures", () => {
  it("essential grants core, agent desktop, and KB only", () => {
    const features = resolveFeatures("essential");
    expect(features).toEqual(
      expect.arrayContaining([
        "entitlement.core",
        "entitlement.agent.desktop",
        "entitlement.kb",
      ]),
    );
    expect(features).not.toContain("entitlement.chat");
    expect(features).not.toContain("entitlement.gis");
    expect(features).not.toContain("entitlement.audit");
  });

  it("professional adds chat and social channels but not GIS/CAD", () => {
    const features = resolveFeatures("professional");
    expect(features).toContain("entitlement.chat");
    expect(features).toContain("entitlement.channel.social");
    expect(features).not.toContain("entitlement.gis");
    expect(features).not.toContain("entitlement.cad");
  });

  it("enterprise adds GIS, CAD, bot, semantic search, audit, and advanced RBAC", () => {
    const features = resolveFeatures("enterprise");
    expect(features).toEqual(
      expect.arrayContaining([
        "entitlement.gis",
        "entitlement.cad",
        "entitlement.bot",
        "entitlement.kb.semantic_search",
        "entitlement.audit",
        "entitlement.rbac.advanced",
      ]),
    );
  });

  it("merges à-la-carte add-on SKUs on top of the plan", () => {
    const features = resolveFeatures("essential", ["CC-GIS"]);
    expect(features).toContain("entitlement.gis");
    expect(features).not.toContain("entitlement.cad");
  });

  it("returns no duplicates when add-ons overlap the plan", () => {
    const features = resolveFeatures("professional", ["CC-CHAT"]);
    expect(new Set(features).size).toBe(features.length);
  });
});

describe("hasFeature / hasAnyFeature", () => {
  it("returns true for granted features and false for withheld ones", () => {
    const set = entitlementSet();
    expect(hasFeature(set, "entitlement.chat")).toBe(true);
    expect(hasFeature(set, "entitlement.gis")).toBe(false);
  });

  it("is fail-closed for a null set or a malformed features payload", () => {
    expect(hasFeature(null, "entitlement.core")).toBe(false);
    const malformed = entitlementSet({ features: undefined as never });
    expect(hasFeature(malformed, "entitlement.core")).toBe(false);
  });

  it("hasAnyFeature is true when any one feature is granted", () => {
    const set = entitlementSet();
    expect(hasAnyFeature(set, ["entitlement.gis", "entitlement.chat"])).toBe(true);
    expect(hasAnyFeature(set, ["entitlement.gis", "entitlement.cad"])).toBe(false);
  });
});

describe("getLimit", () => {
  it("returns the numeric limit and null for a null set", () => {
    expect(getLimit(entitlementSet(), "maxAgents")).toBe(250);
    expect(getLimit(null, "maxAgents")).toBeNull();
  });
});

describe("minTierForFeature / tierMeetsRequirement", () => {
  it("reports the minimum tier per the feature catalog", () => {
    expect(minTierForFeature("entitlement.gis")).toBe("enterprise");
    expect(minTierForFeature("entitlement.chat")).toBe("professional");
    expect(minTierForFeature("entitlement.kb")).toBe("essential");
  });

  it("compares tiers on the essential → professional → enterprise ladder", () => {
    expect(tierMeetsRequirement("enterprise", "professional")).toBe(true);
    expect(tierMeetsRequirement("professional", "enterprise")).toBe(false);
    expect(tierMeetsRequirement("essential", "essential")).toBe(true);
  });
});
