// Active SKU list with descriptions from the static catalog.
import { Package } from "lucide-react";
import { SKU_CATALOG } from "@/core/config/entitlements";
import { useEntitlements } from "@/core/hooks/useEntitlements";
import { useTranslation } from "@/core/hooks/useTranslation";

export function SkuListCard() {
  const { t } = useTranslation();
  const { skus } = useEntitlements();

  return (
    <div className="rounded-xl border border-gray-200 p-5 dark:border-gray-800">
      <div className="mb-4 flex items-center gap-2">
        <Package className="h-4 w-4 text-gray-500 dark:text-gray-400" />
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
          {t("entitlement.subscription.skus")}
        </h3>
      </div>
      <ul className="space-y-3">
        {skus.map((sku) => {
          const entry = SKU_CATALOG[sku];
          if (!entry) return null;
          return (
            <li key={sku} className="text-sm">
              <p className="font-medium text-gray-900 dark:text-white">
                {t(entry.labelKey)}
              </p>
              <p className="text-gray-500 dark:text-gray-400">
                {t(entry.descriptionKey)}
              </p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
