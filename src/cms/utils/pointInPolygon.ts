// src/cms/utils/pointInPolygon.ts
/**
 * SDK-free point-in-polygon test for the incident-pin / Service Center feature.
 *
 * Sibling of areaGeometry.ts and held to the same rules: no map SDK import, one
 * job, testable in isolation. It operates on the same `PolygonCoordinates` shape
 * the area template / country-province-district records carry - GeoJSON polygon
 * rings, `[ ring ][ point ][ lng, lat ]` - so a district's `coordinates` can be
 * passed straight through with no conversion.
 *
 * The circle drawn on the no-match fallback path plays NO role here: matching is
 * polygon containment only, so this is a plain ray-casting ring test with hole
 * support and nothing more (no circle-vs-polygon intersection).
 */
import type { PolygonCoordinates } from "@/cms/types/area";

/** A single coordinate, GeoJSON-ordered: longitude first, then latitude. */
export type LngLatPoint = readonly [number, number];

const isFinitePair = (point: unknown): point is [number, number] =>
  Array.isArray(point) &&
  point.length >= 2 &&
  typeof point[0] === "number" &&
  typeof point[1] === "number" &&
  Number.isFinite(point[0]) &&
  Number.isFinite(point[1]);

/**
 * Whether `point` lies inside a single linear ring.
 *
 * Even-odd ray casting: count how many ring edges a ray travelling in +x from
 * the point crosses; odd means inside. A point exactly on an edge is not
 * guaranteed either way - administrative boundaries are not surveyed to the
 * ~11cm this would need to matter, and the fallback path handles "no clear
 * match" safely regardless.
 *
 * The ring may be open or closed (first point repeated at the end); both work
 * because the loop pairs the last vertex with the first.
 */
export function isPointInRing(point: LngLatPoint, ring: ReadonlyArray<ReadonlyArray<number>>): boolean {
  const [x, y] = point;
  if (!Number.isFinite(x) || !Number.isFinite(y) || !Array.isArray(ring) || ring.length < 3) {
    return false;
  }

  let inside = false;
  for (let current = 0, previous = ring.length - 1; current < ring.length; previous = current, current += 1) {
    const a = ring[current];
    const b = ring[previous];
    if (!isFinitePair(a) || !isFinitePair(b)) {
      continue;
    }
    const [ax, ay] = a;
    const [bx, by] = b;

    const straddlesRay = ay > y !== by > y;
    if (!straddlesRay) {
      continue;
    }
    const intersectionX = ((bx - ax) * (y - ay)) / (by - ay) + ax;
    if (x < intersectionX) {
      inside = !inside;
    }
  }
  return inside;
}

/**
 * Whether `point` lies inside a polygon expressed as GeoJSON rings.
 *
 * Ring 0 is the outer boundary; any further rings are holes. A point inside the
 * outer ring but inside a hole counts as outside. Multi-polygon inputs are not
 * expected from the district endpoint and are not handled here - pass one
 * polygon's rings at a time.
 */
export function isPointInPolygon(point: LngLatPoint, rings: PolygonCoordinates | null | undefined): boolean {
  if (!Array.isArray(rings) || rings.length === 0) {
    return false;
  }
  const [outer, ...holes] = rings;
  if (!isPointInRing(point, outer ?? [])) {
    return false;
  }
  return !holes.some(hole => isPointInRing(point, hole ?? []));
}
