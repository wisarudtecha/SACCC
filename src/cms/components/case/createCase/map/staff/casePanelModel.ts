// Pure view-model helpers for the Case Panel.
//
// Kept free of React and of any map SDK on purpose: the panel, the map wiring and
// the tests all read from here, and a helper that lived in an SDK-bound module
// would drag that SDK into every chunk that imports it.
import type { CaseSopUnit } from "@/cms/types/dispatch";
import type { MapLatLon } from "../mapTypes";
import type { StaffMarker } from "./staffTypes";

/** The only fields of a user record the panel reads. */
export interface UserNameSource {
  username: string;
  displayName?: string;
  firstName?: string;
  lastName?: string;
}

function joinName(firstName?: string, lastName?: string): string {
  return `${firstName ?? ""} ${lastName ?? ""}`.trim();
}

/** username -> best available display name. Users with no name at all are left out. */
export function buildUserNameIndex(users: readonly UserNameSource[]): ReadonlyMap<string, string> {
  const index = new Map<string, string>();
  users.forEach((user) => {
    const label = user.displayName?.trim() || joinName(user.firstName, user.lastName);
    if (user.username && label) {
      index.set(user.username, label);
    }
  });
  return index;
}

/** A name when the user lookup knows one, otherwise the username itself. */
export function resolveUserLabel(username: string, index: ReadonlyMap<string, string>): string {
  return index.get(username) ?? username;
}

/**
 * The people who assigned units to this case: the distinct `createdBy` of every
 * SOP unit, in the order they first appear. `createdBy` is a username, not a
 * name - see resolveUserLabel.
 */
export function dedupeDispatchers(units: readonly CaseSopUnit[]): string[] {
  const seen = new Set<string>();
  units.forEach((unit) => {
    const dispatcher = unit.createdBy?.trim();
    if (dispatcher) {
      seen.add(dispatcher);
    }
  });
  return [...seen];
}

/** How a responder is named in the list: their name, else username, else unit id. */
export function getResponderLabel(unit: CaseSopUnit): string {
  return joinName(unit.firstName, unit.lastName) || unit.username || unit.unitId;
}

/** Where a responder is on the map, or null when the staff list has no marker for them. */
export function resolveFocusTarget(
  unitId: string,
  staff: readonly StaffMarker[]
): MapLatLon | null {
  const marker = staff.find((item) => item.unitId === unitId);
  return marker ? { latitude: marker.latitude, longitude: marker.longitude } : null;
}

/**
 * The points a "focus" press must show together: the incident pin, and every
 * responder assigned to the case who has a position. The pressed responder is
 * always among them - the button only exists for assigned people - but the caller
 * still names them so they are never dropped.
 *
 * Only responders the staff list has a marker for can be included; one with no
 * reported position has nowhere to be framed. Without an incident location there
 * is nothing to frame against, so this returns an empty list and the press falls
 * back to centring on the responder.
 */
export function collectFramePoints(
  incident: MapLatLon | null | undefined,
  assignedUnitIds: ReadonlySet<string>,
  staff: readonly StaffMarker[],
  focusedUnitId: string
): MapLatLon[] {
  if (!incident) {
    return [];
  }
  const points: MapLatLon[] = [{ latitude: incident.latitude, longitude: incident.longitude }];
  staff.forEach((marker) => {
    if (assignedUnitIds.has(marker.unitId) || marker.unitId === focusedUnitId) {
      points.push({ latitude: marker.latitude, longitude: marker.longitude });
    }
  });
  return points;
}

/**
 * Whether the focus button should be offered for a responder.
 *
 * The staff list is empty while the layer is off, so "no marker" only means
 * "no position" once the list has actually loaded. Before that the answer is
 * unknown, and the button stays enabled - pressing it turns the layer on.
 */
export function canFocusResponder(
  unitId: string,
  staff: readonly StaffMarker[],
  isStaffLoaded: boolean
): boolean {
  return !isStaffLoaded || resolveFocusTarget(unitId, staff) !== null;
}
