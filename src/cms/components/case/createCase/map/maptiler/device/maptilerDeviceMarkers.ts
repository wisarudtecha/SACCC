// The Device symbols, drawn as SVG for MapLibre's HTML marker elements.
//
// Same symbols as the ArcGIS and Longdo sides - same category glyphs, colours,
// sizes and alphas, all from DEVICE_SYMBOL_TOKENS so the renderers cannot drift.
// A near-copy of longdo/device/longdoDeviceMarkers.ts; the only difference is the
// return shape - a MapLibre `Marker` takes an element and an `anchor` keyword,
// where Longdo takes an HTML string and a pixel `offset`.
//
// ANCHORING: a device "stands on" its coordinate, so the glyph is anchored at
// its bottom centre ("bottom"); a selection halo marks a spot on the ground, so
// it is centred ("center").
import { DEVICE_SYMBOL_TOKENS as TOKENS, getDeviceCategoryRgb } from "../../device/deviceSymbols";
import type { DeviceCategory } from "../../device/deviceTypes";

type Rgb = readonly [number, number, number];
export type MarkerAnchor = "center" | "bottom";

export interface DeviceMarkerVisual {
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

/** The category glyph, scaled from its 24x24 box, bottom edge on (anchorX, anchorY). */
function figure(anchorX: number, anchorY: number, size: number, path: string, fill: string, strokeWidth: number): string {
  const scale = size / TOKENS.viewBox;
  return (
    `<g transform="translate(${anchorX - size / 2}, ${anchorY - size}) scale(${scale})">` +
    `<path d="${path}" fill="${fill}" ` +
    `stroke="rgba(255, 255, 255, 1)" stroke-width="${strokeWidth / scale}" ` +
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

export interface DeviceMarkerIconState {
  category: DeviceCategory;
  isSelected: boolean;
}

/** Visual for one Device. */
export function createDeviceMarkerVisual(state: DeviceMarkerIconState, name: string): DeviceMarkerVisual {
  const rgb = getDeviceCategoryRgb(state.category);
  const path = TOKENS.categoryPath[state.category];
  const fill = rgba(rgb, TOKENS.fillAlpha);
  const size = state.isSelected ? TOKENS.selectedSize : TOKENS.size;
  const strokeWidth = state.isSelected ? 2 : 1.5;

  if (!state.isSelected) {
    return {
      html: svg(size, figure(size / 2, size, size, path, fill, strokeWidth), name),
      anchor: "bottom"
    };
  }

  const canvas = TOKENS.haloSize + TOKENS.selectedSize;
  const centre = canvas / 2;
  const parts = [
    halo(centre, centre, TOKENS.haloSize, rgb),
    figure(centre, centre, size, path, fill, strokeWidth)
  ];
  return { html: svg(canvas, parts.join(""), name), anchor: "center" };
}
