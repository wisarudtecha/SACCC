import type {
  EntitlementFeature,
  PackageTier,
  SkuCode,
} from "@/core/types/entitlement";

export interface FeatureCatalogEntry {
  /** i18n key for the feature display name (lock badges, upsell copy). */
  labelKey: string;
  /** Minimum package tier that includes this feature. */
  requiredTier: PackageTier;
  /** SKU that grants this feature. */
  sku: SkuCode;
}

/**
 * One entry per entitlement feature key. `requiredTier` drives the
 * "requires Enterprise" upsell messaging — it is the *minimum* tier whose
 * package preset includes the granting SKU.
 */
export const FEATURE_CATALOG: Record<EntitlementFeature, FeatureCatalogEntry> = {
  "entitlement.core": {
    labelKey: "entitlement.feature.core.label",
    requiredTier: "essential",
    sku: "CC-CORE",
  },
  "entitlement.agent.desktop": {
    labelKey: "entitlement.feature.agent_desktop.label",
    requiredTier: "essential",
    sku: "CC-AGENT",
  },
  "entitlement.kb": {
    labelKey: "entitlement.feature.kb.label",
    requiredTier: "essential",
    sku: "CC-KB",
  },
  "entitlement.kb.semantic_search": {
    labelKey: "entitlement.feature.kb_semantic_search.label",
    requiredTier: "enterprise",
    sku: "CC-KB",
  },
  "entitlement.chat": {
    labelKey: "entitlement.feature.chat.label",
    requiredTier: "professional",
    sku: "CC-CHAT",
  },
  "entitlement.bot": {
    labelKey: "entitlement.feature.bot.label",
    requiredTier: "enterprise",
    sku: "CC-BOT",
  },
  "entitlement.gis": {
    labelKey: "entitlement.feature.gis.label",
    requiredTier: "enterprise",
    sku: "CC-GIS",
  },
  "entitlement.cad": {
    labelKey: "entitlement.feature.cad.label",
    requiredTier: "enterprise",
    sku: "CC-CAD",
  },
  "entitlement.channel.social": {
    labelKey: "entitlement.feature.channel_social.label",
    requiredTier: "professional",
    sku: "CC-CHANNEL",
  },
  "entitlement.audit": {
    labelKey: "entitlement.feature.audit.label",
    requiredTier: "enterprise",
    sku: "CC-CORE",
  },
  "entitlement.rbac.advanced": {
    labelKey: "entitlement.feature.rbac_advanced.label",
    requiredTier: "enterprise",
    sku: "CC-CORE",
  },
};
