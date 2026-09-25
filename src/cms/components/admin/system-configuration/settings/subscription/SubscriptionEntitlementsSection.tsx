// The Subscription & Entitlements settings section: a read-only view of the
// tenant's package, seat usage, active SKUs, and per-feature entitlement
// state. Writes are owned by the platform console (not built yet) — this
// section is deliberately display-only.
import { useEntitlements } from "@/core/hooks/useEntitlements";
import { useTranslation } from "@/core/hooks/useTranslation";
import { FeatureStateTable } from "./FeatureStateTable";
import { PlanSummaryCard } from "./PlanSummaryCard";
import { SeatUsageCard } from "./SeatUsageCard";
import { SkuListCard } from "./SkuListCard";

export function SubscriptionEntitlementsSection() {
  const { t } = useTranslation();
  const { isLoading } = useEntitlements();

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        {[0, 1, 2].map((row) => (
          <div
            key={row}
            className="h-40 rounded-xl border border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-white/[0.02]"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <PlanSummaryCard />
      <SeatUsageCard />
      <SkuListCard />
      <FeatureStateTable />
      <p className="text-xs text-gray-400 dark:text-gray-500">
        {t("entitlement.subscription.readonly_note")}
      </p>
    </div>
  );
}
