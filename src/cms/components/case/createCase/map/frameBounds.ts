// Framing math for "show all of these points in one view".
//
// Pure and free of any map SDK, so a provider only has to supply the projection
// and the "go to this box" call. Works in a planar coordinate space (the ArcGIS
// map passes Web Mercator metres), where a straight line on screen is a straight
// line in the numbers and pixel sizes scale linearly.
//
// The reason this exists rather than "go to the points' extent": the large map
// docks cards over its left edge, and an extent fitted to the whole view would
// put the leftmost point underneath one. The box returned here is chosen so the
// points land in the part of the view that is actually visible.
import { MAX_MERCATOR_EXTENT_M } from "./webMercator";

export interface PlanarPoint {
  x: number;
  y: number;
}

export interface PlanarBounds {
  xmin: number;
  ymin: number;
  xmax: number;
  ymax: number;
}

export interface ViewportSize {
  width: number;
  height: number;
}

/** Pixels of the view that are covered or unusable on each side. */
export interface FrameInsets {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

export const NO_INSETS: FrameInsets = { left: 0, top: 0, right: 0, bottom: 0 };

/** Where the view is centred and how much ground one pixel covers - see computeFrameView. */
export interface FrameView {
  center: PlanarPoint;
  unitsPerPixel: number;
}

/**
 * Smallest span (in the planar units) the points are ever framed within. Without
 * it a pin and a responder at the same spot would ask for an infinite zoom.
 */
export const MIN_FRAME_SPAN = 400;

const DEFAULT_MIN_SPAN = MIN_FRAME_SPAN;

/**
 * The camera that shows every point inside the uncovered part of the view: where
 * the view is centred, and how many planar units one pixel spans.
 *
 * This is the form a provider that positions by centre + zoom needs (Longdo);
 * providers that fit a box use computeFramedBounds, built on it. Returns null
 * when there is nothing to frame. Insets that leave no usable area are ignored
 * rather than trusted, so a tiny window still gets a sensible frame.
 */
export function computeFrameView(
  points: readonly PlanarPoint[],
  viewport: ViewportSize,
  insets: FrameInsets = NO_INSETS,
  minSpan: number = DEFAULT_MIN_SPAN
): FrameView | null {
  if (points.length === 0 || viewport.width <= 0 || viewport.height <= 0) {
    return null;
  }

  const xs = points.map((point) => point.x);
  const ys = points.map((point) => point.y);
  const centerX = (Math.min(...xs) + Math.max(...xs)) / 2;
  const centerY = (Math.min(...ys) + Math.max(...ys)) / 2;
  const spanX = Math.max(Math.max(...xs) - Math.min(...xs), minSpan);
  const spanY = Math.max(Math.max(...ys) - Math.min(...ys), minSpan);

  const usableWidth = viewport.width - insets.left - insets.right;
  const usableHeight = viewport.height - insets.top - insets.bottom;
  const hasUsableArea = usableWidth > 0 && usableHeight > 0;
  const effectiveInsets = hasUsableArea ? insets : NO_INSETS;
  const effectiveWidth = hasUsableArea ? usableWidth : viewport.width;
  const effectiveHeight = hasUsableArea ? usableHeight : viewport.height;

  // Planar units per pixel: the coarser of the two axes, so both fit.
  const unitsPerPixel = Math.max(spanX / effectiveWidth, spanY / effectiveHeight);

  // The uncovered region's centre sits off the view's centre by half the
  // difference of its insets. Screen y grows downward and world y grows upward,
  // hence the opposite signs.
  const offsetX = (effectiveInsets.left - effectiveInsets.right) / 2;
  const offsetY = (effectiveInsets.top - effectiveInsets.bottom) / 2;
  return {
    center: {
      x: centerX - offsetX * unitsPerPixel,
      y: centerY + offsetY * unitsPerPixel
    },
    unitsPerPixel
  };
}

/**
 * The view bounds that show every point inside the uncovered part of the view.
 *
 * The result has the viewport's own aspect ratio, so a `goTo(bounds)` neither
 * crops nor re-fits it differently. Returns null when there is nothing to frame.
 */
export function computeFramedBounds(
  points: readonly PlanarPoint[],
  viewport: ViewportSize,
  insets: FrameInsets = NO_INSETS,
  minSpan: number = DEFAULT_MIN_SPAN
): PlanarBounds | null {
  const view = computeFrameView(points, viewport, insets, minSpan);
  if (!view) {
    return null;
  }
  const halfWidth = (viewport.width * view.unitsPerPixel) / 2;
  const halfHeight = (viewport.height * view.unitsPerPixel) / 2;
  return {
    xmin: view.center.x - halfWidth,
    xmax: view.center.x + halfWidth,
    ymin: view.center.y - halfHeight,
    ymax: view.center.y + halfHeight
  };
}

/** Tile size the Web Mercator zoom scale below is defined against. */
const TILE_SIZE_PX = 256;

/**
 * Furthest a frame ever zooms in. Only matters when every point is at (almost)
 * the same place, where "fit them all" has no natural stopping point.
 */
export const FRAME_MAX_ZOOM = 17;

/**
 * The (fractional) Web Mercator zoom at which one pixel spans `unitsPerPixel`
 * metres. The inverse of the scale ladder: each zoom level halves it, and zoom 0
 * fits the whole world in one 256px tile.
 */
export function zoomForUnitsPerPixel(unitsPerPixel: number): number {
  return Math.log2((2 * MAX_MERCATOR_EXTENT_M) / (TILE_SIZE_PX * unitsPerPixel));
}

/** Least usable area, in pixels, an inset set is allowed to leave on either axis. */
const MIN_USABLE_PX = 120;

/**
 * Insets a fit-to-bounds call can actually honour.
 *
 * MapLibre's `fitBounds` gives up silently when the padding leaves no room, and a
 * narrow window with both cards open does exactly that. Where an axis would fall
 * under a minimum usable size the insets on it are scaled down together, keeping
 * their proportions, so the fit still happens - just with less room reserved.
 */
export function clampInsets(insets: FrameInsets, viewport: ViewportSize): FrameInsets {
  const shrinkAxis = (start: number, end: number, size: number): [number, number] => {
    const usable = size - start - end;
    if (usable >= MIN_USABLE_PX || start + end <= 0) {
      return [start, end];
    }
    const allowance = Math.max(size - MIN_USABLE_PX, 0);
    const scale = allowance / (start + end);
    return [start * scale, end * scale];
  };
  const [left, right] = shrinkAxis(insets.left, insets.right, viewport.width);
  const [top, bottom] = shrinkAxis(insets.top, insets.bottom, viewport.height);
  return { left, top, right, bottom };
}

/** Width of one docked map card, matching the `sm:w-72` the panels use. */
export const DOCKED_CARD_WIDTH_PX = 288;
/** A card collapsed to its header, matching the `w-48` the panels use. */
export const DOCKED_CARD_COLLAPSED_WIDTH_PX = 192;
/** Gap between docked cards, and the dock's own distance from the map's left edge. */
export const DOCK_GAP_PX = 8;
export const DOCK_EDGE_PX = 8;

interface DockedCardsState {
  isCasePanelOpen: boolean;
  isCasePanelCollapsed: boolean;
  /** Whether a staff card sits beside it. Assumed expanded: its collapse state is its own. */
  hasStaffCard: boolean;
}

/**
 * How much of the map's left edge the docked cards cover, in pixels - the `left`
 * inset to frame around. Zero when no card is showing.
 */
export function dockedCardsWidthPx({
  isCasePanelOpen,
  isCasePanelCollapsed,
  hasStaffCard
}: DockedCardsState): number {
  const widths: number[] = [];
  if (isCasePanelOpen) {
    widths.push(isCasePanelCollapsed ? DOCKED_CARD_COLLAPSED_WIDTH_PX : DOCKED_CARD_WIDTH_PX);
  }
  if (hasStaffCard) {
    widths.push(DOCKED_CARD_WIDTH_PX);
  }
  if (widths.length === 0) {
    return 0;
  }
  const gaps = (widths.length - 1) * DOCK_GAP_PX;
  return DOCK_EDGE_PX + widths.reduce((sum, width) => sum + width, 0) + gaps;
}
