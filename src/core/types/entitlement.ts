// Entitlement / SKU licensing types.
//
// Mirrors the commercial model in docs/CC-Super-App-Product-Pricing-Model.md:
// 9 SKUs bundled into Essential / Professional / Enterprise packages.
// `TenantEntitlements` is the exact shape of the future
// GET /tenants/{orgId}/entitlements envelope `data` payload — mock fixtures
// under src/core/mocks/entitlements/ carry this shape verbatim so the swap to
// a real endpoint touches only the loader.

/** SKU codes from the pricing doc's "Recommended Final Product Catalog". */
export type SkuCode =
  | "CC-CORE"
  | "CC-AGENT"
  | "CC-KB"
  | "CC-CHAT"
  | "CC-BOT"
  | "CC-GIS"
  | "CC-CAD"
  | "CC-CHANNEL"
  | "CC-SERVICE";

export type PackageTier = "essential" | "professional" | "enterprise";

/**
 * Feature keys in a dedicated `entitlement.*` namespace, deliberately
 * decoupled from RBAC permission keys (`module.action`). Entitlement answers
 * "did this tenant buy X"; RBAC answers "may this user do X".
 */
export type EntitlementFeature =
  | "entitlement.core"
  | "entitlement.agent.desktop"
  | "entitlement.kb"
  | "entitlement.kb.semantic_search"
  | "entitlement.chat"
  | "entitlement.bot"
  | "entitlement.gis"
  | "entitlement.cad"
  | "entitlement.channel.social"
  | "entitlement.audit"
  | "entitlement.rbac.advanced";

export interface EntitlementLimits {
  maxAgents: number;
  maxStorageGB: number;
  maxCasesPerMonth: number;
  maxAPICallsPerDay: number;
}

export interface TenantEntitlements {
  orgId: string;
  plan: PackageTier;
  skus: SkuCode[];
  /** Pre-resolved union of the plan preset and any add-on SKU grants. */
  features: EntitlementFeature[];
  limits: EntitlementLimits;
  seats: {
    used: number;
    max: number;
  };
  /** Reserved for per-tenant provider config set by the platform console. */
  providerConfig?: Record<string, unknown>;
  renewedAt?: string;
  expiresAt?: string;
}
