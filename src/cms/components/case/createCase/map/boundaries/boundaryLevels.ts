// Per-level configuration: which attribute means what, and how each level is
// filtered, ordered and labelled.
//
// Everything level-specific that is NOT a colour or a symbol lives here, so
// adding a fourth level (or swapping to the country-wide dataset) is a matter of
// editing this table rather than hunting through the layer hook.
//
// Field names match what scripts/build-admin-geojson.mjs emits - that script and
// this file are the two halves of one contract.
import type { Language } from "@/core/config/i18n";
import type { AdminLevel, BoundarySelection } from "./boundaryTypes";

export interface BoundaryLevelConfig {
  level: AdminLevel;
  /** File under /geo, served from public/. */
  fileName: string;
  /** Unique feature id, and the field the selection filters on. */
  idField: string;
  /** Parent code field; null at the top level. */
  parentField: string | null;
  /** Palette slot, precomputed at build time. Drives the renderer. */
  colorField: string;
  /** Name attribute per app language. */
  nameFieldByLanguage: Readonly<Record<Language, string>>;
  /**
   * Draw order within the boundary group, 0 = bottom. The finest level sits on
   * top so its outlines are never buried under a coarser fill.
   */
  drawIndex: number;
  /**
   * Labels are hidden when the view scale is LARGER than this (i.e. zoomed
   * further out); 0 means always shown. Three simultaneous label sets collide
   * badly, so the finer levels only appear once there is room for them.
   */
  labelMinScale: number;
  /** Label point size. Coarser levels read as more important. */
  labelSize: number;
}

export const BOUNDARY_LEVELS: readonly BoundaryLevelConfig[] = [
  {
    level: "province",
    fileName: "th-bangkok-province.geojson",
    idField: "PROV_CODE",
    parentField: null,
    colorField: "COLOR_IDX",
    nameFieldByLanguage: { th: "PROV_NAMT", en: "PROV_NAMEN", cn: "PROV_NAMC" },
    drawIndex: 0,
    labelMinScale: 0,
    labelSize: 13
  },
  {
    level: "district",
    fileName: "th-bangkok-district.geojson",
    idField: "District",
    parentField: "PROV_CODE",
    colorField: "COLOR_IDX",
    nameFieldByLanguage: { th: "AMP_NAMT", en: "AMP_NAMEN", cn: "AMP_NAMC" },
    drawIndex: 1,
    labelMinScale: 2_000_000,
    labelSize: 11
  },
  {
    level: "subdistrict",
    fileName: "th-bangkok-subdistrict.geojson",
    idField: "Subdist",
    // The district code, not the province: this is both the picker's cascade key
    // and the colour-inheritance join.
    parentField: "District",
    colorField: "COLOR_IDX",
    nameFieldByLanguage: { th: "TAM_NAMT", en: "TAM_NAMEN", cn: "TAM_NAMC" },
    drawIndex: 2,
    labelMinScale: 300_000,
    labelSize: 9
  }
];

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
 * Codes are numeric strings from a generated file, but this builds SQL that the
 * layer executes, so treat them as untrusted anyway and drop anything that is
 * not alphanumeric. A stray quote would otherwise break the expression.
 */
function sanitiseCode(code: string): string {
  return code.replace(/[^a-zA-Z0-9]/g, "");
}

/**
 * The layer's definitionExpression for the current selection.
 *
 * An empty selection yields "1=0" - draw nothing - rather than being treated as
 * "no filter, draw everything". Empty meaning ALL would make clearing a level in
 * the picker do the opposite of what it looks like.
 *
 * Note this filters client-side over an already-downloaded file, which only
 * works because Bangkok is small. Once the country-wide BFF lands, the selection
 * has to become part of the request instead - see boundarySource.ts.
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
