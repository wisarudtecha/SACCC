// Who may be dragged onto the case pin to be assigned.
//
// Clustered (group) icons are never draggable, but that is not decided here: the
// provider adapters only start a drag from an INDIVIDUAL marker hit, so a group
// circle never reaches this check. Everything below is about one officer.
import { isStaleLocation, type StaffMarker } from "../staffTypes";

export type DragBlockReason =
  | "assign-not-allowed"
  | "already-assigned"
  | "request-pending"
  | "logged-out"
  | "stale-location";

export interface DragEligibilityContext {
  /** Units already on this case, from the SOP `unitLists`. */
  assignedUnitIds: ReadonlySet<string>;
  /** Units with an assign/undo drag request still in flight or inside its undo window. */
  pendingUnitIds: ReadonlySet<string>;
  /** Same gate as the panel's Assign button (SOP dispatch stage exists). */
  canAssign: boolean;
  nowMs?: number;
}

/** Why this officer cannot be dragged, or null when they can. Most general reason first. */
export function getDragBlockReason(
  marker: StaffMarker,
  context: DragEligibilityContext
): DragBlockReason | null {
  if (!context.canAssign) {
    return "assign-not-allowed";
  }
  if (context.assignedUnitIds.has(marker.unitId)) {
    return "already-assigned";
  }
  if (context.pendingUnitIds.has(marker.unitId)) {
    return "request-pending";
  }
  if (!marker.isLogin) {
    return "logged-out";
  }
  if (isStaleLocation(marker, context.nowMs)) {
    return "stale-location";
  }
  return null;
}

/** The set of unit ids a provider adapter should allow a drag to start from. */
export function getDraggableUnitIds(
  markers: readonly StaffMarker[],
  context: DragEligibilityContext
): Set<string> {
  const draggable = new Set<string>();
  markers.forEach((marker) => {
    if (getDragBlockReason(marker, context) === null) {
      draggable.add(marker.unitId);
    }
  });
  return draggable;
}
