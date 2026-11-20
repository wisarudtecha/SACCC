// src/cms/components/assignOfficer/officerColumns.test.ts
//
// Pins the capability rules of the assignment picker's officer table.
//
// The regression behind these tests: the ETA/TTL column rendered for every tenant,
// including one with no GIS add-on, because the column list was hardcoded. The column
// is a driving-route solve against a paid provider, so "not purchased" has to hide it -
// and the org-level switches have to be able to narrow it further, which they could not
// before because nothing read them.
import { describe, expect, it } from "vitest";
import {
  resolveOfficerColumns,
  type OfficerPickerCapabilities,
} from "./officerColumns";

const ALL_ON: OfficerPickerCapabilities = {
  hasGis: true,
  showWorkload: true,
  showAssignedCases: true,
  showRecommendRanking: true,
  etaTtlInPicker: true,
};

const visibleIds = (capabilities: OfficerPickerCapabilities) =>
  resolveOfficerColumns(capabilities).columns.map((column) => column.id);

describe("resolveOfficerColumns", () => {
  it("renders all seven columns when the tenant has GIS and every org switch is on", () => {
    const resolved = resolveOfficerColumns(ALL_ON);

    expect(resolved.columns.map((column) => column.id)).toEqual([
      "name",
      "status",
      "area",
      "skills",
      "workload",
      "assignedCases",
      "etaTtl",
    ]);
    expect(resolved.gridTemplateColumns).toBe("15% 11% 13% 15% 12% 14% 20%");
    expect(resolved.showEtaTtl).toBe(true);
  });

  it("drops the ETA/TTL column for a tenant with no GIS add-on", () => {
    const resolved = resolveOfficerColumns({ ...ALL_ON, hasGis: false });

    expect(visibleIds({ ...ALL_ON, hasGis: false })).not.toContain("etaTtl");
    expect(resolved.showEtaTtl).toBe(false);
    // The six columns that are not GIS keep rendering - losing the map must not cost
    // the dispatcher the workload and assigned-case counts they assign by.
    expect(resolved.columns).toHaveLength(6);
    expect(resolved.gridTemplateColumns).toBe("15% 11% 13% 15% 12% 14%");
  });

  it("drops the ETA/TTL column when the org switch turns it off for the picker, even if GIS is owned", () => {
    const resolved = resolveOfficerColumns({ ...ALL_ON, etaTtlInPicker: false });

    expect(resolved.showEtaTtl).toBe(false);
    expect(resolved.columns.map((column) => column.id)).not.toContain("etaTtl");
  });

  it("never shows ETA/TTL when GIS is missing, whatever the org switch says", () => {
    const resolved = resolveOfficerColumns({
      ...ALL_ON,
      hasGis: false,
      etaTtlInPicker: true,
    });

    expect(resolved.showEtaTtl).toBe(false);
  });

  it("honours the assignment switches for workload, assigned cases and the Recommend ranking", () => {
    const resolved = resolveOfficerColumns({
      ...ALL_ON,
      showWorkload: false,
      showAssignedCases: false,
      showRecommendRanking: false,
    });

    expect(resolved.columns.map((column) => column.id)).toEqual([
      "name",
      "status",
      "area",
      "skills",
      "etaTtl",
    ]);
    expect(resolved.showWorkload).toBe(false);
    expect(resolved.showAssignedCases).toBe(false);
    expect(resolved.showRecommendRanking).toBe(false);
    expect(resolved.gridTemplateColumns).toBe("15% 11% 13% 15% 20%");
  });

  it("keeps the four identity columns when every switch is off", () => {
    const resolved = resolveOfficerColumns({
      hasGis: false,
      showWorkload: false,
      showAssignedCases: false,
      showRecommendRanking: false,
      etaTtlInPicker: false,
    });

    expect(resolved.columns.map((column) => column.id)).toEqual([
      "name",
      "status",
      "area",
      "skills",
    ]);
    // Never empty: the table would have no header at all.
    expect(resolved.columns.length).toBeGreaterThan(0);
  });

  it("keeps one grid track per visible column, so header and rows cannot drift", () => {
    const resolved = resolveOfficerColumns({ ...ALL_ON, showWorkload: false });

    expect(resolved.gridTemplateColumns.split(" ")).toHaveLength(
      resolved.columns.length
    );
  });
});
