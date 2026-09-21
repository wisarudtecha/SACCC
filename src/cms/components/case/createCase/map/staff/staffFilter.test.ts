import { describe, expect, it } from "vitest";
import type { UnitWorkload } from "@/cms/types/unitWorkload";
import {
  DEFAULT_STAFF_FILTER_MODE,
  RECOMMENDED_STAFF_LIMIT,
  filterStaffForMode
} from "./staffFilter";
import type { StaffMarker } from "./staffTypes";

function makeMarker(unitId: string): StaffMarker {
  return {
    unitId,
    unitName: unitId,
    username: unitId,
    photo: "",
    statusId: "",
    isLogin: true,
    latitude: 13.7,
    longitude: 100.5,
    lastUpdateTime: "",
    skills: [],
    bearing: null,
    speedKmh: null,
    accuracyMeters: null,
    gpsTime: ""
  };
}

function makeWorkload(unitId: string, activeCaseCount: number): UnitWorkload {
  return {
    unitId,
    activeCaseCount,
    cases: Array.from({ length: activeCaseCount }, (_, index) => ({ caseId: `${unitId}-${index}` }))
  };
}

/** u1..u8, where u1 is the least loaded and u8 the most. */
const staff = Array.from({ length: 8 }, (_, index) => makeMarker(`u${index + 1}`));
const workload = Object.fromEntries(
  staff.map((marker, index) => [marker.unitId, makeWorkload(marker.unitId, index)])
);
const ids = (markers: readonly StaffMarker[]) => markers.map((marker) => marker.unitId);
const noneAssigned: ReadonlySet<string> = new Set();

describe("filterStaffForMode", () => {
  it("defaults to recommend", () => {
    expect(DEFAULT_STAFF_FILTER_MODE).toBe("recommend");
  });

  it("shows everyone in all mode", () => {
    const result = filterStaffForMode({
      mode: "all",
      staff,
      assignedUnitIds: noneAssigned,
      workloadByUnitId: workload,
      isWorkloadError: false
    });

    expect(ids(result)).toEqual(ids(staff));
  });

  it("recommend keeps only the least-loaded few", () => {
    const result = filterStaffForMode({
      mode: "recommend",
      staff,
      assignedUnitIds: noneAssigned,
      workloadByUnitId: workload,
      isWorkloadError: false
    });

    expect(result).toHaveLength(RECOMMENDED_STAFF_LIMIT);
    expect(ids(result)).toEqual(["u1", "u2", "u3", "u4", "u5"]);
  });

  it("always keeps an assigned officer, even a heavily loaded one, on top of the shortlist", () => {
    const result = filterStaffForMode({
      mode: "recommend",
      staff,
      assignedUnitIds: new Set(["u8"]),
      workloadByUnitId: workload,
      isWorkloadError: false
    });

    expect(ids(result)).toEqual(["u1", "u2", "u3", "u4", "u5", "u8"]);
  });

  it("does not count an assigned officer against the shortlist", () => {
    const result = filterStaffForMode({
      mode: "recommend",
      staff,
      assignedUnitIds: new Set(["u1"]),
      workloadByUnitId: workload,
      isWorkloadError: false
    });

    // u1 is assigned, so the five best of the REST are u2..u6.
    expect(ids(result)).toEqual(["u1", "u2", "u3", "u4", "u5", "u6"]);
  });

  it("keeps the incoming order rather than the rank order", () => {
    const reversed = [...staff].reverse();
    const result = filterStaffForMode({
      mode: "recommend",
      staff: reversed,
      assignedUnitIds: noneAssigned,
      workloadByUnitId: workload,
      isWorkloadError: false
    });

    expect(ids(result)).toEqual(["u5", "u4", "u3", "u2", "u1"]);
  });

  it("ranks an officer with no workload entry after those that have one", () => {
    const withoutU1 = Object.fromEntries(Object.entries(workload).filter(([id]) => id !== "u1"));
    const result = filterStaffForMode({
      mode: "recommend",
      staff,
      assignedUnitIds: noneAssigned,
      workloadByUnitId: withoutU1,
      isWorkloadError: false
    });

    expect(ids(result)).toEqual(["u2", "u3", "u4", "u5", "u6"]);
  });

  it("shows everyone when the workload request failed", () => {
    const result = filterStaffForMode({
      mode: "recommend",
      staff,
      assignedUnitIds: noneAssigned,
      workloadByUnitId: {},
      isWorkloadError: true
    });

    expect(ids(result)).toEqual(ids(staff));
  });

  it("shows everyone while there is no workload data yet", () => {
    const result = filterStaffForMode({
      mode: "recommend",
      staff,
      assignedUnitIds: noneAssigned,
      workloadByUnitId: {},
      isWorkloadError: false
    });

    expect(ids(result)).toEqual(ids(staff));
  });

  it("does not mutate the staff list it was given", () => {
    const before = ids(staff);
    filterStaffForMode({
      mode: "recommend",
      staff,
      assignedUnitIds: noneAssigned,
      workloadByUnitId: workload,
      isWorkloadError: false
    });

    expect(ids(staff)).toEqual(before);
  });
});
