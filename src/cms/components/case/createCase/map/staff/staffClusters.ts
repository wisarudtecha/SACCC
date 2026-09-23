// Grouping overlapping staff markers, and deciding whether zooming would help.
//
// Officers standing at the same station - or simply near each other at a low
// zoom - draw on top of one another: only the topmost is visible, and only the
// topmost can be clicked. Worse, two officers reporting IDENTICAL coordinates
// never separate however far you zoom, so one of them is unreachable.
//
// So markers are grouped by SCREEN distance at the current zoom, and a group is
// drawn as one circle carrying a count. Screen space rather than geographic
// distance because the problem is a drawing problem: two officers 50m apart
// overlap at city zoom and do not overlap at street zoom, and the grouping has
// to follow that.
//
// This module is deliberately pure, and is now a thin staff-flavoured adapter
// over shared/proximityClustering.ts: the union-find and separation-zoom maths
// live there so Place and Device clustering can reuse them exactly, and the
// only thing left here is staff-specific - attaching each group's best
// availability, which drives the circle's colour.
import {
  getSeparationZoom as getSharedSeparationZoom,
  groupByProximity,
  DEFAULT_CLUSTER_RADIUS_PX,
  type ProximityPoint,
  type ScreenPoint
} from "../shared/proximityClustering";
import { getStaffAvailability, type StaffAvailability } from "./staffSymbols";
import type { StaffMarker } from "./staffTypes";

export type { ScreenPoint };

export interface StaffGroup {
  /**
   * Sorted member unitIds joined. Stable across recomputes, so a group that
   * survives a pan keeps its graphic instead of being torn down and rebuilt.
   */
  id: string;
  unitIds: string[];
  /** Centroid of the members - where the group's circle is drawn. */
  latitude: number;
  longitude: number;
  /** Best availability among the members; what the circle is coloured by. */
  availability: StaffAvailability;
  /**
   * Smallest pairwise screen distance, at the zoom this grouping was computed
   * at. This is what decides whether zooming in can separate the group.
   */
  minPairwisePx: number;
}

export interface StaffGrouping {
  singles: StaffMarker[];
  groups: StaffGroup[];
}

/**
 * Merge distance in pixels.
 *
 * The person marker is 18px and the selection halo 34px, so anything much
 * tighter would let a halo swallow a neighbour it had not grouped with.
 */
export const STAFF_CLUSTER_RADIUS_PX = DEFAULT_CLUSTER_RADIUS_PX;

/** Lower is better. "Best" is the most dispatchable member of a group. */
const AVAILABILITY_RANK: Record<StaffAvailability, number> = {
  ready: 0,
  engaged: 1,
  "off-duty": 2
};

/**
 * A group takes its most dispatchable member's colour.
 *
 * The map answers one question - "can I dispatch someone here right now?" - so a
 * green circle meaning "at least one officer here is ready" is the honest answer
 * to it. The picker then shows each member's own status, so nothing is lost.
 */
function bestAvailability(markers: readonly StaffMarker[]): StaffAvailability {
  return markers.reduce<StaffAvailability>((best, marker) => {
    const availability = getStaffAvailability(marker.statusId, marker.isLogin);
    return AVAILABILITY_RANK[availability] < AVAILABILITY_RANK[best] ? availability : best;
  }, "off-duty");
}

/** Adapts a StaffMarker to the shared clustering core's point shape. */
interface StaffProximityPoint extends ProximityPoint {
  marker: StaffMarker;
}

/**
 * Partition markers into those that stand alone on screen and those that overlap,
 * via the shared union-find core (see shared/proximityClustering.ts).
 */
export function groupStaffByProximity(
  markers: readonly StaffMarker[],
  toScreen: (marker: StaffMarker) => ScreenPoint | null,
  radiusPx: number = STAFF_CLUSTER_RADIUS_PX
): StaffGrouping {
  const points: StaffProximityPoint[] = markers.map((marker) => ({
    id: marker.unitId,
    lat: marker.latitude,
    lon: marker.longitude,
    marker
  }));

  const grouping = groupByProximity(
    points,
    (point) => toScreen(point.marker),
    radiusPx
  );

  return {
    singles: grouping.singles.map((point) => point.marker),
    groups: grouping.groups.map((group) => {
      const members = group.members.map((point) => point.marker);
      return {
        id: group.id,
        unitIds: members.map((marker) => marker.unitId).sort(),
        latitude: group.latitude,
        longitude: group.longitude,
        availability: bestAvailability(members),
        minPairwisePx: group.minPairwisePx
      };
    })
  };
}

/**
 * The zoom that would break this group apart, or null if no zoom would.
 *
 * Screen distance doubles per zoom level in a Web Mercator view, so separating a
 * pair currently `minPairwisePx` apart needs `log2(radius / minPairwisePx)` more
 * levels. Two cases have no answer:
 *
 *   - the members report the same coordinates, so they are 0px apart at every
 *     zoom and only a picker can tell them apart;
 *   - the zoom needed is past what the view allows.
 *
 * @param maxZoom Normally `view.constraints.effectiveMaxZoom`, so the answer
 *                respects what the basemap actually offers rather than a guess.
 */
export function getSeparationZoom(
  group: StaffGroup,
  currentZoom: number,
  maxZoom: number,
  radiusPx: number = STAFF_CLUSTER_RADIUS_PX
): number | null {
  return getSharedSeparationZoom(group, currentZoom, maxZoom, radiusPx);
}
