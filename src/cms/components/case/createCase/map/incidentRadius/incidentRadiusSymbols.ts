// Look of the no-match fallback radius circle, in the three notations the
// providers need it: an ArcGIS simple-fill symbol, and CSS colour strings for
// Longdo / MapLibre.
//
// Q7 decision: reuse the boundary overlay palette (boundaryColors.ts) rather
// than a bespoke colour. It draws from one fixed palette slot at the mid-level
// alphas, with a DASHED outline so it still reads as an advisory circle and not
// an administrative boundary. No map SDK import - plain data, cheap to load.
import {
  boundaryRgba,
  boundaryRgbaCss,
  MID_LEVEL_STYLE
} from "../boundaries/boundaryColors";

/**
 * Palette slot for the circle. 1 = magenta in BOUNDARY_HUES: high-contrast in
 * both themes, not blue (the case pin is brand blue), reads as "attention".
 * Adjust this one constant to recolour the circle.
 */
const INCIDENT_RADIUS_COLOR_INDEX = 1;

export const INCIDENT_RADIUS_OUTLINE_WIDTH = MID_LEVEL_STYLE.outlineWidth;

/** `rgba()` string for the ring outline. */
export const incidentRadiusStrokeCss = (isDarkTheme: boolean): string =>
  boundaryRgbaCss(INCIDENT_RADIUS_COLOR_INDEX, isDarkTheme, MID_LEVEL_STYLE.outlineAlpha);

/** `rgba()` string for the ring fill. */
export const incidentRadiusFillCss = (isDarkTheme: boolean): string =>
  boundaryRgbaCss(INCIDENT_RADIUS_COLOR_INDEX, isDarkTheme, MID_LEVEL_STYLE.fillAlpha);

/**
 * ArcGIS simple-fill symbol for the buffered circle. `[r, g, b, alpha]` is the
 * component form the SDK's symbols take, matching MARKER_SYMBOL in
 * ArcgisAddressMap.tsx.
 */
export function incidentRadiusArcgisSymbol(isDarkTheme: boolean) {
  return {
    type: "simple-fill" as const,
    color: boundaryRgba(INCIDENT_RADIUS_COLOR_INDEX, isDarkTheme, MID_LEVEL_STYLE.fillAlpha),
    outline: {
      color: boundaryRgba(INCIDENT_RADIUS_COLOR_INDEX, isDarkTheme, MID_LEVEL_STYLE.outlineAlpha),
      width: MID_LEVEL_STYLE.outlineWidth,
      style: "dash" as const
    }
  };
}
