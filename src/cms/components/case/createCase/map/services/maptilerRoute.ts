// Route solving on the OpenRouteService directions API.
//
// MapTiler has no routing API of its own, so the MapTiler provider borrows ORS
// for the officer -> case driving route. Reached through routeService.ts's
// dynamic import, the same way arcgisRoute / longdoRoute are.
//
// Unlike Longdo's router, ORS DOES return geometry: the `geojson` endpoint
// answers with a LineString plus a distance/duration summary, so this behaves
// like the ArcGIS solve (path + metrics) rather than the Longdo one (metrics
// only, map re-solves for the line). A MapTiler route overlay draws the returned
// `path` directly - see useMapTilerRouteOverlay.
//
// No traffic adjustment: ORS `driving-car` estimates free-flow times. There is
// no `startTime` equivalent, so Bangkok drive times run optimistic. Accepted -
// a rough ETA still beats none, and this is the trade for a provider that does
// not depend on the referrer-locked ArcGIS key.
import { API_CONFIG } from "@/core/config/api";
import type { MapLatLon, RoutePath } from "../mapTypes";
import type { RouteService, RouteSolution } from "./routeService";

const DIRECTIONS_URL =
  "https://api.openrouteservice.org/v2/directions/driving-car/geojson";

interface OrsSummary {
  /** Metres. */
  distance?: unknown;
  /** Seconds. */
  duration?: unknown;
}

interface OrsFeature {
  geometry?: { type?: string; coordinates?: unknown };
  properties?: { summary?: OrsSummary };
}

function toFiniteNumber(value: unknown): number | null {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

/** ORS LineString coordinates -> the RoutePath shape (one path of [lng, lat] pairs). */
function toRoutePath(coordinates: unknown): RoutePath | null {
  if (!Array.isArray(coordinates) || coordinates.length < 2) {
    return null;
  }
  const path = coordinates.reduce<[number, number][]>((points, point) => {
    if (
      Array.isArray(point) &&
      typeof point[0] === "number" &&
      typeof point[1] === "number" &&
      Number.isFinite(point[0]) &&
      Number.isFinite(point[1])
    ) {
      points.push([point[0], point[1]]);
    }
    return points;
  }, []);
  return path.length >= 2 ? { paths: [path] } : null;
}

export const maptilerRouteService: RouteService = {
  async solve(from: MapLatLon, to: MapLatLon): Promise<RouteSolution | null> {
    const key = API_CONFIG.ORS_API_KEY;
    if (!key) {
      throw new Error("VITE_ORS_API_KEY is not set - the MapTiler map cannot solve routes");
    }

    const response = await fetch(DIRECTIONS_URL, {
      method: "POST",
      headers: {
        Authorization: key,
        "Content-Type": "application/json",
        Accept: "application/geo+json"
      },
      body: JSON.stringify({
        coordinates: [
          [from.longitude, from.latitude],
          [to.longitude, to.latitude]
        ]
      })
    });

    if (response.status === 404) {
      // ORS reports "no routable path" as a 404 with an error body - distinct
      // from a transport failure. Reported as "no-metrics", the same way an
      // ArcGIS solve that returns a graphic without totals is.
      return null;
    }
    if (!response.ok) {
      throw new Error(`OpenRouteService request failed with ${response.status}`);
    }

    const parsed: unknown = await response.json();
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return null;
    }

    const features = (parsed as { features?: unknown }).features;
    if (!Array.isArray(features) || features.length === 0) {
      return null;
    }

    const feature = features[0] as OrsFeature;
    const summary = feature.properties?.summary ?? {};
    const metres = toFiniteNumber(summary.distance);
    const seconds = toFiniteNumber(summary.duration);
    if (metres === null || seconds === null) {
      return null;
    }

    return {
      path: toRoutePath(feature.geometry?.coordinates),
      distanceKm: metres / 1000,
      travelMinutes: seconds / 60
    };
  }
};
