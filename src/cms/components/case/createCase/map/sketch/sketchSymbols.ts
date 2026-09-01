// Symbols for the boundary being drawn.
//
// Takes `isDarkTheme` as an explicit parameter rather than reading it from
// context, the same way createRouteSymbol and basemaps.ts do.
//
// Deliberately NOT the boundary palette from boundaryColors.ts. Those colours
// identify one administrative area among its neighbours; this polygon is the
// one being edited, and has to read as "in progress" against whatever is
// underneath it. Amber does that and is the one hue the boundary palette
// excludes least ambiguously - it is not in the four-colour adjacency set and
// not the brand blue of the case marker.
type Rgb = [number, number, number];
type Rgba = [number, number, number, number];

const SKETCH_LIGHT_RGB: Rgb = [217, 119, 6]; // amber-600
const SKETCH_DARK_RGB: Rgb = [251, 191, 36]; // amber-400

const FILL_ALPHA = 0.18;
const OUTLINE_ALPHA = 0.95;
const OUTLINE_WIDTH = 2;

function sketchRgb(isDarkTheme: boolean): Rgb {
  return isDarkTheme ? SKETCH_DARK_RGB : SKETCH_LIGHT_RGB;
}

/**
 * Fill + outline for the polygon.
 *
 * The only symbol here: since 5.0 SketchViewModel applies `polygonSymbol` while
 * the shape is still being drawn as well as afterwards, so there is no separate
 * `activeFillSymbol` to keep in step. Vertex handles are drawn by the model
 * itself and expose no symbol hook.
 */
export function createSketchPolygonSymbol(isDarkTheme: boolean) {
  const [r, g, b] = sketchRgb(isDarkTheme);
  const fill: Rgba = [r, g, b, FILL_ALPHA];
  const outline: Rgba = [r, g, b, OUTLINE_ALPHA];
  return {
    type: "simple-fill" as const,
    style: "solid" as const,
    color: fill,
    outline: {
      type: "simple-line" as const,
      style: "solid" as const,
      color: outline,
      width: OUTLINE_WIDTH
    }
  };
}

/**
 * The same values, as a second provider needs them.
 *
 * Longdo geometry takes CSS colour strings rather than an Esri symbol object,
 * so its renderer needs the numbers, not the object. Shared for the same reason
 * STAFF_SYMBOL_TOKENS and BREADCRUMB_TOKENS are: two copies of "what the
 * in-progress boundary looks like" would drift.
 */
export const SKETCH_TOKENS = {
  lightRgb: SKETCH_LIGHT_RGB,
  darkRgb: SKETCH_DARK_RGB,
  fillAlpha: FILL_ALPHA,
  outlineAlpha: OUTLINE_ALPHA,
  outlineWidth: OUTLINE_WIDTH
} as const;
