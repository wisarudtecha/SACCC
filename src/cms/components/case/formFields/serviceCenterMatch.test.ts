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

const district = (
  distId: string,
  ring: number[][],
  overrides: Partial<AreaDistrict> = {}
): Partial<AreaDistrict> => ({
  countryId: "TH",
  provId: "10",
  distId,
  active: true,
  coordinates: [ring],
  ...overrides
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
  // Exercises the default path: autoLockOnMatch = true, showRadius = true.
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

  it("matches on a duplicate Area row for the same Service Center (same id, differing only by a stale label)", () => {
    // Real-world case: /area/country_province_districts returned the same
    // Service Center twice with different provinceEn casing ("Bangkok1" vs
    // "BANGKOK") but the same `id`. This must resolve as one match, not an
    // ambiguous one.
    const canonical = area({ id: "166", distId: "1001", provinceEn: "Bangkok1" });
    const duplicateLabel = area({ id: "166", distId: "1001", provinceEn: "BANGKOK" });
    const polygonByKey = buildDistrictPolygonIndex([district("1001", SQUARE_A)]);

    const result = resolveServiceCenterMatch({
      incident: INSIDE_A,
      areaList: [canonical, duplicateLabel],
      polygonByKey,
      radiusMeters: 900
    });

    expect(result.status).toBe("matched");
    expect(result.matchedArea?.id).toBe("166");
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

  it("demotes a lone containing polygon to no-match when autoLockOnMatch is false", () => {
    const areaA = area({ id: "A", distId: "1001" });
    const polygonByKey = buildDistrictPolygonIndex([district("1001", SQUARE_A)]);

    const result = resolveServiceCenterMatch({
      incident: INSIDE_A,
      areaList: [areaA],
      polygonByKey,
      radiusMeters: 900,
      autoLockOnMatch: false
    });

    // The org has turned auto-lock off: the field stays manual and the decision
    // circle is still drawn (showRadius defaults true).
    expect(result.status).toBe("no-match");
    expect(result.matchedArea).toBeNull();
    expect(result.incidentRadius).toEqual({ center: INSIDE_A, radiusMeters: 900 });
  });

  it("suppresses the fallback circle when showRadius is false", () => {
    const areaA = area({ id: "A", distId: "1001" });
    const polygonByKey = buildDistrictPolygonIndex([district("1001", SQUARE_A)]);

    const result = resolveServiceCenterMatch({
      incident: OUTSIDE_BOTH,
      areaList: [areaA],
      polygonByKey,
      radiusMeters: 900,
      showRadius: false
    });

    expect(result.status).toBe("no-match");
    expect(result.incidentRadius).toBeNull();
  });

  it("matches regardless of boundary layer visibility (REQ 1: the map never has to show a polygon for the match to apply)", () => {
    // resolveServiceCenterMatch takes no boundary-visibility input at all - this
    // test locks that invariant in so a future refactor cannot accidentally
    // gate the match on useBoundarySelection's `visibility` state, the way the
    // case map's OTHER polygon controls do since REQ 3/4 (manual-only display).
    const areaA = area({ id: "A", distId: "1001" });
    const polygonByKey = buildDistrictPolygonIndex([district("1001", SQUARE_A)]);

    const result = resolveServiceCenterMatch({
      incident: INSIDE_A,
      areaList: [areaA],
      polygonByKey,
      radiusMeters: 900
    });

    expect(result.status).toBe("matched");
    expect(result.matchedArea?.id).toBe("A");
  });

  it("excludes an inactive Area even when its polygon contains the incident", () => {
    const retiredArea = area({ id: "A", distId: "1001", districtActive: false });
    const polygonByKey = buildDistrictPolygonIndex([district("1001", SQUARE_A)]);

    const result = resolveServiceCenterMatch({
      incident: INSIDE_A,
      areaList: [retiredArea],
      polygonByKey,
      radiusMeters: 900
    });

    // A deactivated Service Center must never be silently adopted.
    expect(result.status).toBe("no-match");
    expect(result.matchedArea).toBeNull();
  });

  it("excludes an inactive district row from the polygon index, even for an active Area", () => {
    const areaA = area({ id: "A", distId: "1001" });
    const polygonByKey = buildDistrictPolygonIndex([district("1001", SQUARE_A, { active: false })]);

    const result = resolveServiceCenterMatch({
      incident: INSIDE_A,
      areaList: [areaA],
      polygonByKey,
      radiusMeters: 900
    });

    // The active Area has no geometry of its own to borrow from the retired row.
    expect(result.status).toBe("no-match");
  });

  it("matches the active district when an old, retired boundary overlaps it at the same point", () => {
    const retiredArea = area({ id: "OLD", distId: "1001", districtActive: false });
    const activeArea = area({ id: "NEW", distId: "1002" });
    // Both districts carry the same footprint (the org redrew 1001 as 1002
    // without deleting the old row), so a naive containment test would see two
    // matches and fall back to no-match. Only the active one should count.
    const polygonByKey = buildDistrictPolygonIndex([
      district("1001", SQUARE_A, { active: false }),
      district("1002", SQUARE_A)
    ]);

    const result = resolveServiceCenterMatch({
      incident: INSIDE_A,
      areaList: [retiredArea, activeArea],
      polygonByKey,
      radiusMeters: 900
    });

    expect(result.status).toBe("matched");
    expect(result.matchedArea?.id).toBe("NEW");
  });

  it("composes both suppressions: no lock and no circle", () => {
    const areaA = area({ id: "A", distId: "1001" });
    const polygonByKey = buildDistrictPolygonIndex([district("1001", SQUARE_A)]);

    const result = resolveServiceCenterMatch({
      incident: INSIDE_A,
      areaList: [areaA],
      polygonByKey,
      radiusMeters: 900,
      showRadius: false,
      autoLockOnMatch: false
    });

    expect(result.status).toBe("no-match");
    expect(result.matchedArea).toBeNull();
    expect(result.incidentRadius).toBeNull();
  });
});
