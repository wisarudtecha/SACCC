// The staff symbols, drawn as SVG for Longdo's HTML marker icons.
//
// Same symbols as the ArcGIS side - same silhouette, same three operational
// colours, same sizes and alphas, all taken from STAFF_SYMBOL_TOKENS so the two
// renderers cannot drift. What changes is the medium, and it allows one real
// simplification: ArcGIS needs three stacked graphics for a selected officer
// (halo, chevron, figure) because an Esri marker symbol is a single shape. An
// SVG icon is a drawing, so all three go in one node - no draw-order juggling,
// and the halo cannot end up under the wrong marker.
//
// ANCHORING is the thing to get right. Longdo positions an HTML icon by its
// top-left corner, so every icon here declares an `offset` that puts the
// officer's REPORTED POSITION at the correct point inside the drawing:
//   - a person stands ON their position, so the figure's feet sit at the anchor
//     (this is what ArcGIS expresses as `yoffset: size / 2`);
//   - a halo is a spotlight on the ground, so it is centred on the anchor;
//   - a group circle marks an area several officers share rather than someone
//     standing at a spot, so it too is centred.
//
// HIT AREA follows the canvas, not the ink: the icon is a real DOM element, so
// a canvas larger than the symbol would swallow map clicks around it. Each
// state therefore gets the smallest canvas that fits what it draws.
import {
  STAFF_SYMBOL_TOKENS as TOKENS,
  getAvailabilityRgb,
  getGroupSize,
  type StaffAvailability
} from "../../staff/staffSymbols";
import type { LongdoMarkerOptions } from "../longdoApi";

type Rgb = readonly [number, number, number];

function rgba(rgb: Rgb, alpha: number): string {
  return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})`;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * The icon wrapper.
 *
 * `name` becomes an SVG <title>, which the browser shows as a tooltip. The
 * marker option of the same name is deliberately NOT used: Longdo builds its own
 * popup from `title`/`detail`, and a vendor popup opening on click would compete
 * with the app's StaffDetailPanel for the same gesture.
 */
function svg(size: number, body: string, name: string): string {
  return (
    `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" ` +
    `xmlns="http://www.w3.org/2000/svg" style="overflow:visible;cursor:pointer">` +
    (name ? `<title>${escapeXml(name)}</title>` : "") +
    `${body}</svg>`
  );
}

/**
 * The person silhouette, scaled from its 24x24 authoring box and placed so its
 * feet land on (`anchorX`, `anchorY`).
 */
function figure(anchorX: number, anchorY: number, size: number, fill: string, outlineAlpha: number, strokeWidth: number): string {
  const scale = size / TOKENS.viewBox;
  return (
    `<g transform="translate(${anchorX - size / 2}, ${anchorY - size}) scale(${scale})">` +
    `<path d="${TOKENS.markerPath}" fill="${fill}" ` +
    `stroke="rgba(255, 255, 255, ${outlineAlpha})" stroke-width="${strokeWidth / scale}" ` +
    `stroke-linejoin="round" /></g>`
  );
}

function halo(centreX: number, centreY: number, diameter: number, rgb: Rgb): string {
  return (
    `<circle cx="${centreX}" cy="${centreY}" r="${diameter / 2 - 1}" ` +
    `fill="${rgba(rgb, TOKENS.haloFillAlpha)}" ` +
    `stroke="${rgba(rgb, TOKENS.haloOutlineAlpha)}" stroke-width="1.5" />`
  );
}

/**
 * The direction-of-travel chevron, on the halo ring, pointing along `bearing`.
 *
 * The chevron is authored pointing UP, and a compass bearing is measured
 * clockwise from north, so an SVG `rotate(bearing)` about the chevron's own
 * centre points it correctly with no conversion. Its position on the ring uses
 * sin/-cos rather than the sin/cos the ArcGIS symbol uses, because SVG's y axis
 * grows DOWNWARD while Esri's screen offsets grow upward.
 */
function chevron(centreX: number, centreY: number, bearingDegrees: number, fill: string): string {
  const radians = (bearingDegrees * Math.PI) / 180;
  const size = TOKENS.headingSize;
  const x = centreX + TOKENS.headingOrbitPx * Math.sin(radians);
  const y = centreY - TOKENS.headingOrbitPx * Math.cos(radians);
  const scale = size / TOKENS.viewBox;

  return (
    `<g transform="translate(${x}, ${y}) rotate(${bearingDegrees}) ` +
    `translate(${-size / 2}, ${-size / 2}) scale(${scale})">` +
    `<path d="${TOKENS.chevronPath}" fill="${fill}" ` +
    `stroke="rgba(255, 255, 255, 1)" stroke-width="${1 / scale}" ` +
    `stroke-linejoin="round" /></g>`
  );
}

