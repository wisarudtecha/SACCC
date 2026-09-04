// src/cms/utils/incidentRadius.ts
/**
 * The no-match fallback radius circle: its size, and the geometry that draws it.
 *
 * SDK-free on purpose (same rule as areaGeometry.ts / pointInPolygon.ts): all
 * three map providers need the ring, and none of them should pull a mapping SDK
 * into this module. ArcGIS draws its circle with `geometryEngine.geodesicBuffer`
 * instead of this generator; Longdo and MapTiler have no native buffer and use
 * `generateIncidentCircleRing` below.
 *
 * The circle is a VISUAL AID ONLY - it is rendered only when polygon matching
 * finds no unambiguous Service Center, and it never participates in matching.
 * Nothing here is persisted with the case.
 */
import type { MapLatLon } from "@/cms/components/case/createCase/map/mapTypes";

/**
 * Fallback radius used until an organization configures its own value.
 *
 * 900m is the figure the ticket gives as an example. It is a single constant on
 * purpose - changing the default is a one-line edit.
 */
export const DEFAULT_INCIDENT_RADIUS_METERS = 900;

/** Vertices in the generated ring. 72 keeps a 900m circle visually smooth at city zoom. */
const CIRCLE_SEGMENTS = 72;

/** Mean Earth radius, metres - the sphere the haversine offset assumes. */
const EARTH_RADIUS_METERS = 6_378_137;

/**
 * Coerces a raw org-configured radius value into a usable number of metres.
 *
 * The org radius comes from the org record (see `useOrgIncidentRadiusMeters`),
 * which is a FE contract ahead of the backend - the field is often absent, null,
 * or (once it exists) could arrive as a string. Anything that is not a finite
 * positive number falls back to DEFAULT_INCIDENT_RADIUS_METERS.
 *
 * Phase 2 - a per-case-type radius override - is explicitly deferred. When it
 * lands it should resolve to a number and pass through here unchanged.
 */
export function pickIncidentRadiusMeters(raw: unknown): number {
  const value = typeof raw === "string" ? Number(raw) : raw;
  return typeof value === "number" && Number.isFinite(value) && value > 0
    ? value
    : DEFAULT_INCIDENT_RADIUS_METERS;
}

const toRadians = (degrees: number): number => (degrees * Math.PI) / 180;
const toDegrees = (radians: number): number => (radians * 180) / Math.PI;

/**
 * A closed GeoJSON ring ([lng, lat], first point repeated at the end)
 * approximating a geodesic circle of `radiusMeters` around `center`.
 *
 * Uses the spherical law of cosines / haversine forward formula per vertex, so
 * the circle stays true-to-scale at Thailand latitudes rather than squashing
 * the way a naive "degrees = metres / 111320" offset does. Good enough for a
 * decision-aid overlay; not intended as survey geometry.
 */
export function generateIncidentCircleRing(
  center: MapLatLon,
  radiusMeters: number,
  segments: number = CIRCLE_SEGMENTS
): [number, number][] {
  const safeRadius = Number.isFinite(radiusMeters) && radiusMeters > 0 ? radiusMeters : DEFAULT_INCIDENT_RADIUS_METERS;
  const safeSegments = Number.isFinite(segments) && segments >= 8 ? Math.floor(segments) : CIRCLE_SEGMENTS;

  const latRad = toRadians(center.latitude);
  const lonRad = toRadians(center.longitude);
  const angularDistance = safeRadius / EARTH_RADIUS_METERS;

  const ring: [number, number][] = [];
  for (let step = 0; step <= safeSegments; step += 1) {
    // Close the ring exactly by reusing step 0's bearing on the final vertex.
    const bearing = (2 * Math.PI * (step % safeSegments)) / safeSegments;

    const pointLat = Math.asin(
      Math.sin(latRad) * Math.cos(angularDistance) +
        Math.cos(latRad) * Math.sin(angularDistance) * Math.cos(bearing)
    );
    const pointLon =
      lonRad +
      Math.atan2(
        Math.sin(bearing) * Math.sin(angularDistance) * Math.cos(latRad),
        Math.cos(angularDistance) - Math.sin(latRad) * Math.sin(pointLat)
      );

    ring.push([toDegrees(pointLon), toDegrees(pointLat)]);
  }
  return ring;
}
