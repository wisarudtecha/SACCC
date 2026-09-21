import { describe, expect, it } from "vitest";
import { MAX_MERCATOR_EXTENT_M, lngLatToMeters, metersToLngLat } from "./webMercator";

describe("web mercator", () => {
  it("puts the origin at zero", () => {
    const point = lngLatToMeters({ longitude: 0, latitude: 0 });

    expect(point.x).toBeCloseTo(0, 6);
    expect(point.y).toBeCloseTo(0, 6);
  });

  it("maps longitude 180 to half the world's width", () => {
    expect(lngLatToMeters({ longitude: 180, latitude: 0 }).x).toBeCloseTo(MAX_MERCATOR_EXTENT_M, 3);
  });

  it("matches the standard EPSG:3857 reference values", () => {
    // x is R * longitude in radians, worked by hand: 6378137 * 100.5018 * pi / 180.
    expect(lngLatToMeters({ longitude: 100.5018, latitude: 0 }).x).toBeCloseTo(11187809.2, 0);
    // The well-known figure for 45 degrees north.
    expect(lngLatToMeters({ longitude: 0, latitude: 45 }).y).toBeCloseTo(5621521.49, 1);
  });

  it("round-trips a point", () => {
    const original = { longitude: 100.5018, latitude: 13.7563 };
    const back = metersToLngLat(lngLatToMeters(original));

    expect(back.longitude).toBeCloseTo(original.longitude, 9);
    expect(back.latitude).toBeCloseTo(original.latitude, 9);
  });

  it("round-trips the southern and western hemispheres", () => {
    const original = { longitude: -70.6, latitude: -33.4 };
    const back = metersToLngLat(lngLatToMeters(original));

    expect(back.longitude).toBeCloseTo(original.longitude, 9);
    expect(back.latitude).toBeCloseTo(original.latitude, 9);
  });

  it("clamps a pole to a finite value instead of infinity", () => {
    const point = lngLatToMeters({ longitude: 0, latitude: 90 });

    expect(Number.isFinite(point.y)).toBe(true);
  });

  it("grows northward: a higher latitude has a larger y", () => {
    const south = lngLatToMeters({ longitude: 100, latitude: 10 });
    const north = lngLatToMeters({ longitude: 100, latitude: 20 });

    expect(north.y).toBeGreaterThan(south.y);
  });
});
