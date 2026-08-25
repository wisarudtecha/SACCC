// Shared vocabulary for the administrative boundary layers.
//
// Kept free of any @arcgis/core import so the picker UI, the selection hook and
// the layer hook can all share these types without the SDK being pulled into a
// chunk that only renders a list of checkboxes.
import type { Language } from "@/core/config/i18n";

/**
 * Every administrative level either data source can produce, coarsest first.
 *
 * Four names for three layers, because the two sources do not use the same
 * three. The static /geo files are Bangkok-shaped (province -> district ->
 * subdistrict); the org area API is country-shaped (country -> province ->
 * district). Which three are live is decided by the active source's level table
 * - see BOUNDARY_LEVELS in boundaryLevels.ts. Nothing outside that table should
 * name a level literally.
 */
export type AdminLevel = "country" | "province" | "district" | "subdistrict";

/**
 * One selectable area, from the geometry-free index. The picker renders these;
 * the map never reads them.
 */
export interface BoundaryOption {
  /** Unique code for the level: "TH", "10", "1001". */
  code: string;
  /** Parent's code - one level up, per the active level table. */
  parent: string | null;
  th: string;
  en: string;
  cn: string;
  /** Palette slot. Baked into the static files; computed for the org source. */
  color: number;
}

/**
 * Per-level records covering EVERY AdminLevel, not just the active three.
 *
 * Deliberately a full Record rather than a Partial: each source populates only
 * the levels it has, but every consumer iterates the active level list, so the
 * inactive key is allocated and never read. That costs one empty array and
 * saves optional-chaining at a dozen call sites.
 */
export type BoundaryIndex = Readonly<Record<AdminLevel, readonly BoundaryOption[]>>;

/** Which area codes are drawn, per level. */
export type BoundarySelection = Readonly<Record<AdminLevel, readonly string[]>>;

/** Which levels are drawn at all. Toggled instantly, unlike the selection. */
export type BoundaryVisibility = Readonly<Record<AdminLevel, boolean>>;

/**
 * Everything the map needs to draw boundaries. Assembled by useBoundarySelection
 * and handed to ArcgisAddressMap as one opaque prop, so the generic map
 * component never learns what a sub-district is.
 */
export interface BoundaryLayerConfig {
  /** Applied selection - NOT the panel's draft. */
  selection: BoundarySelection;
  visibility: BoundaryVisibility;
}

/** Every level empty. Built once; the shape is the same for both sources. */
export const EMPTY_BOUNDARY_SELECTION: BoundarySelection = {
  country: [],
  province: [],
  district: [],
  subdistrict: []
};

export const EMPTY_BOUNDARY_INDEX: BoundaryIndex = {
  country: [],
  province: [],
  district: [],
  subdistrict: []
};

/**
 * An option's name in the active language.
 *
 * Falls back to English. For the static files this guards only against a
 * malformed index, since the generator already substitutes English where a
 * Chinese name was unavailable. For the org source it is load-bearing: the area
 * API carries `en` and `th` only, so `cn` is always the English name.
 */
export function boundaryOptionName(option: BoundaryOption, language: Language): string {
  if (language === "th") {
    return option.th || option.en;
  }
  if (language === "cn") {
    return option.cn || option.en;
  }
  return option.en;
}
