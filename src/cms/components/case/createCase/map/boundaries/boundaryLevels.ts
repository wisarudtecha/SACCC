// Per-level configuration: which attribute means what, and how each level is
// filtered, ordered, styled and labelled.
//
// TWO tables, one active. The app can draw boundaries from either of two data
// sources and they are not levelled the same way:
//
//   local (public/geo/*.geojson)  province -> district -> subdistrict, Bangkok
//   org   (area API)              country  -> province -> district,    per org
//
// Everything level-specific that is not a palette hue lives in these tables, so
// the difference between the two sources is a table lookup rather than a branch
// scattered through the layer hook, the picker and the toolbar.
//
// Local field names match what scripts/build-admin-geojson.mjs emits - that
// script and this table are the two halves of one contract. The org
// FeatureCollections are built in-browser by boundarySource.ts, so their
// attribute names are normalised and identical at every level.
import type { Language } from "@/core/config/i18n";
import { API_CONFIG } from "@/core/config/api";
import {
  FINE_LEVEL_STYLE,
  MID_LEVEL_STYLE,
  TOP_LEVEL_STYLE,
  type BoundaryLevelStyle
} from "./boundaryColors";
import type { AdminLevel, BoundarySelection } from "./boundaryTypes";

export interface BoundaryLevelConfig {
  level: AdminLevel;
  /** Unique feature id, and the field the selection filters on. */
  idField: string;
  /** Parent code field; null at the top level. */
  parentField: string | null;
  /** Palette slot. Drives the renderer. */
  colorField: string;
  /** Name attribute per app language. */
  nameFieldByLanguage: Readonly<Record<Language, string>>;
  /**
   * Draw order within the boundary group, 0 = bottom. The finest level sits on
   * top so its outlines are never buried under a coarser fill.
   */
  drawIndex: number;
  /**
   * Fill/outline weights. Held per level rather than looked up by level NAME,
   * because the same name sits at different depths in the two tables: "province"
   * is the coarsest local level but the middle org one, and has to be drawn as
   * whatever it is in the active table.
   */
  style: BoundaryLevelStyle;
  /**
   * Labels are hidden when the view scale is LARGER than this (i.e. zoomed
   * further out); 0 means always shown. Several simultaneous label sets collide
   * badly, so the finer levels only appear once there is room for them.
   */
  labelMinScale: number;
  /** Label point size. Coarser levels read as more important. */
  labelSize: number;
  labelWeight: "normal" | "bold";
  /** Starts switched on. Exactly one level per table should set this. */
  defaultVisible: boolean;
  /** i18n keys - full name for tooltips and the picker, short for the toolbar. */
  labelKey: string;
  shortLabelKey: string;
}

/**
 * The Bangkok reference data.
 *
 * Kept as the fallback view and as the worked example of the level table, not as
 * dead code: VITE_BOUNDARY_SOURCE=local selects it, which is the quickest way to
 * tell a rendering bug apart from a backend data problem.
 */
export const LOCAL_BOUNDARY_LEVELS: readonly BoundaryLevelConfig[] = [
  {
    level: "province",
    idField: "PROV_CODE",
    parentField: null,
    colorField: "COLOR_IDX",
    nameFieldByLanguage: { th: "PROV_NAMT", en: "PROV_NAMEN", cn: "PROV_NAMC" },
    drawIndex: 0,
    style: TOP_LEVEL_STYLE,
    labelMinScale: 0,
    labelSize: 13,
    labelWeight: "bold",
    defaultVisible: false,
    labelKey: "case.display.map_boundary_province",
    shortLabelKey: "case.display.map_boundary_province_short"
  },
  {
    level: "district",
    idField: "District",
    parentField: "PROV_CODE",
    colorField: "COLOR_IDX",
    nameFieldByLanguage: { th: "AMP_NAMT", en: "AMP_NAMEN", cn: "AMP_NAMC" },
    drawIndex: 1,
    style: MID_LEVEL_STYLE,
    labelMinScale: 2_000_000,
    labelSize: 11,
    labelWeight: "bold",
    // The level a dispatcher works in on a city map, and the middle of this
    // table - the same slot the org table gives to province.
    defaultVisible: true,
    labelKey: "case.display.map_boundary_district",
    shortLabelKey: "case.display.map_boundary_district_short"
  },
  {
    level: "subdistrict",
    idField: "Subdist",
    // The district code, not the province: this is both the picker's cascade key
    // and the colour-inheritance join.
    parentField: "District",
    colorField: "COLOR_IDX",
    nameFieldByLanguage: { th: "TAM_NAMT", en: "TAM_NAMEN", cn: "TAM_NAMC" },
    drawIndex: 2,
    style: FINE_LEVEL_STYLE,
    labelMinScale: 300_000,
    labelSize: 9,
    labelWeight: "normal",
    defaultVisible: false,
    labelKey: "case.display.map_boundary_subdistrict",
    shortLabelKey: "case.display.map_boundary_subdistrict_short"
  }
];

