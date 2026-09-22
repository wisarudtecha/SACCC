import { describe, expect, it } from "vitest";
import { DRAG_START_THRESHOLD_PX, hasMovedPastThreshold } from "./dragThreshold";

describe("hasMovedPastThreshold", () => {
  const start = { x: 100, y: 100 };

  it("is not a drag while the pointer has not moved", () => {
    expect(hasMovedPastThreshold(start, start)).toBe(false);
  });

  it("is not a drag at exactly the threshold", () => {
    expect(hasMovedPastThreshold(start, { x: 100 + DRAG_START_THRESHOLD_PX, y: 100 })).toBe(false);
  });

  it("is a drag just past the threshold", () => {
    expect(hasMovedPastThreshold(start, { x: 100 + DRAG_START_THRESHOLD_PX + 0.5, y: 100 })).toBe(true);
  });

  it("measures diagonally, not per axis", () => {
    // 4px on each axis is ~5.66px along the diagonal, past a 5px threshold.
    expect(hasMovedPastThreshold(start, { x: 104, y: 104 })).toBe(true);
    expect(hasMovedPastThreshold(start, { x: 103, y: 103 })).toBe(false);
  });

  it("works in any direction", () => {
    expect(hasMovedPastThreshold(start, { x: 90, y: 100 })).toBe(true);
    expect(hasMovedPastThreshold(start, { x: 100, y: 93 })).toBe(true);
  });

  it("honours a custom threshold", () => {
    expect(hasMovedPastThreshold(start, { x: 108, y: 100 }, 10)).toBe(false);
    expect(hasMovedPastThreshold(start, { x: 111, y: 100 }, 10)).toBe(true);
  });
});
