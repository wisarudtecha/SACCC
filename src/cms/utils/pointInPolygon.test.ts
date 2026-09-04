// Tests for the SDK-free point-in-polygon containment utility.
//
// This repo ships no test runner today (see CLAUDE.md). These are written for
// Vitest so they run as soon as one is added:  `pnpm add -D vitest` then
// `npx vitest run`. `*.test.ts` is excluded from tsconfig.app.json so `tsc -b`
// does not try to resolve `vitest` in the meantime.
import { describe, it, expect } from "vitest";
import type { PolygonCoordinates } from "@/cms/types/area";
import { isPointInPolygon, isPointInRing } from "./pointInPolygon";

// A closed unit-ish square around Bangkok's Phra Nakhon, matching the shape
// src/cms/mocks/areaCURL.sh returns for a district.
const SQUARE: PolygonCoordinates = [
  [
    [100.49, 13.75],
    [100.5, 13.75],
    [100.5, 13.76],
    [100.49, 13.76],
    [100.49, 13.75]
  ]
];

describe("isPointInRing", () => {
  it("returns true for a point clearly inside the ring", () => {
    expect(isPointInRing([100.495, 13.755], SQUARE[0])).toBe(true);
  });

  it("returns false for a point outside the ring", () => {
    expect(isPointInRing([100.6, 13.8], SQUARE[0])).toBe(false);
  });

  it("returns false for a degenerate ring with fewer than three points", () => {
    expect(isPointInRing([0, 0], [[0, 0], [1, 1]])).toBe(false);
  });

  it("works on an open ring (first point not repeated at the end)", () => {
    const open = SQUARE[0].slice(0, -1);
    expect(isPointInRing([100.495, 13.755], open)).toBe(true);
  });
});

describe("isPointInPolygon", () => {
  it("matches a point inside the outer ring", () => {
    expect(isPointInPolygon([100.495, 13.755], SQUARE)).toBe(true);
  });

  it("rejects a point outside the outer ring", () => {
    expect(isPointInPolygon([101, 14], SQUARE)).toBe(false);
  });

  it("treats a point inside a hole as outside", () => {
    const withHole: PolygonCoordinates = [
      SQUARE[0],
      [
        [100.494, 13.754],
        [100.496, 13.754],
        [100.496, 13.756],
        [100.494, 13.756],
        [100.494, 13.754]
      ]
    ];
    expect(isPointInPolygon([100.495, 13.755], withHole)).toBe(false);
    // still inside the outer ring, away from the hole
    expect(isPointInPolygon([100.499, 13.759], withHole)).toBe(true);
  });

  it("returns false for empty or missing geometry", () => {
    expect(isPointInPolygon([100.495, 13.755], [])).toBe(false);
    expect(isPointInPolygon([100.495, 13.755], null)).toBe(false);
    expect(isPointInPolygon([100.495, 13.755], undefined)).toBe(false);
  });
});
