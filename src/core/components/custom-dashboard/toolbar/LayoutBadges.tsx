// src/core/components/custom-dashboard/toolbar/LayoutBadges.tsx
import React from "react";
import { Share2, Star } from "lucide-react";
import { useTranslation } from "@/core/hooks/useTranslation";

const badgeClass =
  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs whitespace-nowrap";

export const DefaultBadge: React.FC = () => {
  const { t } = useTranslation();
  return (
    <span className={`${badgeClass} bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200`}>
      <Star className="h-3 w-3" />
      {t("dashboard.custom.default_badge")}
    </span>
  );
};

export const SharedBadge: React.FC = () => {
  const { t } = useTranslation();
  return (
    <span className={`${badgeClass} bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200`}>
      <Share2 className="h-3 w-3" />
      {t("dashboard.custom.shared_badge")}
    </span>
  );
};

export const ReadOnlyBadge: React.FC = () => {
  const { t } = useTranslation();
  return (
    <span className={`${badgeClass} bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200`}>
      {t("dashboard.custom.read_only")}
    </span>
  );
};
