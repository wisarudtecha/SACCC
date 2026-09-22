import { describe, expect, it } from "vitest";
import { computeAnchorPlacement } from "../../anchorPlacement";
import { STAFF_DRAG_PICK_RADIUS_PX, pickNearestStaff } from "./pickStaff";

const candidates = [
  { unitId: "a", x: 100, y: 100 },
  { unitId: "b", x: 200, y: 100 },
  { unitId: "c", x: 106, y: 100 }
];

describe("pickNearestStaff", () => {
  const all = new Set(["a", "b", "c"]);

  it("picks the officer under the pointer", () => {
    expect(pickNearestStaff({ x: 200, y: 102 }, candidates, all)).toBe("b");
  });

  it("returns null when nobody is within the radius", () => {
    expect(pickNearestStaff({ x: 150, y: 150 }, candidates, all)).toBeNull();
  });

  it("accepts a press exactly at the radius", () => {
    expect(pickNearestStaff({ x: 200 + STAFF_DRAG_PICK_RADIUS_PX, y: 100 }, candidates, all)).toBe("b");
  });

  it("prefers the nearer of two officers both inside the radius", () => {
    expect(pickNearestStaff({ x: 104, y: 100 }, candidates, all)).toBe("c");
  });

  it("ignores officers who are not allowed to be dragged", () => {
    expect(pickNearestStaff({ x: 100, y: 100 }, candidates, new Set(["b"]))).toBeNull();
  });

  it("falls through to an allowed officer that is further but still inside", () => {
    expect(pickNearestStaff({ x: 104, y: 100 }, candidates, new Set(["a"]))).toBe("a");
  });

  it("returns null for an empty allow-list or no candidates", () => {
    expect(pickNearestStaff({ x: 100, y: 100 }, candidates, new Set())).toBeNull();
    expect(pickNearestStaff({ x: 100, y: 100 }, [], all)).toBeNull();
  });
});

describe("computeAnchorPlacement", () => {
  const box = { width: 800, height: 600 };

  it("hides an overlay whose coordinate could not be projected", () => {
    expect(computeAnchorPlacement(null, box).isVisible).toBe(false);
    expect(computeAnchorPlacement({ x: Number.NaN, y: 10 }, box).isVisible).toBe(false);
  });

  it("hides an overlay whose anchor is off the map", () => {
    expect(computeAnchorPlacement({ x: -1, y: 300 }, box).isVisible).toBe(false);
    expect(computeAnchorPlacement({ x: 400, y: 601 }, box).isVisible).toBe(false);
  });

  it("keeps an anchor that is well inside where it is", () => {
    expect(computeAnchorPlacement({ x: 400, y: 300 }, box)).toEqual({ x: 400, y: 300, isVisible: true });
  });

  it("pulls an anchor at the very edge in by the margin", () => {
    expect(computeAnchorPlacement({ x: 0, y: 600 }, box, 12)).toEqual({ x: 12, y: 588, isVisible: true });
  });

  it("does not invert on a box smaller than twice the margin", () => {
    const placement = computeAnchorPlacement({ x: 5, y: 5 }, { width: 10, height: 10 }, 12);
    expect(placement).toEqual({ x: 12, y: 12, isVisible: true });
  });
});
