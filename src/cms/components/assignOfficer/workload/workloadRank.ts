// How officers are ranked by workload - the "Recommend" ordering.
//
// One definition, shared by the assign-officer modal and the map's staff filter,
// so the two can never disagree about who the least-loaded officer is. Pure and
// free of React and map SDKs.
//
// Least-loaded first: active-case count ascending, then currently-assigned-case
// list length ascending. ETA/TTL is deliberately NOT a factor (Decision #9), so
// ranking reads only data already in hand and triggers no routing calls.
import type { UnitWorkload } from "@/cms/types/unitWorkload";

export interface WorkloadRank {
  load: number;
  cases: number;
}

/**
 * An officer with no workload entry ranks LAST rather than first: "not loaded
 * yet" or "the endpoint did not return them" must not read as "has no cases".
 */
export function getWorkloadRank(entry: UnitWorkload | undefined): WorkloadRank {
  if (!entry) {
    return { load: Number.POSITIVE_INFINITY, cases: Number.POSITIVE_INFINITY };
  }
  return { load: entry.activeCaseCount, cases: entry.cases.length };
}

/** Sort comparator: negative when `a` is less loaded than `b`. */
export function compareWorkloadRank(a: WorkloadRank, b: WorkloadRank): number {
  if (a.load !== b.load) {
    return a.load - b.load;
  }
  // Explicit equality first: two unranked officers are both Infinity, and
  // Infinity - Infinity is NaN, which a comparator must not return.
  if (a.cases === b.cases) {
    return 0;
  }
  return a.cases - b.cases;
}
