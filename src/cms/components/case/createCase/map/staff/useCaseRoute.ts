// Solves, caches and rate-limits the officer -> case driving route.
//
// Solving is ALWAYS user-triggered - never on selection, never on a timer. Each
// solve costs ArcGIS credits (see docs/prompt-staff-map-route.md §6), so the
// only entry point is `solve()`, called from a "Calculate route" button.
//
// The displayed `routeState` is DERIVED every render from (a) the current
// officer+position+case key, (b) a precondition check on that key, (c) an
// in-flight/settled result stamped with the key it belongs to, and (d) the
// cache. Nothing is carried over across a key change: if the key differs from
// what a transient result was stamped with, that result is invisible. This is
// what guarantees a stale polyline can never survive a selection change -
// there is no leftover state to forget to clear.
import { useCallback, useEffect, useRef, useState } from "react";
import * as route from "@arcgis/core/rest/route.js";
import RouteParameters from "@arcgis/core/rest/support/RouteParameters.js";
import Stop from "@arcgis/core/rest/support/Stop.js";
import Collection from "@arcgis/core/core/Collection.js";
import Point from "@arcgis/core/geometry/Point.js";
import type Polyline from "@arcgis/core/geometry/Polyline.js";
import { API_CONFIG } from "@/core/config/api";
import type { ArcgisLatLon } from "../ArcgisAddressMap";
import { buildRouteKey, type RouteResult, type RouteState } from "./routeTypes";
import { isMappableCoordinate, isStaleLocation, type StaffMarker } from "./staffTypes";
import { STAFF_REFRESH_COOLDOWN_MS } from "./useStaffPositions";

/** Same floor as the staff refresh button - see useStaffPositions.ts. */
const ROUTE_SOLVE_COOLDOWN_MS = STAFF_REFRESH_COOLDOWN_MS;

/** Oldest entry is evicted once the cache would grow past this. */
const CACHE_MAX_ENTRIES = 20;

interface UseCaseRouteOptions {
  /** The officer the panel is currently showing, or null when nothing is selected. */
  marker: StaffMarker | null;
  /** The open case's location. */
  caseLocation: ArcgisLatLon | null;
}

export interface UseCaseRouteResult {
  routeState: RouteState;
  /** False while a precondition fails, a solve is in flight, or the cooldown is armed. */
  canSolve: boolean;
  /** Seconds left before another solve is allowed; 0 when not cooling down. */
  cooldownSeconds: number;
  solve: () => void;
}

function toFiniteNumber(value: unknown): number | null {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function cacheRoute(cache: Map<string, RouteResult>, key: string, result: RouteResult): void {
  cache.delete(key);
  cache.set(key, result);
  if (cache.size > CACHE_MAX_ENTRIES) {
    const oldestKey = cache.keys().next().value;
    if (oldestKey !== undefined) {
      cache.delete(oldestKey);
    }
  }
}

export function useCaseRoute({ marker, caseLocation }: UseCaseRouteOptions): UseCaseRouteResult {
  const cacheRef = useRef<Map<string, RouteResult>>(new Map());
  // The last solve's outcome, stamped with the key it was solved for. Only
  // rendered when that key still matches the CURRENT key - see header comment.
  const [transient, setTransient] = useState<{ key: string; state: RouteState } | null>(null);
  const [cooldownUntil, setCooldownUntil] = useState(0);
  // Write-only: bumping it re-renders so `canSolve` is re-evaluated once the
  // cooldown expires, mirroring useStaffPositions.ts.
  const [, setCooldownTick] = useState(0);

  const staffPosition =
    marker && isMappableCoordinate(marker.latitude, marker.longitude) ? marker : null;
  const caseMappable =
    caseLocation && isMappableCoordinate(caseLocation.latitude, caseLocation.longitude)
      ? caseLocation
      : null;

  // In order: no case location beats no staff position, matching §7 of the brief.
  // The "no staff position" arm is defensive only - toStaffMarkers already drops
  // unmappable units before they ever become a StaffMarker.
  const precondition =
    marker && !caseMappable
      ? ("no-case-location" as const)
      : marker && !staffPosition
        ? ("no-staff-position" as const)
        : null;

  const currentKey =
    marker && staffPosition && caseMappable
      ? buildRouteKey(
          marker.unitId,
          staffPosition.latitude,
          staffPosition.longitude,
          caseMappable.latitude,
          caseMappable.longitude
        )
      : null;

  useEffect(() => {
    const remainingMs = cooldownUntil - Date.now();
    if (remainingMs <= 0) {
      return;
    }
    const timeoutId = setTimeout(() => setCooldownTick((tick) => tick + 1), remainingMs);
    return () => clearTimeout(timeoutId);
  }, [cooldownUntil]);

  const cached = currentKey ? (cacheRef.current.get(currentKey) ?? null) : null;

  const routeState: RouteState = precondition
    ? { status: "error", reason: precondition }
    : transient && transient.key === currentKey
      ? transient.state
      : cached
        ? { status: "ready", result: cached }
        : { status: "idle" };

  const cooldownRemainingMs = cooldownUntil - Date.now();
  const cooldownSeconds = cooldownRemainingMs > 0 ? Math.ceil(cooldownRemainingMs / 1000) : 0;

  const canSolve =
    Boolean(currentKey) &&
    !precondition &&
    routeState.status !== "solving" &&
    cooldownRemainingMs <= 0;

  const solve = useCallback(() => {
    if (!currentKey || !marker || !staffPosition || !caseMappable) {
      return;
    }
    const key = currentKey;
    const isFromStalePosition = isStaleLocation(marker);

    setTransient({ key, state: { status: "solving" } });
    setCooldownUntil(Date.now() + ROUTE_SOLVE_COOLDOWN_MS);

    const stops = new Collection([
      new Stop({
        geometry: new Point({ latitude: staffPosition.latitude, longitude: staffPosition.longitude })
      }),
      new Stop({
        geometry: new Point({ latitude: caseMappable.latitude, longitude: caseMappable.longitude })
      })
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

    route
      .solve(API_CONFIG.ARCGIS_ROUTE_URL, params)
      .then((solveResult) => {
        const routeGraphic = solveResult.routeResults?.[0]?.route;
        const geometry = routeGraphic?.geometry as Polyline | undefined;
        const attributes = (routeGraphic?.attributes ?? {}) as Record<string, unknown>;
        const distanceKm = toFiniteNumber(attributes.Total_Kilometers);
        const travelMinutes = toFiniteNumber(attributes.Total_TravelTime);

        if (!geometry || distanceKm === null || travelMinutes === null) {
          setTransient((previous) =>
            previous?.key === key ? { key, state: { status: "error", reason: "no-metrics" } } : previous
          );
          return;
        }

        const result: RouteResult = {
          geometry,
          distanceKm,
          travelMinutes,
          solvedAtMs: Date.now(),
          isFromStalePosition
        };
        cacheRoute(cacheRef.current, key, result);
        setTransient((previous) =>
          previous?.key === key ? { key, state: { status: "ready", result } } : previous
        );
      })
      .catch((error: unknown) => {
        console.error("Failed to solve the officer-to-case route", error);
        setTransient((previous) =>
          previous?.key === key ? { key, state: { status: "error", reason: "solve-failed" } } : previous
        );
      });
  }, [currentKey, marker, staffPosition, caseMappable]);

  return { routeState, canSolve, cooldownSeconds, solve };
}
