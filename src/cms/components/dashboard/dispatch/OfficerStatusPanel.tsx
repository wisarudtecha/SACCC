// src/cms/components/dashboard/dispatch/OfficerStatusPanel.tsx
import React from "react";
import { useTranslation } from "@/core/hooks/useTranslation";
import { Skeleton } from "@/core/components/ui/loading/LoadingSystem";
import UnitStatusBadgeContent from "@/cms/components/admin/system-configuration/unit/UnitStatusBadge";
import { useOfficerStatusList } from "@/cms/components/dashboard/dispatch/useOfficerStatusList";

const PANEL_HEIGHT = 480;

export const OfficerStatusPanel: React.FC = () => {
  const { t } = useTranslation();
  const { officers, isLoading } = useOfficerStatusList();

  if (isLoading) {
    return <Skeleton height={PANEL_HEIGHT} />;
  }

  return (
    <div
      className="space-y-2 overflow-y-auto rounded-lg border border-gray-200 p-3 dark:border-gray-700"
      style={{ maxHeight: PANEL_HEIGHT }}
    >
      {officers.length === 0 && (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {t("dashboard.dispatch.officer_status_empty")}
        </p>
      )}
      {officers.map(officer => (
        <div
          key={officer.unitId}
          className="flex items-center justify-between gap-3 rounded-md border border-gray-100 px-3 py-2 dark:border-gray-800"
        >
          <span className="truncate text-sm font-medium text-gray-900 dark:text-white">{officer.unitName}</span>
          <UnitStatusBadgeContent status={officer.status} />
        </div>
      ))}
    </div>
  );
};

export default OfficerStatusPanel;
