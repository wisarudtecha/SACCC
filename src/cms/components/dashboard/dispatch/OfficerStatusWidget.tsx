// src/cms/components/dashboard/dispatch/OfficerStatusWidget.tsx
import React from "react";
import type { SelfFetchingWidgetRenderProps } from "@/core/components/custom-dashboard/widgets/types";
import { CompactWidgetTile } from "@/core/components/custom-dashboard/widgets/CompactWidgetTile";
import { useTranslation } from "@/core/hooks/useTranslation";
import { OfficerStatusPanel } from "@/cms/components/dashboard/dispatch/OfficerStatusPanel";
import { useOfficerStatusList } from "@/cms/components/dashboard/dispatch/useOfficerStatusList";

export const OfficerStatusWidget: React.FC<SelfFetchingWidgetRenderProps> = ({ compact, icon }) => {
  const { t } = useTranslation();
  // RTK Query dedupes this against OfficerStatusPanel's own identical call - no extra request.
  const { officers } = useOfficerStatusList();

  if (compact) {
    const availableCount = officers.filter(officer => officer.status === "available").length;
    return (
      <CompactWidgetTile
        icon={icon}
        label={t("dashboard.custom.widgets.officer_status.compact_label")}
        value={`${availableCount}/${officers.length}`}
      />
    );
  }

  return <OfficerStatusPanel />;
};

export default OfficerStatusWidget;
