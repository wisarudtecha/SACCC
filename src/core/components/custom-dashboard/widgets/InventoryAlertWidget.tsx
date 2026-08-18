// src/core/components/custom-dashboard/widgets/InventoryAlertWidget.tsx
import React from "react";
import { formatNumberWithComma, getRequestStatus } from "@/cms/utils/productHelper";
import Badge, { BadgeColor } from "@/core/components/ui/badge/Badge";
import { useTranslation } from "@/core/hooks/useTranslation";
import type { WidgetRenderProps } from "@/core/components/custom-dashboard/widgets/types";

/**
 * Low-stock parts and pending purchase approvals. `getRequestStatus` is reused for the badge
 * color because it has the right polarity here — a higher count means a more severe alert.
 */
export const InventoryAlertWidget: React.FC<WidgetRenderProps> = ({ data }) => {
  const { t } = useTranslation();

  if (data.kind !== "inventory-alert") {
    return null;
  }

  const partsColor = getRequestStatus(data.partsBelowMinimum)?.variant as BadgeColor;
  const approvalColor = getRequestStatus(data.purchaseRequestsWaiting)?.variant as BadgeColor;

  return (
    <div className="space-y-4">
      <Badge
        className="w-full rounded-2xl! p-4! text-sm item-start! justify-start!"
        color={partsColor}
      >
        {t("productDashboard.inventoryAlert.partsBelowMinimum", {
          count: formatNumberWithComma(data.partsBelowMinimum),
        })}
      </Badge>

      <Badge
        className="w-full rounded-2xl! p-4! text-sm item-start! justify-start!"
        color={approvalColor}
      >
        {t("productDashboard.inventoryAlert.purchaseRequestsWaiting", {
          count: formatNumberWithComma(data.purchaseRequestsWaiting),
        })}
      </Badge>
    </div>
  );
};
