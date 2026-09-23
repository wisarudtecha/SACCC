import { describe, expect, it } from "vitest";
import {
  DEFAULT_CLUSTER_RADIUS_PX,
  getSeparationZoom,
  groupByProximity,
  type ProximityPoint,
  type ScreenPoint
} from "./proximityClustering";

interface TestPoint extends ProximityPoint {
  screen: ScreenPoint;
}

function point(id: string, x: number, y: number): TestPoint {
  return { id, lat: 0, lon: 0, screen: { x, y } };
}

function toScreen(item: TestPoint): ScreenPoint {
  return item.screen;
}

describe("groupByProximity", () => {
  it("keeps points further apart than the radius as singles", () => {
    const items = [point("a", 0, 0), point("b", 100, 0)];
    const { singles, groups } = groupByProximity(items, toScreen, 38);
    expect(singles.map((item) => item.id).sort()).toEqual(["a", "b"]);
    expect(groups).toHaveLength(0);
  });

  it("merges points within the radius into one group", () => {
    const items = [point("a", 0, 0), point("b", 10, 0)];
    const { singles, groups } = groupByProximity(items, toScreen, 38);
    expect(singles).toHaveLength(0);
    expect(groups).toHaveLength(1);
    expect(groups[0].members.map((m) => m.id).sort()).toEqual(["a", "b"]);
    expect(groups[0].minPairwisePx).toBeCloseTo(10);
  });

  it("splits into two groups when a chain exceeds the radius partway through", () => {
    const items = [point("a", 0, 0), point("b", 10, 0), point("c", 100, 0)];
    const { singles, groups } = groupByProximity(items, toScreen, 38);
    expect(singles.map((item) => item.id)).toEqual(["c"]);
    expect(groups).toHaveLength(1);
    expect(groups[0].members.map((m) => m.id).sort()).toEqual(["a", "b"]);
  });

  it("treats a point with no screen projection as a single", () => {
    const items = [point("a", 0, 0), point("b", 5, 0)];
    const grouping = groupByProximity(
      items,
      (item) => (item.id === "b" ? null : toScreen(item)),
      38
    );
    expect(grouping.singles.map((item) => item.id).sort()).toEqual(["a", "b"]);
    expect(grouping.groups).toHaveLength(0);
  });

  it("uses the default radius when none is passed", () => {
    const items = [point("a", 0, 0), point("b", DEFAULT_CLUSTER_RADIUS_PX - 1, 0)];
    const { groups } = groupByProximity(items, toScreen);
    expect(groups).toHaveLength(1);
  });
});

describe("getSeparationZoom", () => {
  it("returns null when members share the same coordinate", () => {
    expect(getSeparationZoom({ minPairwisePx: 0 }, 10, 20)).toBeNull();
  });

  it("returns null when already further apart than the merge radius", () => {
    expect(getSeparationZoom({ minPairwisePx: 40 }, 10, 20, 38)).toBeNull();
  });

  it("returns null when the needed zoom exceeds maxZoom", () => {
    expect(getSeparationZoom({ minPairwisePx: 1 }, 10, 10.5, 38)).toBeNull();
  });

  it("returns a zoom level with half a level of headroom when reachable", () => {
    // radius/minPairwisePx = 4 -> log2(4) = 2 levels needed.
    const zoom = getSeparationZoom({ minPairwisePx: 9.5 }, 10, 20, 38);
    expect(zoom).not.toBeNull();
    expect(zoom!).toBeGreaterThan(12);
    expect(zoom!).toBeLessThanOrEqual(20);
  });

  it("caps the returned zoom at maxZoom", () => {
    const zoom = getSeparationZoom({ minPairwisePx: 9.5 }, 10, 12, 38);
    expect(zoom).toBe(12);
  });
});
