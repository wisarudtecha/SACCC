// The entitlement-coverage guard.
//
// This is a META test: it checks that the codebase can still answer "where is this
// feature enforced?" for every paid feature. It exists because the GIS leak was a missing
// question rather than a broken condition - the gate sat on `AddressMap`, so every GIS
// capability that renders without a map stayed open, and nothing anywhere failed.
//
// Three properties:
//   1. every key in `FEATURE_CATALOG` appears in `FEATURE_SURFACES` (no silent addition);
//   2. every entry either names at least one surface or states why there is none;
//   3. every named path still exists (references rot exactly like documentation does).
import { existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { FEATURE_CATALOG } from "./featureCatalog";
import { FEATURE_SURFACES } from "./featureSurfaces";
import type { EntitlementFeature } from "@/core/types/entitlement";

const REPO_ROOT = process.cwd();

const catalogKeys = Object.keys(FEATURE_CATALOG) as EntitlementFeature[];
const surfaceKeys = Object.keys(FEATURE_SURFACES) as EntitlementFeature[];

describe("entitlement feature surfaces", () => {
  it("documents every catalogued feature", () => {
    const undocumented = catalogKeys.filter((key) => !surfaceKeys.includes(key));

    expect(undocumented).toEqual([]);
  });

  it("does not document a feature that is not in the catalog", () => {
    const orphaned = surfaceKeys.filter((key) => !catalogKeys.includes(key));

    expect(orphaned).toEqual([]);
  });

  it.each(catalogKeys)("%s names a surface or explains why there is none", (key) => {
    const entry = FEATURE_SURFACES[key];

    expect(entry).toBeDefined();
    const hasSurfaces = entry.surfaces.length > 0;
    const hasReason = (entry.noUiSurface ?? "").trim().length > 0;

    // Exactly one of the two: "enforced here" and "nothing to enforce yet" are
    // different claims and must not be mixed, or the reason reads like an excuse.
    expect(hasSurfaces !== hasReason).toBe(true);
  });

  it.each(catalogKeys)("%s lists only paths that still exist", (key) => {
    const missing = FEATURE_SURFACES[key].surfaces
      .map((surface) => surface.path)
      .filter((relativePath) => !existsSync(path.join(REPO_ROOT, relativePath)));

    expect(missing).toEqual([]);
  });

  it("keeps the GIS gate list complete for the surfaces this round added", () => {
    // The specific holes this test suite was written for. A green run above only proves
    // the file EXISTS; this pins that the three capabilities which render without a map
    // are named, so re-introducing an ungated surface means editing this list on purpose.
    const gisPaths = FEATURE_SURFACES["entitlement.gis"].surfaces.map((surface) => surface.path);

    expect(gisPaths).toEqual(
      expect.arrayContaining([
        "src/cms/components/assignOfficer/officerColumns.ts",
        "src/cms/components/assignOfficer/workload/useOfficerRouteSolves.ts",
        "src/cms/components/dashboard/map/CaseAreaChoroplethMap.tsx",
        "src/cms/components/dashboard/map/heatmap/DispatchHeatmap.tsx",
      ])
    );
  });
});
