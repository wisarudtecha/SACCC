// Types for the officer -> case driving route (Smart Routing Engine / ETA-TTL
// sections). See useCaseRoute.ts for the state machine that produces these.
import type { RoutePath } from "../mapTypes";

export type RouteErrorReason =
  | "no-case-location"
  | "no-staff-position"
  | "solve-failed"
  | "no-metrics";

export interface RouteResult {
  /**
   * The solved line, or null when the provider's router returns metrics only
   * (Longdo). The map draws such a route from its endpoints instead - see
   * RouteOverlay in mapTypes.ts.
   */
  geometry: RoutePath | null;
  distanceKm: number;
  travelMinutes: number;
  /** When the solve completed - both ETA and TTL are derived from this, not "now". */
  solvedAtMs: number;
  /** True when the officer's reported position was already stale at solve time. */
  isFromStalePosition: boolean;
}

export type RouteState =
  | { status: "idle" }
  | { status: "solving" }
  | { status: "ready"; result: RouteResult }
  | { status: "error"; reason: RouteErrorReason };

/**
 * Coordinates rounded to ~11m so GPS jitter between refreshes does not
 * invalidate a cached solve for a stationary or slow-moving officer.
 */
const CACHE_COORD_PRECISION = 4;

function roundCoord(value: number): number {
  return Number(value.toFixed(CACHE_COORD_PRECISION));
}

/** Cache/request key: identifies "this officer, at this position, to this case". */
export function buildRouteKey(
  unitId: string,
  staffLat: number,
  staffLon: number,
  caseLat: number,
  caseLon: number
): string {
  return [
    unitId,
    roundCoord(staffLat),
    roundCoord(staffLon),
    roundCoord(caseLat),
    roundCoord(caseLon)
  ].join(":");
}
