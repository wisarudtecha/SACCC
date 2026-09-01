// Solves a distance/ETA summary for EVERY member of the currently open staff
// cluster (StaffGroupPanel), automatically - no button, no drawn polyline.
//
// This is deliberately a SEPARATE hook from useCaseRoute.ts, with its own
// cache, rather than sharing state: useCaseRoute is built around one officer,
// a manual "Calculate route" button, and an indefinite cache. A cluster needs
// N officers, an automatic solve on open, and a short TTL so a dispatcher
// toggling the panel doesn't re-spend ArcGIS credits - different enough shapes
// that forcing them through one state machine would deform both. The ~10-line
// cache-eviction logic is duplicated rather than shared for the same reason.
//
// ClosestFacility (which would batch this into one request instead of N) is
// NOT entitled on this key - confirmed via a live 403 against the World
// ClosestFacility service. Each member is solved with the same World Route
// service useCaseRoute.ts already uses.
import { useEffect, useMemo, useRef, useState } from "react";
import type { MapLatLon } from "../mapTypes";
import { routeService } from "../services/routeService";
import { buildRouteKey, type RouteResult, type RouteState } from "./routeTypes";
import { isMappableCoordinate, isStaleLocation, type StaffMarker } from "./staffTypes";

/** Reopening the same cluster within this window reuses cached results. */
const CLUSTER_ROUTE_TTL_MS = 90_000;

/** Oldest entry is evicted once the cache would grow past this. No cap on
 *  cluster size means this needs more headroom than the single-officer cache. */
const CACHE_MAX_ENTRIES = 50;

interface CacheEntry {
  result: RouteResult;
  solvedAtMs: number;
}

interface UseClusterRouteSummariesOptions {
  /** The officers in the open cluster, or null while no cluster panel is open. */
  members: readonly StaffMarker[] | null;
  caseLocation: MapLatLon | null;
}

export interface ClusterMemberRoute {
  unitId: string;
  state: RouteState;
}

export interface UseClusterRouteSummariesResult {
  /** One entry per member, in `members` order. */
  routes: readonly ClusterMemberRoute[];
}

function cacheRoute(cache: Map<string, CacheEntry>, key: string, entry: CacheEntry): void {
  cache.delete(key);
  cache.set(key, entry);
  if (cache.size > CACHE_MAX_ENTRIES) {
    const oldestKey = cache.keys().next().value;
    if (oldestKey !== undefined) {
      cache.delete(oldestKey);
    }
  }
}

interface MemberKey {
  unitId: string;
  marker: StaffMarker;
  caseLat: number;
  caseLon: number;
  key: string;
}

export function useClusterRouteSummaries({
  members,
  caseLocation
}: UseClusterRouteSummariesOptions): UseClusterRouteSummariesResult {
  const cacheRef = useRef<Map<string, CacheEntry>>(new Map());
  const [resultsByUnitId, setResultsByUnitId] = useState<Record<string, RouteState>>({});
  // Bumped on every effect run; a response is applied only if it still matches
  // the generation it was solved for - guards against a slow response landing
  // after the panel closed, or after the same cluster was reopened and raced
  // a fresh request against a stale one.
  const generationRef = useRef(0);

  const caseMappable =
    caseLocation && isMappableCoordinate(caseLocation.latitude, caseLocation.longitude)
      ? caseLocation
      : null;

  // Only members with a usable position get solved; the rest surface a
  // permanent "no-staff-position" error below, same ordering useCaseRoute uses.
  const memberKeys = useMemo<readonly MemberKey[]>(() => {
    if (!members || !caseMappable) {
      return [];
    }
    return members
      .filter((marker) => isMappableCoordinate(marker.latitude, marker.longitude))
      .map((marker) => ({
        unitId: marker.unitId,
        marker,
        caseLat: caseMappable.latitude,
        caseLon: caseMappable.longitude,
        key: buildRouteKey(
          marker.unitId,
          marker.latitude,
          marker.longitude,
          caseMappable.latitude,
          caseMappable.longitude
        )
      }));
  }, [members, caseMappable]);

  // Read via a ref inside the effect below so the effect can be keyed on the
  // cheap, stable SIGNATURE string rather than `memberKeys`' object identity,
  // which changes every time the staff position poll returns a new array even
  // when nothing relevant actually moved.
  const memberKeysRef = useRef(memberKeys);
  memberKeysRef.current = memberKeys;

  const keysSignature = useMemo(
    () =>
      memberKeys
        .map((entry) => entry.key)
        .sort()
        .join(","),
    [memberKeys]
  );

  useEffect(() => {
    const keys = memberKeysRef.current;
    if (keys.length === 0) {
      return;
    }

    generationRef.current += 1;
    const myGeneration = generationRef.current;

    keys.forEach(({ unitId, marker, caseLat, caseLon, key }) => {
      const cached = cacheRef.current.get(key);
      if (cached && Date.now() - cached.solvedAtMs < CLUSTER_ROUTE_TTL_MS) {
        setResultsByUnitId((previous) => ({
          ...previous,
          [unitId]: { status: "ready", result: cached.result }
        }));
        return;
      }

      const isFromStalePosition = isStaleLocation(marker);
      setResultsByUnitId((previous) => ({ ...previous, [unitId]: { status: "solving" } }));

      routeService
        .solve(marker, { latitude: caseLat, longitude: caseLon })
        .then((solution) => {
          if (generationRef.current !== myGeneration) {
            return;
          }

          if (!solution) {
            setResultsByUnitId((previous) => ({
              ...previous,
              [unitId]: { status: "error", reason: "no-metrics" }
            }));
            return;
          }

          const result: RouteResult = {
            geometry: solution.path,
            distanceKm: solution.distanceKm,
            travelMinutes: solution.travelMinutes,
            solvedAtMs: Date.now(),
            isFromStalePosition
          };
          cacheRoute(cacheRef.current, key, { result, solvedAtMs: result.solvedAtMs });
          setResultsByUnitId((previous) => ({ ...previous, [unitId]: { status: "ready", result } }));
        })
        .catch((error: unknown) => {
          if (generationRef.current !== myGeneration) {
            return;
          }
          console.error("Failed to solve a cluster member's route", error);
          setResultsByUnitId((previous) => ({
            ...previous,
            [unitId]: { status: "error", reason: "solve-failed" }
          }));
        });
    });
  }, [keysSignature]);

  const routes = useMemo<readonly ClusterMemberRoute[]>(() => {
    if (!members) {
      return [];
    }
    return members.map((marker) => {
      if (!caseMappable) {
        return { unitId: marker.unitId, state: { status: "error", reason: "no-case-location" } };
      }
      if (!isMappableCoordinate(marker.latitude, marker.longitude)) {
        return { unitId: marker.unitId, state: { status: "error", reason: "no-staff-position" } };
      }
      return { unitId: marker.unitId, state: resultsByUnitId[marker.unitId] ?? { status: "idle" } };
    });
  }, [members, caseMappable, resultsByUnitId]);

  return { routes };
}
