// src/core/components/entitlements/UpgradeModal.tsx
import { useNavigate } from "react-router";
import { Lock, X } from "lucide-react";
import {
  FEATURE_CATALOG,
  PACKAGE_PRESETS,
} from "@/core/config/entitlements";
import { useEntitlements } from "@/core/hooks/useEntitlements";
import { useTranslation } from "@/core/hooks/useTranslation";
import type { EntitlementFeature } from "@/core/types/entitlement";

interface UpgradeModalProps {
  feature: EntitlementFeature;
  onClose: () => void;
}

/**
 * Upsell prompt for a locked feature: what it is, which tier unlocks it,
 * and a CTA to the tenant's Subscription & Entitlements settings section.
 */
export function UpgradeModal({ feature, onClose }: UpgradeModalProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { plan } = useEntitlements();

  const catalogEntry = FEATURE_CATALOG[feature];
  const requiredPreset = PACKAGE_PRESETS[catalogEntry.requiredTier];

  const goToSubscription = () => {
    onClose();
    navigate("/cms/settings/organization");
  };

  return (
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={t("entitlement.upgrade.title")}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-900"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-50 dark:bg-brand-500/10">
            <Lock className="h-5 w-5 text-brand-600 dark:text-brand-400" />
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-white/[0.06] dark:hover:text-gray-300"
            aria-label={t("entitlement.upgrade.close")}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <h2 className="mb-1 text-lg font-semibold text-gray-900 dark:text-white">
          {t("entitlement.upgrade.title")}
        </h2>
        <p className="mb-4 text-sm text-gray-600 dark:text-gray-300">
          {t(catalogEntry.labelKey)}
        </p>

        <dl className="mb-6 space-y-2 rounded-xl bg-gray-50 p-4 text-sm dark:bg-white/[0.03]">
          <div className="flex justify-between">
            <dt className="text-gray-500 dark:text-gray-400">
              {t("entitlement.upgrade.current_plan")}
            </dt>
            <dd className="font-medium text-gray-900 dark:text-white">
              {plan
                ? t(PACKAGE_PRESETS[plan].labelKey)
                : t("entitlement.upgrade.unknown_plan")}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500 dark:text-gray-400">
              {t("entitlement.upgrade.required_tier")}
            </dt>
            <dd className="font-medium text-brand-600 dark:text-brand-400">
              {t(requiredPreset.labelKey)} — ฿
              {requiredPreset.pricePerAgentThb.toLocaleString()}{" "}
              {t("entitlement.upgrade.per_agent_month")}
            </dd>
          </div>
        </dl>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/[0.06]"
          >
            {t("entitlement.upgrade.close")}
          </button>
          <button
            type="button"
            onClick={goToSubscription}
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
          >
            {t("entitlement.upgrade.view_plans")}
          </button>
        </div>
      </div>
    </div>
  );
}
