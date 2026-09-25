import type { EntitlementFeature, SkuCode } from "@/core/types/entitlement";

export interface SkuCatalogEntry {
  /** i18n key for the SKU display name. */
  labelKey: string;
  /** i18n key for a short description (used in upsell / subscription views). */
  descriptionKey: string;
  /** Features granted when the tenant holds this SKU. */
  features: EntitlementFeature[];
}

/**
 * Static mirror of the pricing doc's final product catalog.
 * Data-shaped (plain records) on purpose: this is the frontend mirror of the
 * future server-driven price book, so it must stay serializable.
 */
export const SKU_CATALOG: Record<SkuCode, SkuCatalogEntry> = {
  "CC-CORE": {
    labelKey: "entitlement.sku.cc_core.label",
    descriptionKey: "entitlement.sku.cc_core.description",
    features: ["entitlement.core"],
  },
  "CC-AGENT": {
    labelKey: "entitlement.sku.cc_agent.label",
    descriptionKey: "entitlement.sku.cc_agent.description",
    features: ["entitlement.agent.desktop"],
  },
  "CC-KB": {
    labelKey: "entitlement.sku.cc_kb.label",
    descriptionKey: "entitlement.sku.cc_kb.description",
    features: ["entitlement.kb"],
  },
  "CC-CHAT": {
    labelKey: "entitlement.sku.cc_chat.label",
    descriptionKey: "entitlement.sku.cc_chat.description",
    features: ["entitlement.chat"],
  },
  "CC-BOT": {
    labelKey: "entitlement.sku.cc_bot.label",
    descriptionKey: "entitlement.sku.cc_bot.description",
    features: ["entitlement.bot"],
  },
  "CC-GIS": {
    labelKey: "entitlement.sku.cc_gis.label",
    descriptionKey: "entitlement.sku.cc_gis.description",
    features: ["entitlement.gis"],
  },
  "CC-CAD": {
    labelKey: "entitlement.sku.cc_cad.label",
    descriptionKey: "entitlement.sku.cc_cad.description",
    features: ["entitlement.cad"],
  },
  "CC-CHANNEL": {
    labelKey: "entitlement.sku.cc_channel.label",
    descriptionKey: "entitlement.sku.cc_channel.description",
    features: ["entitlement.channel.social"],
  },
  "CC-SERVICE": {
    labelKey: "entitlement.sku.cc_service.label",
    descriptionKey: "entitlement.sku.cc_service.description",
    features: [],
  },
};
