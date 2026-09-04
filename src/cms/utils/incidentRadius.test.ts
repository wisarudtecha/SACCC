// Tests for the fallback radius helpers. See pointInPolygon.test.ts for how to
// run these before this repo has a test runner wired up.
import { describe, it, expect } from "vitest";
import {
  DEFAULT_INCIDENT_RADIUS_METERS,
  generateIncidentCircleRing,
  pickIncidentRadiusMeters
} from "./incidentRadius";
import { isPointInPolygon } from "./pointInPolygon";

const BANGKOK = { latitude: 13.7563, longitude: 100.5018 };

/** Metres between two lng/lat points, haversine. */
function haversineMeters(a: [number, number], b: [number, number]): number {
  const R = 6_378_137;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b[1] - a[1]);
  const dLon = toRad(b[0] - a[0]);
  const lat1 = toRad(a[1]);
  const lat2 = toRad(b[1]);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

describe("pickIncidentRadiusMeters", () => {
  it("passes through a finite positive number", () => {
    expect(pickIncidentRadiusMeters(1500)).toBe(1500);
  });

  it("coerces a numeric string", () => {
    expect(pickIncidentRadiusMeters("1200")).toBe(1200);
  });

  it("falls back to the 900m default for anything unusable", () => {
    expect(pickIncidentRadiusMeters(undefined)).toBe(DEFAULT_INCIDENT_RADIUS_METERS);
    expect(pickIncidentRadiusMeters(null)).toBe(900);
    expect(pickIncidentRadiusMeters(0)).toBe(900);
    expect(pickIncidentRadiusMeters(-100)).toBe(900);
    expect(pickIncidentRadiusMeters(Number.NaN)).toBe(900);
    expect(pickIncidentRadiusMeters("not a number")).toBe(900);
    expect(pickIncidentRadiusMeters({})).toBe(900);
  });
});

describe("generateIncidentCircleRing", () => {
  it("produces a closed ring", () => {
    const ring = generateIncidentCircleRing(BANGKOK, 900);
    expect(ring.length).toBeGreaterThan(8);
    expect(ring[0]).toEqual(ring[ring.length - 1]);
  });

  it("keeps every vertex within ~1% of the requested radius", () => {
    const ring = generateIncidentCircleRing(BANGKOK, 900);
    for (const vertex of ring) {
      const distance = haversineMeters([BANGKOK.longitude, BANGKOK.latitude], vertex);
      expect(Math.abs(distance - 900)).toBeLessThan(9);
    }
  });

  it("contains the centre and excludes a point well outside the radius", () => {
    const ring = generateIncidentCircleRing(BANGKOK, 900);
    expect(isPointInPolygon([BANGKOK.longitude, BANGKOK.latitude], [ring])).toBe(true);
    // ~1.1km east
    expect(isPointInPolygon([BANGKOK.longitude + 0.01, BANGKOK.latitude], [ring])).toBe(false);
  });

  it("falls back to the default radius for a non-positive value", () => {
    const ring = generateIncidentCircleRing(BANGKOK, 0);
    const distance = haversineMeters([BANGKOK.longitude, BANGKOK.latitude], ring[0]);
    expect(Math.abs(distance - DEFAULT_INCIDENT_RADIUS_METERS)).toBeLessThan(9);
  });
});
