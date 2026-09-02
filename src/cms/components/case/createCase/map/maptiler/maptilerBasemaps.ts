// MapTiler's half of the basemap catalogue: which MapTiler style each abstract
// option id (see basemaps.ts) is drawn with, plus the app-language mapping.
//
// The counterpart of arcgisBasemaps.ts / longdoBasemaps.ts. Style ids are from
// MapTiler Cloud's standard set:
//   streets-v2        the general-purpose street map
//   streets-v2-dark   its night variant, used while the app is in dark mode
//   hybrid            labelled satellite imagery ("satellite" alone is the
//                     unlabelled variant - an operator locating an incident
//                     needs the street names, the same reason arcgisBasemaps
//                     picks "arcgis/imagery" over "arcgis/imagery/standard")
//
// Kept out of basemaps.ts because that file is imported by BasemapSwitcher,
// which must not pull a map SDK into its chunk - though nothing here imports
// maplibre-gl, only the setup helper.
import type { Language } from "@/core/config/i18n";
import { DEFAULT_BASEMAP_ID, type BasemapOptionId } from "../basemaps";
import { mapTilerStyleUrl } from "./maptilerSetup";

interface MapTilerStyleChoice {
  light: string;
  /**
   * Style used while the app is in dark mode. Satellite names the same style
   * twice on purpose - imagery is imagery either way, exactly as the ArcGIS and
   * Longdo tables have no night variant for it.
   */
  dark: string;
}

const MAPTILER_STYLE_BY_OPTION: Record<BasemapOptionId, MapTilerStyleChoice> = {
  street: { light: "streets-v2", dark: "streets-v2-dark" },
  satellite: { light: "hybrid", dark: "hybrid" }
};

/**
 * App language -> MapTiler `setLanguage` code.
 *
 * MapTiler's language capability takes ISO codes; `cn` maps to `zh`. Anything
 * absent yields `undefined`, which leaves the style's own default labels in
 * place rather than failing - degrading to default-language labels always beats
 * a broken map.
 */
const MAPTILER_LANGUAGE_BY_APP_LANGUAGE: Partial<Record<Language, string>> = {
  th: "th",
  en: "en",
  cn: "zh"
};

export function toMapTilerLanguage(language: Language | undefined): string | undefined {
  if (!language) {
    return undefined;
  }
  return MAPTILER_LANGUAGE_BY_APP_LANGUAGE[language];
}

/** The MapTiler style URL for a basemap option, honouring dark mode + language. */
export function mapTilerStyleFor(
  id: BasemapOptionId,
  isDarkTheme: boolean,
  language: Language
): string {
  const choice = MAPTILER_STYLE_BY_OPTION[id] ?? MAPTILER_STYLE_BY_OPTION[DEFAULT_BASEMAP_ID];
  return mapTilerStyleUrl(isDarkTheme ? choice.dark : choice.light, toMapTilerLanguage(language));
}

/** A signature that changes whenever the applied style should change. */
export function mapTilerStyleSignature(
  id: BasemapOptionId,
  isDarkTheme: boolean,
  language: Language
): string {
  return `${id}:${isDarkTheme ? "dark" : "light"}:${toMapTilerLanguage(language) ?? "default"}`;
}
