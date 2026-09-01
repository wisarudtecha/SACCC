// src/cms/utils/areaGeometry.ts
/**
 * Polygon handling for area templates.
 *
 * Template country / province / district records carry `coordinates` as GeoJSON
 * polygon rings ([ring][point][lng, lat]). The admin UI edits them as text, so
 * parsing has to be forgiving about formatting and strict about shape - a ring
 * that is not closed, or a latitude of 200, is silently accepted by the API and
 * only shows up later as geometry that will not render.
 */
import type { PolygonCoordinates } from "@/cms/types/area";

/** Three corners plus the repeated closing point. Exported so the sketch side
 *  can discard a half-finished ring by the same rule this file validates by. */
export const MIN_RING_POINTS = 4;
const LNG_MIN = -180;
const LNG_MAX = 180;
const LAT_MIN = -90;
const LAT_MAX = 90;

/** i18n keys under crud.areaTemplate.geometry.error - callers pass these to t(). */
export type PolygonParseErrorKey =
  | "invalid_json"
  | "not_rings"
  | "empty"
  | "ring_not_array"
  | "too_few_points"
  | "point_not_pair"
  | "point_not_number"
  | "lng_out_of_range"
  | "lat_out_of_range"
  | "ring_not_closed";

export type PolygonParseResult =
  | { rings: PolygonCoordinates; error?: never }
  | { rings?: never; error: PolygonParseErrorKey };

/**
 * Decimal places kept for a vertex placed on the map.
 *
 * A raw click carries ~15 significant digits, which is metres of false
 * precision and multiplies the payload size of a ring by three. Six places is
 * roughly 11cm at the equator - finer than any administrative boundary is
 * actually surveyed to.
 */
const SKETCH_PRECISION = 6;
const SKETCH_PRECISION_FACTOR = 10 ** SKETCH_PRECISION;

const isNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

const samePoint = (a: number[], b: number[]): boolean => a[0] === b[0] && a[1] === b[1];

const roundCoordinate = (value: number): number =>
  Math.round(value * SKETCH_PRECISION_FACTOR) / SKETCH_PRECISION_FACTOR;

/** Trims a drawn ring to SKETCH_PRECISION. See the constant for why. */
export const roundRing = (ring: readonly number[][]): number[][] =>
  ring.map(point => [roundCoordinate(point[0]), roundCoordinate(point[1])]);

/**
 * Repeats the first point at the end when it is not already there.
 *
 * parsePolygonRings rejects an unclosed ring, and a ring assembled point by
 * point is unclosed by definition until someone closes it. Rounding first and
 * closing second matters: closing a ring whose ends were rounded apart would
 * leave two near-identical points rather than one closed ring.
 */
export const closeRing = (ring: readonly number[][]): number[][] => {
  if (ring.length === 0) {
    return [];
  }
  const first = ring[0];
  const last = ring[ring.length - 1];
  if (samePoint(first, last)) {
    return [...ring];
  }
  return [...ring, [first[0], first[1]]];
};

/**
 * Parses the textarea contents into polygon rings.
 *
 * Returns an error key rather than throwing: the caller renders it as the
 * field's validation message, and a bad paste is an ordinary user mistake, not
 * an exceptional condition. An empty/whitespace-only string is *not* an error -
 * it means "no geometry" and yields `{ rings: [] }`, which callers send as null.
 */
export const parsePolygonRings = (text: string): PolygonParseResult => {
  const trimmed = (text || "").trim();
  if (!trimmed) {
    return { rings: [] };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  }
  catch {
    return { error: "invalid_json" };
  }

  if (!Array.isArray(parsed)) {
    return { error: "not_rings" };
  }
  if (parsed.length === 0) {
    return { error: "empty" };
  }

  for (const ring of parsed) {
    if (!Array.isArray(ring)) {
      return { error: "ring_not_array" };
    }
    if (ring.length < MIN_RING_POINTS) {
      return { error: "too_few_points" };
    }

    for (const point of ring) {
      if (!Array.isArray(point) || point.length !== 2) {
        return { error: "point_not_pair" };
      }
      const [lng, lat] = point;
      if (!isNumber(lng) || !isNumber(lat)) {
        return { error: "point_not_number" };
      }
      if (lng < LNG_MIN || lng > LNG_MAX) {
        return { error: "lng_out_of_range" };
      }
      if (lat < LAT_MIN || lat > LAT_MAX) {
        return { error: "lat_out_of_range" };
      }
    }

    if (!samePoint(ring[0] as number[], ring[ring.length - 1] as number[])) {
      return { error: "ring_not_closed" };
    }
  }

  return { rings: parsed as PolygonCoordinates };
};

/** Renders rings back into the textarea - one point per line stays diffable by eye. */
export const formatPolygonRings = (rings?: PolygonCoordinates | null): string => {
  if (!rings || rings.length === 0) {
    return "";
  }
  return JSON.stringify(rings);
};

/**
 * Builds the `coordinates` value for a create/update payload.
 *
 * Three cases, because "omit" and "clear" are different intents that the
 * transport does not distinguish for us. buildGraphQLQuery strips undefined and
 * null from every mutation input (gqlMapper.ts), so `coordinates: null` is
 * indistinguishable from never having sent the field - and whether the BFF reads
 * an absent field as "keep" or "set null" is not documented. Callers therefore
 * resend the existing rings on every update, and only an empty array can mean
 * "clear this".
 *
 * NOTE: that `[]` clears rather than, say, being rejected as an empty polygon is
 * the one unverified assumption here. It is deliberately confined to this
 * function - if the backend disagrees, this is the only line that changes.
 *
 * @param rings    what the user has in the form now (empty = they cleared it)
 * @param existing what the record currently has, for the round-trip on update
 */
export const toCoordinatesPayload = (
  rings: PolygonCoordinates,
  existing?: PolygonCoordinates | null
): PolygonCoordinates | undefined => {
  if (rings.length > 0) {
    return rings;
  }
  if (existing && existing.length > 0) {
    return [];
  }
  // Nothing entered and nothing to clear - omit the field entirely rather than
  // send a clear signal for geometry that never existed.
  return undefined;
};

export interface GeometrySummary {
  hasGeometry: boolean;
  ringCount: number;
  pointCount: number;
}

/** Drives the read-only geometry indicator in list columns and hierarchy metadata. */
export const describeGeometry = (rings?: PolygonCoordinates | null): GeometrySummary => {
  if (!rings || rings.length === 0) {
    return { hasGeometry: false, ringCount: 0, pointCount: 0 };
  }
  return {
    hasGeometry: true,
    ringCount: rings.length,
    pointCount: rings.reduce((total, ring) => total + (ring?.length || 0), 0)
  };
};

/**
 * Stable string for a set of rings, for "did this actually change?" tests.
 *
 * The map and the textarea are two views of one string, so without this the
 * commit that follows a drag would re-render the polygon that produced it, on
 * every drag, forever.
 *
 * Lives HERE rather than beside the sketch conversions, which import a map SDK:
 * both providers' sketch layers need this test, and importing it from an
 * ArcGIS-bound module pulled ~185KB of Esri geometry into the Longdo bundle.
 */
export const ringsSignature = (rings: PolygonCoordinates | null | undefined): string =>
  rings && rings.length > 0 ? JSON.stringify(rings) : "";
