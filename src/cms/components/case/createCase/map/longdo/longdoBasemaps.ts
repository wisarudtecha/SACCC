// Longdo's half of the basemap catalogue: which layer constant each abstract
// option id (see basemaps.ts) is drawn with.
//
// The names come from the SDK's own layer selector, read out of longdo.MapTheme:
// its three primary buttons are Map -> longdo_normal, Satellite -> longdo_hard
// and Traffic -> longdo_gray, with Night/Dark/Light/Pastel/Political in the
// dropdown behind them. Everything grouped under "Non-free" there - GISTDA
// sphere, Google, TomTom, ESRI - is deliberately not offered: those need
// separate entitlement, and a basemap that silently fails to draw is worse than
// one the control never listed.
//
// Names, not values: longdo.Layers only exists once the SDK script has loaded,
// so a module-level table has to hold the key and look the value up at call time.
import type { Language } from "@/core/config/i18n";
import { DEFAULT_BASEMAP_ID, type BasemapOptionId } from "../basemaps";
import type { LongdoGlobal, LongdoMap } from "./longdoApi";

interface LongdoLayerChoice {
  light: string;
  /**
   * Layer used while the app is in dark mode. Satellite names the same layer
   * twice on purpose - imagery is imagery either way, exactly as the ArcGIS
   * table has no night variant for it.
   */
  dark: string;
}

const LONGDO_LAYER_BY_OPTION: Record<BasemapOptionId, LongdoLayerChoice> = {
  street: { light: "NORMAL", dark: "DARK" },
  satellite: { light: "HARD", dark: "HARD" }
};

/**
 * App language -> Longdo language code.
 *
 * Longdo labels its map in Thai or English only, so Chinese asks for English:
 * the alternative is Thai labels for a reader who chose neither.
 */
export function toLongdoLanguage(language: Language | undefined): string {
  return language === "en" || language === "cn" ? "en" : "th";
}

/**
 * Point the map at the layer for `id`, in place.
 *
 * Never rebuilds the map - the same rule the ArcGIS side follows, and for the
 * same reason: a rebuild would throw away the user's pan/zoom and every overlay
 * drawn on it.
 *
 * Falls back to NORMAL if the named layer is missing from this SDK build, so an
 * unrecognised name costs the user a style rather than a map.
 */
export function applyLongdoBasemap(
  longdo: LongdoGlobal,
  map: LongdoMap,
  id: BasemapOptionId,
  isDarkTheme: boolean
): void {
  const choice = LONGDO_LAYER_BY_OPTION[id] ?? LONGDO_LAYER_BY_OPTION[DEFAULT_BASEMAP_ID];
  const layerName = isDarkTheme ? choice.dark : choice.light;
  const layer = longdo.Layers[layerName] ?? longdo.Layers.NORMAL;
  map.Layers.setBase(layer);
}
