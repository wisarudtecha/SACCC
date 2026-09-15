// src/core/components/custom-dashboard/widgets/registry.ts
/**
 * The widget registry.
 *
 * A persisted widget stores only a `widgetKey`. The only way to render it is to resolve
 * that key here, which yields both the component *and* the `sourceId` it reads from — so
 * a widget's data binding cannot silently go unread (the flaw in the previous system,
 * where `WidgetConfig.dataSource` was a string nothing consumed).
 *
 * To add a widget: add one entry with its `group`. To feed it from a new WebSocket message
 * type, add a parser and one entry in `sources/registry.ts`. A layout can freely mix widgets
 * from any group.
 */
import {
  AlertTriangle,
  BarChart3,
  ChartColumnBig,
  LayoutGrid,
  MapPin,
  Package,
  PieChart,
  ShoppingCart,
  Timer,
  TrendingUp,
} from "lucide-react";
import { SOURCE_IDS } from "@/core/components/custom-dashboard/sources/registry";
import { CaseDailyChartWidget } from "@/core/components/custom-dashboard/widgets/CaseDailyChartWidget";
import { CaseMonthlyChartWidget } from "@/core/components/custom-dashboard/widgets/CaseMonthlyChartWidget";
import { CaseStatusDonutWidget } from "@/core/components/custom-dashboard/widgets/CaseStatusDonutWidget";
import { CaseSummaryMetricsWidget } from "@/core/components/custom-dashboard/widgets/CaseSummaryMetricsWidget";
import { CaseSummaryByAreaTopDistrictsWidget } from "@/core/components/custom-dashboard/widgets/CaseSummaryByAreaTopDistrictsWidget";
import { SlaPerformanceWidget } from "@/core/components/custom-dashboard/widgets/SlaPerformanceWidget";
import { GrowthMetricsWidget } from "@/core/components/custom-dashboard/widgets/GrowthMetricsWidget";
import { ModuleOverviewWidget } from "@/core/components/custom-dashboard/widgets/ModuleOverviewWidget";
import { TopOrderedWidget } from "@/core/components/custom-dashboard/widgets/TopOrderedWidget";
import { RevenueWidget } from "@/core/components/custom-dashboard/widgets/RevenueWidget";
import { InventoryAlertWidget } from "@/core/components/custom-dashboard/widgets/InventoryAlertWidget";
import {
  compactCaseSummary,
  compactSla,
  compactCaseSeries,
  compactCaseSummaryByArea,
  compactGrowthMetrics,
  compactModuleOverview,
  compactTopOrdered,
  compactRevenue,
  compactInventoryAlert,
} from "@/core/components/custom-dashboard/widgets/compactAdapters";
import type { WidgetDefinition } from "@/core/components/custom-dashboard/widgets/types";

export const WIDGET_KEYS = {
  // Case (cms)
  caseSummaryMetrics: "case-summary-metrics",
  slaPerformance: "sla-performance",
  caseDailyChart: "case-daily-chart",
  caseMonthlyChart: "case-monthly-chart",
  caseStatusDonut: "case-status-donut",
  caseSummaryByAreaTopDistricts: "case-summary-by-area-top-districts",
  // Product (cms CRM)
  productGrowthMetrics: "product-growth-metrics",
  productModuleOverview: "product-module-overview",
  productTopOrdered: "product-top-ordered",
  productRevenue: "product-revenue",
  productInventoryAlert: "product-inventory-alert",
} as const;

