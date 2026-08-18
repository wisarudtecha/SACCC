// Basemap catalogue for the case map's layers control.
//
// Basemaps come from the ArcGIS Basemap Styles service (v2), addressed by style
// id (`{provider}/{style}`). v2 is used rather than the legacy well-known ids
// ("streets-navigation-vector", "hybrid", ...) because it accepts a `language`
// preference, so basemap labels can follow the app language.
//
// Note "arcgis/imagery" is the LABELLED imagery style - it draws street names
// and boundaries over the satellite tiles. "arcgis/imagery/standard" is the
// imagery-only variant and is deliberately not offered: an operator locating an
// incident needs the street names.
import Basemap from "@arcgis/core/Basemap.js";
import type { Language } from "@/core/config/i18n";

export type BasemapOptionId = "street" | "satellite";

export interface BasemapOption {
  id: BasemapOptionId;
  /** Basemap Styles service (v2) style id. */
  styleId: string;
  /**
   * Style id used while the app is in dark mode. Omitted where the basemap is
   * already dark enough to sit under a dark UI - satellite imagery is imagery
   * either way, and there is no "night" version of a photograph.
   */
  darkStyleId?: string;
  /** Legacy well-known id used if the styles service is unavailable. */
  fallbackId: string;
  /** Legacy well-known id for the dark variant. */
  darkFallbackId?: string;
  /** i18n key for the option's label. */
  labelKey: string;
}

export const BASEMAP_OPTIONS: readonly BasemapOption[] = [
  {
    id: "street",
    styleId: "arcgis/navigation",
    darkStyleId: "arcgis/navigation-night",
    fallbackId: "streets-navigation-vector",
    darkFallbackId: "streets-night-vector",
    labelKey: "case.display.map_basemap_street"
  },
  {
    id: "satellite",
    styleId: "arcgis/imagery",
    fallbackId: "hybrid",
    labelKey: "case.display.map_basemap_satellite"
  }
];

export const DEFAULT_BASEMAP_ID: BasemapOptionId = "street";

const BASEMAP_PREFERENCE_KEY = "cms.map.basemap";

// App language -> ArcGIS Basemap Styles service language code. Anything absent
// from this map yields `undefined`, which omits the `language` preference
// entirely and lets the service fall back to its own default. Degrading to
// default-language labels is always preferable to failing to load a basemap.
const ESRI_LANGUAGE_BY_APP_LANGUAGE: Partial<Record<Language, string>> = {
  th: "th",
  en: "en",
  cn: "zh-CN"
};

export function toEsriLanguage(language: Language | undefined): string | undefined {
  if (!language) {
    return undefined;
  }
  return ESRI_LANGUAGE_BY_APP_LANGUAGE[language];
}

export function getBasemapOption(id: BasemapOptionId): BasemapOption {
  return BASEMAP_OPTIONS.find((option) => option.id === id) ?? BASEMAP_OPTIONS[0];
}

function isBasemapOptionId(value: unknown): value is BasemapOptionId {
  return BASEMAP_OPTIONS.some((option) => option.id === value);
}

/**
 * Build a Basemap for the given option.
 *
 * Always returns a NEW instance. Instances are deliberately not cached and
 * shared: while the expand modal is open two MapViews are alive at once, and
 * handing the same Basemap object to both risks one view's teardown disposing
 * layers the other is still drawing. Tile reuse is handled by the browser's
 * HTTP cache, so a fresh instance costs nothing meaningful.
 */
export function createBasemap(
  id: BasemapOptionId,
  esriLanguage?: string,
  isDarkTheme = false
): Basemap {
  const option = getBasemapOption(id);
  return new Basemap({
    style: {
      id: (isDarkTheme && option.darkStyleId) || option.styleId,
      ...(esriLanguage ? { language: esriLanguage } : {})
    }
  });
}

/**
 * Legacy well-known basemap for `id`, used when the styles service rejects the
 * request (e.g. the API key lacks the Basemaps privilege). Returns null if the
 * SDK doesn't recognise the id, in which case the caller should leave the
 * current basemap alone rather than blank the map.
 */
export function createFallbackBasemap(
  id: BasemapOptionId,
  isDarkTheme = false
): Basemap | null {
  const option = getBasemapOption(id);
  const fallbackId = (isDarkTheme && option.darkFallbackId) || option.fallbackId;
  return Basemap.fromId(fallbackId) ?? null;
}

export function readBasemapPreference(): BasemapOptionId {
  try {
    const stored = window.localStorage.getItem(BASEMAP_PREFERENCE_KEY);
    return isBasemapOptionId(stored) ? stored : DEFAULT_BASEMAP_ID;
  } catch {
    // localStorage throws in private mode / when storage is disabled.
    return DEFAULT_BASEMAP_ID;
  }
}

export function writeBasemapPreference(id: BasemapOptionId): void {
  try {
    window.localStorage.setItem(BASEMAP_PREFERENCE_KEY, id);
  } catch {
    // Preference is a nicety - failing to persist it must not break the map.
  }
}
