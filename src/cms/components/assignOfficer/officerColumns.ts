// The column set of the assignment picker's officer table.
//
// Why this is a module of its own: the table's header and every row have to stay in
// lockstep, so "which columns exist" is one decision, not seven conditionals. Before
// this file existed the 7 columns were a hardcoded Tailwind class
// (`grid-cols-[15%_11%_13%_15%_12%_14%_20%]`) plus two disjoint JSX blocks, which is
// exactly how the ETA/TTL column went on rendering for a tenant with no GIS: nothing
// asked the entitlement question, because nothing owned the column list.
//
// The capability rules encoded here:
//   * `etaTtl` needs the GIS add-on (`entitlement.gis`) AND the org's
//     `staff.etaTtl.applyToAssignmentPicker` switch. The column solves a driving route
//     through a paid provider, so the tenant's purchase decides first and the org
//     setting can only narrow it further - never the other way round.
//   * `workload` / `assignedCases` / the "Recommend" ranking are NOT GIS: they are
//     counts that ride the roster payload, so they answer only to the org's
//     `assignment.*` switches.
//   * Name, status, area and skills are always present; a table without them would not
//     be an officer list. Keeping them unconditional is also what makes the "at least
//     one column" invariant trivial.
//
// Every column therefore carries an `isEnabled` predicate instead of the caller
// carrying `if`s: a new column cannot be added without answering "when is this shown?".

export type OfficerColumnId =
  | "name"
  | "status"
  | "area"
  | "skills"
  | "workload"
  | "assignedCases"
  | "etaTtl";

export interface OfficerColumn {
  id: OfficerColumnId;
  /** i18n key for the header label. */
  labelKey: string;
  /** CSS grid track. Header and rows both read it, so the two cannot drift. */
  width: string;
  /**
   * Wrapper class for this column's cell, for the columns whose cell needs something
   * other than the default centred flex row (the name cell is inset by `mx-4`, the area
   * cell is muted). Kept next to the column so a row can be rendered from the column
   * list alone.
   */
  cellClass?: string;
}

/**
 * Everything that decides the column set. All of it comes from outside this module:
 * `hasGis` from `useEntitlements().hasFeature("entitlement.gis")`, the rest from
 * `useOrgMapSettings().loaded`.
 */
export interface OfficerPickerCapabilities {
  /**
   * True only when the tenant actually owns `entitlement.gis`. Callers pass
   * `hasFeature(...)`, which is fail-closed while entitlements load - never
   * `!isLocked(...)`, which is fail-open and would briefly grant the column.
   */
  hasGis: boolean;
  /** `OrgMapSettings.assignment.showWorkload` - the active-case-count column. */
  showWorkload: boolean;
  /** `OrgMapSettings.assignment.showAssignedCases` - the assigned-cases column. */
  showAssignedCases: boolean;
  /** `OrgMapSettings.assignment.enableRecommendRanking` - the "Recommend" view toggle. */
  showRecommendRanking: boolean;
  /**
   * `OrgMapSettings.staff.etaTtl.applyToAssignmentPicker` - an admin switch that keeps
   * ETA/TTL on the map staff panel while turning it off in this picker.
   */
  etaTtlInPicker: boolean;
}

export interface ResolvedOfficerColumns {
  /** Visible columns, in render order. Never empty. */
  columns: OfficerColumn[];
  /** Ready-to-use `gridTemplateColumns`, derived from the visible columns. */
  gridTemplateColumns: string;
  /** Convenience flags for callers that must also skip work (see `showEtaTtl`). */
  showEtaTtl: boolean;
  showWorkload: boolean;
  showAssignedCases: boolean;
  showRecommendRanking: boolean;
}

interface OfficerColumnDefinition {
  column: OfficerColumn;
  isEnabled: (capabilities: OfficerPickerCapabilities) => boolean;
}

/**
 * The table, in render order. The four identity columns come first and are always on;
 * the capability-dependent ones follow, widest-justified column last.
 */
const COLUMN_DEFINITIONS: OfficerColumnDefinition[] = [
  {
    column: {
      id: "name",
      labelKey: "case.assign_officer_modal.name",
      width: "15%",
      cellClass: "flex items-center mx-4 space-x-2",
    },
    isEnabled: () => true,
  },
  {
    column: { id: "status", labelKey: "case.assign_officer_modal.status", width: "11%" },
    isEnabled: () => true,
  },
  {
    column: {
      id: "area",
      labelKey: "case.assign_officer_modal.area",
      width: "13%",
      cellClass: "flex items-center justify-center text-gray-600 dark:text-gray-300",
    },
    isEnabled: () => true,
  },
  {
    column: { id: "skills", labelKey: "case.assign_officer_modal.skills", width: "15%" },
    isEnabled: () => true,
  },
  {
    column: {
      id: "workload",
      labelKey: "case.assign_officer_modal.workloads",
      width: "12%",
    },
    isEnabled: (capabilities) => capabilities.showWorkload,
  },
  {
    column: {
      id: "assignedCases",
      labelKey: "case.assign_officer_modal.assigned_cases",
      width: "14%",
    },
    isEnabled: (capabilities) => capabilities.showAssignedCases,
  },
  {
    column: {
      id: "etaTtl",
      labelKey: "case.assign_officer_modal.eta_ttl",
      width: "20%",
    },
    // `entitlement.gis` AND the org's picker switch; the entitlement is the outer gate.
    isEnabled: (capabilities) =>
      capabilities.hasGis && capabilities.etaTtlInPicker,
  },
];

export function resolveOfficerColumns(
  capabilities: OfficerPickerCapabilities
): ResolvedOfficerColumns {
  const columns = COLUMN_DEFINITIONS.filter((definition) =>
    definition.isEnabled(capabilities)
  ).map((definition) => definition.column);

  return {
    columns,
    gridTemplateColumns: columns.map((column) => column.width).join(" "),
    showEtaTtl: columns.some((column) => column.id === "etaTtl"),
    showWorkload: capabilities.showWorkload,
    showAssignedCases: capabilities.showAssignedCases,
    showRecommendRanking: capabilities.showRecommendRanking,
  };
}