export const WIDGET_DEFINITIONS: Record<string, WidgetDefinition> = {
  // ------------------------------------------------------------------ Case
  [WIDGET_KEYS.caseSummaryMetrics]: {
    key: WIDGET_KEYS.caseSummaryMetrics,
    kind: "sourced",
    group: "case",
    sourceId: SOURCE_IDS.caseSummary,
    labelKey: "dashboard.custom.widgets.case_summary_metrics.label",
    descriptionKey: "dashboard.custom.widgets.case_summary_metrics.description",
    icon: LayoutGrid,
    Component: CaseSummaryMetricsWidget,
    defaultPosition: { colSpan: 3, rowSpan: 1 },
    defaultConfig: { showHeader: true },
    configurable: ["title", "showHeader", "colSpan", "rowSpan", "displayMode"],
    compactAdapter: compactCaseSummary,
  },

  [WIDGET_KEYS.slaPerformance]: {
    key: WIDGET_KEYS.slaPerformance,
    kind: "sourced",
    group: "case",
    sourceId: SOURCE_IDS.sla,
    labelKey: "dashboard.custom.widgets.sla_performance.label",
    descriptionKey: "dashboard.custom.widgets.sla_performance.description",
    icon: Timer,
    Component: SlaPerformanceWidget,
    defaultPosition: { colSpan: 1, rowSpan: 1 },
    defaultConfig: { showHeader: true },
    configurable: ["title", "showHeader", "colSpan", "rowSpan", "displayMode"],
    compactAdapter: compactSla,
  },

  [WIDGET_KEYS.caseDailyChart]: {
    key: WIDGET_KEYS.caseDailyChart,
    kind: "sourced",
    group: "case",
    sourceId: SOURCE_IDS.caseDaily,
    labelKey: "dashboard.custom.widgets.case_daily_chart.label",
    descriptionKey: "dashboard.custom.widgets.case_daily_chart.description",
    icon: ChartColumnBig,
    Component: CaseDailyChartWidget,
    defaultPosition: { colSpan: 3, rowSpan: 2 },
    defaultConfig: { showHeader: true },
    configurable: ["title", "showHeader", "colSpan", "rowSpan", "displayMode"],
    compactAdapter: compactCaseSeries,
  },

  [WIDGET_KEYS.caseMonthlyChart]: {
    key: WIDGET_KEYS.caseMonthlyChart,
    kind: "sourced",
    group: "case",
    sourceId: SOURCE_IDS.caseMonthly,
    labelKey: "dashboard.custom.widgets.case_monthly_chart.label",
    descriptionKey: "dashboard.custom.widgets.case_monthly_chart.description",
    icon: BarChart3,
    Component: CaseMonthlyChartWidget,
    defaultPosition: { colSpan: 4, rowSpan: 2 },
    defaultConfig: { showHeader: true, monthRange: 6 },
    configurable: ["title", "showHeader", "colSpan", "rowSpan", "monthRange", "displayMode"],
    compactAdapter: compactCaseSeries,
  },

  [WIDGET_KEYS.caseStatusDonut]: {
    key: WIDGET_KEYS.caseStatusDonut,
    kind: "sourced",
    group: "case",
    sourceId: SOURCE_IDS.caseDaily,
    labelKey: "dashboard.custom.widgets.case_status_donut.label",
    descriptionKey: "dashboard.custom.widgets.case_status_donut.description",
    icon: PieChart,
    Component: CaseStatusDonutWidget,
    defaultPosition: { colSpan: 1, rowSpan: 2 },
    defaultConfig: { showHeader: true },
    configurable: ["title", "showHeader", "colSpan", "rowSpan", "displayMode"],
    compactAdapter: compactCaseSeries,
  },

  [WIDGET_KEYS.caseSummaryByAreaTopDistricts]: {
    key: WIDGET_KEYS.caseSummaryByAreaTopDistricts,
    kind: "sourced",
    group: "case",
    sourceId: SOURCE_IDS.caseSummaryByArea,
    labelKey: "dashboard.custom.widgets.case_summary_by_area_top_districts.label",
    descriptionKey: "dashboard.custom.widgets.case_summary_by_area_top_districts.description",
    icon: MapPin,
    Component: CaseSummaryByAreaTopDistrictsWidget,
    defaultPosition: { colSpan: 1, rowSpan: 2 },
    defaultConfig: { showHeader: true, topN: 5 },
    configurable: ["title", "showHeader", "colSpan", "rowSpan", "topN", "displayMode"],
    compactAdapter: compactCaseSummaryByArea,
  },

  // --------------------------------------------------------------- Product
  [WIDGET_KEYS.productGrowthMetrics]: {
    key: WIDGET_KEYS.productGrowthMetrics,
    kind: "sourced",
    group: "product",
    sourceId: SOURCE_IDS.growthMetrics,
    labelKey: "dashboard.custom.widgets.growth_metrics.label",
    descriptionKey: "dashboard.custom.widgets.growth_metrics.description",
    icon: TrendingUp,
    Component: GrowthMetricsWidget,
    defaultPosition: { colSpan: 4, rowSpan: 1 },
    defaultConfig: { showHeader: true },
    configurable: ["title", "showHeader", "colSpan", "rowSpan", "displayMode"],
    compactAdapter: compactGrowthMetrics,
  },

  [WIDGET_KEYS.productModuleOverview]: {
    key: WIDGET_KEYS.productModuleOverview,
    kind: "sourced",
    group: "product",
    sourceId: SOURCE_IDS.moduleOverview,
    labelKey: "dashboard.custom.widgets.module_overview.label",
    descriptionKey: "dashboard.custom.widgets.module_overview.description",
    icon: LayoutGrid,
    Component: ModuleOverviewWidget,
    defaultPosition: { colSpan: 2, rowSpan: 2 },
    defaultConfig: { showHeader: true },
    configurable: ["title", "showHeader", "colSpan", "rowSpan", "displayMode"],
    compactAdapter: compactModuleOverview,
  },

  [WIDGET_KEYS.productTopOrdered]: {
    key: WIDGET_KEYS.productTopOrdered,
    kind: "sourced",
    group: "product",
    sourceId: SOURCE_IDS.topOrdered,
    labelKey: "dashboard.custom.widgets.top_ordered.label",
    descriptionKey: "dashboard.custom.widgets.top_ordered.description",
    icon: Package,
    Component: TopOrderedWidget,
    defaultPosition: { colSpan: 2, rowSpan: 2 },
    defaultConfig: { showHeader: true },
    configurable: ["title", "showHeader", "colSpan", "rowSpan", "displayMode"],
    compactAdapter: compactTopOrdered,
  },

  [WIDGET_KEYS.productRevenue]: {
    key: WIDGET_KEYS.productRevenue,
    kind: "sourced",
    group: "product",
    sourceId: SOURCE_IDS.revenue,
    labelKey: "dashboard.custom.widgets.revenue.label",
    descriptionKey: "dashboard.custom.widgets.revenue.description",
    icon: ShoppingCart,
    Component: RevenueWidget,
    defaultPosition: { colSpan: 1, rowSpan: 2 },
    defaultConfig: { showHeader: true },
    configurable: ["title", "showHeader", "colSpan", "rowSpan", "displayMode"],
    compactAdapter: compactRevenue,
  },

  [WIDGET_KEYS.productInventoryAlert]: {
    key: WIDGET_KEYS.productInventoryAlert,
    kind: "sourced",
    group: "product",
    sourceId: SOURCE_IDS.inventoryAlert,
    labelKey: "dashboard.custom.widgets.inventory_alert.label",
    descriptionKey: "dashboard.custom.widgets.inventory_alert.description",
    icon: AlertTriangle,
    Component: InventoryAlertWidget,
    defaultPosition: { colSpan: 1, rowSpan: 1 },
    defaultConfig: { showHeader: true },
    configurable: ["title", "showHeader", "colSpan", "rowSpan", "displayMode"],
    compactAdapter: compactInventoryAlert,
  },
};

export const getWidgetDefinition = (widgetKey: string): WidgetDefinition | undefined =>
  WIDGET_DEFINITIONS[widgetKey];

/**
 * Lets a module register its own widget definitions without `core` importing that
 * module's code (see the "self-fetching" doc comment on `WidgetDefinition` in
 * `types.ts`). Appends into the same map `getWidgetDefinition`/`WidgetLibraryModal`
 * already read, so no other file needs to change to pick up a registration.
 */
export function registerWidgetDefinition(definition: WidgetDefinition): void {
  WIDGET_DEFINITIONS[definition.key] = definition;
}
