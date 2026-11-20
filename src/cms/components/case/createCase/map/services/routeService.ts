// Solving an officer -> case driving route.
//
// Interface plus the provider switch. Unlike the geocoders - which each map
// component imports directly, because it knows its own provider - this one is
// reached from useCaseRoute and useClusterRouteSummaries, which are
// provider-agnostic. So the choice is made here, through a DYNAMIC import:
// naming both implementations statically would pull @arcgis/core's routing
// modules into a Longdo build, which is most of what choosing a provider is
// meant to avoid.
//
// This module holds no state. The caching, the cooldown and the "which solve
// does this result belong to" bookkeeping stay in useCaseRoute.ts and
// useClusterRouteSummaries.ts, which need them in two different shapes.
import type { MapLatLon, RoutePath } from "../mapTypes";
import { getMapRuntimeConfig } from "../mapRuntimeConfig";

export interface RouteSolution {
  /**
   * The solved line, or null when the provider's router returns metrics without
   * geometry - which Longdo's does. A null path is NOT a failure: the metrics
   * are what the panel reads, and a Longdo map draws its own line from the
   * endpoints (see useLongdoRouteOverlay).
   */
  path: RoutePath | null;
  distanceKm: number;
  travelMinutes: number;
}

export interface RouteService {
  /**
   * Solve one route, or resolve null when the service answered without usable
   * metrics - which callers report as "no-metrics", distinct from the rejection
   * they report as "solve-failed".
   *
   * Every call costs quota, so this is only ever reached from a user action or
   * from opening a cluster panel; nothing here should be put on a timer.
   */
  solve(from: MapLatLon, to: MapLatLon): Promise<RouteSolution | null>;
}

/**
 * The active implementation, loaded once and shared.
 *
 * The provider is resolved once per session by `mapRuntimeConfig` (an org may
 * override the deployment default), and so is this chunk: the first solve loads
 * the selected provider's implementation, and later solves reuse it.
 */
let servicePromise: Promise<RouteService> | null = null;

function loadProviderService(): Promise<RouteService> {
  switch (getMapRuntimeConfig().provider) {
    case "longdo":
      return import("./longdoRoute").then((module) => module.longdoRouteService);
    case "maptiler":
      return import("./maptilerRoute").then((module) => module.maptilerRouteService);
    case "arcgis":
    default:
      return import("./arcgisRoute").then((module) => module.arcgisRouteService);
  }
}

function loadRouteService(): Promise<RouteService> {
  if (!servicePromise) {
    servicePromise = loadProviderService();
  }
  return servicePromise;
}

/**
 * Drop the cached implementation so the NEXT solve re-resolves the provider.
 *
 * Called when an admin's save changes the map provider for the running session
 * (see `applyMapSettingsToSession`). Without it the map would draw with the new
 * SDK while Calculate kept calling the old one - a mismatch that looks like "the
 * routing is broken for Longdo" and is invisible in the network log at a glance,
 * because both providers are reached through this same singleton.
 *
 * Everything else about this module is per-session caching on purpose; this is the
 * single, explicit way to reset it.
 */
export function resetRouteService(): void {
  servicePromise = null;
}

export const routeService: RouteService = {
  async solve(from: MapLatLon, to: MapLatLon): Promise<RouteSolution | null> {
    const service = await loadRouteService();
    return service.solve(from, to);
  }
};
