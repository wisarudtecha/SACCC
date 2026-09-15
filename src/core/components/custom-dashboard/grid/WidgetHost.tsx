// src/core/components/custom-dashboard/grid/WidgetHost.tsx
import React from "react";
import { DashboardWidgetSkeleton } from "@/core/components/ui/loading/LoadingSystem";
import { useTranslation } from "@/core/hooks/useTranslation";
import { getWidgetDefinition } from "@/core/components/custom-dashboard/widgets/registry";
import { UnknownWidget } from "@/core/components/custom-dashboard/widgets/UnknownWidget";
import { useWidgetSource } from "@/core/components/custom-dashboard/sources/useWidgetSource";
import { pickText } from "@/core/components/custom-dashboard/widgets/chartTheme";
import { CompactWidgetTile } from "@/core/components/custom-dashboard/widgets/CompactWidgetTile";
import type { DashboardWidget } from "@/core/types/dashboardLayout";

/**
 * Resolves a widget's registry entry, then either renders a "self-fetching" widget
 * directly (it owns its own loading state) or, for a "sourced" widget, waits for its
 * WebSocket source's first message before rendering.
 *
 * For sourced widgets this is the single skeleton gate: because the host holds it,
 * every sourced widget component receives non-optional, already-parsed data and
 * contains no loading logic of its own.
 */
export const WidgetHost: React.FC<{ widget: DashboardWidget }> = ({ widget }) => {
  const { t, language } = useTranslation();
  const definition = getWidgetDefinition(widget.widgetKey);
  // Hook order must stay stable, so an unknown or self-fetching widget still subscribes
  // (to a source id that simply never resolves) rather than returning before the hook runs.
  const { data, hasData } = useWidgetSource(definition?.kind === "sourced" ? definition.sourceId : "");

  if (!definition) {
    return <UnknownWidget widgetKey={widget.widgetKey} />;
  }

  const showHeader = widget.config.showHeader !== false;

  if (definition.kind === "self-fetching") {
    const title = widget.title || t(definition.labelKey);
    const { Component } = definition;
    const compact = widget.config.displayMode === "compact";
    return (
      <div className="flex h-full flex-col">
        {showHeader && (
          <h3 className="mb-2 text-sm font-medium text-gray-600 dark:text-gray-300">
            {title}
          </h3>
        )}
        <div className="min-h-0 flex-1">
          <Component widget={widget} compact={compact} icon={definition.icon} />
        </div>
      </div>
    );
  }

  if (!hasData || !data) {
    return <DashboardWidgetSkeleton />;
  }

  // Case payloads carry a bilingual title; product payloads don't, so fall back to the
  // widget's registry label for those.
  const payloadTitle = "title" in data ? data.title : undefined;
  const title = widget.title || pickText(payloadTitle, language) || t(definition.labelKey);
  const { Component } = definition;

  // Falls back to the normal render if compact mode is requested but the definition has
  // no adapter, or the adapter declines (kind mismatch) - compact mode never crashes.
  const compact =
    widget.config.displayMode === "compact" ? definition.compactAdapter?.(data, language) : undefined;

  if (compact) {
    return <CompactWidgetTile icon={definition.icon} label={compact.label} value={compact.value} />;
  }

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
