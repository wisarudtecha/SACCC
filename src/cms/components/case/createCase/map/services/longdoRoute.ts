// Route solving on Longdo's RouteService JSON API.
//
// METRICS ONLY, and that is not an omission. The API answers with turn-by-turn
// guidance - each step's road name, distance and interval - plus totals, and no
// geometry whatsoever. Four request shapes were tried against the live service
// (`/route/guide`, the same with `path=1`, `/route`, `/route/path`); none
// returned a coordinate list. So `path` is always null here, and a Longdo map
// draws its route line by handing the endpoints to the SDK's own router - see
// useLongdoRouteOverlay.
//
// This is still the right home for the solve, because the caller that needs it
// MOST needs no line at all: useClusterRouteSummaries solves one route per
// cluster member to render a distance and an ETA as text, and doing that
// through a map-bound router is not possible.
import { API_CONFIG } from "@/core/config/api";
import type { MapLatLon } from "../mapTypes";
import type { RouteService, RouteSolution } from "./routeService";

const ROUTE_URL = "https://api.longdo.com/RouteService/json/route/guide";

/**
 * `t` asks the router to account for traffic, which is the same intent the
 * ArcGIS solve expresses by passing a `startTime` - without it Bangkok drive
 * times are badly understated. `type=25` is the vehicle profile the service
 * defaults to for a car.
 */
const ROUTE_MODE = "t";
const ROUTE_TYPE = "25";

interface LongdoRouteLeg {
  /** Total distance in METRES. */
  distance?: unknown;
  /** Total travel time in SECONDS. */
  interval?: unknown;
}

function toFiniteNumber(value: unknown): number | null {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export const longdoRouteService: RouteService = {
  async solve(from: MapLatLon, to: MapLatLon): Promise<RouteSolution | null> {
    const url =
      `${ROUTE_URL}?flon=${from.longitude}&flat=${from.latitude}` +
      `&tlon=${to.longitude}&tlat=${to.latitude}` +
      `&mode=${ROUTE_MODE}&type=${ROUTE_TYPE}` +
      `&key=${encodeURIComponent(API_CONFIG.LONGDO_API_KEY)}`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Longdo route request failed with ${response.status}`);
    }

    const parsed: unknown = await response.json();
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return null;
    }

    const legs = (parsed as { data?: unknown }).data;
    if (!Array.isArray(legs) || legs.length === 0) {
      // A route the service could not find comes back with an empty `data`, not
      // an error status - reported as "no metrics", the same way an ArcGIS solve
      // that returns a graphic without totals is.
      return null;
    }

    const leg = legs[0] as LongdoRouteLeg;
    const metres = toFiniteNumber(leg?.distance);
    const seconds = toFiniteNumber(leg?.interval);
    if (metres === null || seconds === null) {
      return null;
    }

    return {
      // No geometry to hand back - see the header.
      path: null,
      distanceKm: metres / 1000,
      travelMinutes: seconds / 60
    };
  }
};
