// Which staff the map shows, for the two modes the assign-officer modal offers.
//
// "All Officers" is everyone. "Recommend By Skills" mirrors the modal's
// Recommend view - which ranks officers least-loaded first (see workloadRank.ts;
// despite the label it does not match skills). A list can be ranked, a map cannot,
// so here the ranking becomes a shortlist: the officers already on the case, plus
// the few least-loaded of the rest.
//
// Pure and free of React and map SDKs.
import type { UnitWorkload } from "@/cms/types/unitWorkload";
import { compareWorkloadRank, getWorkloadRank } from "@/cms/components/assignOfficer/workload/workloadRank";
import type { StaffMarker } from "./staffTypes";

export type StaffFilterMode = "recommend" | "all";

/** Recommend By Skills is the default, as in the assign-officer modal's wording. */
export const DEFAULT_STAFF_FILTER_MODE: StaffFilterMode = "recommend";

/** How many unassigned officers "recommend" adds to the ones already assigned. */
export const RECOMMENDED_STAFF_LIMIT = 5;

interface FilterStaffOptions {
  mode: StaffFilterMode;
  staff: readonly StaffMarker[];
  /** Units already on this case - always shown, whatever the mode. */
  assignedUnitIds: ReadonlySet<string>;
  workloadByUnitId: Readonly<Record<string, UnitWorkload>>;
  isWorkloadError: boolean;
}

/**
 * The staff to draw. Order is preserved.
 *
 * Never hides people on missing data: with no workload to rank by (the request
 * failed, or has not answered yet) "recommend" shows everyone, because a shortlist
 * built from nothing would be an arbitrary one.
 */
export function filterStaffForMode({
  mode,
  staff,
  assignedUnitIds,
  workloadByUnitId,
  isWorkloadError
}: FilterStaffOptions): readonly StaffMarker[] {
  if (mode === "all") {
    return staff;
  }
  const hasWorkload = Object.keys(workloadByUnitId).length > 0;
  if (isWorkloadError || !hasWorkload) {
    return staff;
  }

  const shortlist = new Set(
    staff
      .filter((marker) => !assignedUnitIds.has(marker.unitId))
      .sort((a, b) =>
        compareWorkloadRank(
          getWorkloadRank(workloadByUnitId[a.unitId]),
          getWorkloadRank(workloadByUnitId[b.unitId])
        )
      )
      .slice(0, RECOMMENDED_STAFF_LIMIT)
      .map((marker) => marker.unitId)
  );

  return staff.filter(
    (marker) => assignedUnitIds.has(marker.unitId) || shortlist.has(marker.unitId)
  );
}
