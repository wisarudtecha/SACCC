// src/core/components/entitlements/EntitlementLockedPage.tsx
import { Lock } from "lucide-react";
import {
  FEATURE_CATALOG,
  PACKAGE_PRESETS,
} from "@/core/config/entitlements";
import { useTranslation } from "@/core/hooks/useTranslation";
import { useUpgradePrompt } from "./useUpgradePrompt";
import type { EntitlementFeature } from "@/core/types/entitlement";

interface EntitlementLockedPageProps {
  feature: EntitlementFeature;
}

/**
 * Full-page lock state for route-level entitlement gates. Visual language
 * mirrors the access-denied block in ProtectedRoute.
 */
export function EntitlementLockedPage({ feature }: EntitlementLockedPageProps) {
  const { t } = useTranslation();
  const { promptFor, modal } = useUpgradePrompt();

  const catalogEntry = FEATURE_CATALOG[feature];
  const requiredPreset = PACKAGE_PRESETS[catalogEntry.requiredTier];

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center max-w-md">
        <Lock className="h-16 w-16 text-brand-500 dark:text-brand-400 mx-auto mb-4" />

        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          {t("entitlement.locked.title")}
        </h2>

        <p className="text-gray-600 dark:text-gray-300 mb-1">
          {t(catalogEntry.labelKey)}
        </p>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
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
      </div>
      {modal}
    </div>
  );
}
