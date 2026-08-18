// Presentation helpers shared by the two staff cards.
//
// The detail panel and the group picker show the same officer in two places -
// initials in an avatar, and the exact status name beside the availability dot.
// Both read from here so they cannot drift apart, which is the whole reason a
// dispatcher trusts one against the other.
import type { Language } from "@/core/config/i18n";
import type { CaseStatusInterface } from "@/cms/components/ui/status/status";
import type { UnitStatus } from "@/cms/types/unit";

export function getStaffInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map((word) => word[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

/**
 * The unit status catalogue, cached by CaseApiManager's fetchUnitStatus.
 *
 * Returns [] rather than throwing when the cache is missing or malformed: a
 * status name is a label, and losing it should cost a dash on screen, not the
 * card it sits in.
 */
export function readUnitStatuses(): UnitStatus[] {
  try {
    return JSON.parse(localStorage.getItem("unit_status") ?? "[]") as UnitStatus[];
  }
  catch {
    return [];
  }
}

export function getUnitStatusName(statuses: readonly UnitStatus[], statusId: string): string {
  return statuses.find((status) => status.sttId.includes(statusId))?.sttName ?? "-";
}

/**
 * The case status catalogue, cached by CaseApiManager's fetchCaseStatus. A
 * DIFFERENT code space from unit_status above: this is a workflow/SOP action
 * id (what a CaseSopUnit.statusId actually carries), not a unit's global duty
 * status - the two catalogues are not interchangeable.
 */
export function readCaseStatuses(): CaseStatusInterface[] {
  try {
    return JSON.parse(localStorage.getItem("caseStatus") ?? "[]") as CaseStatusInterface[];
  }
  catch {
    return [];
  }
}

/** Exact match, unlike getUnitStatusName's `.includes()` - a different catalogue, a different rule. */
export function getCaseStatusName(
  statuses: readonly CaseStatusInterface[],
  statusId: string,
  language: Language
): string {
  const match = statuses.find((status) => status.statusId === statusId);
  return (language === "th" ? match?.th : match?.en) ?? "-";
}
