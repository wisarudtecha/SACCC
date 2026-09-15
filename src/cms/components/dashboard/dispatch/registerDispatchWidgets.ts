// src/cms/components/dashboard/dispatch/registerDispatchWidgets.ts
//
// Registers the Dispatch Dashboard's data as Custom Dashboard widgets. These are
// "self-fetching" (they read `cms` REST endpoints directly, not the shared WebSocket
// WIDGET_SOURCES pipeline), so they're registered from here - a `cms` module - into
// `core`'s registry, rather than `core` importing `cms` widget code directly. See the
// `SelfFetchingWidgetDefinition` doc comment in
// `@/core/components/custom-dashboard/widgets/types.ts` for why.
//
// Imported once, for this side effect only, from `src/cms/App.tsx`.
import { Flame, Radio, Users } from "lucide-react";
import { registerWidgetDefinition } from "@/core/components/custom-dashboard/widgets/registry";
import { OfficerStatusWidget } from "@/cms/components/dashboard/dispatch/OfficerStatusWidget";
import { EventsFeedWidget } from "@/cms/components/dashboard/dispatch/EventsFeedWidget";
import { HeatmapWidget } from "@/cms/components/dashboard/dispatch/HeatmapWidget";

export const DISPATCH_WIDGET_KEYS = {
  officerStatus: "dispatch-officer-status",
  eventsFeed: "dispatch-events-feed",
  incidentHeatmap: "dispatch-incident-heatmap",
} as const;

registerWidgetDefinition({
  key: DISPATCH_WIDGET_KEYS.officerStatus,
  kind: "self-fetching",
  group: "dispatch",
  labelKey: "dashboard.custom.widgets.officer_status.label",
  descriptionKey: "dashboard.custom.widgets.officer_status.description",
  icon: Users,
  Component: OfficerStatusWidget,
  defaultPosition: { colSpan: 1, rowSpan: 2 },
  defaultConfig: { showHeader: true },
  configurable: ["title", "showHeader", "colSpan", "rowSpan", "displayMode"],
});

registerWidgetDefinition({
  key: DISPATCH_WIDGET_KEYS.eventsFeed,
  kind: "self-fetching",
  group: "dispatch",
  labelKey: "dashboard.custom.widgets.events_feed.label",
  descriptionKey: "dashboard.custom.widgets.events_feed.description",
  icon: Radio,
  Component: EventsFeedWidget,
  defaultPosition: { colSpan: 2, rowSpan: 2 },
  defaultConfig: { showHeader: true },
  configurable: ["title", "showHeader", "colSpan", "rowSpan", "displayMode"],
});

registerWidgetDefinition({
  key: DISPATCH_WIDGET_KEYS.incidentHeatmap,
  kind: "self-fetching",
  group: "dispatch",
  labelKey: "dashboard.custom.widgets.incident_heatmap.label",
  descriptionKey: "dashboard.custom.widgets.incident_heatmap.description",
  icon: Flame,
  Component: HeatmapWidget,
  defaultPosition: { colSpan: 4, rowSpan: 2 },
  defaultConfig: { showHeader: true },
  configurable: ["title", "showHeader", "colSpan", "rowSpan", "displayMode"],
});