/**
 * The organization's own area data, from GET /area/countries/{id}/tree.
 *
 * Attribute names are uniform across the three levels because boundarySource.ts
 * builds these FeatureCollections itself - there is no upstream schema to match,
 * so there is no reason for the id field to be named differently at each level
 * the way the generated files do it.
 *
 * Province is the default view: it is the level an operator reasons about on a
 * country-wide map, and the org equivalent of the district default the local
 * table uses for a city-wide one.
 */
export const ORG_BOUNDARY_LEVELS: readonly BoundaryLevelConfig[] = [
  {
    level: "country",
    idField: "CODE",
    parentField: null,
    colorField: "COLOR_IDX",
    nameFieldByLanguage: { th: "NAME_TH", en: "NAME_EN", cn: "NAME_CN" },
    drawIndex: 0,
    style: TOP_LEVEL_STYLE,
    labelMinScale: 0,
    labelSize: 13,
    labelWeight: "bold",
    defaultVisible: false,
    labelKey: "case.display.map_boundary_country",
    shortLabelKey: "case.display.map_boundary_country_short"
  },
  {
    level: "province",
    idField: "CODE",
    parentField: "PARENT",
    colorField: "COLOR_IDX",
    nameFieldByLanguage: { th: "NAME_TH", en: "NAME_EN", cn: "NAME_CN" },
    drawIndex: 1,
    style: MID_LEVEL_STYLE,
    // Zero, unlike the local table's middle level: this one is on by default and
    // is read at country extent, so a scale floor would leave the default view
    // showing unlabelled polygons.
    labelMinScale: 0,
    labelSize: 11,
    labelWeight: "bold",
    defaultVisible: true,
    labelKey: "case.display.map_boundary_province",
    shortLabelKey: "case.display.map_boundary_province_short"
  },
  {
    level: "district",
    idField: "CODE",
    parentField: "PARENT",
    colorField: "COLOR_IDX",
    nameFieldByLanguage: { th: "NAME_TH", en: "NAME_EN", cn: "NAME_CN" },
    drawIndex: 2,
    style: FINE_LEVEL_STYLE,
    labelMinScale: 2_000_000,
    labelSize: 9,
    labelWeight: "normal",
    defaultVisible: false,
    labelKey: "case.display.map_boundary_district",
    shortLabelKey: "case.display.map_boundary_district_short"
  }
];

/**
 * The active level table.
 *
 * A deploy-time decision, like VITE_USE_GRAPHQL - there is exactly one source at
 * a time and it is not a per-map choice, so this is a module constant rather
 * than a prop or a context.
 */
export const BOUNDARY_LEVELS: readonly BoundaryLevelConfig[] =
  API_CONFIG.BOUNDARY_SOURCE === "local" ? LOCAL_BOUNDARY_LEVELS : ORG_BOUNDARY_LEVELS;

/**
 * Iteration order for anything that walks the active levels. Coarsest first, so
 * a UI rendering in this order reads top-down.
 * Note this is the opposite of DRAW order, where the finest level sits on top.
 */
export const ADMIN_LEVELS: readonly AdminLevel[] = BOUNDARY_LEVELS.map((config) => config.level);

export function getBoundaryLevel(level: AdminLevel): BoundaryLevelConfig {
  const config = BOUNDARY_LEVELS.find((entry) => entry.level === level);
  if (!config) {
    throw new Error(`Unknown administrative level: ${level}`);
  }
  return config;
}

/** Fields the layer must fetch: id, parent, colour and every language's name. */
export function outFieldsFor(config: BoundaryLevelConfig): string[] {
  const fields = new Set<string>([config.idField, config.colorField]);
  if (config.parentField) {
    fields.add(config.parentField);
  }
  Object.values(config.nameFieldByLanguage).forEach((field) => fields.add(field));
  return [...fields];
}

/**
 * Codes are data-file strings, but this builds SQL that the layer executes, so
 * treat them as untrusted anyway and drop anything that is not alphanumeric. A
 * stray quote would otherwise break the expression.
 */
function sanitiseCode(code: string): string {
  return code?.replace(/[^a-zA-Z0-9]/g, "");
}

/**
 * The layer's definitionExpression for the current selection.
 *
 * An empty selection yields "1=0" - draw nothing - rather than being treated as
 * "no filter, draw everything". Empty meaning ALL would make clearing a level in
 * the picker do the opposite of what it looks like.
 *
 * Filtering is client-side over an already-downloaded FeatureCollection under
 * both sources, and stays correct for both: the local files are one city, and
 * the org tree is one organization's areas fetched in a single call. Neither is
 * the country-wide, every-sub-district dataset that would have to be scoped
 * server-side instead.
 */
export function buildDefinitionExpression(
  config: BoundaryLevelConfig,
  selection: BoundarySelection
): string {
  const codes = selection[config.level];
  if (!codes || codes.length === 0) {
    return "1=0";
  }
  const values = codes.map((code) => `'${sanitiseCode(code)}'`).join(",");
  return `${config.idField} IN (${values})`;
}
