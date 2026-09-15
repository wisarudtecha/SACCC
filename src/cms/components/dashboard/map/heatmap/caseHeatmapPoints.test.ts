import { describe, expect, it } from "vitest";
import { toHeatmapPoints } from "./caseHeatmapPoints";
import type { Case } from "@/cms/store/api/caseApi";

const makeCase = (overrides: Partial<Case>): Case => ({
  id: "1",
  orgId: "org1",
  caseId: "CASE-1",
  caseVersion: "1",
  referCaseId: null,
  caseTypeId: "T1",
  caseSTypeId: "ST1",
  priority: 1,
  source: "phone",
  deviceId: "",
  phoneNo: "",
  phoneNoHide: false,
  caseDetail: null,
  extReceive: "",
  statusId: "S001",
  caseLat: "13.75",
  caseLon: "100.5",
  caselocAddr: "",
  caselocAddrDecs: "",
  countryId: "TH",
  provId: "",
  distId: "",
  caseDuration: 0,
  createdDate: "",
  startedDate: "",
  commandedDate: "",
  receivedDate: "",
  arrivedDate: "",
  closedDate: "",
  usercreate: "",
  usercommand: "",
  userreceive: "",
  userarrive: "",
  userclose: "",
  resId: "",
  resDetail: null,
  createdAt: "",
  updatedAt: "",
  createdBy: "",
  updatedBy: "",
  ...overrides,
});

describe("toHeatmapPoints", () => {
  it("converts a case with valid coordinates into a weighted point", () => {
    const cases = [makeCase({ caseId: "CASE-1", caseLat: "13.75", caseLon: "100.5", priority: 2 })];

    expect(toHeatmapPoints(cases)).toEqual([{ caseId: "CASE-1", lat: 13.75, lon: 100.5, weight: 2 }]);
  });

  it("drops cases with non-numeric coordinates", () => {
    const cases = [makeCase({ caseLat: "", caseLon: "" })];

    expect(toHeatmapPoints(cases)).toEqual([]);
  });

  it("drops cases sitting exactly at (0, 0), the common bad-geocode sentinel", () => {
    const cases = [makeCase({ caseLat: "0", caseLon: "0" })];

    expect(toHeatmapPoints(cases)).toEqual([]);
  });

  it("clamps priority into the 1-3 weight range", () => {
    const cases = [
      makeCase({ caseId: "LOW", priority: 0 }),
      makeCase({ caseId: "HIGH", priority: 9 }),
    ];

    const points = toHeatmapPoints(cases);

    expect(points.find(point => point.caseId === "LOW")?.weight).toBe(1);
    expect(points.find(point => point.caseId === "HIGH")?.weight).toBe(3);
  });
});
