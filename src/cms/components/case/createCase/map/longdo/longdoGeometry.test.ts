import { describe, expect, it } from "vitest";
import type { LongdoBound } from "./longdoApi";
import { locationFromScreen, screenFromLocation } from "./longdoGeometry";

const SIZE = { width: 800, height: 600 };
const RECT_AT_ORIGIN = { left: 0, top: 0, ...SIZE };

const BANGKOK: LongdoBound = { minLon: 100.4, maxLon: 100.6, minLat: 13.65, maxLat: 13.85 };
const HIGH_LATITUDE: LongdoBound = { minLon: 10, maxLon: 20, minLat: 60, maxLat: 70 };

describe("screenFromLocation", () => {
  it("puts the top-left corner of the bound at the origin", () => {
    const point = screenFromLocation(BANGKOK, SIZE, { lon: 100.4, lat: 13.85 });
    expect(point?.x).toBeCloseTo(0, 6);
    expect(point?.y).toBeCloseTo(0, 6);
  });

  it("puts the bottom-right corner of the bound at the box size", () => {
    const point = screenFromLocation(BANGKOK, SIZE, { lon: 100.6, lat: 13.65 });
    expect(point?.x).toBeCloseTo(800, 6);
    expect(point?.y).toBeCloseTo(600, 6);
  });

  it("is linear in longitude", () => {
    const point = screenFromLocation(BANGKOK, SIZE, { lon: 100.5, lat: 13.75 });
    expect(point?.x).toBeCloseTo(400, 6);
  });

  it("is linear in Mercator latitude, not in latitude", () => {
    // 65 is the linear midpoint of 60..70, but Mercator stretches toward the
    // pole, so it sits BELOW the middle of the box.
    const point = screenFromLocation(HIGH_LATITUDE, SIZE, { lon: 15, lat: 65 });
    expect(point?.y).toBeGreaterThan(300);
    expect(point?.y).toBeLessThan(600);
  });

  it("is the inverse of locationFromScreen", () => {
    const pixels = [
      { x: 0, y: 0 },
      { x: 123, y: 456 },
      { x: 400, y: 300 },
      { x: 799, y: 1 },
      { x: 800, y: 600 }
    ];
    [BANGKOK, HIGH_LATITUDE].forEach((bound) => {
      pixels.forEach((pixel) => {
        const location = locationFromScreen(bound, RECT_AT_ORIGIN, pixel.x, pixel.y);
        expect(location).not.toBeNull();
        const back = screenFromLocation(bound, SIZE, location!);
        expect(back?.x).toBeCloseTo(pixel.x, 6);
        expect(back?.y).toBeCloseTo(pixel.y, 6);
      });
    });
  });

  it("puts a location outside the bound outside the box rather than failing", () => {
    const west = screenFromLocation(BANGKOK, SIZE, { lon: 100.3, lat: 13.75 });
    const south = screenFromLocation(BANGKOK, SIZE, { lon: 100.5, lat: 13.5 });
    expect(west?.x).toBeLessThan(0);
    expect(south?.y).toBeGreaterThan(600);
  });

  it("returns null when the box has no area", () => {
    expect(screenFromLocation(BANGKOK, { width: 0, height: 600 }, { lon: 100.5, lat: 13.75 })).toBeNull();
    expect(screenFromLocation(BANGKOK, { width: 800, height: 0 }, { lon: 100.5, lat: 13.75 })).toBeNull();
  });

  it("returns null when the bound cannot define a mapping", () => {
    const flatLongitude: LongdoBound = { ...BANGKOK, maxLon: BANGKOK.minLon };
    const flatLatitude: LongdoBound = { ...BANGKOK, maxLat: BANGKOK.minLat };
    const notANumber: LongdoBound = { ...BANGKOK, maxLon: Number.NaN };
    [flatLongitude, flatLatitude, notANumber].forEach((bound) => {
      expect(screenFromLocation(bound, SIZE, { lon: 100.5, lat: 13.75 })).toBeNull();
    });
  });
});
