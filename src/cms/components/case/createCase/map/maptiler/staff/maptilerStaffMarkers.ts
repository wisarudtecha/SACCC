// The staff symbols, drawn as SVG for MapLibre's HTML marker elements.
//
// Same symbols as the ArcGIS and Longdo sides - same silhouette, same three
// operational colours, same sizes and alphas, all from STAFF_SYMBOL_TOKENS so
// the renderers cannot drift. This is a near-copy of longdo/staff/
// longdoStaffMarkers.ts; the only difference is the return shape - a MapLibre
// `Marker` takes an element and an `anchor` keyword, where Longdo takes an HTML
// string and a pixel `offset`.
//
// ANCHORING: an officer stands ON their position, so the figure is anchored at
// its bottom centre ("bottom"); a halo or a group circle marks a spot several
// people share, so it is centred ("center").
import {
  STAFF_SYMBOL_TOKENS as TOKENS,
  getAvailabilityRgb,
  getGroupSize,
  type StaffAvailability
} from "../../staff/staffSymbols";

type Rgb = readonly [number, number, number];
export type MarkerAnchor = "center" | "bottom";

export interface StaffMarkerVisual {
  html: string;
  anchor: MarkerAnchor;
}

function rgba(rgb: Rgb, alpha: number): string {
  return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})`;
}

function escapeXml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function svg(size: number, body: string, name: string): string {
  return (
    `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" ` +
    `xmlns="http://www.w3.org/2000/svg" style="overflow:visible;cursor:pointer;display:block">` +
    (name ? `<title>${escapeXml(name)}</title>` : "") +
    `${body}</svg>`
  );
}

/** The silhouette, scaled from its 24x24 box, feet on (anchorX, anchorY). */
function figure(
  anchorX: number,
  anchorY: number,
  size: number,
  fill: string,
  outlineAlpha: number,
  strokeWidth: number
): string {
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

/** Visual for one officer. */
export function createStaffMarkerVisual(state: StaffMarkerIconState, name: string): StaffMarkerVisual {
  const rgb = getAvailabilityRgb(state.availability);
  const isMuted = state.isStale || !state.isLogin;
  const fill = rgba(rgb, isMuted ? TOKENS.mutedAlpha : TOKENS.activeAlpha);
  const outlineAlpha = isMuted && !state.isSelected ? 0.7 : 1;
  const size = state.isSelected ? TOKENS.selectedSize : TOKENS.size;
  const strokeWidth = state.isSelected ? 2 : 1.5;

  if (!state.isSelected) {
    return {
      html: svg(size, figure(size / 2, size, size, fill, outlineAlpha, strokeWidth), name),
      anchor: "bottom"
    };
  }

  const canvas = TOKENS.haloSize + TOKENS.headingSize * 2;
  const centre = canvas / 2;
  const parts = [
    halo(centre, centre, TOKENS.haloSize, rgb),
    state.bearing === null
      ? ""
      : chevron(centre, centre, state.bearing, rgba(rgb, TOKENS.activeAlpha)),
    figure(centre, centre, size, fill, outlineAlpha, strokeWidth)
  ];
  return { html: svg(canvas, parts.join(""), name), anchor: "center" };
}

/** Visual for a group of officers who overlap on screen. */
export function createStaffGroupMarkerVisual(
  availability: StaffAvailability,
  count: number,
  isSelected: boolean,
  name: string
): StaffMarkerVisual {
  const rgb = getAvailabilityRgb(availability);
  const diameter = getGroupSize(count);
  const haloDiameter = diameter + TOKENS.groupHaloMargin;
  const canvas = isSelected ? haloDiameter : diameter;
  const centre = canvas / 2;

  const parts = [
    isSelected ? halo(centre, centre, haloDiameter, rgb) : "",
    `<circle cx="${centre}" cy="${centre}" r="${diameter / 2 - 1}" ` +
      `fill="${rgba(rgb, TOKENS.groupFillAlpha)}" stroke="rgba(255, 255, 255, 1)" stroke-width="2" />`,
    `<text x="${centre}" y="${centre}" text-anchor="middle" dominant-baseline="central" ` +
      `font-family="system-ui, sans-serif" font-size="11" font-weight="bold" fill="#ffffff" ` +
      `stroke="rgba(17, 24, 39, 0.55)" stroke-width="1" paint-order="stroke">${count}</text>`
  ];
  return { html: svg(canvas, parts.join(""), name), anchor: "center" };
}
