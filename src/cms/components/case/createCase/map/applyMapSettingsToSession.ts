// Apply a just-saved settings document to the RUNNING session.
//
// Why this exists: most org settings are read through `useOrgMapSettings`, whose
// RTK Query cache is invalidated by the save, so they apply on their own. Three
// knobs are different - `mapProvider`, `allowMapStyleChange` and the org default
// basemap live in `mapRuntimeConfig`, which resolves once per session so a
// provider change can never remount a live MapView. This module is the one
// controlled exception: after a successful save, the admin gets the new
// configuration without reloading the page.
//
// It lives in its own file rather than inside `mapRuntimeConfig` because the route
// service imports that store, so calling into the service from the store would be
// a circular import.
import type { OrgMapSettings } from "@/core/types/organization";
import { applyMapRuntimeConfig, type MapRuntimeConfigApplyResult } from "./mapRuntimeConfig";
import { resetRouteService } from "./services/routeService";

/**
 * Apply `mapSettings` to the session. Returns what happened, so the caller can tell
 * the admin when a reload really is required (`"deferred"` = a map was on screen).
 *
 * The route-service reset is part of the contract, not an optimisation: see
 * `resetRouteService`.
 */
export function applyMapSettingsToSession(
  mapSettings: OrgMapSettings,
  orgId: string
): MapRuntimeConfigApplyResult {
  const result = applyMapRuntimeConfig({
    orgId,
    requestedProvider: mapSettings.general.mapProvider,
    basemapId: mapSettings.general.defaultBasemapId,
    allowMapStyleChange: mapSettings.general.allowMapStyleChange,
  });

  if (result === "applied") {
    resetRouteService();
  }

  return result;
}
