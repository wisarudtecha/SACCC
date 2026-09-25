import type { PackageTier, SkuCode } from "@/core/types/entitlement";

export interface PackagePreset {
  /** i18n key for the package display name. */
  labelKey: string;
  /** THB per agent per month, per the pricing doc baseline. */
  pricePerAgentThb: number;
  /** SKUs bundled into this tier. */
  skus: SkuCode[];
}

/**
 * Commercial packages from the pricing doc:
 * Essential ฿1,500 / Professional ฿2,500 / Enterprise ฿4,000 per agent/month.
 * Tiers are cumulative — each includes the previous tier's SKUs.
 */
export const PACKAGE_PRESETS: Record<PackageTier, PackagePreset> = {
  essential: {
    labelKey: "entitlement.plan.essential",
    pricePerAgentThb: 1500,
    skus: ["CC-CORE", "CC-AGENT", "CC-KB"],
  },
  professional: {
    labelKey: "entitlement.plan.professional",
    pricePerAgentThb: 2500,
    skus: ["CC-CORE", "CC-AGENT", "CC-KB", "CC-CHAT", "CC-CHANNEL"],
  },
  enterprise: {
    labelKey: "entitlement.plan.enterprise",
    pricePerAgentThb: 4000,
    skus: [
      "CC-CORE",
      "CC-AGENT",
      "CC-KB",
      "CC-CHAT",
      "CC-CHANNEL",
      "CC-GIS",
      "CC-CAD",
      "CC-BOT",
    ],
  },
};

/** Enterprise-only feature grants not tied to a bundled SKU's base feature. */
export const ENTERPRISE_EXTRA_FEATURES = [
  "entitlement.kb.semantic_search",
  "entitlement.audit",
  "entitlement.rbac.advanced",
] as const;

export const PACKAGE_TIER_ORDER: PackageTier[] = [
  "essential",
  "professional",
  "enterprise",
];
