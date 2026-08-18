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
// This module is deliberately pure. It takes a `toScreen` callback rather than a
// MapView, so the maths stays testable and free of SDK types; the layer hook
// supplies the projection.
import { getStaffAvailability, type StaffAvailability } from "./staffSymbols";
import type { StaffMarker } from "./staffTypes";

export interface ScreenPoint {
  x: number;
  y: number;
}

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
export const STAFF_CLUSTER_RADIUS_PX = 38;

/** Lower is better. "Best" is the most dispatchable member of a group. */
const AVAILABILITY_RANK: Record<StaffAvailability, number> = {
  ready: 0,
  engaged: 1,
  "off-duty": 2
};

function screenDistance(a: ScreenPoint, b: ScreenPoint): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function isUsablePoint(point: ScreenPoint | null): point is ScreenPoint {
  return point !== null && Number.isFinite(point.x) && Number.isFinite(point.y);
}

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

/**
 * Partition markers into those that stand alone on screen and those that overlap.
 *
 * Single-link: a chain of near neighbours becomes one group, which is what the
 * eye sees too. O(n^2) over a few dozen units per case is nothing, and it is far
 * easier to reason about than a spatial index nothing else here needs.
 */
export function groupStaffByProximity(
  markers: readonly StaffMarker[],
  toScreen: (marker: StaffMarker) => ScreenPoint | null,
  radiusPx: number = STAFF_CLUSTER_RADIUS_PX
): StaffGrouping {
  const singles: StaffMarker[] = [];
  const projected: { marker: StaffMarker; point: ScreenPoint }[] = [];

  markers.forEach((marker) => {
    const point = toScreen(marker);
    if (!isUsablePoint(point)) {
      // Nothing to compare it against, so it can only stand alone.
      singles.push(marker);
      return;
    }
    projected.push({ marker, point });
  });

  // Union-find over "within radiusPx of each other".
  const parent = projected.map((_, index) => index);

  const find = (index: number): number => {
    let root = index;
    while (parent[root] !== root) {
      root = parent[root];
    }
    let node = index;
    while (parent[node] !== root) {
      const next = parent[node];
      parent[node] = root;
      node = next;
    }
    return root;
  };

  const union = (a: number, b: number): void => {
    const rootA = find(a);
    const rootB = find(b);
    if (rootA !== rootB) {
      parent[rootB] = rootA;
    }
  };

  for (let i = 0; i < projected.length; i += 1) {
    for (let j = i + 1; j < projected.length; j += 1) {
      if (screenDistance(projected[i].point, projected[j].point) <= radiusPx) {
        union(i, j);
      }
    }
  }

  const buckets = new Map<number, number[]>();
  projected.forEach((_, index) => {
    const root = find(index);
    const bucket = buckets.get(root);
    if (bucket) {
      bucket.push(index);
    }
    else {
      buckets.set(root, [index]);
    }
  });

  const groups: StaffGroup[] = [];

  buckets.forEach((indices) => {
    if (indices.length === 1) {
      singles.push(projected[indices[0]].marker);
      return;
    }

    const members = indices.map((index) => projected[index].marker);
    const points = indices.map((index) => projected[index].point);

    let minPairwisePx = Number.POSITIVE_INFINITY;
    for (let i = 0; i < points.length; i += 1) {
      for (let j = i + 1; j < points.length; j += 1) {
        minPairwisePx = Math.min(minPairwisePx, screenDistance(points[i], points[j]));
      }
    }

    const unitIds = members.map((marker) => marker.unitId).sort();

    groups.push({
      id: unitIds.join("|"),
      unitIds,
      latitude: members.reduce((sum, marker) => sum + marker.latitude, 0) / members.length,
      longitude: members.reduce((sum, marker) => sum + marker.longitude, 0) / members.length,
      availability: bestAvailability(members),
      minPairwisePx
    });
  });

  return { singles, groups };
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
  if (!Number.isFinite(currentZoom) || !Number.isFinite(maxZoom)) {
    return null;
  }
  if (group.minPairwisePx <= 0) {
    return null;
  }

  const levelsNeeded = Math.log2(radiusPx / group.minPairwisePx);
  if (levelsNeeded <= 0) {
    // Already further apart than the merge radius - unreachable for a real
    // group, since that is what put them together in the first place.
    return null;
  }

  const exactZoom = currentZoom + levelsNeeded;
  if (exactZoom > maxZoom) {
    return null;
  }

  // Half a level of headroom so the closest pair lands clear of the radius
  // rather than exactly on it, which would re-group them on arrival.
  return Math.min(maxZoom, exactZoom + 0.5);
}
