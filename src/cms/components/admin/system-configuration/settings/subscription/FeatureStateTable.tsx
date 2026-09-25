// Every catalogued feature with its entitled/locked state for this tenant.
import { ListChecks, Lock } from "lucide-react";
import {
  FEATURE_CATALOG,
  PACKAGE_PRESETS,
} from "@/core/config/entitlements";
import { useEntitlements } from "@/core/hooks/useEntitlements";
import { useTranslation } from "@/core/hooks/useTranslation";
import type { EntitlementFeature } from "@/core/types/entitlement";

export function FeatureStateTable() {
  const { t } = useTranslation();
  const { hasFeature, isLoading } = useEntitlements();

  const features = Object.keys(FEATURE_CATALOG) as EntitlementFeature[];

  return (
    <div className="rounded-xl border border-gray-200 p-5 dark:border-gray-800">
      <div className="mb-4 flex items-center gap-2">
        <ListChecks className="h-4 w-4 text-gray-500 dark:text-gray-400" />
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
          {t("entitlement.subscription.features")}
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-gray-500 dark:border-gray-800 dark:text-gray-400">
              <th className="pb-2 font-medium">
                {t("entitlement.subscription.feature")}
              </th>
              <th className="pb-2 font-medium">
                {t("entitlement.subscription.required_tier")}
              </th>
              <th className="pb-2 font-medium">
                {t("entitlement.subscription.status")}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {features.map((feature) => {
              const entry = FEATURE_CATALOG[feature];
              const entitled = !isLoading && hasFeature(feature);
              return (
                <tr key={feature}>
                  <td className="py-2.5 font-medium text-gray-900 dark:text-white">
                    {t(entry.labelKey)}
                  </td>
                  <td className="py-2.5 text-gray-500 dark:text-gray-400">
                    {t(PACKAGE_PRESETS[entry.requiredTier].labelKey)}
                  </td>
                  <td className="py-2.5">
                    {entitled ? (
                      <span className="inline-flex items-center rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700 dark:bg-green-500/10 dark:text-green-400">
                        {t("entitlement.subscription.entitled")}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600 dark:bg-white/[0.06] dark:text-gray-300">
                        <Lock className="h-3 w-3" />
                        {t("entitlement.subscription.locked")}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
