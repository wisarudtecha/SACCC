// Route solving on the ArcGIS World Route service.
//
// Lifted out of useCaseRoute / useClusterRouteSummaries, which held two
// identical copies of it, and kept in its own module so routeService.ts can
// reach it through a dynamic import - a static one would put @arcgis/core's
// routing modules in a Longdo build.
import * as route from "@arcgis/core/rest/route.js";
import RouteParameters from "@arcgis/core/rest/support/RouteParameters.js";
import Stop from "@arcgis/core/rest/support/Stop.js";
import Collection from "@arcgis/core/core/Collection.js";
import Point from "@arcgis/core/geometry/Point.js";
import type Polyline from "@arcgis/core/geometry/Polyline.js";
import * as webMercatorUtils from "@arcgis/core/geometry/support/webMercatorUtils.js";
import { API_CONFIG } from "@/core/config/api";
import type { MapLatLon, RoutePath } from "../mapTypes";
import type { RouteService, RouteSolution } from "./routeService";

function toFiniteNumber(value: unknown): number | null {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

/**
 * Solved geometry -> WGS84 [lng, lat] paths.
 *
 * The projection guard is the same one sketchGeometry.ts applies to a sketched
 * polygon: the stops go in as geographic points so the result normally comes
 * back geographic too, but reading `paths` raw from a projected polyline would
 * silently store coordinates in the millions.
 */
function toRoutePath(geometry: Polyline): RoutePath | null {
  const geographic = geometry.spatialReference?.isWGS84
    ? geometry
    : (webMercatorUtils.webMercatorToGeographic(geometry) as Polyline | null);

  const paths = geographic?.paths;
  if (!paths?.length) {
    return null;
  }
  return {
    paths: paths.map((path) => path.map((point) => [point[0], point[1]] as [number, number]))
  };
}

export const arcgisRouteService: RouteService = {
  async solve(from: MapLatLon, to: MapLatLon): Promise<RouteSolution | null> {
    const stops = new Collection([
      new Stop({ geometry: new Point({ latitude: from.latitude, longitude: from.longitude }) }),
      new Stop({ geometry: new Point({ latitude: to.latitude, longitude: to.longitude }) })
    ]);

    const params = new RouteParameters({
      stops,
      returnDirections: false,
      returnRoutes: true,
      // Traffic-adjusted travel time needs a start time - solving without one
      // understates Bangkok drive times by 40-45% (see the Phase 0 spike).
      startTime: new Date(),
      startTimeIsUTC: true
    });

    const solveResult = await route.solve(API_CONFIG.ARCGIS_ROUTE_URL, params);

    const routeGraphic = solveResult.routeResults?.[0]?.route;
    const geometry = routeGraphic?.geometry as Polyline | undefined;
    const attributes = (routeGraphic?.attributes ?? {}) as Record<string, unknown>;
    const distanceKm = toFiniteNumber(attributes.Total_Kilometers);
    const travelMinutes = toFiniteNumber(attributes.Total_TravelTime);

    if (!geometry || distanceKm === null || travelMinutes === null) {
      return null;
    }

    const path = toRoutePath(geometry);
    if (!path) {
      return null;
    }

    return { path, distanceKm, travelMinutes };
  }
};
