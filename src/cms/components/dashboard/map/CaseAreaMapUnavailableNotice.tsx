// src/cms/components/dashboard/map/CaseAreaMapUnavailableNotice.tsx
import React from "react";
import { AlertTriangle } from "lucide-react";
import { useTranslation } from "@/core/hooks/useTranslation";

/**
 * Shown instead of a map when `API_CONFIG.BOUNDARY_SOURCE === "local"`: the
 * government/local boundary geometry is keyed by AMP_CODE-style codes, not
 * `distId`, and there is no crosswalk between the two anywhere in the repo -
 * drawing a map in that mode would silently join the wrong data.
 */
export const CaseAreaMapUnavailableNotice: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-wrap items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4 dark:border-amber-700 dark:bg-amber-900/30">
      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
      <div className="min-w-0 flex-1 text-sm text-amber-800 dark:text-amber-200">
        {t("dashboard.case_summary_by_area.map_unavailable_local_boundary")}
      </div>
    </div>
  );
};

export default CaseAreaMapUnavailableNotice;
