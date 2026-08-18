// src/core/components/custom-dashboard/sources/registry.ts
/**
 * The WebSocket source registry.
 *
 * To feed the dashboard from a new WebSocket message type, add a parser in
 * `parsers.ts` and one entry here. Nothing in the grid, persistence, page, or
 * routing layers needs to change.
 */
import {
  parseCaseDaily,
  parseCaseMonthly,
  parseCaseSummary,
  parseSla,
} from "@/core/components/custom-dashboard/sources/parsers";
import {
  parseGrowthMetrics,
  parseInventoryAlert,
  parseModuleOverview,
  parseRevenue,
  parseTopOrdered,
} from "@/core/components/custom-dashboard/sources/productParsers";
import type { WidgetSourceDefinition } from "@/core/components/custom-dashboard/sources/types";

export const SOURCE_IDS = {
  caseSummary: "case-summary",
  sla: "sla",
  caseDaily: "case-daily",
  caseMonthly: "case-monthly",
  // Product (CRM)
  growthMetrics: "growth-metrics",
  moduleOverview: "module-overview",
  topOrdered: "top-ordered",
  revenue: "revenue",
  inventoryAlert: "inventory-alert",
} as const;

export const WIDGET_SOURCES: Record<string, WidgetSourceDefinition> = {
  [SOURCE_IDS.caseSummary]: {
    id: SOURCE_IDS.caseSummary,
    wsType: "CASE-SUMMARY",
    parse: parseCaseSummary,
  },
  [SOURCE_IDS.sla]: {
    id: SOURCE_IDS.sla,
    wsType: "SLA-PERFORMANCE",
    parse: parseSla,
  },
  [SOURCE_IDS.caseDaily]: {
    id: SOURCE_IDS.caseDaily,
    wsType: "CASE-DAILY-SUMMARY",
    parse: parseCaseDaily,
  },
  [SOURCE_IDS.caseMonthly]: {
    id: SOURCE_IDS.caseMonthly,
    wsType: "CASE-MONTHLY-SUMMARY",
    parse: parseCaseMonthly,
  },

  // Product (CRM) — same subscribe frame, different message types.
  [SOURCE_IDS.growthMetrics]: {
    id: SOURCE_IDS.growthMetrics,
    wsType: "DASHBOARD_GROWTH",
    parse: parseGrowthMetrics,
  },
  [SOURCE_IDS.moduleOverview]: {
    id: SOURCE_IDS.moduleOverview,
    wsType: "DASHBOARD_SUMMARY_ALL",
    parse: parseModuleOverview,
  },
  [SOURCE_IDS.topOrdered]: {
    id: SOURCE_IDS.topOrdered,
    wsType: "ORDER_TOP",
    parse: parseTopOrdered,
  },
  [SOURCE_IDS.revenue]: {
    id: SOURCE_IDS.revenue,
    wsType: "DASHBOARD_REVENUE",
    parse: parseRevenue,
  },
  [SOURCE_IDS.inventoryAlert]: {
    id: SOURCE_IDS.inventoryAlert,
    wsType: "DASHBOARD_INVENTORY_ALERT",
    parse: parseInventoryAlert,
  },
};

/** Reverse index: wire type -> source definition. Built once at module load. */
export const SOURCE_BY_WS_TYPE: Record<string, WidgetSourceDefinition> = Object.fromEntries(
  Object.values(WIDGET_SOURCES).map(source => [source.wsType, source])
);
