// Pins the schema defaults that runtime consumers seed their state from.
//
// Once a value is consumed at runtime (D10/D11 in
// docs/ORG-SETTINGS-Runtime-Wiring-Plan.md), the default IS the behaviour an org
// that never saved settings gets - so a default that quietly disagrees with the
// surface's own hardcoded default flips a layer on for every tenant at deploy
// time. Nothing else in the test suite would notice: the form still renders and
// every value still looks plausible.
import { describe, it, expect } from "vitest";
import { DEFAULT_ORG_MAP_SETTINGS, buildDefaultOrgMapSettings } from "./orgMapSettings";

describe("DEFAULT_ORG_MAP_SETTINGS", () => {
  it("starts every opt-in map layer hidden, like the runtime seeds (D10)", () => {
    // usePlaceLayer.ts `useState(false)`, CaseStaffMapField.tsx
    // `useState(false)` for both the staff layer and the breadcrumb trail.
    expect(DEFAULT_ORG_MAP_SETTINGS.layers.showPlace).toBe(false);
    expect(DEFAULT_ORG_MAP_SETTINGS.staff.showStaff).toBe(false);
    expect(DEFAULT_ORG_MAP_SETTINGS.staff.showTrail).toBe(false);
  });

  it("keeps the basemap controls available by default", () => {
    // Matches AddressMapProps.showBasemapSwitcher's own default (`true`).
    expect(DEFAULT_ORG_MAP_SETTINGS.general.allowMapStyleChange).toBe(true);
    expect(DEFAULT_ORG_MAP_SETTINGS.layers.showSearch).toBe(true);
    expect(DEFAULT_ORG_MAP_SETTINGS.layers.showAddressCoordinates).toBe(true);
    expect(DEFAULT_ORG_MAP_SETTINGS.layers.allowPlaceIncidentPin).toBe(true);
  });

  it("polls staff positions on by default at the existing 60s cadence (D11)", () => {
    // ROSTER_SAFETY_REFETCH_MS in useStaffPositions.ts is 60_000 and always on
    // today; `manual` would remove that safety net for every unconfigured org.
    expect(DEFAULT_ORG_MAP_SETTINGS.staff.tracking).toEqual({
      mode: "auto",
      autoIntervalSeconds: 60,
    });
  });

  it("leaves routing and ETA/TTL manual, matching their current behaviour", () => {
    expect(DEFAULT_ORG_MAP_SETTINGS.staff.routing).toEqual({
      mode: "manual",
      autoIntervalSeconds: null,
    });
    expect(DEFAULT_ORG_MAP_SETTINGS.staff.etaTtl).toEqual({
      mode: "manual",
      autoIntervalSeconds: null,
      applyToAssignmentPicker: true,
    });
  });

  it("gives each org its own copy, so a form edit cannot mutate the default", () => {
    const first = buildDefaultOrgMapSettings("org-a");
    first.staff.tracking.autoIntervalSeconds = 15;
    first.staff.etaTtl.applyToAssignmentPicker = false;

    const second = buildDefaultOrgMapSettings("org-b");
    expect(second.orgId).toBe("org-b");
    expect(second.staff.tracking.autoIntervalSeconds).toBe(60);
    expect(second.staff.etaTtl.applyToAssignmentPicker).toBe(true);
  });
});
