// Per-unit workload + currently-assigned-case data for the officer-assignment
// picker (singleAssignOfficer.tsx).
//
// ─────────────────────────────────────────────────────────────────────────────
// BACKEND CONTRACT — READ BEFORE WIRING TO A LIVE ENDPOINT
// ─────────────────────────────────────────────────────────────────────────────
// No endpoint in this repo today answers "how many / which cases does this unit
// currently hold" — every dispatch endpoint is per-case (`/dispatch/{caseId}/
// units`, `/dispatch/{caseId}/SOP/unit/{unitId}`). This ticket needs ONE bulk,
// per-unit endpoint that takes a batch of unit IDs and returns, for each:
//
//   • activeCaseCount — count of the unit's currently ACTIVE / OPEN assigned
//     cases only. No recently-closed-case window. This is the number rendered as
//     the "Workload" badge (see A1 in the task breakdown — workload and the
//     currently-assigned-case count are the same underlying figure).
//   • cases[]          — the identifiers of those same active cases, so the
//     picker can expand the count into the actual list of case numbers.
//
// Expected shape (the FE is built against `unitWorkloadStub.ts` until this
// lands):
//
//   POST /units/workload
//   request  : { unitIds: string[] }
//   response : ApiResponse<UnitWorkload[]>   // one entry per requested unitId
//
// A unit with no active cases MUST still appear in the array with
// `activeCaseCount: 0` and `cases: []` — an omitted unit is indistinguishable
// from "endpoint doesn't know this unit" on the FE.
//
// GraphQL: if an environment runs with VITE_USE_GRAPHQL="true", this REST `url`
// needs a matching entry in a `graphql/*Queries.ts` file and in `GQL_MAP`
// (`src/core/utils/gqlMapper.ts`) — there is no REST fallback once GraphQL is
// enabled. See CLAUDE.md → "Hybrid REST/GraphQL query layer".
// ─────────────────────────────────────────────────────────────────────────────

/** One active/open case a unit currently holds. */
export interface UnitWorkloadCase {
  /** Stable case identifier. Always present. */
  caseId: string;
  /**
   * Human-facing case number / work-order number shown in the expanded list.
   * Falls back to `caseId` on the FE when the backend omits it.
   */
  caseNumber?: string;
  /** Case status id, if the backend can supply it cheaply. Display-only. */
  statusId?: string;
  /** Case priority, if available. Display-only. */
  priority?: number;
  /** ISO timestamp the case was created, if available. Display-only. */
  createdDate?: string;
}

/** Workload snapshot for a single unit at fetch time. */
export interface UnitWorkload {
  unitId: string;
  /** Count of currently active/open assigned cases. Drives the workload badge. */
  activeCaseCount: number;
  /** The active cases themselves — powers the expand-to-list affordance. */
  cases: UnitWorkloadCase[];
}

/** Request body for the bulk endpoint. */
export interface UnitWorkloadRequest {
  unitIds: string[];
}

function isUnitWorkloadCase(value: unknown): value is UnitWorkloadCase {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  return typeof candidate.caseId === "string";
}

/** True when `value` is the payload shape the bulk endpoint promises. */
export function isUnitWorkloadArray(value: unknown): value is UnitWorkload[] {
  return (
    Array.isArray(value) &&
    value.every((entry) => {
      if (typeof entry !== "object" || entry === null) {
        return false;
      }
      const candidate = entry as Record<string, unknown>;
      return (
        typeof candidate.unitId === "string" &&
        typeof candidate.activeCaseCount === "number" &&
        Array.isArray(candidate.cases) &&
        candidate.cases.every(isUnitWorkloadCase)
      );
    })
  );
}
