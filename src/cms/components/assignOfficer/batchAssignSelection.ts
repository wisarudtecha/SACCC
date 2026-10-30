// Shared selection rules for batch dispatch - assigning several staff to one
// case in a single operation - used by BOTH the assign-officer table modal
// (singleAssignOfficer.tsx) and the map's staff group panel (StaffGroupPanel),
// so the two views cannot drift apart.
//
// IMPORTANT (documented intent): batch dispatch deliberately reuses the
// existing single-assignment endpoint (POST /dispatch/event via
// postDispacthMutation in store/api/dispatch.ts) - one request per selected
// officer, sent sequentially. The team has reviewed and accepted the
// N-request cost for the current scale. A dedicated batch-assignment endpoint
// is a future intent only and is NOT prioritized for the near term; do not
// add one without re-opening that decision.

/** Hard cap on how many staff may be selected for one batch assignment. */
export const MAX_BATCH_ASSIGN_OFFICERS = 5;

/**
 * True while another officer may still be checked. Once the cap is reached the
 * row checkboxes of unselected officers go disabled, and checking has to start
 * with unchecking something.
 */
export function canSelectMore(selectedCount: number): boolean {
  return selectedCount < MAX_BATCH_ASSIGN_OFFICERS;
}

/**
 * "Select All" may only act on a list small enough to take in one go. When the
 * selectable list is larger than the cap the checkbox renders disabled rather
 * than silently selecting a partial slice, which would look like "all".
 */
export function isSelectAllDisabled(selectableCount: number): boolean {
  return selectableCount > MAX_BATCH_ASSIGN_OFFICERS;
}

/**
 * Reconciles a selection against the CURRENT staff list, for whenever that
 * list changes (refetch, filter, reassignment): a selected officer who is no
 * longer selectable drops out of the selection, and a selection that somehow
 * exceeds the cap is trimmed back to it (first-come stays selected).
 *
 * Returns the same array contents when nothing changes is not guaranteed, but
 * callers should treat the result as immutable either way.
 */
export function pruneSelection(
  selectedIds: readonly string[],
  selectableIds: ReadonlySet<string>
): string[] {
  const kept = selectedIds.filter((id) => selectableIds.has(id));
  return kept.length > MAX_BATCH_ASSIGN_OFFICERS
    ? kept.slice(0, MAX_BATCH_ASSIGN_OFFICERS)
    : kept;
}
