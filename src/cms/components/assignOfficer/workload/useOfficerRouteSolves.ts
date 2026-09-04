// On-demand officer -> case driving-route solves for the assignment picker, one
// per candidate row.
//
// This is a SEPARATE hook from the map panel's `useCaseRoute` /
// `useClusterRouteSummaries`, for the same reason those two are separate from
// each other (see the header of useClusterRouteSummaries.ts): the picker needs N
// officers, a MANUAL per-row "Calculate" button (never automatic — Decision #3),
// and an indefinite cache. It reuses everything that actually solves a route —
// `routeService` (the ArcGIS/Longdo/MapTiler provider switch), `buildRouteKey`,
// and the `RouteState` / `RouteResult` types — and adds nothing new to route
// solving. Switching the Recommend / All Officer tabs never calls in here.
//
// Failure is isolated: a solve that rejects surfaces as that row's own
// `{ status: "error" }` and touches nothing else.
import { useCallback, useMemo, useRef, useState } from "react";
import type { Unit } from "@/cms/types/dispatch";
import type { MapLatLon } from "@/cms/components/case/createCase/map/mapTypes";
import { routeService } from "@/cms/components/case/createCase/map/services/routeService";
import {
  buildRouteKey,
  type RouteResult,
  type RouteState,
} from "@/cms/components/case/createCase/map/staff/routeTypes";
import {
  isMappableCoordinate,
  isStaleTimestamp,
} from "@/cms/components/case/createCase/map/staff/staffTypes";

/** One press per this window per row — mirrors the map panel's route cooldown. */
const ROUTE_SOLVE_COOLDOWN_MS = 10_000;

/** Oldest entry evicted past this. Bigger than the single-officer cache: the
 *  picker can solve every visible row over the life of one modal session. */
const CACHE_MAX_ENTRIES = 50;

export interface UseOfficerRouteSolvesResult {
  /** Current display state for a row. `idle` until the dispatcher calculates. */
  routeStateFor: (unitId: string) => RouteState;
  /** False while a precondition fails, a solve is in flight, or the cooldown is armed. */
  canSolve: (unitId: string) => boolean;
  /** Seconds until another solve is allowed for this row; 0 when not cooling down. */
  cooldownSeconds: (unitId: string) => number;
  solve: (unitId: string) => void;
}

