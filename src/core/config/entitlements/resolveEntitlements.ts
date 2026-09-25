import type {
  EntitlementFeature,
  EntitlementLimits,
  PackageTier,
  SkuCode,
  TenantEntitlements,
} from "@/core/types/entitlement";
import { FEATURE_CATALOG } from "./featureCatalog";
import {
  ENTERPRISE_EXTRA_FEATURES,
  PACKAGE_PRESETS,
  PACKAGE_TIER_ORDER,
} from "./packages";
import { SKU_CATALOG } from "./skuCatalog";

/** SKUs bundled into a package tier. Unknown tiers resolve to none. */
export function resolveSkusForPlan(plan: PackageTier): SkuCode[] {
  return PACKAGE_PRESETS[plan]?.skus ?? [];
}

/**
 * Union of features granted by a plan plus any add-on SKUs.
 * The plan's bundled SKUs are always included; extra SKUs (à-la-carte
 * add-ons) are merged on top. Enterprise-only extras (semantic search,
 * audit, advanced RBAC) attach to the enterprise tier.
 */
export function resolveFeatures(
  plan: PackageTier,
  addonSkus: SkuCode[] = [],
): EntitlementFeature[] {
  const skuSet = new Set<SkuCode>([...resolveSkusForPlan(plan), ...addonSkus]);
  const features = new Set<EntitlementFeature>();

  for (const sku of skuSet) {
    const entry = SKU_CATALOG[sku];
    if (!entry) continue;
    for (const feature of entry.features) {
      features.add(feature);
    }
  }

  if (plan === "enterprise") {
    for (const feature of ENTERPRISE_EXTRA_FEATURES) {
      features.add(feature);
    }
  }

  return [...features];
}

/** True when the entitlement set is loaded and grants the feature. */
export function hasFeature(
  set: TenantEntitlements | null,
  feature: EntitlementFeature,
): boolean {
  if (!set || !Array.isArray(set.features)) return false;
  return set.features.includes(feature);
}

export function hasAnyFeature(
  set: TenantEntitlements | null,
  features: EntitlementFeature[],
): boolean {
  return features.some((feature) => hasFeature(set, feature));
}

export function getLimit(
  set: TenantEntitlements | null,
  key: keyof EntitlementLimits,
): number | null {
  if (!set || !set.limits) return null;
  const value = set.limits[key];
  return typeof value === "number" ? value : null;
}

/** Minimum package tier that includes the feature (for upsell copy). */
export function minTierForFeature(feature: EntitlementFeature): PackageTier {
  return FEATURE_CATALOG[feature]?.requiredTier ?? "enterprise";
}

/**
 * True when `tier` is at least `required` on the
 * essential → professional → enterprise ladder.
 */
export function tierMeetsRequirement(
  tier: PackageTier,
  required: PackageTier,
): boolean {
  return PACKAGE_TIER_ORDER.indexOf(tier) >= PACKAGE_TIER_ORDER.indexOf(required);
}
