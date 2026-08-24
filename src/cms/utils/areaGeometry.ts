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

const MIN_RING_POINTS = 4;
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

const isNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

const samePoint = (a: number[], b: number[]): boolean => a[0] === b[0] && a[1] === b[1];

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
