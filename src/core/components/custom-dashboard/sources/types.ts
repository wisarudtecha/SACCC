// src/core/components/custom-dashboard/sources/types.ts
import type { JSONObject } from "@/core/types/dashboard";

/**
 * Both language variants are carried through parsing so that switching language
 * is a render-time concern and never requires re-parsing (or re-fetching) a payload.
 */
export interface BilingualText {
  en: string;
  th: string;
}

export interface CaseSummaryGroup {
  label: BilingualText;
  value: number;
}

/** Parsed `CASE-SUMMARY`. */
export interface CaseSummaryData {
  kind: "case-summary";
  title: BilingualText;
  total: number;
  groups: CaseSummaryGroup[];
}

/** Parsed `SLA-PERFORMANCE`. */
export interface SlaData {
  kind: "sla";
  title: BilingualText;
  total: number;
  inSla: number;
  overSla: number;
  inSlaRate: number;
  overSlaRate: number;
  avgResponse: number;
  avgResponseLabel: BilingualText;
  unit: BilingualText;
}

/**
 * Parsed `CASE-DAILY-SUMMARY` and `CASE-MONTHLY-SUMMARY`. Both arrive in the same
 * envelope shape (period-keyed rows of new/inprogress/complete), so they share a type.
 */
export interface CaseSeriesData {
  kind: "case-series";
  title: BilingualText;
  categories: { en: string[]; th: string[] };
  series: {
    complete: number[];
    inprogress: number[];
    new: number[];
  };
  /** Most recent period's [complete, inprogress, new] — what the donut widget shows. */
  latest: [number, number, number];
}

// ---------------------------------------------------------------------------
// Product (CRM) sources. These arrive on the same `{ EVENT: "DASHBOARD" }` frame as the
// case sources but carry keyed-object payloads rather than the bilingual array envelope.
// ---------------------------------------------------------------------------

export interface GrowthMetric {
  /** Backend key, e.g. "product" / "sparePart" — humanized/translated at render. */
  key: string;
  total: number;
  growthRate: number;
}

/** Parsed `DASHBOARD_GROWTH`. */
export interface GrowthMetricsData {
  kind: "growth-metrics";
  metrics: GrowthMetric[];
}

export interface ModuleOverviewItem {
  key: string;
  totalActive: number;
}

/** Parsed `DASHBOARD_SUMMARY_ALL`. */
export interface ModuleOverviewData {
  kind: "module-overview";
  modules: ModuleOverviewItem[];
}

export interface TopOrderedItem {
  rank: number;
  name: BilingualText;
  quantity: number;
  price: number;
}

/** Parsed `ORDER_TOP`. */
export interface TopOrderedData {
  kind: "top-ordered";
  items: TopOrderedItem[];
}

/** Parsed `DASHBOARD_REVENUE`. */
export interface RevenueData {
  kind: "revenue";
  target: number;
  partsPercent: number;
  productsPercent: number;
}

/** Parsed `DASHBOARD_INVENTORY_ALERT`. */
export interface InventoryAlertData {
  kind: "inventory-alert";
  partsBelowMinimum: number;
  purchaseRequestsWaiting: number;
}

export type WidgetSourceData =
  | CaseSummaryData
  | SlaData
  | CaseSeriesData
  | GrowthMetricsData
  | ModuleOverviewData
  | TopOrderedData
  | RevenueData
  | InventoryAlertData;

/**
 * One entry per WebSocket message type. Adding a new type to the dashboard means
 * adding a parser and one entry to `WIDGET_SOURCES` — nothing in the grid,
 * persistence, or page layers changes.
 */
export interface WidgetSourceDefinition {
  /** Registry key, referenced by a widget definition's `sourceId`. */
  id: string;
  /** Matches `message.data.additionalJson.type` on the wire. */
  wsType: string;
  /** Pure: raw envelope in, typed data out. */
  parse: (envelope: JSONObject) => WidgetSourceData;
  /**
   * Optional per-source subscribe frame. Unused today — all four sources are fed by
   * the single shared `{ EVENT: "DASHBOARD" }` send. Exists so a future source that
   * needs its own EVENT doesn't force a rewrite of the provider.
   */
  subscribe?: (send: (payload: unknown) => void, profile: DashboardProfile) => void;
}

export interface DashboardProfile {
  orgId: string;
  username: string;
}

/** What the provider stores per source. `undefined` for a source means "no message yet". */
export interface WidgetSourceEntry {
  data: WidgetSourceData;
  receivedAt: number;
}

export type WidgetSourceStore = Record<string, WidgetSourceEntry | undefined>;
