// Where an anchored overlay (e.g. the undo popup) goes on a map's box.
//
// Pure so the clamping can be tested without a map. The provider projects a
// coordinate to a pixel; this decides whether it is on the map at all and keeps
// the overlay's anchor inside the box so it never sits half under an edge.
export interface AnchorPoint {
  x: number;
  y: number;
}

export interface AnchorBox {
  width: number;
  height: number;
}

export interface AnchorPlacement {
  x: number;
  y: number;
  isVisible: boolean;
}

/** How close to the edge the anchor may be pushed before the overlay is hidden. */
export const ANCHOR_EDGE_MARGIN_PX = 12;

/**
 * Hidden when the point is unprojectable or outside the box: an overlay for
 * someone who has scrolled off-screen would otherwise stick to the border and
 * point at nothing. Visible placements are clamped by `marginPx` so an officer
 * right at the edge still gets a fully readable popup.
 */
export function computeAnchorPlacement(
  point: AnchorPoint | null,
  box: AnchorBox,
  marginPx: number = ANCHOR_EDGE_MARGIN_PX
): AnchorPlacement {
  if (!point || !Number.isFinite(point.x) || !Number.isFinite(point.y)) {
    return { x: 0, y: 0, isVisible: false };
  }
  const isInside =
    point.x >= 0 && point.x <= box.width &&
    point.y >= 0 && point.y <= box.height;
  if (!isInside) {
    return { x: 0, y: 0, isVisible: false };
  }
  return {
    x: Math.min(Math.max(point.x, marginPx), Math.max(marginPx, box.width - marginPx)),
    y: Math.min(Math.max(point.y, marginPx), Math.max(marginPx, box.height - marginPx)),
    isVisible: true
  };
}
