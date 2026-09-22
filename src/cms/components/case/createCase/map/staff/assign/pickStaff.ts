// Which draggable officer is under the pointer? Synchronous, and pure.
//
// The drag start cannot use the layer's async hitTest: ArcGIS only lets a
// handler stop the map panning if it calls stopPropagation() in the same tick as
// the event, so the answer has to be available immediately. The caller projects
// the INDIVIDUAL markers to screen pixels (clustered officers are simply not in
// the list, which is what keeps group circles undraggable) and asks here.
import type { ScreenPoint } from "../staffClusters";

/**
 * How far from an officer's icon a press still counts as grabbing them. The
 * drawn figure is 18-22px, and singles are never closer than
 * STAFF_CLUSTER_RADIUS_PX (38px), so this cannot be ambiguous between two.
 */
export const STAFF_DRAG_PICK_RADIUS_PX = 16;

export interface ScreenStaffCandidate extends ScreenPoint {
  unitId: string;
}

/** The nearest allowed officer within the radius, or null. */
export function pickNearestStaff(
  point: ScreenPoint,
  candidates: readonly ScreenStaffCandidate[],
  allowedUnitIds: ReadonlySet<string>,
  radiusPx: number = STAFF_DRAG_PICK_RADIUS_PX
): string | null {
  let nearestUnitId: string | null = null;
  let nearestDistance = Number.POSITIVE_INFINITY;

  candidates.forEach((candidate) => {
    if (!allowedUnitIds.has(candidate.unitId)) {
      return;
    }
    const distance = Math.hypot(candidate.x - point.x, candidate.y - point.y);
    if (distance <= radiusPx && distance < nearestDistance) {
      nearestUnitId = candidate.unitId;
      nearestDistance = distance;
    }
  });

  return nearestUnitId;
}
