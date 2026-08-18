// src/core/components/custom-dashboard/grid/WidgetHost.tsx
import React from "react";
import { DashboardWidgetSkeleton } from "@/core/components/ui/loading/LoadingSystem";
import { useTranslation } from "@/core/hooks/useTranslation";
import { getWidgetDefinition } from "@/core/components/custom-dashboard/widgets/registry";
import { UnknownWidget } from "@/core/components/custom-dashboard/widgets/UnknownWidget";
import { useWidgetSource } from "@/core/components/custom-dashboard/sources/useWidgetSource";
import { pickText } from "@/core/components/custom-dashboard/widgets/chartTheme";
import type { DashboardWidget } from "@/core/types/dashboardLayout";

/**
 * Resolves a widget's registry entry, waits for its source's first message, then renders.
 *
 * This is the single skeleton gate: because the host holds it, every widget component
 * below receives non-optional, already-parsed data and contains no loading logic.
 */
export const WidgetHost: React.FC<{ widget: DashboardWidget }> = ({ widget }) => {
  const { t, language } = useTranslation();
  const definition = getWidgetDefinition(widget.widgetKey);
  // Hook order must stay stable, so an unknown widget still subscribes (to a source id
  // that simply never resolves) rather than returning before the hook runs.
  const { data, hasData } = useWidgetSource(definition?.sourceId ?? "");

  if (!definition) {
    return <UnknownWidget widgetKey={widget.widgetKey} />;
  }

  if (!hasData || !data) {
    return <DashboardWidgetSkeleton />;
  }

  const showHeader = widget.config.showHeader !== false;
  // Case payloads carry a bilingual title; product payloads don't, so fall back to the
  // widget's registry label for those.
  const payloadTitle = "title" in data ? data.title : undefined;
  const title = widget.title || pickText(payloadTitle, language) || t(definition.labelKey);
  const { Component } = definition;

  return (
    <div className="flex h-full flex-col">
      {showHeader && (
        <h3 className="mb-2 text-sm font-medium text-gray-600 dark:text-gray-300">
          {title}
        </h3>
      )}
      <div className="min-h-0 flex-1">
        <Component widget={widget} data={data} />
      </div>
    </div>
  );
};
