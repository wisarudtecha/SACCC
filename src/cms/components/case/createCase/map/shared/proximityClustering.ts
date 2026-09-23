// Provider-agnostic screen-space proximity clustering, shared by every map
// marker type that can overlap on screen (staff, Place, Device).
//
// Extracted out of staff/staffClusters.ts, which was already written with no
// StaffMarker-specific logic in its grouping math - only the availability
// colour it attaches to a group afterward is staff-specific. This module keeps
// the union-find and the separation-zoom formula in ONE place so Place and
// Device clustering can reuse it exactly rather than drifting from three
// hand-copied versions.
//
// Deliberately takes a `toScreen` callback rather than a MapView, same reason
// as before: the maths stays testable and free of SDK types, and the layer
// hook (per marker type, per provider) supplies the projection.
export interface ScreenPoint {
  x: number;
  y: number;
}

/** The minimum shape a clusterable item needs: a stable id and a position. */
export interface ProximityPoint {
  id: string;
  lat: number;
  lon: number;
}

export interface ProximityGroup<T extends ProximityPoint> {
  /**
   * Sorted member ids joined. Stable across recomputes, so a group that
   * survives a pan keeps its graphic instead of being torn down and rebuilt.
   */
  id: string;
  members: T[];
  /** Centroid of the members - where the group's circle is drawn. */
  latitude: number;
  longitude: number;
  /**
   * Smallest pairwise screen distance, at the zoom this grouping was computed
   * at. This is what decides whether zooming in can separate the group.
   */
  minPairwisePx: number;
}

export interface ProximityGrouping<T extends ProximityPoint> {
  singles: T[];
  groups: ProximityGroup<T>[];
}

/**
 * Merge distance in pixels. Matches STAFF_CLUSTER_RADIUS_PX - the marker is
 * 18-20px and the selection halo up to 36px, so anything much tighter would
 * let a halo swallow a neighbour it had not grouped with.
 */
export const DEFAULT_CLUSTER_RADIUS_PX = 38;

function screenDistance(a: ScreenPoint, b: ScreenPoint): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function isUsablePoint(point: ScreenPoint | null): point is ScreenPoint {
  return point !== null && Number.isFinite(point.x) && Number.isFinite(point.y);
}

/**
 * Partition items into those that stand alone on screen and those that
 * overlap.
 *
 * Single-link: a chain of near neighbours becomes one group, which is what
 * the eye sees too. O(n^2) over a few dozen items per layer is nothing, and it
 * is far easier to reason about than a spatial index nothing else here needs.
 */
export function groupByProximity<T extends ProximityPoint>(
  items: readonly T[],
  toScreen: (item: T) => ScreenPoint | null,
  radiusPx: number = DEFAULT_CLUSTER_RADIUS_PX
): ProximityGrouping<T> {
  const singles: T[] = [];
  const projected: { item: T; point: ScreenPoint }[] = [];

  items.forEach((item) => {
    const point = toScreen(item);
    if (!isUsablePoint(point)) {
      // Nothing to compare it against, so it can only stand alone.
      singles.push(item);
      return;
    }
    projected.push({ item, point });
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

  const groups: ProximityGroup<T>[] = [];

  buckets.forEach((indices) => {
    if (indices.length === 1) {
      singles.push(projected[indices[0]].item);
      return;
    }

    const members = indices.map((index) => projected[index].item);
    const points = indices.map((index) => projected[index].point);

    let minPairwisePx = Number.POSITIVE_INFINITY;
    for (let i = 0; i < points.length; i += 1) {
      for (let j = i + 1; j < points.length; j += 1) {
        minPairwisePx = Math.min(minPairwisePx, screenDistance(points[i], points[j]));
      }
    }

    const ids = members.map((member) => member.id).sort();

    groups.push({
      id: ids.join("|"),
      members,
      latitude: members.reduce((sum, member) => sum + member.lat, 0) / members.length,
      longitude: members.reduce((sum, member) => sum + member.lon, 0) / members.length,
      minPairwisePx
    });
  });

  return { singles, groups };
}

/**
 * The zoom that would break this group apart, or null if no zoom would.
 *
 * Screen distance doubles per zoom level in a Web Mercator view, so separating
 * a pair currently `minPairwisePx` apart needs `log2(radius / minPairwisePx)`
 * more levels. Two cases have no answer:
 *
 *   - the members report the same coordinates, so they are 0px apart at every
 *     zoom and only a picker can tell them apart;
 *   - the zoom needed is past what the view allows.
 *
 * @param maxZoom Normally `view.constraints.effectiveMaxZoom`, so the answer
 *                respects what the basemap actually offers rather than a guess.
 */
export function getSeparationZoom(
  group: Pick<ProximityGroup<ProximityPoint>, "minPairwisePx">,
  currentZoom: number,
  maxZoom: number,
  radiusPx: number = DEFAULT_CLUSTER_RADIUS_PX
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
