// Did a staff drag end on the case pin?
//
// Provider-agnostic on purpose: each adapter converts the pointer position and
// the pin's position to screen pixels in its own way, then asks this one
// question, so "close enough" means the same thing on all three maps.
import type { ScreenPoint } from "../staffClusters";

/**
 * How near the drop must be to the pin's anchor. Roughly the pin's own size plus
 * a fingertip of slack, so a drop that visibly lands on the pin counts.
 */
export const PIN_DROP_RADIUS_PX = 28;

export function isDropOnPin(
  drop: ScreenPoint,
  pin: ScreenPoint,
  radiusPx: number = PIN_DROP_RADIUS_PX
): boolean {
  return Math.hypot(drop.x - pin.x, drop.y - pin.y) <= radiusPx;
}
