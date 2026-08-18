// src/core/components/custom-dashboard/DashboardUnavailableNotice.tsx
import React from "react";
import { AlertTriangle } from "lucide-react";
import Button from "@/core/components/ui/button/Button";
import { useTranslation } from "@/core/hooks/useTranslation";

/**
 * Shown when the layout list request failed. Without this, an API error is indistinguishable
 * from "you have no layouts yet" — the user would silently edit a throwaway layout believing
 * it was theirs.
 */
export const DashboardUnavailableNotice: React.FC<{
  onRetry: () => void;
  isRetrying?: boolean;
}> = ({ onRetry, isRetrying = false }) => {
  const { t } = useTranslation();

  return (
    <div className="mb-4 flex flex-wrap items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4 dark:border-amber-700 dark:bg-amber-900/30">
      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium text-amber-900 dark:text-amber-100">
          {t("dashboard.custom.unavailable_title")}
        </div>
        <div className="mt-1 text-sm text-amber-800 dark:text-amber-200">
          {t("dashboard.custom.unavailable_message")}
        </div>
      </div>
      <Button variant="outline" onClick={onRetry} disabled={isRetrying}>
        {t("common.retry")}
      </Button>
    </div>
  );
};
