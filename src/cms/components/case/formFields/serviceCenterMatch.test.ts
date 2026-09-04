// Tests for the incident -> Service Center decision rule (the part that drives
// the create-time auto-lock). See src/cms/utils/pointInPolygon.test.ts for how
// to run these before this repo has a test runner wired up.
import { describe, it, expect } from "vitest";
import type { Area } from "@/cms/store/api/area";
import type { AreaDistrict } from "@/cms/types/area";
import { buildDistrictPolygonIndex, resolveServiceCenterMatch } from "./serviceCenterMatch";

const area = (overrides: Partial<Area>): Area => ({
  id: "area-1",
  orgId: "org-1",
  countryId: "TH",
  provId: "10",
  distId: "1001",
  districtEn: "Phra Nakhon",
  districtTh: "พระนคร",
  districtActive: true,
  provinceEn: "Bangkok",
  provinceTh: "กรุงเทพมหานคร",
  provinceActive: true,
  countryEn: "Thailand",
  countryTh: "ประเทศไทย",
  countryActive: true,
  ...overrides
});

const district = (distId: string, ring: number[][]): Partial<AreaDistrict> => ({
  countryId: "TH",
  provId: "10",
  distId,
  coordinates: [ring]
});

const SQUARE_A = [
  [100.49, 13.75],
  [100.5, 13.75],
  [100.5, 13.76],
  [100.49, 13.76],
  [100.49, 13.75]
];
const SQUARE_B = [
  [100.6, 13.75],
  [100.61, 13.75],
  [100.61, 13.76],
  [100.6, 13.76],
  [100.6, 13.75]
];

const INSIDE_A = { latitude: 13.755, longitude: 100.495 };
const OUTSIDE_BOTH = { latitude: 13.9, longitude: 100.0 };

describe("resolveServiceCenterMatch", () => {
  it("locks onto the single Area whose district polygon contains the incident", () => {
    const areaA = area({ id: "A", distId: "1001" });
    const areaB = area({ id: "B", distId: "1002" });
    const polygonByKey = buildDistrictPolygonIndex([
      district("1001", SQUARE_A),
      district("1002", SQUARE_B)
    ]);

    const result = resolveServiceCenterMatch({
      incident: INSIDE_A,
      areaList: [areaA, areaB],
      polygonByKey,
      radiusMeters: 900
    });

    expect(result.status).toBe("matched");
    expect(result.matchedArea?.id).toBe("A");
    expect(result.incidentRadius).toBeNull();
  });

  it("falls back (no match, with a radius circle) when no district contains the point", () => {
    const areaA = area({ id: "A", distId: "1001" });
    const polygonByKey = buildDistrictPolygonIndex([district("1001", SQUARE_A)]);

    const result = resolveServiceCenterMatch({
      incident: OUTSIDE_BOTH,
      areaList: [areaA],
      polygonByKey,
      radiusMeters: 900
    });

    expect(result.status).toBe("no-match");
    expect(result.matchedArea).toBeNull();
    expect(result.incidentRadius).toEqual({ center: OUTSIDE_BOTH, radiusMeters: 900 });
  });

  it("falls back when more than one district contains the point (overlapping data)", () => {
    const areaA = area({ id: "A", distId: "1001" });
    const areaB = area({ id: "B", distId: "1002" });
    // Both districts carry the same polygon, so the incident is inside both.
    const polygonByKey = buildDistrictPolygonIndex([
      district("1001", SQUARE_A),
      district("1002", SQUARE_A)
    ]);

    const result = resolveServiceCenterMatch({
      incident: INSIDE_A,
      areaList: [areaA, areaB],
      polygonByKey,
      radiusMeters: 900
    });

    expect(result.status).toBe("no-match");
    expect(result.incidentRadius?.radiusMeters).toBe(900);
  });

  it("ignores Area rows whose district has no geometry", () => {
    const areaA = area({ id: "A", distId: "1001" });
    const polygonByKey = buildDistrictPolygonIndex([{ countryId: "TH", provId: "10", distId: "1001" }]);

    const result = resolveServiceCenterMatch({
      incident: INSIDE_A,
      areaList: [areaA],
      polygonByKey,
      radiusMeters: 900
    });

    expect(result.status).toBe("no-match");
  });

  it("passes the org-configured radius straight through to the circle", () => {
    const areaA = area({ id: "A", distId: "1001" });
    const polygonByKey = buildDistrictPolygonIndex([district("1001", SQUARE_A)]);

    const result = resolveServiceCenterMatch({
      incident: OUTSIDE_BOTH,
      areaList: [areaA],
      polygonByKey,
      radiusMeters: 1500
    });

    expect(result.status).toBe("no-match");
    expect(result.incidentRadius).toEqual({ center: OUTSIDE_BOTH, radiusMeters: 1500 });
  });

  it("keys on the full country/province/district triple, not distId alone", () => {
    const sameDistIdOtherProvince = area({ id: "OTHER", provId: "11", distId: "1001" });
    const polygonByKey = buildDistrictPolygonIndex([district("1001", SQUARE_A)]); // provId 10

    const result = resolveServiceCenterMatch({
      incident: INSIDE_A,
      areaList: [sameDistIdOtherProvince],
      polygonByKey,
      radiusMeters: 900
    });

    // The province differs, so the polygon must not be borrowed across it.
    expect(result.status).toBe("no-match");
  });
});
