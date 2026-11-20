// Cadence resolution for the two staff timers the org can configure (Phase C of
// docs/ORG-SETTINGS-Runtime-Wiring-Plan.md).
//
// Both settings are the same `AutoManualSetting` shape but they mean different
// things, and getting either wrong is expensive:
//
//   etaTtl  - a DISPLAY-ONLY re-render. "manual" still has to tick (it is the
//              behaviour that shipped), so there is no "off" state.
//   tracking - a SAFETY-NET REFETCH: one request per open case. "manual" really
//              means no timer at all (decision D6), and "auto" needs a floor
//              (decision D7) because the schema accepts 15s while one round is
//              one request per case.
//
// PURE: no React, no SDK, no timer. The hooks/components below only apply what
// this returns.
import type { AutoManualSetting } from "@/core/types/organization";
import { AUTO_INTERVAL_MIN_SECONDS } from "@/cms/utils/orgMapSettings";

/**
 * How often the ETA/TTL countdown re-renders when nothing else is configured.
 * The value both components hardcoded before Phase C1, and the value `manual`
 * keeps - the tick is display-only and never triggers a solve.
 */
export const ETA_TTL_DEFAULT_TICK_MS = 30_000;

/** The schema's floor for any auto interval (seconds), in milliseconds. */
export const ETA_TTL_MIN_TICK_MS = AUTO_INTERVAL_MIN_SECONDS * 1_000;

/**
 * How often the TTL countdown re-renders.
 *
 * `manual` keeps the 30s tick (there is nothing to switch off - see the header).
 * `auto` uses the configured interval, and anything malformed falls back to 30s
 * rather than to 0: a 0ms interval is not "faster", it is a busy loop that
 * re-renders the dashboard continuously.
 */
export function resolveEtaTtlTickMs(setting: AutoManualSetting | null | undefined): number {
  if (!setting || setting.mode !== "auto") {
    return ETA_TTL_DEFAULT_TICK_MS;
  }
  const seconds = setting.autoIntervalSeconds;
  if (typeof seconds !== "number" || !Number.isFinite(seconds)) {
    return ETA_TTL_DEFAULT_TICK_MS;
  }
  const intervalMs = Math.round(seconds * 1_000);
  return intervalMs >= ETA_TTL_MIN_TICK_MS ? intervalMs : ETA_TTL_DEFAULT_TICK_MS;
}

/**
 * How often the staff roster is refetched as a safety net, or null for "no timer".
 *
 * The 60s default is `ROSTER_SAFETY_REFETCH_MS` - what `useStaffPositions` ran
 * unconditionally before C3, so an org that never saved settings keeps the
 * behaviour it has today (D10/D11).
 */
export const TRACKING_DEFAULT_POLL_MS = 60_000;

/**
 * The lowest poll this setting may produce (decision D7).
 *
 * The schema accepts 15s, but a poll round is one request per open case, so a
 * value below 30s is raised to 30s at the point of use rather than rejected on
 * save: an admin who typed 15 gets a working dashboard and a note saying what is
 * really in effect, not a validation error on an unrelated screen.
 */
export const TRACKING_MIN_POLL_MS = 30_000;

/**
 * The safety-net poll interval, or `null` when there should be no timer.
 *
 * `manual` = no timer (D6). `auto` = the configured interval clamped UP to
 * `TRACKING_MIN_POLL_MS`; anything malformed falls back to the default cadence,
 * because "auto with a broken number" must still keep positions fresh.
 */
export function resolveTrackingPollMs(
  setting: AutoManualSetting | null | undefined
): number | null {
  if (!setting || setting.mode !== "auto") {
    return null;
  }
  const seconds = setting.autoIntervalSeconds;
  if (typeof seconds !== "number" || !Number.isFinite(seconds) || seconds <= 0) {
    return TRACKING_DEFAULT_POLL_MS;
  }
  return Math.max(Math.round(seconds * 1_000), TRACKING_MIN_POLL_MS);
}

/**
 * The interval actually in effect, in seconds - what the settings screen quotes
 * back to the admin when the clamp changed their number.
 */
export function resolveTrackingEffectiveSeconds(
  setting: AutoManualSetting | null | undefined
): number | null {
  const pollMs = resolveTrackingPollMs(setting);
  return pollMs === null ? null : Math.round(pollMs / 1_000);
}
