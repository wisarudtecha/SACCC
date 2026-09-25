// Current package card: tier, per-agent price, renewal/expiry dates.
import { CreditCard } from "lucide-react";
import { PACKAGE_PRESETS } from "@/core/config/entitlements";
import { useEntitlements } from "@/core/hooks/useEntitlements";
import { useTranslation } from "@/core/hooks/useTranslation";

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString();
}

export function PlanSummaryCard() {
  const { t } = useTranslation();
  const { plan, renewedAt, expiresAt } = useEntitlements();

  const preset = plan ? PACKAGE_PRESETS[plan] : null;

  return (
    <div className="rounded-xl border border-gray-200 p-5 dark:border-gray-800">
      <div className="mb-4 flex items-center gap-2">
        <CreditCard className="h-4 w-4 text-gray-500 dark:text-gray-400" />
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
          {t("entitlement.subscription.plan_summary")}
        </h3>
      </div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-2xl font-semibold text-brand-600 dark:text-brand-400">
            {preset ? t(preset.labelKey) : t("entitlement.upgrade.unknown_plan")}
          </p>
          {preset && (
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {t("entitlement.subscription.price_per_agent")}: ฿
              {preset.pricePerAgentThb.toLocaleString()}
            </p>
          )}
        </div>
        <dl className="flex gap-6 text-sm">
          <div>
            <dt className="text-gray-500 dark:text-gray-400">
              {t("entitlement.subscription.renewed_at")}
            </dt>
            <dd className="font-medium text-gray-900 dark:text-white">
              {formatDate(renewedAt)}
            </dd>
          </div>
          <div>
            <dt className="text-gray-500 dark:text-gray-400">
              {t("entitlement.subscription.expires_at")}
            </dt>
            <dd className="font-medium text-gray-900 dark:text-white">
              {formatDate(expiresAt)}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
