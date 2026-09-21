// Look of the no-match fallback radius circle, in the three notations the
// providers need it: an ArcGIS simple-fill symbol, and CSS colour strings for
// Longdo / MapLibre.
//
// Q7 decision: reuse the boundary overlay PALETTE (boundaryColors.ts) rather
// than a bespoke colour - but not boundary's alpha/width. Boundary hue is
// assigned per-polygon (four-colour-theorem adjacency, see
// build-admin-geojson.mjs), not per-level, so any boundary polygon can land on
// this same magenta slot at MID_LEVEL_STYLE's alpha - visually near-identical
// where they overlap. INCIDENT_RADIUS_STYLE below is deliberately heavier
// (higher fill alpha, fully opaque + bolder outline) than every boundary
// level's style, so the circle stays legible regardless of what boundary hue
// is underneath. Still DASHED so it reads as advisory, not administrative.
import { boundaryRgba, boundaryRgbaCss } from "../boundaries/boundaryColors";

/**
 * Palette slot for the circle. 1 = magenta in BOUNDARY_HUES: high-contrast in
 * both themes, not blue (the case pin is brand blue), reads as "attention".
 * Adjust this one constant to recolour the circle.
 */
const INCIDENT_RADIUS_COLOR_INDEX = 1;

/**
 * Deliberately distinct from every boundary level's style (boundaryColors.ts)
 * so the circle never visually collides with a boundary polygon rendered in
 * the same hue slot - see the file header for why that can happen.
 */
const INCIDENT_RADIUS_STYLE = {
  fillAlpha: 0.3,
  outlineAlpha: 1,
  outlineWidth: 2.5
};

export const INCIDENT_RADIUS_OUTLINE_WIDTH = INCIDENT_RADIUS_STYLE.outlineWidth;

/** `rgba()` string for the ring outline. */
export const incidentRadiusStrokeCss = (isDarkTheme: boolean): string =>
  boundaryRgbaCss(INCIDENT_RADIUS_COLOR_INDEX, isDarkTheme, INCIDENT_RADIUS_STYLE.outlineAlpha);

/** `rgba()` string for the ring fill. */
export const incidentRadiusFillCss = (isDarkTheme: boolean): string =>
  boundaryRgbaCss(INCIDENT_RADIUS_COLOR_INDEX, isDarkTheme, INCIDENT_RADIUS_STYLE.fillAlpha);

/**
 * ArcGIS simple-fill symbol for the buffered circle. `[r, g, b, alpha]` is the
 * component form the SDK's symbols take, matching MARKER_SYMBOL in
 * ArcgisAddressMap.tsx.
 */
export function incidentRadiusArcgisSymbol(isDarkTheme: boolean) {
  return {
    type: "simple-fill" as const,
    color: boundaryRgba(INCIDENT_RADIUS_COLOR_INDEX, isDarkTheme, INCIDENT_RADIUS_STYLE.fillAlpha),
    outline: {
      color: boundaryRgba(INCIDENT_RADIUS_COLOR_INDEX, isDarkTheme, INCIDENT_RADIUS_STYLE.outlineAlpha),
      width: INCIDENT_RADIUS_STYLE.outlineWidth,
      style: "dash" as const
    }
  };
}
