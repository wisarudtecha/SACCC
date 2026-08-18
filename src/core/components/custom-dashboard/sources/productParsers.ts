// src/core/components/custom-dashboard/sources/productParsers.ts
/**
 * Pure parsers for the Product (CRM) dashboard WebSocket message types.
 *
 * These payloads are keyed objects (not the bilingual array envelope the case sources use),
 * so the shapes here mirror what `ProductDashboard.tsx` reads. Every accessor defaults on a
 * miss because the backend seeds these before live data lands.
 */
import type { JSONArray, JSONObject, JSONValue } from "@/core/types/dashboard";
import type {
  GrowthMetric,
  GrowthMetricsData,
  InventoryAlertData,
  ModuleOverviewData,
  ModuleOverviewItem,
  RevenueData,
  TopOrderedData,
  TopOrderedItem,
} from "@/core/components/custom-dashboard/sources/types";

const toNumber = (value: JSONValue | undefined): number => {
  if (typeof value === "number") {
    return value;
  }
  if (typeof value === "string") {
    const parsed = parseFloat(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  return 0;
};

const toText = (value: JSONValue | undefined): string => (typeof value === "string" ? value : "");

const asObject = (value: JSONValue | undefined): JSONObject =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as JSONObject) : {};

const asArray = (value: JSONValue | undefined): JSONArray => (Array.isArray(value) ? value : []);

/** Reads `additionalJson.data` as an object. */
const getData = (envelope: JSONObject): JSONObject =>
  asObject(asObject(envelope["additionalJson"])["data"]);

// ---------------------------------------------------------------------------
// DASHBOARD_GROWTH — { product: { main: { growthRate, total } }, sparePart: {...}, ... }
// ---------------------------------------------------------------------------

export const parseGrowthMetrics = (envelope: JSONObject): GrowthMetricsData => {
  const data = getData(envelope);

  const metrics: GrowthMetric[] = Object.entries(data).map(([key, entry]) => {
    const main = asObject(asObject(entry as JSONValue)["main"]);
    return {
      key,
      total: toNumber(main["total"]),
      growthRate: toNumber(main["growthRate"]),
    };
  });

  return { kind: "growth-metrics", metrics };
};

// ---------------------------------------------------------------------------
// DASHBOARD_SUMMARY_ALL — { productStock: { totalActive }, sparePartStock: {...}, ... }
// ---------------------------------------------------------------------------

export const parseModuleOverview = (envelope: JSONObject): ModuleOverviewData => {
  const data = getData(envelope);

  const modules: ModuleOverviewItem[] = Object.entries(data).map(([key, entry]) => ({
    key,
    totalActive: toNumber(asObject(entry as JSONValue)["totalActive"]),
  }));

  return { kind: "module-overview", modules };
};

// ---------------------------------------------------------------------------
// ORDER_TOP — { byParts: [{ rank, quantity, partMeta: { th, en, price } }] }
// ---------------------------------------------------------------------------

export const parseTopOrdered = (envelope: JSONObject): TopOrderedData => {
  const byParts = asArray(getData(envelope)["byParts"]);

  const items: TopOrderedItem[] = byParts
    .map(entry => {
      const obj = asObject(entry);
      const partMeta = asObject(obj["partMeta"]);
      return {
        rank: toNumber(obj["rank"]),
        name: { en: toText(partMeta["en"]), th: toText(partMeta["th"]) },
        quantity: toNumber(obj["quantity"]),
        price: toNumber(partMeta["price"]),
      };
    })
    .sort((a, b) => a.rank - b.rank);

  return { kind: "top-ordered", items };
};

// ---------------------------------------------------------------------------
// DASHBOARD_REVENUE — { summary: { target }, items: [{ type, percentRate }] }
// ---------------------------------------------------------------------------

export const parseRevenue = (envelope: JSONObject): RevenueData => {
  const data = getData(envelope);
  const summary = asObject(data["summary"]);
  const items = asArray(data["items"]);

  const percentByType = (type: string): number => {
    const match = items.find(item => asObject(item)["type"] === type);
    return match ? toNumber(asObject(match)["percentRate"]) : 0;
  };

  return {
    kind: "revenue",
    target: toNumber(summary["target"]),
    partsPercent: percentByType("parts"),
    productsPercent: percentByType("products"),
  };
};

// ---------------------------------------------------------------------------
// DASHBOARD_INVENTORY_ALERT — { approval: [...], parts: [...] }
// ---------------------------------------------------------------------------

export const parseInventoryAlert = (envelope: JSONObject): InventoryAlertData => {
  const data = getData(envelope);
  return {
    kind: "inventory-alert",
    partsBelowMinimum: asArray(data["parts"]).length,
    purchaseRequestsWaiting: asArray(data["approval"]).length,
  };
};
