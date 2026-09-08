// Marker symbols for the Place layer.
//
// Each category gets one fixed colour and one glyph, authored on a 24x24 box so
// `size` scales predictably - the same approach staffSymbols.ts takes for the
// officer silhouette. No picture markers: a path stays a single filled shape, so
// the category colour and the selection outline keep working on it unchanged.
//
// Per stakeholder question Q5, a category-coded icon is an accepted starting
// point; the exact icon set is still open. The measurements and path data are
// exported as PLACE_SYMBOL_TOKENS because the Longdo and MapTiler layers draw the
// same glyphs from SVG rather than from an Esri symbol object - sharing the
// numbers is what stops the three providers drifting apart (see staffSymbols.ts).
import type { PlaceCategory } from "./placeTypes";

type Rgb = [number, number, number];
type Rgba = [number, number, number, number];

/**
 * One fixed colour per category. Tailwind 500-scale triples, matching how
 * staffSymbols.ts writes its operational colours. Blue is deliberately close to
 * the brand case pin only for Police; Hospital and Fire take clearly separate
 * hues so the three never read as the same marker.
 */
const CATEGORY_RGB: Record<PlaceCategory, Rgb> = {
  police_station: [37, 99, 235], // blue-600
  hospital: [220, 38, 38], // red-600
  fire_station: [234, 88, 12] // orange-600
};

/**
 * i18n keys for the category labels, under the existing `case.display.*`
 * namespace the other map controls use. Added to all three catalogues in
 * public/i18n/.
 */
const CATEGORY_LABEL_KEY: Record<PlaceCategory, string> = {
  police_station: "case.display.map_place_category_police_station",
  hospital: "case.display.map_place_category_hospital",
  fire_station: "case.display.map_place_category_fire_station"
};

/**
 * Glyphs authored on a 24x24 box. Simple, valid shapes chosen so the starting
 * icon set renders correctly on every provider; refine once an icon spec lands
 * (open question Q5).
 */
const CATEGORY_PATH: Record<PlaceCategory, string> = {
  // Shield.
  police_station: "M12 2 3 5v6c0 5 3.8 9 9 11 5.2-2 9-6 9-11V5l-9-3z",
  // Plus / medical cross.
  hospital: "M10 3h4v6h6v4h-6v6h-4v-6H4V9h6V3z",
  // Flame.
  fire_station:
    "M12 2c1 4 5 5 5 10a5 5 0 0 1-10 0c0-2 .8-3.3 1.8-4.2.2 1 .9 1.9 1.9 2.2C10 8 12 6 12 2z"
};

const DEFAULT_SIZE = 20;
const SELECTED_SIZE = 26;
const FILL_ALPHA = 0.95;

/** Selection halo drawn under the marker - see createPlaceHaloSymbol. */
const HALO_SIZE = 36;
const HALO_FILL_ALPHA = 0.22;
const HALO_OUTLINE_ALPHA = 0.5;

function withAlpha(rgb: Rgb, alpha: number): Rgba {
  return [rgb[0], rgb[1], rgb[2], alpha];
}

/** The one place that maps a Place category to its marker colour. */
export function getPlaceCategoryRgb(category: PlaceCategory): Rgb {
  return CATEGORY_RGB[category];
}

/** The i18n key for a category's label. */
export function getPlaceCategoryLabelKey(category: PlaceCategory): string {
  return CATEGORY_LABEL_KEY[category];
}

export interface PlaceSymbolState {
  isSelected: boolean;
}

/**
 * ArcGIS autocast marker for one Place, matching how MARKER_SYMBOL and
 * createStaffSymbol are written. Selection is carried by size plus a heavier
 * white ring; the category colour never changes, so it can't be masked.
 */
export function createPlaceSymbol(category: PlaceCategory, state: PlaceSymbolState) {
  const size = state.isSelected ? SELECTED_SIZE : DEFAULT_SIZE;

  return {
    type: "simple-marker" as const,
    style: "path" as const,
    path: CATEGORY_PATH[category],
    color: withAlpha(CATEGORY_RGB[category], FILL_ALPHA),
    size,
    // Lift the glyph so it stands on the facility's coordinate rather than
    // centring the point on the middle of the icon - same reasoning as the
    // staff silhouette.
    yoffset: size / 2,
    outline: {
      color: [255, 255, 255, 1],
      width: state.isSelected ? 2 : 1.5
    }
  };
}

/** The disc drawn UNDER the selected Place marker, in the category colour. */
export function createPlaceHaloSymbol(category: PlaceCategory) {
  const rgb = CATEGORY_RGB[category];

  return {
    type: "simple-marker" as const,
    style: "circle" as const,
    color: withAlpha(rgb, HALO_FILL_ALPHA),
    size: HALO_SIZE,
    outline: {
      color: withAlpha(rgb, HALO_OUTLINE_ALPHA),
      width: 1.5
    }
  };
}

/**
 * The measurements and path data behind the symbols above, for the providers
 * that draw from SVG (Longdo) or a GeoJSON-styled layer (MapTiler) instead of an
 * Esri symbol object. See staffSymbols.ts' STAFF_SYMBOL_TOKENS for why this is
 * shared rather than re-derived per provider.
 */
export const PLACE_SYMBOL_TOKENS = {
  viewBox: 24,
  categoryPath: CATEGORY_PATH,
  categoryRgb: CATEGORY_RGB,
  size: DEFAULT_SIZE,
  selectedSize: SELECTED_SIZE,
  fillAlpha: FILL_ALPHA,
  haloSize: HALO_SIZE,
  haloFillAlpha: HALO_FILL_ALPHA,
  haloOutlineAlpha: HALO_OUTLINE_ALPHA
} as const;
