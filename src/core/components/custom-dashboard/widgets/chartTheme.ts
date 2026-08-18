// src/core/components/custom-dashboard/widgets/chartTheme.ts
import type { Language } from "@/core/config/i18n";
import type { BilingualText } from "@/core/components/custom-dashboard/sources/types";

/** Complete, In Progress, New — the same order and colors the existing dashboard uses. */
export const SERIES_COLORS = ["#05DF72", "#51A2FF", "#FDC700"];

export const CHART_FONT_FAMILY = "Outfit, sans-serif";

/**
 * Payloads carry English and Thai. There is no Chinese variant on the wire, so `cn`
 * falls back to English rather than rendering an empty label.
 */
export const pickText = (text: BilingualText | undefined, language: Language): string => {
  if (!text) {
    return "";
  }
  return language === "th" ? text.th || text.en : text.en || text.th;
};

export const statusLabels = (language: Language): { complete: string; inProgress: string; new: string } =>
  language === "th"
    ? { complete: "เสร็จสิ้น", inProgress: "กำลังดำเนินการ", new: "งานใหม่" }
    : { complete: "Complete", inProgress: "In Progress", new: "New" };
