// Adapt the workload data embedded in the getUnit response (`Unit.workloadCount` /
// `Unit.workloadCases`) to the `UnitWorkload` shape the workload UI already
// consumes — workloadRank, OfficerWorkloadCell, OfficerAssignedCasesCell and the
// map's staffFilter. This is the replacement data path for the disconnected
// bulk endpoint (POST /units/workload via useUnitWorkloads — left in place, no
// longer called); workload now rides the same roster fetch, so there is no
// second network call.
//
// All validation is by SHAPE, never truthiness (see CODEBUDDY.md on the
// envelope rule: a resolved response can carry a truthy-but-empty payload).
// A missing or invalid field degrades to "no workload data" (undefined) and
// never throws — the roster keeps rendering whatever the units response says
// about workload, one officer at a time.
import type { UnitWithWorkload } from "@/cms/types/dispatch";
import type { UnitWorkload, UnitWorkloadCase } from "@/cms/types/unitWorkload";

/**
 * What the preview's fallback fetch (getCaseByIdMutation) can contribute — the
 * `Case` response restricted to the fields the preview shows. Structural: the
 * real `Case` type satisfies it without adaptation.
 */
export interface CasePreviewRemote {
  caseId?: string;
  statusId?: string;
  priority?: number;
  createdDate?: string;
}

/** The fields the Case Preview popover renders. caseId is always present. */
export interface CasePreviewFields {
  caseId: string;
  caseNumber?: string;
  statusId?: string;
  priority?: number;
  createdDate?: string;
}

function isUnitWorkloadCase(value: unknown): value is UnitWorkloadCase {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  return typeof candidate.caseId === "string" && candidate.caseId.length > 0;
}

/** Invalid entries are dropped, not fatal: one bad element must not hide the rest. */
function sanitizeCases(value: unknown): UnitWorkloadCase[] {
  return Array.isArray(value) ? value.filter(isUnitWorkloadCase) : [];
}

/**
 * One unit's embedded workload, or undefined when neither field is usable.
 *
 * A valid `workloadCases` array is enough on its own (count falls back to its
 * sanitized length); a `workloadCount` alone also stands (empty case list). Only
 * a missing count AND a non-array `workloadCases` read as "no data".
 */
export function toUnitWorkload(unit: UnitWithWorkload): UnitWorkload | undefined {
  const hasCasesArray = Array.isArray(unit.workloadCases);
  const cases = sanitizeCases(unit.workloadCases);
  const count =
    typeof unit.workloadCount === "number" && Number.isFinite(unit.workloadCount) && unit.workloadCount >= 0
      ? unit.workloadCount
      : hasCasesArray
        ? cases.length
        : undefined;
  if (count === undefined) {
    return undefined;
  }
  return { unitId: unit.unitId, activeCaseCount: count, cases };
}

/** The whole roster in one pass — the map every workload consumer reads. */
export function buildWorkloadByUnitId(
  units: readonly UnitWithWorkload[] | undefined
): Readonly<Record<string, UnitWorkload>> {
  const byUnitId: Record<string, UnitWorkload> = {};
  (units ?? []).forEach((unit) => {
    const workload = toUnitWorkload(unit);
    if (workload) {
      byUnitId[unit.unitId] = workload;
    }
  });
  return byUnitId;
}

/**
 * True when the embedded entry is bare — only a caseId, nothing else to show.
 * This is the sole condition for the preview's fallback fetch
 * (getCaseByIdMutation, `/case/caseId/{id}`); an entry carrying any display
 * field renders straight from the roster data, no extra request.
 */
export function needsCaseFetch(entry: UnitWorkloadCase): boolean {
  return (
    entry.caseNumber === undefined &&
    entry.statusId === undefined &&
    entry.priority === undefined &&
    entry.createdDate === undefined
  );
}

/**
 * The preview's fields: embedded entry first, fetched case filling the gaps.
 * `??` (not `||`) throughout — priority 0 and empty-ish strings are real values.
 */
export function resolveCasePreviewFields(
  entry: UnitWorkloadCase,
  remote?: CasePreviewRemote | null
): CasePreviewFields {
  return {
    caseId: entry.caseId,
    caseNumber: entry.caseNumber,
    statusId: entry.statusId ?? remote?.statusId,
    priority: entry.priority ?? remote?.priority,
    createdDate: entry.createdDate ?? remote?.createdDate
  };
}