interface OfficerRouteContext {
  position: MapLatLon | null;
  isStalePosition: boolean;
  key: string | null;
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

interface UseOfficerRouteSolvesOptions {
  officers: readonly Unit[];
  /** The open case's location, from `caseData.caseLat` / `caseLon`. */
  caseLocation: MapLatLon | null;
}

export function useOfficerRouteSolves({
  officers,
  caseLocation,
}: UseOfficerRouteSolvesOptions): UseOfficerRouteSolvesResult {
  const cacheRef = useRef<Map<string, RouteResult>>(new Map());
  // Last solve outcome per row, stamped with the route key it belongs to. A row
  // whose key has since changed (case moved, officer moved far enough) falls
  // back to cache/idle — a stale metric can't linger. Same guarantee as
  // useCaseRoute's `transient`.
  const [transientByUnitId, setTransientByUnitId] = useState<
    Record<string, { key: string; state: RouteState }>
  >({});
  const [cooldownUntilByUnitId, setCooldownUntilByUnitId] = useState<Record<string, number>>({});
  // Write-only: bumped so `cooldownSeconds` re-reads the clock after a solve.
  const [, setTick] = useState(0);

  const caseMappable = useMemo<MapLatLon | null>(() => {
    if (!caseLocation) {
      return null;
    }
    return isMappableCoordinate(caseLocation.latitude, caseLocation.longitude) ? caseLocation : null;
  }, [caseLocation]);

  const contextByUnitId = useMemo<Record<string, OfficerRouteContext>>(() => {
    return officers.reduce<Record<string, OfficerRouteContext>>((accumulator, officer) => {
      const latitude = Number(officer.locLat);
      const longitude = Number(officer.locLon);
      const hasPosition =
        Number.isFinite(latitude) &&
        Number.isFinite(longitude) &&
        isMappableCoordinate(latitude, longitude);
      const position = hasPosition ? { latitude, longitude } : null;

      accumulator[officer.unitId] = {
        position,
        isStalePosition: isStaleTimestamp(officer.locLastUpdateTime ?? ""),
        key:
          position && caseMappable
            ? buildRouteKey(
                officer.unitId,
                position.latitude,
                position.longitude,
                caseMappable.latitude,
                caseMappable.longitude
              )
            : null,
      };
      return accumulator;
    }, {});
  }, [officers, caseMappable]);

  const routeStateFor = useCallback(
    (unitId: string): RouteState => {
      const context = contextByUnitId[unitId];
      if (!context) {
        return { status: "idle" };
      }
      // "no case location" beats "no staff position" — same order as useCaseRoute.
      if (!caseMappable) {
        return { status: "error", reason: "no-case-location" };
      }
      if (!context.position || !context.key) {
        return { status: "error", reason: "no-staff-position" };
      }
      const transient = transientByUnitId[unitId];
      if (transient && transient.key === context.key) {
        return transient.state;
      }
      const cached = cacheRef.current.get(context.key);
      return cached ? { status: "ready", result: cached } : { status: "idle" };
    },
    [contextByUnitId, caseMappable, transientByUnitId]
  );

  const cooldownRemainingMs = useCallback(
    (unitId: string): number => Math.max(0, (cooldownUntilByUnitId[unitId] ?? 0) - Date.now()),
    [cooldownUntilByUnitId]
  );

  const cooldownSeconds = useCallback(
    (unitId: string): number => {
      const remaining = cooldownRemainingMs(unitId);
      return remaining > 0 ? Math.ceil(remaining / 1000) : 0;
    },
    [cooldownRemainingMs]
  );

  const canSolve = useCallback(
    (unitId: string): boolean => {
      const context = contextByUnitId[unitId];
      if (!context || !context.key || !context.position || !caseMappable) {
        return false;
      }
      if (routeStateFor(unitId).status === "solving") {
        return false;
      }
      return cooldownRemainingMs(unitId) <= 0;
    },
    [contextByUnitId, caseMappable, routeStateFor, cooldownRemainingMs]
  );

  const solve = useCallback(
    (unitId: string): void => {
      const context = contextByUnitId[unitId];
      if (!context || !context.key || !context.position || !caseMappable) {
        return;
      }
      const key = context.key;
      const from = context.position;
      const isFromStalePosition = context.isStalePosition;

      setTransientByUnitId((previous) => ({
        ...previous,
        [unitId]: { key, state: { status: "solving" } },
      }));
      setCooldownUntilByUnitId((previous) => ({
        ...previous,
        [unitId]: Date.now() + ROUTE_SOLVE_COOLDOWN_MS,
      }));
      // Re-render once the cooldown expires so `canSolve` flips back.
      window.setTimeout(() => setTick((tick) => tick + 1), ROUTE_SOLVE_COOLDOWN_MS + 50);

      routeService
        .solve(from, caseMappable)
        .then((solution) => {
          if (!solution) {
            setTransientByUnitId((previous) =>
              previous[unitId]?.key === key
                ? { ...previous, [unitId]: { key, state: { status: "error", reason: "no-metrics" } } }
                : previous
            );
            return;
          }
          const result: RouteResult = {
            geometry: solution.path,
            distanceKm: solution.distanceKm,
            travelMinutes: solution.travelMinutes,
            solvedAtMs: Date.now(),
            isFromStalePosition,
          };
          cacheRoute(cacheRef.current, key, result);
          setTransientByUnitId((previous) =>
            previous[unitId]?.key === key
              ? { ...previous, [unitId]: { key, state: { status: "ready", result } } }
              : previous
          );
        })
        .catch((error: unknown) => {
          console.error("Failed to solve an officer-to-case route in the assignment picker", error);
          setTransientByUnitId((previous) =>
            previous[unitId]?.key === key
              ? { ...previous, [unitId]: { key, state: { status: "error", reason: "solve-failed" } } }
              : previous
          );
        });
    },
    [contextByUnitId, caseMappable]
  );

  return { routeStateFor, canSolve, cooldownSeconds, solve };
}
