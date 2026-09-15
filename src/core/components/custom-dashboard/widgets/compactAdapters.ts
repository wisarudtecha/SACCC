// src/core/components/custom-dashboard/widgets/compactAdapters.ts
//
// One "pick the single headline number" function per source kind, used by
// WidgetHost.tsx to render CompactWidgetTile instead of a widget's normal
// Component when displayMode is "compact". Each mirrors the
// `if (data.kind !== "...") return null` narrowing every widget Component
// already does, and is pure/side-effect-free so it's unit-testable without a DOM.
//
// Static headline labels ("Latest Total", "Below Minimum", ...) are hand-rolled
// EN/TH pairs rather than JSON i18n keys, matching chartTheme.ts's own
// `statusLabels` precedent for this exact kind of short chart-adjacent label.
import type { Language } from "@/core/config/i18n";
import type { WidgetSourceData } from "@/core/components/custom-dashboard/sources/types";
import { pickText } from "@/core/components/custom-dashboard/widgets/chartTheme";

export interface CompactTileValue {
  label: string;
  value: string | number;
}

const label = (language: Language, en: string, th: string): string => (language === "th" ? th : en);

export const compactCaseSummary = (data: WidgetSourceData, language: Language): CompactTileValue | null => {
  if (data.kind !== "case-summary") {
    return null;
  }
  return { label: pickText(data.title, language), value: data.total };
};

export const compactSla = (data: WidgetSourceData, language: Language): CompactTileValue | null => {
  if (data.kind !== "sla") {
    return null;
  }
  return { label: label(language, "In SLA", "ปฏิบัติตาม SLA"), value: data.inSla };
};

/** Shared by caseDailyChart, caseMonthlyChart, and caseStatusDonut - all three read the same `"case-series"` kind. */
export const compactCaseSeries = (data: WidgetSourceData, language: Language): CompactTileValue | null => {
  if (data.kind !== "case-series") {
    return null;
  }
  const [complete, inprogress, newCount] = data.latest;
  return { label: label(language, "Latest Total", "ยอดล่าสุด"), value: complete + inprogress + newCount };
};

export const compactCaseSummaryByArea = (data: WidgetSourceData, language: Language): CompactTileValue | null => {
  if (data.kind !== "case-summary-by-area") {
    return null;
  }
  const totals =
    data.total?.total ??
    data.rows.reduce(
      (sum, row) => ({
        new: sum.new + row.total.new,
        inprogress: sum.inprogress + row.total.inprogress,
        complete: sum.complete + row.total.complete,
      }),
      { new: 0, inprogress: 0, complete: 0 }
    );
  return {
    label: label(language, "Total Cases", "เคสทั้งหมด"),
    value: totals.new + totals.inprogress + totals.complete,
  };
};

export const compactGrowthMetrics = (data: WidgetSourceData, language: Language): CompactTileValue | null => {
  if (data.kind !== "growth-metrics") {
    return null;
  }
  return {
    label: label(language, "Total Growth", "การเติบโตรวม"),
    value: data.metrics.reduce((sum, metric) => sum + metric.total, 0),
  };
};

export const compactModuleOverview = (data: WidgetSourceData, language: Language): CompactTileValue | null => {
  if (data.kind !== "module-overview") {
    return null;
  }
  return {
    label: label(language, "Total Active", "ใช้งานทั้งหมด"),
    value: data.modules.reduce((sum, moduleItem) => sum + moduleItem.totalActive, 0),
  };
};

export const compactTopOrdered = (data: WidgetSourceData, language: Language): CompactTileValue | null => {
  if (data.kind !== "top-ordered") {
    return null;
  }
  const top = data.items[0];
  if (!top) {
    return null;
  }
  return { label: pickText(top.name, language), value: top.quantity };
};

export const compactRevenue = (data: WidgetSourceData, language: Language): CompactTileValue | null => {
  if (data.kind !== "revenue") {
    return null;
  }
  return { label: label(language, "Target", "เป้าหมาย"), value: data.target };
};

export const compactInventoryAlert = (data: WidgetSourceData, language: Language): CompactTileValue | null => {
  if (data.kind !== "inventory-alert") {
    return null;
  }
  return { label: label(language, "Below Minimum", "ต่ำกว่าขั้นต่ำ"), value: data.partsBelowMinimum };
};
