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
//
// THE PROVIDER IS RUNTIME STATE, not build-time config: an org may override
// `VITE_MAP_PROVIDER` in Map Settings, so every export here reads it through
// `mapRuntimeConfig` instead of capturing it once at module scope. Exporting a
// top-level `BASEMAP_OPTIONS` constant (as this file used to) is what must NOT
// come back - it would freeze one provider's list for the whole session.
import type { MapProviderId } from "@/core/config/api";
import { getMapRuntimeConfig } from "./mapRuntimeConfig";

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

/**
 * The options `provider` can draw.
 *
 * `provider` is explicit so the Map Settings form can list the catalogue for the
 * provider the ADMIN SELECTED, which is not necessarily the one this session is
 * drawing with (the choice takes effect on the next load).
 */
export function basemapOptionsFor(provider: MapProviderId): readonly BasemapOption[] {
  return BASEMAP_OPTIONS_BY_PROVIDER[provider];
}

/** The options the provider in force can draw - the runtime callers' entry point. */
export function getBasemapOptions(): readonly BasemapOption[] {
  return basemapOptionsFor(getMapRuntimeConfig().provider);
}

/** Valid under every provider, which is what makes it a safe default. */
export const DEFAULT_BASEMAP_ID: BasemapOptionId = "street";

/**
 * Namespaced per ORG and per provider.
 *
 * Per provider: the three do not offer the same set, so a preference of
 * "satellite" saved under ArcGIS must not come back as a dead choice after the
 * provider changes. Per org: two tenants used from the same browser must not
 * inherit each other's choice (decision A4 - the same reason
 * `configPropertyApi` keys its cache by orgId).
 *
 * The pre-A4 key was `cms.map.basemap.${provider}` with no org. It is
 * deliberately NOT migrated: adopting it would copy one tenant's choice into
 * another's on a shared machine, which is the leak this key exists to close.
 * Losing a cosmetic preference once is the cheaper mistake.
 */
function basemapPreferenceKey(): string {
  const { orgId, provider } = getMapRuntimeConfig();
  return orgId
    ? `cms.map.basemap.${orgId}.${provider}`
    : `cms.map.basemap.${provider}`;
}

function isSupportedBasemapId(value: unknown): value is BasemapOptionId {
  return getBasemapOptions().some((option) => option.id === value);
}

/**
 * The basemap every map should open with, in order (decision B8):
 *
 *   this browser's choice  ->  the org's default  ->  the provider default
 *
 * The middle step is why this reads the runtime configuration: `mapSettings.general.
 * defaultBasemapId` is an org-level decision, so a tenant that never touched the
 * switcher still gets the basemap its admin configured. Validated against the
 * ACTIVE provider's catalogue at every step, so a value stored under a provider
 * that has since changed cannot come back as a dead choice.
 */
export function readBasemapPreference(): BasemapOptionId {
  let stored: string | null = null;
  try {
    stored = window.localStorage.getItem(basemapPreferenceKey());
  } catch {
    // localStorage throws in private mode / when storage is disabled: no
    // per-browser choice, which is exactly what `null` means here.
    stored = null;
  }

  if (isSupportedBasemapId(stored)) {
    return stored;
  }

  const orgDefault = getMapRuntimeConfig().basemapId;
  return isSupportedBasemapId(orgDefault) ? orgDefault : DEFAULT_BASEMAP_ID;
}

export function writeBasemapPreference(id: BasemapOptionId): void {
  try {
    window.localStorage.setItem(basemapPreferenceKey(), id);
  } catch {
    // Preference is a nicety - failing to persist it must not break the map.
  }
}
