// View-model for the staff (dispatch unit) markers drawn on the case map.
//
// The API's `Unit` carries far more than the map needs, and its location fields
// are not guaranteed to be usable: a unit that has never reported a position
// comes back with 0/0 (or nulls that JSON-decode to 0), which would draw every
// such officer in the Gulf of Guinea. `toStaffMarkers` is the single place that
// decides what counts as a mappable staff member, so the layer, the panel and
// any future consumer all agree on it.
import type { Unit } from "@/cms/types/dispatch";

export interface StaffSkill {
  skillId: string;
  en: string;
  th: string;
}

export interface StaffMarker {
  unitId: string;
  unitName: string;
  username: string;
  /** Avatar URL. Used by the detail panel only - never fetched for the map symbol. */
  photo: string;
  /** `sttId` - drives the marker colour, see staffSymbols.ts. */
  statusId: string;
  isLogin: boolean;
  latitude: number;
  longitude: number;
  /** ISO timestamp of the last position report, or "" when never reported. */
  lastUpdateTime: string;
  skills: StaffSkill[];
  /**
   * Direction of travel in compass degrees, or null when the unit did not report
   * a usable one. NOT trustworthy on its own: a parked unit reports whatever
   * heading it last had, and 0 means both "due north" and "no fix". Read it
   * through staffTelemetry's isMoving/hasUsableBearing, never bare.
   */
  bearing: number | null;
  /**
   * Ground speed, km/h. Null when not reported; 0 is a real reading (stopped).
   *
   * The API field is `locSpeed` with no documented unit. km/h is what the rest of
   * this app already renders it as - UnitPreviewModal and UnitManagement both
   * label it that way - so the map follows suit rather than inventing a second
   * reading of the same number.
   */
  speedKmh: number | null;
  /** Reported GPS accuracy radius in metres. Null when absent or 0 (not reported). */
  accuracyMeters: number | null;
  /**
   * ISO timestamp the GPS fix itself was taken, or "" when absent. Distinct from
   * `lastUpdateTime`, which is when the server last heard from the unit - a unit
   * can check in on a fix that is already old.
   */
  gpsTime: string;
}

/**
 * What a click on the staff layer resolved to.
 *
 * A discriminated union rather than a bare unitId because officers who overlap
 * on screen are drawn as one group (see staffClusters.ts), and a click on that
 * group has to be distinguishable from a click on one person - it opens a picker
 * rather than a detail card.
 */
export type StaffSelection =
  | { type: "staff"; unitId: string }
  | { type: "group"; unitIds: readonly string[] };

/**
 * A position older than this is drawn de-emphasised and flagged in the panel.
 * Showing a six-hour-old position with the same confidence as a live one is the
 * failure mode that actually misleads a dispatcher.
 */
export const STAFF_STALE_THRESHOLD_MS = 5 * 60 * 1000;

function toFiniteNumber(value: unknown): number | null {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

/**
 * Compass degrees, or null when the value cannot be read as one.
 *
 * Out-of-range readings are rejected rather than wrapped: a unit reporting 400
 * is reporting a fault, and silently turning that into 40 would hide it behind a
 * confident-looking arrow.
 */
function toBearingDegrees(value: unknown): number | null {
  const parsed = toFiniteNumber(value);
  if (parsed === null || parsed < 0 || parsed > 360) {
    return null;
  }
  // 360 and 0 are the same direction; normalise so consumers only see one.
  return parsed === 360 ? 0 : parsed;
}

/** A reading above zero, or null. Used where 0 means "not reported", not "zero". */
function toPositiveNumber(value: unknown): number | null {
  const parsed = toFiniteNumber(value);
  return parsed !== null && parsed > 0 ? parsed : null;
}

/** A reading of zero or more, or null. Used where 0 is a genuine measurement. */
function toNonNegativeNumber(value: unknown): number | null {
  const parsed = toFiniteNumber(value);
  return parsed !== null && parsed >= 0 ? parsed : null;
}

/**
 * True when the pair is a position a dispatcher can act on. Exact 0/0 is treated
 * as "no fix reported" rather than a real location in the Atlantic - no unit in
 * this product operates there, and the API uses 0 as its empty value.
 */
export function isMappableCoordinate(latitude: number, longitude: number): boolean {
  if (latitude === 0 && longitude === 0) {
    return false;
  }
  return (
    latitude >= -90 && latitude <= 90 &&
    longitude >= -180 && longitude <= 180
  );
}

/**
 * A partial `Unit` carrying whatever a socket event stated about it.
 *
 * Deliberately shaped like `Unit` rather than like `StaffMarker`: patches are
 * merged BEFORE toStaffMarkers runs, so socket data passes through exactly the
 * same guards as data from the REST snapshot - the 0/0 coordinate test, the
 * bearing range check, the "0 means not reported" accuracy rule. One validation
 * path, two transports. It also means a unit whose only known position arrived
 * over the socket can be drawn at all: toStaffMarkers drops units at 0/0, and a
 * patch applied after that filter could never bring one back.
 */
export type UnitPatch = Partial<Unit>;

export function toStaffMarkers(
  units: readonly Unit[] | undefined,
  patches?: Readonly<Record<string, UnitPatch>>
): StaffMarker[] {
  if (!units?.length) {
    return [];
  }

  const hasPatches = Boolean(patches && Object.keys(patches).length > 0);

  return units.reduce<StaffMarker[]>((markers, rawUnit) => {
    const patch = hasPatches ? patches?.[rawUnit.unitId] : undefined;
    const unit = patch ? { ...rawUnit, ...patch } : rawUnit;

    const latitude = toFiniteNumber(unit.locLat);
    const longitude = toFiniteNumber(unit.locLon);

    if (latitude === null || longitude === null || !isMappableCoordinate(latitude, longitude)) {
      return markers;
    }

    return [
      ...markers,
      {
        unitId: unit.unitId,
        unitName: unit.unitName || unit.username || unit.unitId,
        username: unit.username ?? "",
        photo: unit.photo ?? "",
        statusId: unit.sttId ?? "",
        isLogin: Boolean(unit.isLogin),
        latitude,
        longitude,
        lastUpdateTime: unit.locLastUpdateTime ?? "",
        skills: unit.skillLists ?? [],
        bearing: toBearingDegrees(unit.locBearing),
        // 0 is kept as a reading, not discarded: a unit standing still is exactly
        // what a dispatcher wants to see, and it is the value the heading check
        // relies on to know an arrow would be meaningless.
        speedKmh: toNonNegativeNumber(unit.locSpeed),
        accuracyMeters: toPositiveNumber(unit.locAccuracy),
        gpsTime: unit.locGpsTime ?? ""
      }
    ];
  }, []);
}

/**
 * True when an ISO timestamp is older than the staleness threshold, or unusable.
 *
 * Missing and unparseable both count as stale: the point of the flag is "do not
 * trust this as current", and a reading with no time on it earns that least of
 * all.
 */
export function isStaleTimestamp(isoTimestamp: string, nowMs: number = Date.now()): boolean {
  if (!isoTimestamp) {
    return true;
  }
  const reportedAt = new Date(isoTimestamp).getTime();
  if (!Number.isFinite(reportedAt)) {
    return true;
  }
  return nowMs - reportedAt > STAFF_STALE_THRESHOLD_MS;
}

export function isStaleLocation(marker: StaffMarker, nowMs: number = Date.now()): boolean {
  return isStaleTimestamp(marker.lastUpdateTime, nowMs);
}
