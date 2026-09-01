// Fill colours for the boundary polygons.
//
// FOUR colours, and the count is not a style choice:
//
//   - By the four-colour theorem a planar map needs at most four colours for no
//     two bordering areas to share one. Colours are assigned by ADJACENCY at
//     build time (see scripts/build-admin-geojson.mjs), not by hashing the area
//     code, so neighbours provably never collide. Verified on the Bangkok data:
//     123 district borders, 0 of them between same-coloured districts.
//   - Four is also the largest set of the design system's categorical hues that
//     clears the accessibility gates for a map, where ANY two areas can end up
//     side by side (the "all pairs" test, which is what choropleths are held to).
//
// Validation record - scripts/validate_palette.js, --pairs all, both modes:
//
//   worst CVD separation      ΔE 6.9   (target 8, floor 6)
//   worst normal-vision pair  ΔE 19.3  (hard floor 15)
//
// The CVD figure sits in the 6-8 band, which is legal ONLY where a second,
// non-colour channel also carries the distinction. That condition is met here
// and is structural rather than incidental: every polygon is labelled with its
// own name (a product requirement), and the three levels differ by outline
// weight and dash pattern as well as by fill. Do not reuse this palette
// somewhere those two things are absent.
//
// Blue is deliberately absent. The case location marker is brand blue
// (MARKER_SYMBOL in ArcgisAddressMap.tsx) and the Chao Phraya runs through the
// middle of the basemap, so a blue fill would compete with both. The validator
// offered a blue-containing set with identical scores; this one was chosen for
// that reason.

type Rgb = readonly [number, number, number];

interface BoundaryHue {
  name: string;
  light: Rgb;
  dark: Rgb;
}

/**
 * Palette slots, indexed by the COLOR_IDX attribute baked into the data. Order
 * is fixed - changing it repaints every area, which is exactly the "colour
 * follows the entity, not its rank" rule this data is built to satisfy.
 */
const BOUNDARY_HUES: readonly BoundaryHue[] = [
  { name: "yellow", light: [237, 161, 0], dark: [201, 133, 0] },
  { name: "magenta", light: [232, 123, 164], dark: [213, 81, 129] },
  { name: "green", light: [0, 131, 0], dark: [0, 131, 0] },
  { name: "violet", light: [74, 58, 167], dark: [144, 133, 233] }
];

export const BOUNDARY_PALETTE_SIZE = BOUNDARY_HUES.length;

/**
 * Symbol weights, by DEPTH rather than by level name.
 *
 * All three levels can be switched on at once, so they are told apart by FILL
 * WEIGHT and OUTLINE, not by hue - the hue is already spent on identifying the
 * area. Reading inward: a thick solid coarse edge, a medium solid middle edge,
 * and a thin dashed fine edge, which is the conventional way to draw a
 * subdivision of the region it sits inside.
 *
 * Keyed by depth because the level NAMES are not stable across data sources -
 * "province" is the coarsest level in the local table and the middle one in the
 * org table (see boundaryLevels.ts). Each level config picks the style for the
 * slot it actually occupies.
 *
 * Fills stay faint on purpose. An operator is locating an incident against
 * street names on the basemap, not reading a choropleth, so the basemap has to
 * stay legible through the polygon.
 */
export interface BoundaryLevelStyle {
  fillAlpha: number;
  outlineWidth: number;
  outlineStyle: "solid" | "dash";
  /** Outline alpha; fills are faint, so edges carry most of the signal. */
  outlineAlpha: number;
}

export const TOP_LEVEL_STYLE: BoundaryLevelStyle = {
  fillAlpha: 0.05,
  outlineWidth: 3,
  outlineStyle: "solid",
  outlineAlpha: 0.95
};

export const MID_LEVEL_STYLE: BoundaryLevelStyle = {
  fillAlpha: 0.15,
  outlineWidth: 1.5,
  outlineStyle: "solid",
  outlineAlpha: 0.9
};

export const FINE_LEVEL_STYLE: BoundaryLevelStyle = {
  fillAlpha: 0.08,
  outlineWidth: 1,
  outlineStyle: "dash",
  outlineAlpha: 0.85
};

/**
 * RGB for a palette slot. Out-of-range indexes wrap rather than throw: the index
 * comes from a data file, and a bad value should draw the wrong colour, not
 * blank the layer.
 */
export function boundaryHue(colorIndex: number, isDarkTheme: boolean): Rgb {
  const hue = BOUNDARY_HUES[((colorIndex % BOUNDARY_PALETTE_SIZE) + BOUNDARY_PALETTE_SIZE) % BOUNDARY_PALETTE_SIZE];
  return isDarkTheme ? hue.dark : hue.light;
}

/** ArcGIS colour array for a slot at a given alpha. */
export function boundaryRgba(
  colorIndex: number,
  isDarkTheme: boolean,
  alpha: number
): [number, number, number, number] {
  const [r, g, b] = boundaryHue(colorIndex, isDarkTheme);
  return [r, g, b, alpha];
}

/**
 * CSS colour for a slot at a given alpha.
 *
 * The Longdo counterpart of boundaryRgba: its geometry options take CSS colour
 * STRINGS where the ArcGIS symbols take component arrays. Same palette, same
 * alphas from the level styles - only the notation differs.
 */
export function boundaryRgbaCss(
  colorIndex: number,
  isDarkTheme: boolean,
  alpha: number
): string {
  const [r, g, b] = boundaryHue(colorIndex, isDarkTheme);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/** CSS colour for the picker's swatches, so the list matches the map. */
export function boundarySwatchCss(colorIndex: number, isDarkTheme: boolean): string {
  const [r, g, b] = boundaryHue(colorIndex, isDarkTheme);
  return `rgb(${r} ${g} ${b})`;
}
