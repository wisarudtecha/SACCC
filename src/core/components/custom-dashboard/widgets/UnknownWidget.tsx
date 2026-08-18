// src/core/components/custom-dashboard/widgets/UnknownWidget.tsx
import React from "react";
import { HelpCircle } from "lucide-react";
import { useTranslation } from "@/core/hooks/useTranslation";

/**
 * Rendered when a saved layout references a `widgetKey` this build doesn't know — e.g. a
 * layout saved by a newer deployment. Degrading here keeps one unknown widget from
 * breaking the whole dashboard.
 */
export const UnknownWidget: React.FC<{ widgetKey: string }> = ({ widgetKey }) => {
  const { t } = useTranslation();

  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-gray-500 dark:text-gray-400">
      <HelpCircle className="h-6 w-6" />
      <div className="text-sm">{t("dashboard.custom.unknown_widget")}</div>
      <code className="text-xs opacity-70">{widgetKey}</code>
    </div>
  );
};
