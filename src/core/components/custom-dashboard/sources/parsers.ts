// src/core/components/custom-dashboard/sources/parsers.ts
/**
 * Pure parsers: raw WebSocket envelope in, typed widget data out.
 *
 * The wire format is bilingual and irregular. A payload's `additionalJson.data` is an
 * array of single-purpose objects whose *key name* carries both the field identity and
 * the language (`total_en`, `g1_th`, `m3_en`), while the value sits on a sibling `val`
 * key. Every lookup here is written to return a zero/empty default on a miss, because
 * the server seeds these payloads with zeros before live data arrives.
 */
import { findKeyDeep, findKeyInArray } from "@/core/utils/dashboard";
import type { JSONArray, JSONObject, JSONValue } from "@/core/types/dashboard";
import type {
  BilingualText,
  CaseSeriesData,
  CaseSummaryData,
  CaseSummaryGroup,
  SlaData,
} from "@/core/components/custom-dashboard/sources/types";

/** Rows of a period series are identified by an `m<n>_en` key; the "Total" row has none. */
const PERIOD_KEY_PATTERN = /^m\d+_en$/;

const toNumber = (value: JSONValue | undefined): number => {
  if (typeof value === "number") {
    return value;
  }
  if (typeof value === "string") {
    // SLA percentages arrive as "82%".
    const parsed = parseFloat(value.replace("%", ""));
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  return 0;
};

const toText = (value: JSONValue | undefined): string => (typeof value === "string" ? value : "");

const getAdditionalJson = (envelope: JSONObject): JSONObject => {
  const additionalJson = envelope["additionalJson"];
  return (additionalJson && typeof additionalJson === "object" && !Array.isArray(additionalJson)
    ? additionalJson
    : {}) as JSONObject;
};

const getRows = (envelope: JSONObject): JSONObject[] => {
  const rows = getAdditionalJson(envelope)["data"];
  return Array.isArray(rows) ? (rows.filter(row => typeof row === "object" && row !== null) as JSONObject[]) : [];
};

const getTitle = (envelope: JSONObject): BilingualText => {
  const additionalJson = getAdditionalJson(envelope);
  return {
    en: toText(additionalJson["title_en"]),
    th: toText(additionalJson["title_th"]),
  };
};

/** Reads the `val` of the row that carries `<field>_en` / `<field>_th`. */
const readValue = (rows: JSONArray, field: string): number =>
  toNumber(findKeyInArray(rows, `${field}_en`)?.val ?? findKeyInArray(rows, `${field}_th`)?.val);

/** Reads the bilingual label attached to a field, wherever it is nested. */
const readLabel = (rows: JSONArray, field: string): BilingualText => ({
  en: toText(findKeyDeep(rows, `${field}_en`)),
  th: toText(findKeyDeep(rows, `${field}_th`)),
});

const rate = (part: number, total: number): number => (total > 0 ? (part / total) * 100 : 0);

// ---------------------------------------------------------------------------
// CASE-SUMMARY
// ---------------------------------------------------------------------------

/**
 * Group rows are `g1`, `g2`, `g3`, … — discovered rather than hardcoded, so a server
 * that starts sending a `g4` renders it without a code change here.
 */
export const parseCaseSummary = (envelope: JSONObject): CaseSummaryData => {
  const rows = getRows(envelope);
  const groups: CaseSummaryGroup[] = [];

  rows.forEach(row => {
    const englishKey = Object.keys(row).find(key => /^g\d+_en$/.test(key));
    if (!englishKey) {
      return;
    }
    const field = englishKey.replace(/_en$/, "");
    groups.push({
      label: { en: toText(row[englishKey]), th: toText(row[`${field}_th`]) },
      value: toNumber(row["val"]),
    });
  });

  return {
    kind: "case-summary",
    title: getTitle(envelope),
    total: readValue(rows, "total"),
    groups,
  };
};

// ---------------------------------------------------------------------------
// SLA-PERFORMANCE
// ---------------------------------------------------------------------------

export const parseSla = (envelope: JSONObject): SlaData => {
  const rows = getRows(envelope);
  const total = readValue(rows, "total");
  const inSla = readValue(rows, "inSLA");
  const overSla = readValue(rows, "overSLA");

  return {
    kind: "sla",
    title: getTitle(envelope),
    total,
    inSla,
    overSla,
    inSlaRate: rate(inSla, total),
    overSlaRate: rate(overSla, total),
    avgResponse: readValue(rows, "avg_respose_time"),
    avgResponseLabel: readLabel(rows, "avg_respose_time"),
    unit: readLabel(rows, "unit"),
  };
};

// ---------------------------------------------------------------------------
// CASE-DAILY-SUMMARY / CASE-MONTHLY-SUMMARY (same envelope shape)
// ---------------------------------------------------------------------------

interface PeriodRow {
  row: JSONObject;
  labelEn: string;
  labelTh: string;
  date: number;
}

const readPeriodRows = (rows: JSONObject[]): PeriodRow[] =>
  rows
    .filter(row => Object.keys(row).some(key => PERIOD_KEY_PATTERN.test(key)))
    .map(row => {
      const englishKey = Object.keys(row).find(key => key.endsWith("_en")) ?? "";
      const thaiKey = Object.keys(row).find(key => key.endsWith("_th")) ?? "";
      const labelEn = toText(row[englishKey]);
      return {
        row,
        labelEn,
        labelTh: toText(row[thaiKey]),
        date: new Date(labelEn).getTime(),
      };
    });

/**
 * @param sortChronologically Monthly rows arrive unordered and must be sorted by their
 *   parsed date. Daily rows arrive already ordered and their labels don't reliably parse
 *   as dates, so sorting them would scramble the series.
 */
const buildCaseSeries = (envelope: JSONObject, sortChronologically: boolean): CaseSeriesData => {
  const periodRows = readPeriodRows(getRows(envelope));

  if (sortChronologically) {
    periodRows.sort((a, b) => a.date - b.date);
  }

  const complete = periodRows.map(entry => Math.max(0, toNumber(entry.row["complete"])));
  const inprogress = periodRows.map(entry => Math.max(0, toNumber(entry.row["inprogress"])));
  const created = periodRows.map(entry => Math.max(0, toNumber(entry.row["new"])));
  const lastIndex = periodRows.length - 1;

  return {
    kind: "case-series",
    title: getTitle(envelope),
    categories: {
      en: periodRows.map(entry => entry.labelEn),
      th: periodRows.map(entry => entry.labelTh),
    },
    series: { complete, inprogress, new: created },
    latest:
      lastIndex >= 0
        ? [complete[lastIndex], inprogress[lastIndex], created[lastIndex]]
        : [0, 0, 0],
  };
};

export const parseCaseDaily = (envelope: JSONObject): CaseSeriesData => buildCaseSeries(envelope, false);

export const parseCaseMonthly = (envelope: JSONObject): CaseSeriesData => buildCaseSeries(envelope, true);
