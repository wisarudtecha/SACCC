// Deterministic stand-in for the not-yet-built bulk workload endpoint.
//
// Used ONLY when VITE_MOCK_API="true" (see `useUnitWorkloads`). It exists so the
// picker's workload badge, assigned-cases list, and "Recommend" ranking can be
// built and demoed before the backend (`POST /units/workload`, contract in
// `src/cms/types/unitWorkload.ts`) is available. It is NOT wired to any live
// data and MUST NOT be imported by production code paths.
//
// The output is a pure function of the unit id, so a given officer shows the
// same workload every time the modal opens — which keeps the "Recommend"
// ordering stable and demonstrable.
import type { UnitWorkload, UnitWorkloadCase } from "@/cms/types/unitWorkload";

/** Small, fast string hash (djb2). Stable across sessions and machines. */
function hashString(input: string): number {
  let hash = 5381;
  for (let index = 0; index < input.length; index += 1) {
    hash = (hash * 33) ^ input.charCodeAt(index);
  }
  // >>> 0 folds it back into an unsigned 32-bit int.
  return hash >>> 0;
}

/** 0–4 active cases per unit, derived from the id. */
function stubCaseCount(unitId: string): number {
  return hashString(unitId) % 5;
}

function stubCasesFor(unitId: string, count: number): UnitWorkloadCase[] {
  return Array.from({ length: count }, (_, index) => {
    const seed = hashString(`${unitId}:${index}`);
    return {
      caseId: `STUB-${seed.toString(36).toUpperCase()}`,
      caseNumber: `CASE-${(seed % 900000) + 100000}`,
    };
  });
}

/** Mirrors the promised endpoint response for the given unit ids. */
export function buildStubUnitWorkloads(unitIds: readonly string[]): UnitWorkload[] {
  return unitIds.map((unitId) => {
    const activeCaseCount = stubCaseCount(unitId);
    return {
      unitId,
      activeCaseCount,
      cases: stubCasesFor(unitId, activeCaseCount),
    };
  });
}
