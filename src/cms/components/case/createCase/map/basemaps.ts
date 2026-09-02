// Which basemaps the layers control offers, per provider.
//
// Deliberately free of any map SDK import: BasemapSwitcher renders this list,
// and it must not drag a mapping SDK into its chunk - least of all the wrong
// one. Everything ArcGIS-specific (style ids, the Basemap objects themselves,
// the language mapping) lives in arcgisBasemaps.ts, on the far side of the
// provider boundary.
//
// The ID is abstract on purpose. "street" is a style of map, not a vendor's
// layer name, so the stored preference survives a provider switch and the
// switcher's labels stay the same in all three catalogues.
import { API_CONFIG, type MapProviderId } from "@/core/config/api";

export type BasemapOptionId = "street" | "satellite";

export interface BasemapOption {
  id: BasemapOptionId;
  /** i18n key for the option's label. */
  labelKey: string;
}

const STREET_OPTION: BasemapOption = {
  id: "street",
  labelKey: "case.display.map_basemap_street"
};

const SATELLITE_OPTION: BasemapOption = {
  id: "satellite",
  labelKey: "case.display.map_basemap_satellite"
};

/**
 * What each provider can actually draw.
 *
 * Both offer both today. The table is per-provider anyway because the sets are
 * not guaranteed to stay identical - and an option a provider cannot draw must
 * be omitted here rather than silently falling back to another: a control that
 * does nothing when clicked is worse than a control that isn't there.
 */
const BASEMAP_OPTIONS_BY_PROVIDER: Record<MapProviderId, readonly BasemapOption[]> = {
  arcgis: [STREET_OPTION, SATELLITE_OPTION],
  longdo: [STREET_OPTION, SATELLITE_OPTION],
  // MapTiler serves both a street style and a labelled satellite ("hybrid")
  // style, so it offers the same pair as ArcGIS - unlike Longdo, whose free set
  // has no satellite.
  maptiler: [STREET_OPTION, SATELLITE_OPTION]
};

/** The options the active provider can draw. */
export const BASEMAP_OPTIONS: readonly BasemapOption[] =
  BASEMAP_OPTIONS_BY_PROVIDER[API_CONFIG.MAP_PROVIDER];

/** Valid under every provider, which is what makes it a safe default. */
export const DEFAULT_BASEMAP_ID: BasemapOptionId = "street";

/**
 * Namespaced per provider: the two do not offer the same set, so a preference
 * of "satellite" saved under ArcGIS must not come back as a dead choice after
 * an environment switches to Longdo.
 */
const BASEMAP_PREFERENCE_KEY = `cms.map.basemap.${API_CONFIG.MAP_PROVIDER}`;

function isSupportedBasemapId(value: unknown): value is BasemapOptionId {
  return BASEMAP_OPTIONS.some((option) => option.id === value);
}

export function readBasemapPreference(): BasemapOptionId {
  try {
    const stored = window.localStorage.getItem(BASEMAP_PREFERENCE_KEY);
    return isSupportedBasemapId(stored) ? stored : DEFAULT_BASEMAP_ID;
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
