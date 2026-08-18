// Display formatting for the route sections. `src/cms/components/date/` has no
// duration or wall-clock-arrival helper to extend - both are self-contained here.
import type { Language } from "@/core/config/i18n";
import type { TranslationKey, TranslationParams } from "@/core/types/i18n";
import type { RouteErrorReason } from "./routeTypes";

type Translate = (key: TranslationKey, params?: TranslationParams) => string;

/** "18 min" / translated equivalent. */
export function formatDriveTime(minutes: number, t: Translate): string {
  const rounded = Math.max(1, Math.round(minutes));
  return t("case.display.map_staff_route_minutes", { minutes: rounded });
}

/** "7.4 km" / translated equivalent. */
export function formatDistanceKm(distanceKm: number, t: Translate): string {
  return t("case.display.map_staff_route_km", { km: distanceKm.toFixed(1) });
}

/** Wall-clock arrival time, e.g. "14:32", in the case's operating timezone. */
export function formatEtaClock(atMs: number, language: Language): string {
  const formatter = new Intl.DateTimeFormat(language === "th" ? "th-TH" : "en-US", {
    timeZone: "Asia/Bangkok",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  });
  return formatter.format(new Date(atMs));
}

/** Minutes remaining until arrival, floored at 0 - never negative. */
export function ttlMinutesRemaining(etaMs: number, nowMs: number): number {
  return Math.max(0, Math.round((etaMs - nowMs) / 60_000));
}

const ROUTE_ERROR_KEYS: Record<RouteErrorReason, TranslationKey> = {
  "no-case-location": "case.display.map_staff_route_err_no_case",
  "no-staff-position": "case.display.map_staff_route_err_no_staff",
  "solve-failed": "case.display.map_staff_route_err_failed",
  "no-metrics": "case.display.map_staff_route_err_metrics"
};

export function routeErrorKey(reason: RouteErrorReason): TranslationKey {
  return ROUTE_ERROR_KEYS[reason];
}
