// src/cms/utils/slaEscalation.ts
/**
 * Pure SLA visual-state derivation shared by the countdown timer, the case
 * list / assignment badges, and the SLA monitor widget, so every surface
 * renders the SAME state for the same case (CAD-FE-SLA-Breach-Escalation §7).
 *
 * The client clock only animates: callers should derive the inputs from
 * server-supplied values (`createdAt` + SLA minutes today, `slaDueAt` once the
 * backend ships) and treat the result as a rendering hint, not as breach
 * detection — detection is a backend responsibility (CAD assumption A1).
 */
import type { SlaVisualState } from "@/cms/types/escalation";
import {
  clampWarningThresholdPct,
  DEFAULT_WARNING_THRESHOLD_PCT,
} from "@/cms/utils/escalationRules";

const MINUTE_MS = 60 * 1000;

/**
 * Derives the visual SLA state for a case created at `createdAt` with an SLA
 * window of `slaMinutes`, evaluated at `nowMs` (defaults to `Date.now()`,
 * injectable for tests and for server-clock-offset rendering).
 *
 * - "breached": the SLA due time has passed.
 * - "warning": at least `warningPct` percent of the SLA window has elapsed
 *   (default 80%, clamped to 1-99 — CAD decision 4).
 * - "normal": everything else, including unparseable / non-positive inputs, so
 *   a bad record never renders as a false breach.
 */
export function deriveSlaState(
  createdAt: string | number | Date | null | undefined,
  slaMinutes: number | null | undefined,
  warningPct: number = DEFAULT_WARNING_THRESHOLD_PCT,
  nowMs: number = Date.now()
): SlaVisualState {
  if (createdAt === null || createdAt === undefined || slaMinutes === null || slaMinutes === undefined) {
    return "normal";
  }
  const createdMs = new Date(createdAt).getTime();
  if (!Number.isFinite(createdMs) || !Number.isFinite(slaMinutes) || slaMinutes <= 0) {
    return "normal";
  }
  const windowMs = slaMinutes * MINUTE_MS;
  const remainingMs = createdMs + windowMs - nowMs;
  if (remainingMs <= 0) {
    return "breached";
  }
  const elapsedPct = ((windowMs - remainingMs) / windowMs) * 100;
  return elapsedPct >= clampWarningThresholdPct(warningPct) ? "warning" : "normal";
}

/** Badge color for a derived state — mirrors the existing Badge variant names. */
export function slaStateToBadgeColor(state: SlaVisualState): "primary" | "warning" | "error" {
  if (state === "breached") {
    return "error";
  }
  if (state === "warning") {
    return "warning";
  }
  return "primary";
}

/**
 * Dedupe key for escalation notifications: one alert per (caseId, level, type)
 * so reconnects and multi-tab sessions do not re-alert (CAD risk table), while
 * a warning and its later breach at the same level still each alert once.
 */
export function escalationDedupeKey(
  caseId: string,
  level: number,
  type?: "warning" | "breach"
): string {
  return type ? `${caseId}#${level}#${type}` : `${caseId}#${level}`;
}
