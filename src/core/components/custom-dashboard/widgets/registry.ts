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
import { SlaPerformanceWidget } from "@/core/components/custom-dashboard/widgets/SlaPerformanceWidget";
import { GrowthMetricsWidget } from "@/core/components/custom-dashboard/widgets/GrowthMetricsWidget";
import { ModuleOverviewWidget } from "@/core/components/custom-dashboard/widgets/ModuleOverviewWidget";
import { TopOrderedWidget } from "@/core/components/custom-dashboard/widgets/TopOrderedWidget";
import { RevenueWidget } from "@/core/components/custom-dashboard/widgets/RevenueWidget";
import { InventoryAlertWidget } from "@/core/components/custom-dashboard/widgets/InventoryAlertWidget";
import type { WidgetDefinition } from "@/core/components/custom-dashboard/widgets/types";

export const WIDGET_KEYS = {
  // Case (cms)
  caseSummaryMetrics: "case-summary-metrics",
  slaPerformance: "sla-performance",
  caseDailyChart: "case-daily-chart",
  caseMonthlyChart: "case-monthly-chart",
  caseStatusDonut: "case-status-donut",
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
    group: "case",
    sourceId: SOURCE_IDS.caseSummary,
    labelKey: "dashboard.custom.widgets.case_summary_metrics.label",
    descriptionKey: "dashboard.custom.widgets.case_summary_metrics.description",
    icon: LayoutGrid,
    Component: CaseSummaryMetricsWidget,
    defaultPosition: { colSpan: 3, rowSpan: 1 },
    defaultConfig: { showHeader: true },
    configurable: ["title", "showHeader", "colSpan", "rowSpan"],
  },

  [WIDGET_KEYS.slaPerformance]: {
    key: WIDGET_KEYS.slaPerformance,
    group: "case",
    sourceId: SOURCE_IDS.sla,
    labelKey: "dashboard.custom.widgets.sla_performance.label",
    descriptionKey: "dashboard.custom.widgets.sla_performance.description",
    icon: Timer,
    Component: SlaPerformanceWidget,
    defaultPosition: { colSpan: 1, rowSpan: 1 },
    defaultConfig: { showHeader: true },
    configurable: ["title", "showHeader", "colSpan", "rowSpan"],
  },

  [WIDGET_KEYS.caseDailyChart]: {
    key: WIDGET_KEYS.caseDailyChart,
    group: "case",
    sourceId: SOURCE_IDS.caseDaily,
    labelKey: "dashboard.custom.widgets.case_daily_chart.label",
    descriptionKey: "dashboard.custom.widgets.case_daily_chart.description",
    icon: ChartColumnBig,
    Component: CaseDailyChartWidget,
    defaultPosition: { colSpan: 3, rowSpan: 2 },
    defaultConfig: { showHeader: true },
    configurable: ["title", "showHeader", "colSpan", "rowSpan"],
  },

  [WIDGET_KEYS.caseMonthlyChart]: {
    key: WIDGET_KEYS.caseMonthlyChart,
    group: "case",
    sourceId: SOURCE_IDS.caseMonthly,
    labelKey: "dashboard.custom.widgets.case_monthly_chart.label",
    descriptionKey: "dashboard.custom.widgets.case_monthly_chart.description",
    icon: BarChart3,
    Component: CaseMonthlyChartWidget,
    defaultPosition: { colSpan: 4, rowSpan: 2 },
    defaultConfig: { showHeader: true, monthRange: 6 },
    configurable: ["title", "showHeader", "colSpan", "rowSpan", "monthRange"],
  },

  [WIDGET_KEYS.caseStatusDonut]: {
    key: WIDGET_KEYS.caseStatusDonut,
    group: "case",
    sourceId: SOURCE_IDS.caseDaily,
    labelKey: "dashboard.custom.widgets.case_status_donut.label",
    descriptionKey: "dashboard.custom.widgets.case_status_donut.description",
    icon: PieChart,
    Component: CaseStatusDonutWidget,
    defaultPosition: { colSpan: 1, rowSpan: 2 },
    defaultConfig: { showHeader: true },
    configurable: ["title", "showHeader", "colSpan", "rowSpan"],
  },

  // --------------------------------------------------------------- Product
  [WIDGET_KEYS.productGrowthMetrics]: {
    key: WIDGET_KEYS.productGrowthMetrics,
    group: "product",
    sourceId: SOURCE_IDS.growthMetrics,
    labelKey: "dashboard.custom.widgets.growth_metrics.label",
    descriptionKey: "dashboard.custom.widgets.growth_metrics.description",
    icon: TrendingUp,
    Component: GrowthMetricsWidget,
    defaultPosition: { colSpan: 4, rowSpan: 1 },
    defaultConfig: { showHeader: true },
    configurable: ["title", "showHeader", "colSpan", "rowSpan"],
  },

  [WIDGET_KEYS.productModuleOverview]: {
    key: WIDGET_KEYS.productModuleOverview,
    group: "product",
    sourceId: SOURCE_IDS.moduleOverview,
    labelKey: "dashboard.custom.widgets.module_overview.label",
    descriptionKey: "dashboard.custom.widgets.module_overview.description",
    icon: LayoutGrid,
    Component: ModuleOverviewWidget,
    defaultPosition: { colSpan: 2, rowSpan: 2 },
    defaultConfig: { showHeader: true },
    configurable: ["title", "showHeader", "colSpan", "rowSpan"],
  },

  [WIDGET_KEYS.productTopOrdered]: {
    key: WIDGET_KEYS.productTopOrdered,
    group: "product",
    sourceId: SOURCE_IDS.topOrdered,
    labelKey: "dashboard.custom.widgets.top_ordered.label",
    descriptionKey: "dashboard.custom.widgets.top_ordered.description",
    icon: Package,
    Component: TopOrderedWidget,
    defaultPosition: { colSpan: 2, rowSpan: 2 },
    defaultConfig: { showHeader: true },
    configurable: ["title", "showHeader", "colSpan", "rowSpan"],
  },

  [WIDGET_KEYS.productRevenue]: {
    key: WIDGET_KEYS.productRevenue,
    group: "product",
    sourceId: SOURCE_IDS.revenue,
    labelKey: "dashboard.custom.widgets.revenue.label",
    descriptionKey: "dashboard.custom.widgets.revenue.description",
    icon: ShoppingCart,
    Component: RevenueWidget,
    defaultPosition: { colSpan: 1, rowSpan: 2 },
    defaultConfig: { showHeader: true },
    configurable: ["title", "showHeader", "colSpan", "rowSpan"],
  },

  [WIDGET_KEYS.productInventoryAlert]: {
    key: WIDGET_KEYS.productInventoryAlert,
    group: "product",
    sourceId: SOURCE_IDS.inventoryAlert,
    labelKey: "dashboard.custom.widgets.inventory_alert.label",
    descriptionKey: "dashboard.custom.widgets.inventory_alert.description",
    icon: AlertTriangle,
    Component: InventoryAlertWidget,
    defaultPosition: { colSpan: 1, rowSpan: 1 },
    defaultConfig: { showHeader: true },
    configurable: ["title", "showHeader", "colSpan", "rowSpan"],
  },
};

export const getWidgetDefinition = (widgetKey: string): WidgetDefinition | undefined =>
  WIDGET_DEFINITIONS[widgetKey];
