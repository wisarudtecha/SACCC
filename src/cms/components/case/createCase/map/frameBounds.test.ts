import { describe, expect, it } from "vitest";
import {
  DOCKED_CARD_COLLAPSED_WIDTH_PX,
  DOCKED_CARD_WIDTH_PX,
  DOCK_EDGE_PX,
  DOCK_GAP_PX,
  FRAME_MAX_ZOOM,
  MIN_FRAME_SPAN,
  NO_INSETS,
  clampInsets,
  computeFrameView,
  computeFramedBounds,
  dockedCardsWidthPx,
  zoomForUnitsPerPixel,
  type PlanarBounds,
  type PlanarPoint
} from "./frameBounds";
import { MAX_MERCATOR_EXTENT_M } from "./webMercator";

const viewport = { width: 1000, height: 600 };

/** Where a point lands on screen, in pixels, when the view shows `bounds`. */
function toPixel(point: PlanarPoint, bounds: PlanarBounds) {
  return {
    x: ((point.x - bounds.xmin) / (bounds.xmax - bounds.xmin)) * viewport.width,
    y: ((bounds.ymax - point.y) / (bounds.ymax - bounds.ymin)) * viewport.height
  };
}

describe("computeFramedBounds", () => {
  it("returns null when there is nothing to frame", () => {
    expect(computeFramedBounds([], viewport)).toBeNull();
  });

  it("returns null for an empty viewport", () => {
    expect(computeFramedBounds([{ x: 0, y: 0 }], { width: 0, height: 100 })).toBeNull();
  });

  it("keeps the viewport's aspect ratio", () => {
    const bounds = computeFramedBounds(
      [{ x: 0, y: 0 }, { x: 5000, y: 1000 }],
      viewport
    )!;

    const aspect = (bounds.xmax - bounds.xmin) / (bounds.ymax - bounds.ymin);
    expect(aspect).toBeCloseTo(viewport.width / viewport.height, 6);
  });

  it("puts every point inside the view", () => {
    const points = [{ x: 0, y: 0 }, { x: 8000, y: 3000 }, { x: 2000, y: -2500 }];
    const bounds = computeFramedBounds(points, viewport)!;

    points.forEach((point) => {
      const pixel = toPixel(point, bounds);
      expect(pixel.x).toBeGreaterThanOrEqual(0);
      expect(pixel.x).toBeLessThanOrEqual(viewport.width);
      expect(pixel.y).toBeGreaterThanOrEqual(0);
      expect(pixel.y).toBeLessThanOrEqual(viewport.height);
    });
  });

  it("zooms out as far as the spread needs", () => {
    const near = computeFramedBounds([{ x: 0, y: 0 }, { x: 1000, y: 0 }], viewport)!;
    const far = computeFramedBounds([{ x: 0, y: 0 }, { x: 50000, y: 0 }], viewport)!;

    expect(far.xmax - far.xmin).toBeGreaterThan(near.xmax - near.xmin);
  });

  it("keeps every point clear of a covered left strip", () => {
    const insets = { left: 400, top: 0, right: 0, bottom: 0 };
    const points = [{ x: 0, y: 0 }, { x: 8000, y: 2000 }];
    const bounds = computeFramedBounds(points, viewport, insets)!;

    points.forEach((point) => {
      expect(toPixel(point, bounds).x).toBeGreaterThanOrEqual(insets.left - 0.001);
      expect(toPixel(point, bounds).x).toBeLessThanOrEqual(viewport.width + 0.001);
    });
  });

  it("keeps every point inside all four insets", () => {
    const insets = { left: 300, top: 80, right: 60, bottom: 50 };
    const points = [{ x: -3000, y: -900 }, { x: 4000, y: 1500 }];
    const bounds = computeFramedBounds(points, viewport, insets)!;

    points.forEach((point) => {
      const pixel = toPixel(point, bounds);
      expect(pixel.x).toBeGreaterThanOrEqual(insets.left - 0.001);
      expect(pixel.x).toBeLessThanOrEqual(viewport.width - insets.right + 0.001);
      expect(pixel.y).toBeGreaterThanOrEqual(insets.top - 0.001);
      expect(pixel.y).toBeLessThanOrEqual(viewport.height - insets.bottom + 0.001);
    });
  });

  it("frames coincident points at the minimum span instead of zooming in forever", () => {
    const bounds = computeFramedBounds([{ x: 100, y: 100 }, { x: 100, y: 100 }], viewport)!;

    expect(bounds.xmax - bounds.xmin).toBeGreaterThan(0);
    expect(bounds.ymax - bounds.ymin).toBeGreaterThanOrEqual(MIN_FRAME_SPAN);
  });

  it("frames a single point", () => {
    const bounds = computeFramedBounds([{ x: 10, y: 20 }], viewport)!;

    expect((bounds.xmin + bounds.xmax) / 2).toBeCloseTo(10, 6);
    expect((bounds.ymin + bounds.ymax) / 2).toBeCloseTo(20, 6);
  });

  it("ignores insets that leave no usable area", () => {
    const withHugeInsets = computeFramedBounds(
      [{ x: 0, y: 0 }, { x: 5000, y: 1000 }],
      viewport,
      { left: 900, top: 0, right: 200, bottom: 0 }
    );
    const withNone = computeFramedBounds([{ x: 0, y: 0 }, { x: 5000, y: 1000 }], viewport, NO_INSETS);

    expect(withHugeInsets).toEqual(withNone);
  });
});