export interface StaffMarkerIconState {
  availability: StaffAvailability;
  isSelected: boolean;
  isStale: boolean;
  isLogin: boolean;
  /** Compass degrees, or null when no honest arrow can be drawn. */
  bearing: number | null;
}

/**
 * Marker options for one officer.
 *
 * A stale or logged-out officer keeps its colour but loses opacity - the
 * dispatcher still sees who and what, while the washed-out marker says "this
 * position may no longer be true". Selection is carried by the halo, never by
 * colour, so it cannot mask availability.
 */
export function createStaffMarkerOptions(
  state: StaffMarkerIconState,
  name: string
): LongdoMarkerOptions {
  const rgb = getAvailabilityRgb(state.availability);
  const isMuted = state.isStale || !state.isLogin;
  const fill = rgba(rgb, isMuted ? TOKENS.mutedAlpha : TOKENS.activeAlpha);
  const outlineAlpha = isMuted && !state.isSelected ? 0.7 : 1;
  const size = state.isSelected ? TOKENS.selectedSize : TOKENS.size;
  const strokeWidth = state.isSelected ? 2 : 1.5;

  if (!state.isSelected) {
    // Just the figure: the smallest canvas that fits it, standing on the anchor
    // at its bottom centre.
    return {
      icon: {
        html: svg(size, figure(size / 2, size, size, fill, outlineAlpha, strokeWidth), name),
        offset: { x: size / 2, y: size }
      }
    };
  }

  // Selected: the canvas has to hold the halo and a chevron orbiting outside it,
  // with the anchor at the centre (the officer's feet).
  const canvas = TOKENS.haloSize + TOKENS.headingSize * 2;
  const centre = canvas / 2;
  const parts = [
    halo(centre, centre, TOKENS.haloSize, rgb),
    // Only when the arrow would be honest - see useLongdoStaffOverlays for the
    // three conditions that have to hold before a bearing is passed in at all.
    state.bearing === null ? "" : chevron(centre, centre, state.bearing, rgba(rgb, TOKENS.activeAlpha)),
    figure(centre, centre, size, fill, outlineAlpha, strokeWidth)
  ];

  return {
    icon: {
      html: svg(canvas, parts.join(""), name),
      offset: { x: centre, y: centre }
    }
  };
}

/**
 * Marker options for a group of officers who overlap on screen.
 *
 * Centred on its point rather than standing on it, and coloured by the group's
 * best availability, so a dispatcher can still see at a glance whether anyone
 * here is dispatchable. The count is drawn into the same SVG - on ArcGIS it has
 * to be a second graphic carrying the same group id.
 */
export function createStaffGroupMarkerOptions(
  availability: StaffAvailability,
  count: number,
  isSelected: boolean,
  name: string
): LongdoMarkerOptions {
  const rgb = getAvailabilityRgb(availability);
  const diameter = getGroupSize(count);
  const haloDiameter = diameter + TOKENS.groupHaloMargin;
  // A selected group needs room for the halo that sits OUTSIDE its circle.
  const canvas = isSelected ? haloDiameter : diameter;
  const centre = canvas / 2;

  const parts = [
    isSelected ? halo(centre, centre, haloDiameter, rgb) : "",
    `<circle cx="${centre}" cy="${centre}" r="${diameter / 2 - 1}" ` +
      `fill="${rgba(rgb, TOKENS.groupFillAlpha)}" stroke="rgba(255, 255, 255, 1)" stroke-width="2" />`,
    `<text x="${centre}" y="${centre}" text-anchor="middle" dominant-baseline="central" ` +
      `font-family="system-ui, sans-serif" font-size="11" font-weight="bold" fill="#ffffff" ` +
      // Thin dark halo so the digits hold up against every one of the three fills.
      `stroke="rgba(17, 24, 39, 0.55)" stroke-width="1" paint-order="stroke">${count}</text>`
  ];

  return {
    icon: {
      html: svg(canvas, parts.join(""), name),
      offset: { x: centre, y: centre }
    }
  };
}
