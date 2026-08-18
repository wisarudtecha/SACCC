// The MOB websocket contract, in one place.
//
// Source: src/cms/mocks/MOB.sh. The backend emits three unit events on the shared
// notification socket, all under EVENT "MOB" and told apart by `eventType`:
//
//   UNIT_SELECT  additionalJson: { unitId, username }  a responder picked a unit on the mobile app
//   STATUS       additionalJson: { sttId, unitId }     that unit's duty status changed
//   TRACKING     additionalJson: { unitId, latitude, longitude, heading, speed,
//                                  accuracy, gpsTime, ... }  the unit reported a position
//
// TRACKING is the one event that fully states its own change: it carries where
// the unit now is, so nothing has to be refetched to draw it (contrast STATUS and
// UNIT_SELECT, which each state a single field). There is still no DESELECT
// event, so the socket can say a unit was crewed but never that it was left, and
// `isLogin` continues to come only from /dispatch/{caseId}/units.
//
// TRACKING's field names deliberately do NOT match `Unit`'s - it sends
// `latitude`/`heading`/`gpsTime` where the REST snapshot has
// `locLat`/`locBearing`/`locGpsTime`, and its `gpsTime` is epoch milliseconds
// where `locGpsTime` is a string. Reconciling the two is useStaffPositions'
// job (see toLivePatch); this module's job is only to say what arrived.
//
// `WebSocketMessage.data` is `any` (websocket.tsx). This module is where that
// stops: everything downstream sees a MobUnitEvent or nothing at all.

export const MOB_EVENT = "MOB";

export type MobEventType = "UNIT_SELECT" | "STATUS" | "TRACKING";

/**
 * The position a TRACKING event reported.
 *
 * One nullable group rather than six loose optional fields on the event: a
 * heading or a speed means nothing without the coordinates they were measured
 * at, so they travel together or not at all.
 */
export interface MobLocation {
  latitude: number;
  longitude: number;
  /** Compass degrees, clockwise from north. */
  heading?: number;
  /** Ground speed. km/h - the unit the rest of this app reads locSpeed as. */
  speed?: number;
  /** Accuracy radius in metres. */
  accuracy?: number;
  /** EPOCH MILLISECONDS, unlike Unit.locGpsTime, which is a string. */
  gpsTimeMs?: number;
}

export interface MobUnitEvent {
  eventType: MobEventType;
  unitId: string;
  /** STATUS only - the unit's new duty status id. */
  sttId?: string;
  /** UNIT_SELECT only - the responder now crewing the unit. */
  username?: string;
  /** TRACKING only, and only when the coordinates were usable. */
  location?: MobLocation;
  /** Server timestamp of the event. */
  createdAt?: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/** Reads a non-empty string field; the API sends "" where it means absent. */
function readString(source: Record<string, unknown>, key: string): string | undefined {
  const value = source[key];
  return typeof value === "string" && value !== "" ? value : undefined;
}

/**
 * Reads a numeric field, accepting the number itself or a numeric string.
 *
 * Separate from readString rather than layered on it: JSON from this socket has
 * sent both shapes for the same field before, and a coordinate that silently
 * became NaN would put an officer nowhere at all.
 */
function readNumber(source: Record<string, unknown>, key: string): number | undefined {
  const value = source[key];
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : undefined;
  }
  if (typeof value === "string" && value !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

/**
 * The location half of a TRACKING event, or undefined when it has none to give.
 *
 * Only latitude and longitude are required. Everything else is genuinely
 * optional on the wire - a handset with no speed sensor still reports where it
 * is - and each field is validated further downstream by toStaffMarkers, which
 * is where 0/0, out-of-range bearings and unreported accuracies are already
 * ruled on for the REST snapshot.
 */
function readLocation(payload: Record<string, unknown>): MobLocation | undefined {
  const latitude = readNumber(payload, "latitude");
  const longitude = readNumber(payload, "longitude");
  if (latitude === undefined || longitude === undefined) {
    return undefined;
  }
  return {
    latitude,
    longitude,
    heading: readNumber(payload, "heading"),
    speed: readNumber(payload, "speed"),
    accuracy: readNumber(payload, "accuracy"),
    gpsTimeMs: readNumber(payload, "gpsTime")
  };
}

function isMobEventType(value: unknown): value is MobEventType {
  return value === "UNIT_SELECT" || value === "STATUS" || value === "TRACKING";
}

/**
 * Narrow a raw socket frame to a MOB unit event.
 *
 * Returns null for everything that is not one: a different EVENT, an eventType
 * this build does not handle, or a payload with no unitId to apply it to. The
 * caller gets a single yes/no instead of a chain of optional chaining, and a new
 * eventType added on the backend is ignored rather than half-applied.
 */
export function parseMobEvent(data: unknown): MobUnitEvent | null {
  if (!isRecord(data) || data.EVENT !== MOB_EVENT) {
    return null;
  }
  if (!isMobEventType(data.eventType)) {
    return null;
  }

  const payload = data.additionalJson;
  if (!isRecord(payload)) {
    return null;
  }

  const unitId = readString(payload, "unitId");
  if (!unitId) {
    return null;
  }

  return {
    eventType: data.eventType,
    unitId,
    sttId: readString(payload, "sttId"),
    username: readString(payload, "username"),
    // A TRACKING event whose coordinates are missing or unreadable still parses:
    // it names a unit that reported, which is true, and leaves `location`
    // undefined. Deciding that there is nothing to draw belongs to toLivePatch,
    // not here - same division of labour as sttId and username above.
    location: data.eventType === "TRACKING" ? readLocation(payload) : undefined,
    createdAt: readString(data, "createdAt")
  };
}
