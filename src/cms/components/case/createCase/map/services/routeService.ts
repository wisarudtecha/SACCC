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
import { API_CONFIG } from "@/core/config/api";
import type { MapLatLon, RoutePath } from "../mapTypes";

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
 * The provider cannot change while the app is running, so this resolves at most
 * one chunk per session.
 */
let servicePromise: Promise<RouteService> | null = null;

function loadRouteService(): Promise<RouteService> {
  if (!servicePromise) {
    servicePromise =
      API_CONFIG.MAP_PROVIDER === "longdo"
        ? import("./longdoRoute").then((module) => module.longdoRouteService)
        : API_CONFIG.MAP_PROVIDER === "maptiler"
          ? import("./maptilerRoute").then((module) => module.maptilerRouteService)
          : import("./arcgisRoute").then((module) => module.arcgisRouteService);
  }
  return servicePromise;
}

export const routeService: RouteService = {
  async solve(from: MapLatLon, to: MapLatLon): Promise<RouteSolution | null> {
    const service = await loadRouteService();
    return service.solve(from, to);
  }
};
