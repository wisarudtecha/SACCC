// src/core/components/entitlements/LockedFeature.tsx
import { Lock } from "lucide-react";
import {
  FEATURE_CATALOG,
  PACKAGE_PRESETS,
} from "@/core/config/entitlements";
import { useTranslation } from "@/core/hooks/useTranslation";
import { useUpgradePrompt } from "./useUpgradePrompt";
import type { EntitlementFeature } from "@/core/types/entitlement";

interface LockedFeatureProps {
  feature: EntitlementFeature;
}

/**
 * Inline lock/upsell placeholder rendered in place of a feature the tenant
 * has not purchased. Per product decision, unentitled features are shown
 * locked — never hidden.
 */
export function LockedFeature({ feature }: LockedFeatureProps) {
  const { t } = useTranslation();
  const { promptFor, modal } = useUpgradePrompt();

  const catalogEntry = FEATURE_CATALOG[feature];
  const requiredPreset = PACKAGE_PRESETS[catalogEntry.requiredTier];

  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50 px-6 py-10 text-center dark:border-gray-700 dark:bg-white/[0.02]">
      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-gray-200 dark:bg-white/[0.06]">
        <Lock className="h-5 w-5 text-gray-500 dark:text-gray-400" />
      </div>
      <h3 className="mb-1 text-sm font-semibold text-gray-900 dark:text-white">
        {t(catalogEntry.labelKey)}
      </h3>
      <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
        {t("entitlement.locked.subtitle")}{" "}
        <span className="font-medium text-brand-600 dark:text-brand-400">
          {t(requiredPreset.labelKey)}
        </span>
      </p>
      <button
        type="button"
        onClick={() => promptFor(feature)}
        className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
      >
        {t("entitlement.locked.cta")}
      </button>
      {modal}
    </div>
  );
}
