// src/core/components/custom-dashboard/constants.ts
import { getWidgetDefinition, WIDGET_KEYS } from "@/core/components/custom-dashboard/widgets/registry";
import type { DashboardLayout, DashboardWidget } from "@/core/types/dashboardLayout";

/** Remembers which layout the user was last looking at. */
export const LAST_LAYOUT_KEY = "dashboard:lastLayoutId";

/** `?layout=<id>` — makes a specific dashboard linkable and survives a reload. */
export const LAYOUT_QUERY_PARAM = "layout";

/** Sentinel id for the built-in layout, which exists only client-side until first saved. */
export const DEFAULT_LAYOUT_ID = "default";

const newWidgetId = (): string =>
  `widget-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

/**
 * Builds a widget from its registry defaults. Used by the picker and the default layout.
 *
 * NOTE: impure (Date.now/Math.random). Never call this — or anything that calls it — from a
 * component's render path or from a `useMemo`; a fresh identity on every render feeds the
 * draft-adoption effect and produces an unbounded update loop. Use a lazy `useState`
 * initializer when a component needs one of these per mount.
 */
export const createWidget = (widgetKey: string, order: number): DashboardWidget => {
  const definition = getWidgetDefinition(widgetKey);

  return {
    id: newWidgetId(),
    widgetKey,
    position: {
      order,
      colSpan: definition?.defaultPosition.colSpan ?? 1,
      rowSpan: definition?.defaultPosition.rowSpan ?? 1,
    },
    config: { ...(definition?.defaultConfig ?? {}) },
  };
};

/**
 * Copies widgets for Duplicate, re-stamping ids. Widget ids are only unique within a layout
 * today, and we can't rule out a server-side uniqueness constraint across layouts.
 */
export const cloneWidgets = (widgets: DashboardWidget[]): DashboardWidget[] =>
  widgets.map((widget, index) => ({
    ...widget,
    id: newWidgetId(),
    position: { ...widget.position, order: index },
    config: { ...widget.config },
  }));

/**
 * The layout shown when the backend has no layouts for this user — including when the
 * endpoint is unreachable. The dashboard is never empty on first visit.
 *
 * The name is deliberately untranslated: it becomes a persisted server-side value once saved.
 * Display `t("dashboard.custom.default_layout_name")` for the unsaved local layout instead.
 */
export const buildDefaultLayout = (): DashboardLayout => ({
  id: DEFAULT_LAYOUT_ID,
  name: "Default Dashboard",
  isShared: false,
  isDefault: true,
  orgId: "",
  createdBy: "",
  lastModified: new Date().toISOString(),
  widgets: [
    createWidget(WIDGET_KEYS.caseSummaryMetrics, 0),
    createWidget(WIDGET_KEYS.slaPerformance, 1),
    createWidget(WIDGET_KEYS.caseDailyChart, 2),
    createWidget(WIDGET_KEYS.caseStatusDonut, 3),
    createWidget(WIDGET_KEYS.caseMonthlyChart, 4),
  ],
});

/** A named, empty layout — what "New layout" creates. Duplicate covers "start from current". */
export const buildBlankLayout = (name: string): DashboardLayout => ({
  id: DEFAULT_LAYOUT_ID,
  name,
  isShared: false,
  isDefault: false,
  orgId: "",
  createdBy: "",
  lastModified: new Date().toISOString(),
  widgets: [],
});
