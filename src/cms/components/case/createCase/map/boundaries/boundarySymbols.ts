// Renderers and label classes for the boundary layers.
//
// Both are rebuilt (not mutated) whenever the theme or the app language changes,
// and reassigned onto the live layer. Accessor does not observe mutation of a
// nested symbol, so editing one in place would silently do nothing.
//
// ---------------------------------------------------------------------------
// FONT: leave `family` unset. This is load-bearing, not an oversight.
// ---------------------------------------------------------------------------
// Labels on a 2D MapView are NOT rendered with the browser's system fonts. They
// are drawn from hosted signed-distance-field font files (.pbf) fetched from
// esriConfig.fontsUrl, and only the families in that catalogue exist - see the
// table in @arcgis/core/symbols/Font.d.ts.
//
// Every family in that catalogue is Latin-only (Noto Sans, Ubuntu, Montserrat,
// Merriweather, ...). Naming any of them would leave Thai and Chinese labels as
// blank boxes. The DEFAULT, "sans-serif", resolves to the Arial Unicode MS font
// file, which is pan-Unicode and covers both Thai and CJK.
//
// So the correct action for a Thai/Chinese map is to specify no family at all.
// If someone later "improves" this by setting one to match the app's UI font,
// the labels will break for two of the three supported languages.
import LabelClass from "@arcgis/core/layers/support/LabelClass.js";
import SimpleFillSymbol from "@arcgis/core/symbols/SimpleFillSymbol.js";
import SimpleLineSymbol from "@arcgis/core/symbols/SimpleLineSymbol.js";
import TextSymbol from "@arcgis/core/symbols/TextSymbol.js";
import UniqueValueRenderer from "@arcgis/core/renderers/UniqueValueRenderer.js";
import type { Language } from "@/core/config/i18n";
import { BOUNDARY_PALETTE_SIZE, boundaryRgba } from "./boundaryColors";
import type { BoundaryLevelConfig } from "./boundaryLevels";

/** Label ink and halo. Halo is what keeps a name readable over any basemap. */
const LABEL_LIGHT_TEXT: [number, number, number, number] = [31, 41, 55, 1]; // gray-800
const LABEL_LIGHT_HALO: [number, number, number, number] = [255, 255, 255, 0.9];
const LABEL_DARK_TEXT: [number, number, number, number] = [249, 250, 251, 1]; // gray-50
const LABEL_DARK_HALO: [number, number, number, number] = [17, 24, 39, 0.9]; // gray-900

const LABEL_HALO_SIZE = 1.5;

/**
 * One fill symbol per palette slot.
 *
 * A UniqueValueRenderer over the precomputed COLOR_IDX keeps this to four
 * entries per layer no matter how many areas are drawn - the alternative,
 * keying on the area code, would mean 50 entries today and 928 once the data
 * goes country-wide.
 *
 * It is also what makes sub-districts inherit their district's colour for free:
 * the build script copies the parent's COLOR_IDX onto each sub-district, so both
 * layers can run the same four-entry renderer.
 */
export function createBoundaryRenderer(
  config: BoundaryLevelConfig,
  isDarkTheme: boolean
): UniqueValueRenderer {
  const style = config.style;

  const symbolFor = (colorIndex: number) =>
    new SimpleFillSymbol({
      color: boundaryRgba(colorIndex, isDarkTheme, style.fillAlpha),
      outline: new SimpleLineSymbol({
        color: boundaryRgba(colorIndex, isDarkTheme, style.outlineAlpha),
        width: style.outlineWidth,
        style: style.outlineStyle
      })
    });

  return new UniqueValueRenderer({
    field: config.colorField,
    uniqueValueInfos: Array.from({ length: BOUNDARY_PALETTE_SIZE }, (_, colorIndex) => ({
      value: colorIndex,
      symbol: symbolFor(colorIndex)
    })),
    // A feature with an unexpected COLOR_IDX should still be visible; drawing
    // nothing would look like missing data rather than a data problem.
    defaultSymbol: symbolFor(0)
  });
}

/**
 * The label class for a level in the current language and theme.
 *
 * Polygons support only "always-horizontal" placement - the SDK ignores any
 * other value on a polygon layer, so it is set explicitly rather than left to
 * chance.
 *
 * `minScale` is the important part. With all three levels switched on there are
 * three sets of names competing for the same space; without a scale floor the
 * finer ones render as an unreadable mat at city zoom. Each level only starts
 * labelling once there is room for it (see BOUNDARY_LEVELS).
 */
export function createBoundaryLabelClass(
  config: BoundaryLevelConfig,
  language: Language,
  isDarkTheme: boolean
): LabelClass {
  const nameField = config.nameFieldByLanguage[language] ?? config.nameFieldByLanguage.en;

  return new LabelClass({
    labelExpressionInfo: { expression: `$feature.${nameField}` },
    labelPlacement: "always-horizontal",
    minScale: config.labelMinScale,
    // Drop a label rather than let it overlap another. Correct for dense layers,
    // and these three layers deconflict against each other as well.
    deconflictionStrategy: "static",
    symbol: new TextSymbol({
      color: isDarkTheme ? LABEL_DARK_TEXT : LABEL_LIGHT_TEXT,
      haloColor: isDarkTheme ? LABEL_DARK_HALO : LABEL_LIGHT_HALO,
      haloSize: LABEL_HALO_SIZE,
      // No `family` - see the note at the top of this file.
      font: {
        size: config.labelSize,
        // From the table, not from the level name: the finest level is called
        // "subdistrict" in one data source and "district" in the other.
        weight: config.labelWeight
      }
    })
  });
}