describe("computeFrameView", () => {
  it("agrees with computeFramedBounds", () => {
    const points = [{ x: 0, y: 0 }, { x: 8000, y: 3000 }];
    const insets = { left: 300, top: 70, right: 40, bottom: 50 };
    const view = computeFrameView(points, viewport, insets)!;
    const bounds = computeFramedBounds(points, viewport, insets)!;

    expect((bounds.xmin + bounds.xmax) / 2).toBeCloseTo(view.center.x, 6);
    expect((bounds.ymin + bounds.ymax) / 2).toBeCloseTo(view.center.y, 6);
    expect((bounds.xmax - bounds.xmin) / viewport.width).toBeCloseTo(view.unitsPerPixel, 9);
  });

  it("returns null when there is nothing to frame", () => {
    expect(computeFrameView([], viewport)).toBeNull();
  });
});

describe("zoomForUnitsPerPixel", () => {
  it("is zero when one 256px tile spans the whole world", () => {
    const worldMetresPerPixel = (2 * MAX_MERCATOR_EXTENT_M) / 256;

    expect(zoomForUnitsPerPixel(worldMetresPerPixel)).toBeCloseTo(0, 9);
  });

  it("gains one level each time the scale halves", () => {
    expect(zoomForUnitsPerPixel(100) - zoomForUnitsPerPixel(200)).toBeCloseTo(1, 9);
  });

  it("matches the familiar figure for zoom 12 (about 38 m per pixel)", () => {
    expect(zoomForUnitsPerPixel(38.2185)).toBeCloseTo(12, 2);
  });

  it("exposes a sane maximum framing zoom", () => {
    expect(FRAME_MAX_ZOOM).toBeGreaterThan(10);
    expect(FRAME_MAX_ZOOM).toBeLessThan(21);
  });
});

