// Reading and formatting the telemetry a unit reports alongside its position.
//
// The values themselves already arrive on the dispatch unit list - nothing here
// costs a request. What they need is judgement, because the raw fields lie in
// two specific ways and both of them mislead a dispatcher:
//
//   1. A bearing is only meaningful while the unit is actually moving. A parked
//      car keeps reporting the heading it had when it stopped, and 0 means both
//      "due north" and "no fix at all". So a direction is only ever shown when
//      the speed says the unit is going somewhere.
//   2. None of it is live. These are the values as of the last refetch of the
//      unit list - see useStaffPositions - so every one of them is presented
//      with its age, exactly as the coordinates already are.
//
// Formatting lives here rather than in the section component for the same reason
// routeFormat.ts exists: it is testable-by-inspection arithmetic, and keeping it
// out of JSX keeps the section readable.
import type { TranslationKey, TranslationParams } from "@/core/types/i18n";
import type { StaffMarker } from "./staffTypes";

type Translate = (key: TranslationKey, params?: TranslationParams) => string;

/**
 * Above this the unit is treated as travelling, and its bearing as real.
 *
 * Set at brisk-walking pace: below it, GPS noise alone can swing a reported
 * heading through a full circle while the unit has not actually turned.
 */
export const MOVING_SPEED_KMH = 5;

/** True when the unit is going somewhere, as opposed to stopped or not reporting. */
export function isMoving(marker: StaffMarker): boolean {
  return marker.speedKmh !== null && marker.speedKmh > MOVING_SPEED_KMH;
}

/**
 * The bearing to draw an arrow for, or null when an arrow would be a guess.
 *
 * Both conditions matter: a bearing without movement is stale, and movement
 * without a bearing has no direction to point.
 */
export function getTravelBearing(marker: StaffMarker): number | null {
  return isMoving(marker) && marker.bearing !== null ? marker.bearing : null;
}

const COMPASS_KEYS: readonly TranslationKey[] = [
  "case.display.map_staff_compass_n",
  "case.display.map_staff_compass_ne",
  "case.display.map_staff_compass_e",
  "case.display.map_staff_compass_se",
  "case.display.map_staff_compass_s",
  "case.display.map_staff_compass_sw",
  "case.display.map_staff_compass_w",
  "case.display.map_staff_compass_nw"
];

/** The eight-point compass name for a bearing, e.g. 100 degrees -> "E". */
export function compassKey(bearingDegrees: number): TranslationKey {
  const sector = Math.round(bearingDegrees / 45) % COMPASS_KEYS.length;
  return COMPASS_KEYS[sector];
}

/** "NE 042°" - the name a person reads, with the number they can act on. */
export function formatBearing(bearingDegrees: number, t: Translate): string {
  return t("case.display.map_staff_tracking_bearing_value", {
    compass: t(compassKey(bearingDegrees)),
    degrees: String(Math.round(bearingDegrees)).padStart(3, "0")
  });
}

/** "48 km/h", or the translated stopped label when the unit is not travelling. */
export function formatSpeed(speedKmh: number, t: Translate): string {
  if (speedKmh <= MOVING_SPEED_KMH) {
    return t("case.display.map_staff_tracking_stopped");
  }
  return t("case.display.map_staff_tracking_speed_value", { speed: Math.round(speedKmh) });
}

/** "±12 m". Rounded up, so the figure never claims more precision than reported. */
export function formatAccuracy(accuracyMeters: number, t: Translate): string {
  return t("case.display.map_staff_tracking_accuracy_value", {
    meters: Math.ceil(accuracyMeters)
  });
}
