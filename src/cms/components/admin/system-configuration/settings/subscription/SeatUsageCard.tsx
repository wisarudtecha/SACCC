// Agent seat usage against the package limit.
import { Users } from "lucide-react";
import { useEntitlements } from "@/core/hooks/useEntitlements";
import { useTranslation } from "@/core/hooks/useTranslation";

export function SeatUsageCard() {
  const { t } = useTranslation();
  const { seats } = useEntitlements();

  if (!seats || seats.max <= 0) return null;

  const percentage = Math.min(100, Math.round((seats.used / seats.max) * 100));

  return (
    <div className="rounded-xl border border-gray-200 p-5 dark:border-gray-800">
      <div className="mb-4 flex items-center gap-2">
        <Users className="h-4 w-4 text-gray-500 dark:text-gray-400" />
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
          {t("entitlement.subscription.seats")}
        </h3>
      </div>
      <div className="mb-2 flex items-baseline gap-2">
        <span className="text-2xl font-semibold text-gray-900 dark:text-white">
          {seats.used.toLocaleString()}
        </span>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          / {seats.max.toLocaleString()} {t("entitlement.subscription.seats_used")}
        </span>
        <span className="ml-auto text-sm font-medium text-gray-500 dark:text-gray-400">
          {percentage}%
        </span>
      </div>
      <div
        className="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700"
        role="progressbar"
        aria-valuenow={percentage}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full rounded-full bg-brand-600 dark:bg-brand-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
