// Shared vocabulary for the administrative boundary layers.
//
// Kept free of any @arcgis/core import so the picker UI, the selection hook and
// the layer hook can all share these types without the SDK being pulled into a
// chunk that only renders a list of checkboxes.
import type { Language } from "@/core/config/i18n";

/** The three administrative levels, coarsest first. */
export type AdminLevel = "province" | "district" | "subdistrict";

/**
 * Iteration order for anything that walks all three levels. Coarsest first, so
 * a UI rendering in this order reads Province -> District -> Sub-district.
 * Note this is the opposite of DRAW order, where the finest level sits on top.
 */
export const ADMIN_LEVELS: readonly AdminLevel[] = ["province", "district", "subdistrict"];

/**
 * One selectable area, from the geometry-free index file. The picker renders
 * these; the map never reads them.
 */
export interface BoundaryOption {
  /** Unique code for the level: "10", "1001", "104901". */
  code: string;
  /** Parent's code - province for a district, district for a sub-district. */
  parent: string | null;
  th: string;
  en: string;
  cn: string;
  /** Palette slot, precomputed by adjacency colouring at build time. */
  color: number;
}

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

export const EMPTY_BOUNDARY_SELECTION: BoundarySelection = {
  province: [],
  district: [],
  subdistrict: []
};

/**
 * An option's name in the active language.
 *
 * Falls back to English, matching what the map's labels do: the generated data
 * already substitutes English where a Chinese name was unavailable, so this
 * guards only against a malformed index rather than the normal missing-name
 * case.
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
