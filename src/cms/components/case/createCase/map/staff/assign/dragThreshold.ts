// How far a press must travel before it counts as a drag rather than a click.
//
// Without it, every click on an officer would be a zero-length drag: the map
// would stop panning, a ghost would flash up, and selecting someone would depend
// on how steady the user's hand was. Below the threshold nothing is claimed, so
// a plain click keeps meaning "select this officer".
import type { ScreenPoint } from "../staffClusters";

export const DRAG_START_THRESHOLD_PX = 5;

/** True once the pointer is MORE than `thresholdPx` from where it went down. */
export function hasMovedPastThreshold(
  start: ScreenPoint,
  current: ScreenPoint,
  thresholdPx: number = DRAG_START_THRESHOLD_PX
): boolean {
  return Math.hypot(current.x - start.x, current.y - start.y) > thresholdPx;
}
