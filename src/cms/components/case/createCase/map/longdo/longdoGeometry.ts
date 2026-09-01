// Coordinate conversions for the Longdo map.
//
// Three unrelated jobs, together in one module because they are all "the same
// place, expressed differently":
//
//   1. GeoJSON rings -> the { lon, lat } objects every Longdo constructor takes.
//   2. A screen position -> a location. The SDK offers no such call
//      (Util.locationToPoint answers in internal world units, not screen
//      pixels), and one is REQUIRED: an overlay swallows the map's own click
//      event, so a click on a boundary polygon has to be turned back into the
//      map click it should have been. See LongdoAddressMap's click handling.
//   3. A location -> world pixels, for staff clustering.
//
// All of it is plain Web Mercator. No SDK import, so it stays testable and
// costs nothing to load.
import type { PolygonCoordinates } from "@/cms/types/area";
import type { LongdoBound, LongdoLocation } from "./longdoApi";

/** Web Mercator world size in pixels at zoom 0, the constant every tile scheme is built on. */
const TILE_SIZE = 256;

/**
 * Scale denominator at zoom 0 for a 96dpi screen. Converting between the two is
 * what lets the boundary level table keep expressing its label thresholds as
 * ArcGIS scales (see BOUNDARY_LEVELS.labelMinScale) while Longdo thinks in zoom.
 */
const SCALE_AT_ZOOM_0 = 559_082_264;

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

function toDegrees(radians: number): number {
  return (radians * 180) / Math.PI;
}

/** Latitude -> Mercator y, in the projection's own units. */
function mercatorY(latitude: number): number {
  // Clamped to the projection's limit: Mercator cannot express the poles, and
  // tan() at 90 degrees would return Infinity rather than a usable number.
  const clamped = Math.max(-85.051129, Math.min(85.051129, latitude));
  return Math.log(Math.tan(Math.PI / 4 + toRadians(clamped) / 2));
}

/** The inverse of mercatorY. */
function latitudeFromMercatorY(y: number): number {
  return toDegrees(2 * Math.atan(Math.exp(y)) - Math.PI / 2);
}

/**
 * A zoom level that shows roughly the given ArcGIS scale denominator.
 *
 * Used to translate the boundary table's `labelMinScale` into the zoom floor
 * the label logic compares against, so the two providers thin their labels out
 * at the same point without the table having to carry two sets of numbers.
 */
export function zoomForScale(scale: number): number {
  if (!Number.isFinite(scale) || scale <= 0) {
    // 0 means "always label" in the table - a floor of 0 keeps that meaning.
    return 0;
  }
  return Math.log2(SCALE_AT_ZOOM_0 / scale);
}

/** One GeoJSON ring ([lng, lat] pairs) -> Longdo's location objects. */
export function toLongdoLocations(
  ring: readonly (readonly number[])[]
): LongdoLocation[] {
  return ring.reduce<LongdoLocation[]>((locations, point) => {
    const [lon, lat] = point;
    if (!Number.isFinite(lon) || !Number.isFinite(lat)) {
      return locations;
    }
    return [...locations, { lon, lat }];
  }, []);
}

/**
 * The OUTER ring of a stored polygon, as Longdo locations.
 *
 * Longdo's Polygon takes a single ring, so a polygon with holes loses them.
 * Everything boundarySource emits is single-ring, and the sketch editor stores
 * one ring - but the drop is reported rather than silent, because a hole that
 * quietly fills in is the kind of thing nobody notices until a map is printed.
 */
export function toOuterRing(rings: PolygonCoordinates): LongdoLocation[] {
  if (!rings?.length) {
    return [];
  }
  if (rings.length > 1) {
    console.warn(
      `Longdo draws a single ring; ${rings.length - 1} inner ring(s) will not be rendered`
    );
  }
  return toLongdoLocations(rings[0]);
}

/** Longdo locations -> GeoJSON ring ([lng, lat] pairs). */
export function toRing(locations: readonly LongdoLocation[]): [number, number][] {
  return locations.map((location) => [location.lon, location.lat]);
}

/**
 * Where a screen position sits on the map.
 *
 * Derived from the view's current bound rather than from any SDK call: linear
 * in longitude and linear in MERCATOR latitude, which is exactly how the tiles
 * are laid out, so this is an inversion of the projection rather than an
 * approximation of it.
 *
 * It does assume the map is neither rotated nor pitched. Neither is exposed by
 * this app's controls, but if a rotated Longdo view is ever introduced this is
 * the function that has to learn about it.
 */
export function locationFromScreen(
  bound: LongdoBound,
  rect: { left: number; top: number; width: number; height: number },
  clientX: number,
  clientY: number
): LongdoLocation | null {
  if (rect.width <= 0 || rect.height <= 0) {
    return null;
  }

  const fractionX = (clientX - rect.left) / rect.width;
  const fractionY = (clientY - rect.top) / rect.height;

  const lon = bound.minLon + fractionX * (bound.maxLon - bound.minLon);

  const topY = mercatorY(bound.maxLat);
  const bottomY = mercatorY(bound.minLat);
  const lat = latitudeFromMercatorY(topY + fractionY * (bottomY - topY));

  if (!Number.isFinite(lon) || !Number.isFinite(lat)) {
    return null;
  }
  return { lon, lat };
}

export interface WorldPixel {
  x: number;
  y: number;
}

/**
 * A location in world pixels at the given zoom.
 *
 * Absolute, not viewport-relative, and that is deliberate: staff clustering
 * (see staffClusters.ts) only ever measures DISTANCES between the points it is
 * handed, and distances are identical in both frames. Skipping the viewport
 * means the grouping needs neither the map's centre nor its size, and stays
 * correct while the user is mid-pan.
 */
export function toWorldPixel(location: LongdoLocation, zoom: number): WorldPixel {
  const worldSize = TILE_SIZE * Math.pow(2, zoom);
  const x = ((location.lon + 180) / 360) * worldSize;
  const y = (0.5 - mercatorY(location.lat) / (2 * Math.PI)) * worldSize;
  return { x, y };
}

/** Bounding box of a set of locations, in the shape map.bound() takes. */
export function boundOf(locations: readonly LongdoLocation[]): LongdoBound | null {
  if (!locations.length) {
    return null;
  }
  return locations.reduce<LongdoBound>(
    (bound, location) => ({
      minLon: Math.min(bound.minLon, location.lon),
      minLat: Math.min(bound.minLat, location.lat),
      maxLon: Math.max(bound.maxLon, location.lon),
      maxLat: Math.max(bound.maxLat, location.lat)
    }),
    {
      minLon: locations[0].lon,
      minLat: locations[0].lat,
      maxLon: locations[0].lon,
      maxLat: locations[0].lat
    }
  );
}

/**
 * The location an SDK event reports, or null when it carries none.
 *
 * Longdo's map `click` hands back a plain `{ lon, lat, x, y }`, but its overlay
 * events hand back the OVERLAY instead - so every consumer has to check rather
 * than assume.
 */
export function readEventLocation(event: unknown): LongdoLocation | null {
  const candidate = event as Partial<LongdoLocation> | null;
  if (!candidate || typeof candidate.lon !== "number" || typeof candidate.lat !== "number") {
    return null;
  }
  return { lon: candidate.lon, lat: candidate.lat };
}

/** Screen-pixel distance between two locations at a given zoom. */
export function pixelDistance(a: LongdoLocation, b: LongdoLocation, zoom: number): number {
  const pointA = toWorldPixel(a, zoom);
  const pointB = toWorldPixel(b, zoom);
  return Math.hypot(pointA.x - pointB.x, pointA.y - pointB.y);
}