// The property Longdo's centre-and-zoom framing depends on: it can only pick a
// whole zoom level, so it rounds DOWN (zooms out). That must never push a point
// under a docked card or off the view.
describe("a whole-number zoom taken from a frame view", () => {
  const insets = { left: 400, top: 72, right: 48, bottom: 64 };
  const spreads = [800, 3000, 20000, 150000];

  spreads.forEach((spread) => {
    it(`keeps every point in the uncovered area for a ${spread} m spread`, () => {
      const points = [
        { x: 11187430, y: 1548160 },
        { x: 11187430 + spread, y: 1548160 + spread * 0.4 },
        { x: 11187430 + spread * 0.3, y: 1548160 - spread * 0.6 }
      ];
      const view = computeFrameView(points, viewport, insets)!;
      const zoom = Math.floor(zoomForUnitsPerPixel(view.unitsPerPixel));
      const unitsPerPixel = (2 * MAX_MERCATOR_EXTENT_M) / (256 * 2 ** zoom);

      points.forEach((point) => {
        const x = viewport.width / 2 + (point.x - view.center.x) / unitsPerPixel;
        const y = viewport.height / 2 - (point.y - view.center.y) / unitsPerPixel;
        expect(x).toBeGreaterThanOrEqual(insets.left - 0.001);
        expect(x).toBeLessThanOrEqual(viewport.width - insets.right + 0.001);
        expect(y).toBeGreaterThanOrEqual(insets.top - 0.001);
        expect(y).toBeLessThanOrEqual(viewport.height - insets.bottom + 0.001);
      });
    });
  });
});

describe("clampInsets", () => {
  it("leaves insets alone when plenty of room remains", () => {
    const insets = { left: 200, top: 70, right: 40, bottom: 60 };

    expect(clampInsets(insets, viewport)).toEqual(insets);
  });

  it("shrinks insets that would leave no usable width, keeping their proportions", () => {
    const clamped = clampInsets({ left: 900, top: 0, right: 300, bottom: 0 }, viewport);

    expect(viewport.width - clamped.left - clamped.right).toBeGreaterThanOrEqual(120 - 0.001);
    expect(clamped.left / clamped.right).toBeCloseTo(3, 6);
  });

  it("clamps each axis independently", () => {
    const clamped = clampInsets({ left: 100, top: 900, right: 100, bottom: 200 }, viewport);

    expect(clamped.left).toBe(100);
    expect(clamped.right).toBe(100);
    expect(viewport.height - clamped.top - clamped.bottom).toBeGreaterThanOrEqual(120 - 0.001);
  });

  it("never returns a negative inset", () => {
    const clamped = clampInsets({ left: 5000, top: 5000, right: 5000, bottom: 5000 }, { width: 50, height: 50 });

    expect(Math.min(clamped.left, clamped.top, clamped.right, clamped.bottom)).toBeGreaterThanOrEqual(0);
  });
});

describe("dockedCardsWidthPx", () => {
  it("is zero when nothing is docked", () => {
    expect(
      dockedCardsWidthPx({ isCasePanelOpen: false, isCasePanelCollapsed: false, hasStaffCard: false })
    ).toBe(0);
  });

  it("covers one card and the edge margin", () => {
    expect(
      dockedCardsWidthPx({ isCasePanelOpen: true, isCasePanelCollapsed: false, hasStaffCard: false })
    ).toBe(DOCK_EDGE_PX + DOCKED_CARD_WIDTH_PX);
  });

  it("adds the gap for two cards", () => {
    expect(
      dockedCardsWidthPx({ isCasePanelOpen: true, isCasePanelCollapsed: false, hasStaffCard: true })
    ).toBe(DOCK_EDGE_PX + 2 * DOCKED_CARD_WIDTH_PX + DOCK_GAP_PX);
  });

  it("counts a collapsed Case Panel at its narrower width", () => {
    expect(
      dockedCardsWidthPx({ isCasePanelOpen: true, isCasePanelCollapsed: true, hasStaffCard: true })
    ).toBe(DOCK_EDGE_PX + DOCKED_CARD_COLLAPSED_WIDTH_PX + DOCKED_CARD_WIDTH_PX + DOCK_GAP_PX);
  });

  it("counts only the staff card when the Case Panel is closed", () => {
    expect(
      dockedCardsWidthPx({ isCasePanelOpen: false, isCasePanelCollapsed: true, hasStaffCard: true })
    ).toBe(DOCK_EDGE_PX + DOCKED_CARD_WIDTH_PX);
  });
});
