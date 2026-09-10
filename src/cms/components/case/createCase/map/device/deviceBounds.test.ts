// Unit tests for the Device layer's viewport-box maths (debounce/dedup helpers).
// Run: `pnpm test` (Vitest, node environment).
import { describe, it, expect } from "vitest";
import {
  BOUNDS_PRECISION,
  DEVICE_BOUNDS_DEBOUNCE_MS,
  boundsKey,
  roundBounds,
  sameBounds
} from "./deviceBounds";

describe("roundBounds", () => {
  it("snaps every edge to BOUNDS_PRECISION decimal places", () => {
    const rounded = roundBounds({
      minLat: 13.123456789,
      minLon: 100.987654321,
      maxLat: 13.223344556,
      maxLon: 100.111199999
    });
    expect(rounded).toEqual({
      minLat: 13.1235,
      minLon: 100.9877,
      maxLat: 13.2233,
      maxLon: 100.1112
    });
  });

  it("is idempotent", () => {
    const once = roundBounds({ minLat: 1.111149, minLon: 2.22225, maxLat: 3.3, maxLon: 4.4 });
    expect(roundBounds(once)).toEqual(once);
  });

  it("uses 4 dp", () => {
    expect(BOUNDS_PRECISION).toBe(4);
  });
});

describe("sameBounds", () => {
  const box = { minLat: 13.5, minLon: 100.5, maxLat: 13.6, maxLon: 100.6 };

  it("is true for two equal boxes", () => {
    expect(sameBounds(box, { ...box })).toBe(true);
  });

  it("is false when any edge differs by more than the rounding step", () => {
    expect(sameBounds(box, { ...box, maxLon: 100.6001 })).toBe(false);
  });

  it("is false when either side is null", () => {
    expect(sameBounds(null, box)).toBe(false);
    expect(sameBounds(box, null)).toBe(false);
    expect(sameBounds(null, null)).toBe(false);
  });

  it("treats a sub-rounding jitter as the same box once both are rounded", () => {
    const jittered = roundBounds({ ...box, maxLon: 100.600004 });
    expect(sameBounds(roundBounds(box), jittered)).toBe(true);
  });
});

describe("boundsKey", () => {
  it("is stable for the same box", () => {
    const box = { minLat: 1, minLon: 2, maxLat: 3, maxLon: 4 };
    expect(boundsKey(box)).toBe(boundsKey({ ...box }));
  });

  it("is order-sensitive across edges", () => {
    expect(boundsKey({ minLat: 1, minLon: 2, maxLat: 3, maxLon: 4 })).not.toBe(
      boundsKey({ minLat: 2, minLon: 1, maxLat: 3, maxLon: 4 })
    );
  });

  it("is the empty string for null", () => {
    expect(boundsKey(null)).toBe("");
  });
});

describe("DEVICE_BOUNDS_DEBOUNCE_MS", () => {
  it("is a sane debounce window", () => {
    expect(DEVICE_BOUNDS_DEBOUNCE_MS).toBeGreaterThanOrEqual(200);
    expect(DEVICE_BOUNDS_DEBOUNCE_MS).toBeLessThanOrEqual(1000);
  });
});
