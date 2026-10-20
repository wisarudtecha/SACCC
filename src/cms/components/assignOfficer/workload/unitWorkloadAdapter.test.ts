import { describe, expect, it } from "vitest";
import type { UnitWithWorkload } from "@/cms/types/dispatch";
import {
  buildWorkloadByUnitId,
  needsCaseFetch,
  resolveCasePreviewFields,
  toUnitWorkload
} from "./unitWorkloadAdapter";

function makeUnit(overrides: Partial<UnitWithWorkload> = {}): UnitWithWorkload {
  return {
    orgId: "org",
    unitId: "unit-1",
    unitName: "Unit One",
    unitSourceId: "",
    unitTypeId: "",
    priority: 0,
    compId: "",
    deptId: "dept",
    commId: "",
    stnId: "",
    plateNo: "",
    provinceCode: "",
    active: true,
    photo: "",
    username: "user",
    isLogin: true,
    isFreeze: false,
    isOutArea: false,
    locLat: 0,
    locLon: 0,
    locAlt: 0,
    locBearing: 0,
    locSpeed: 0,
    locProvider: 0,
    locGpsTime: "",
    locSatellites: 0,
    locAccuracy: 0,
    locLastUpdateTime: "",
    breakDuration: 0,
    healthChk: "",
    healthChkTime: "",
    sttId: "",
    createdBy: "",
    updatedBy: "",
    unitPropLists: [],
    skillLists: [],
    proplLists: [],
    ...overrides
  };
}

describe("toUnitWorkload", () => {
  it("maps count and cases from a fully-populated unit", () => {
    const unit = makeUnit({
      workloadCount: 2,
      workloadCases: [
        { caseId: "c1", caseNumber: "WO-1" },
        { caseId: "c2", statusId: "S001", priority: 3, createdDate: "2026-10-01" }
      ]
    });

    expect(toUnitWorkload(unit)).toEqual({
      unitId: "unit-1",
      activeCaseCount: 2,
      cases: [
        { caseId: "c1", caseNumber: "WO-1" },
        { caseId: "c2", statusId: "S001", priority: 3, createdDate: "2026-10-01" }
      ]
    });
  });

  it("returns undefined when both workload fields are missing", () => {
    expect(toUnitWorkload(makeUnit())).toBeUndefined();
  });

  it("returns undefined when count is not a usable number and cases is not an array", () => {
    const unit = makeUnit({ workloadCount: "many", workloadCases: "nope" });

    expect(toUnitWorkload(unit)).toBeUndefined();
  });

  it("falls back to the cases length when count is missing but cases is a valid array", () => {
    const unit = makeUnit({
      workloadCases: [{ caseId: "c1" }, { caseId: "c2" }, { caseId: "c3" }]
    });

    expect(toUnitWorkload(unit)).toEqual({
      unitId: "unit-1",
      activeCaseCount: 3,
      cases: [{ caseId: "c1" }, { caseId: "c2" }, { caseId: "c3" }]
    });
  });

  it("keeps a valid count when cases is missing", () => {
    const unit = makeUnit({ workloadCount: 4 });

    expect(toUnitWorkload(unit)).toEqual({ unitId: "unit-1", activeCaseCount: 4, cases: [] });
  });

  it("treats an empty cases array as a real zero workload", () => {
    const unit = makeUnit({ workloadCases: [] });

    expect(toUnitWorkload(unit)).toEqual({ unitId: "unit-1", activeCaseCount: 0, cases: [] });
  });

  it("drops invalid case entries instead of rejecting the whole list", () => {
    const unit = makeUnit({
      workloadCount: 2,
      workloadCases: [
        { caseId: "c1" },
        { caseId: "" },
        { noCaseId: true },
        null
      ]
    });

    expect(toUnitWorkload(unit)?.cases).toEqual([{ caseId: "c1" }]);
  });

  it("rejects a negative count as unusable but still counts valid cases", () => {
    const unit = makeUnit({ workloadCount: -1, workloadCases: [{ caseId: "c1" }] });

    expect(toUnitWorkload(unit)).toEqual({
      unitId: "unit-1",
      activeCaseCount: 1,
      cases: [{ caseId: "c1" }]
    });
  });
});

describe("buildWorkloadByUnitId", () => {
  it("indexes one entry per unit that has usable workload data", () => {
    const byUnitId = buildWorkloadByUnitId([
      makeUnit({ unitId: "a", workloadCount: 1, workloadCases: [{ caseId: "c1" }] }),
      makeUnit({ unitId: "b" })
    ]);

    expect(Object.keys(byUnitId)).toEqual(["a"]);
    expect(byUnitId.a).toEqual({ unitId: "a", activeCaseCount: 1, cases: [{ caseId: "c1" }] });
  });

  it("returns an empty map for undefined input", () => {
    expect(buildWorkloadByUnitId(undefined)).toEqual({});
  });
});

describe("needsCaseFetch", () => {
  it("is true for a bare entry carrying only caseId", () => {
    expect(needsCaseFetch({ caseId: "c1" })).toBe(true);
  });

  it("is false once any display field is present", () => {
    expect(needsCaseFetch({ caseId: "c1", caseNumber: "WO-1" })).toBe(false);
    expect(needsCaseFetch({ caseId: "c1", statusId: "S001" })).toBe(false);
    expect(needsCaseFetch({ caseId: "c1", priority: 0 })).toBe(false);
    expect(needsCaseFetch({ caseId: "c1", createdDate: "" })).toBe(false);
  });
});

describe("resolveCasePreviewFields", () => {
  it("prefers embedded entry fields and leaves gaps for the remote to fill", () => {
    const fields = resolveCasePreviewFields(
      { caseId: "c1", caseNumber: "WO-1" },
      { caseId: "c1", statusId: "S002", priority: 5, createdDate: "2026-10-02" }
    );

    expect(fields).toEqual({
      caseId: "c1",
      caseNumber: "WO-1",
      statusId: "S002",
      priority: 5,
      createdDate: "2026-10-02"
    });
  });

  it("fills only the missing fields from the fetched case", () => {
    const fields = resolveCasePreviewFields(
      { caseId: "c1", priority: 1, createdDate: "2026-10-01" },
      { caseId: "c1", statusId: "S009", priority: 9 }
    );

    expect(fields).toEqual({
      caseId: "c1",
      priority: 1,
      createdDate: "2026-10-01",
      statusId: "S009"
    });
  });

  it("keeps priority 0 from either source — zero is a real value", () => {
    expect(resolveCasePreviewFields({ caseId: "c1" }, { caseId: "c1", priority: 0 }).priority).toBe(0);
    expect(resolveCasePreviewFields({ caseId: "c1", priority: 0 }).priority).toBe(0);
  });

  it("renders from the entry alone when there is no fetched case", () => {
    expect(resolveCasePreviewFields({ caseId: "c1" })).toEqual({ caseId: "c1" });
  });
});
