// ArcGIS's half of the basemap catalogue: what each abstract option id
// (see basemaps.ts) is actually drawn with.
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
//
// Split out of basemaps.ts when a second provider arrived: that file is
// imported by BasemapSwitcher, which must not pull @arcgis/core into its chunk.
import Basemap from "@arcgis/core/Basemap.js";
import type { Language } from "@/core/config/i18n";
import { DEFAULT_BASEMAP_ID, type BasemapOptionId } from "./basemaps";

interface ArcgisBasemapStyle {
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
}

const ARCGIS_BASEMAP_STYLES: Record<BasemapOptionId, ArcgisBasemapStyle> = {
  street: {
    styleId: "arcgis/navigation",
    darkStyleId: "arcgis/navigation-night",
    fallbackId: "streets-navigation-vector",
    darkFallbackId: "streets-night-vector"
  },
  satellite: {
    styleId: "arcgis/imagery",
    fallbackId: "hybrid"
  }
};

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

function getStyle(id: BasemapOptionId): ArcgisBasemapStyle {
  return ARCGIS_BASEMAP_STYLES[id] ?? ARCGIS_BASEMAP_STYLES[DEFAULT_BASEMAP_ID];
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
  const style = getStyle(id);
  return new Basemap({
    style: {
      id: (isDarkTheme && style.darkStyleId) || style.styleId,
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
  const style = getStyle(id);
  const fallbackId = (isDarkTheme && style.darkFallbackId) || style.fallbackId;
  return Basemap.fromId(fallbackId) ?? null;
}
