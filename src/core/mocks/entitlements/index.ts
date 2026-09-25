import type { TenantEntitlements } from "@/core/types/entitlement";
import bmaFixture from "./bma.json";
import sihFixture from "./sih.json";
import skyAiFixture from "./sky-ai.json";
import defaultFixture from "./default.json";

/**
 * Per-tenant entitlement fixtures, keyed by the login-time organization
 * string (`user.organization` — e.g. "BMA", "SKY-AI"). Each fixture carries
 * the exact `TenantEntitlements` shape of the future
 * GET /tenants/{orgId}/entitlements envelope `data` payload.
 *
 * When the real endpoint lands, the loader in entitlementSlice.ts switches
 * source (and re-keys to `user.orgId`) in one place — nothing below changes.
 */
export const ENTITLEMENT_FIXTURES: Record<string, TenantEntitlements> = {
  BMA: bmaFixture as TenantEntitlements,
  SIH: sihFixture as TenantEntitlements,
  "SKY-AI": skyAiFixture as TenantEntitlements,
};

const FALLBACK = defaultFixture as TenantEntitlements;

/** Display names for the login tenant selector. */
export const FIXTURE_TENANT_NAMES: string[] = Object.keys(ENTITLEMENT_FIXTURES);

/**
 * Runtime shape guard — mirrors the isAreaCountryTree precedent. A resolved
 * response can carry a truthy-but-empty payload, so validate the *shape*,
 * never truthiness.
 */
export function isTenantEntitlements(
  value: unknown,
): value is TenantEntitlements {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<TenantEntitlements>;
  return (
    typeof candidate.orgId === "string" &&
    typeof candidate.plan === "string" &&
    Array.isArray(candidate.skus) &&
    Array.isArray(candidate.features) &&
    !!candidate.limits &&
    typeof candidate.limits.maxAgents === "number" &&
    !!candidate.seats &&
    typeof candidate.seats.used === "number" &&
    typeof candidate.seats.max === "number"
  );
}

/**
 * Look up the fixture for an organization name; falls back to the Essential
 * default for unknown orgs so a new tenant always gets a working baseline.
 * Matching is trim + case-insensitive: the org string comes from a server
 * payload whose casing/whitespace we don't control.
 */
export function resolveFixture(orgKey: string | undefined | null): TenantEntitlements {
  const normalized = orgKey?.trim().toUpperCase();
  if (normalized) {
    const fixture = ENTITLEMENT_FIXTURES_LOOKUP[normalized];
    if (fixture && isTenantEntitlements(fixture)) {
      return { ...structuredClone(fixture), orgId: orgKey as string };
    }
  }
  return { ...structuredClone(FALLBACK), orgId: orgKey ?? FALLBACK.orgId };
}

const ENTITLEMENT_FIXTURES_LOOKUP: Record<string, TenantEntitlements> =
  Object.fromEntries(
    Object.entries(ENTITLEMENT_FIXTURES).map(([key, fixture]) => [
      key.toUpperCase(),
      fixture,
    ]),
  );
