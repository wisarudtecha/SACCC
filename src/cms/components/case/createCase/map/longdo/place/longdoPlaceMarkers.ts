// The Place symbols, drawn as SVG for Longdo's HTML marker icons.
//
// Same symbols as the ArcGIS side - same category glyphs, same colours, same
// sizes and alphas, all from PLACE_SYMBOL_TOKENS so the two renderers cannot
// drift. A near-copy of longdo/staff/longdoStaffMarkers.ts, minus everything
// Place does not have: no heading chevron, no group circles, no muted state.
//
// ANCHORING mirrors the staff figure: a facility "stands on" its coordinate (the
// ArcGIS symbol expresses this as `yoffset: size / 2`), so the glyph's bottom
// edge sits on the anchor. A selection halo is a spotlight on the ground, so it
// is centred on the anchor.
//
// Each renderer keeps its own private `rgba` / `escapeXml` / `svg` copies - the
// staff renderers do too, there is no shared util.
import { PLACE_SYMBOL_TOKENS as TOKENS, getPlaceCategoryRgb } from "../../place/placeSymbols";
import type { PlaceCategory } from "../../place/placeTypes";
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
 * The icon wrapper. `name` becomes an SVG <title>, shown as a native tooltip.
 * The marker option of the same name is NOT used: Longdo would build its own
 * popup from it and compete with the app's PlaceInfoPopup for the click.
 */
function svg(size: number, body: string, name: string): string {
  return (
    `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" ` +
    `xmlns="http://www.w3.org/2000/svg" style="overflow:visible;cursor:pointer">` +
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

export interface PlaceMarkerIconState {
  category: PlaceCategory;
  isSelected: boolean;
}

/**
 * Marker options for one Place. Selection is carried by the halo, never by
 * colour, so the category can always be read off the glyph.
 */
export function createPlaceMarkerOptions(
  state: PlaceMarkerIconState,
  name: string
): LongdoMarkerOptions {
  const rgb = getPlaceCategoryRgb(state.category);
  const path = TOKENS.categoryPath[state.category];
  const fill = rgba(rgb, TOKENS.fillAlpha);
  const size = state.isSelected ? TOKENS.selectedSize : TOKENS.size;
  const strokeWidth = state.isSelected ? 2 : 1.5;

  if (!state.isSelected) {
    return {
      icon: {
        html: svg(size, figure(size / 2, size, size, path, fill, strokeWidth), name),
        offset: { x: size / 2, y: size }
      }
    };
  }

  // Selected: the canvas holds the halo plus the (larger) glyph standing on the
  // centre, with the anchor at that centre - the facility's point.
  const canvas = TOKENS.haloSize + TOKENS.selectedSize;
  const centre = canvas / 2;
  const parts = [
    halo(centre, centre, TOKENS.haloSize, rgb),
    figure(centre, centre, size, path, fill, strokeWidth)
  ];

  return {
    icon: {
      html: svg(canvas, parts.join(""), name),
      offset: { x: centre, y: centre }
    }
  };
}
