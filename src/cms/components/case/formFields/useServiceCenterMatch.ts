// Resolves which Service Center (Area) owns an incident coordinate, by testing
// the point against each Area's district polygon.
//
// Polygon containment is the ONLY matching mechanism (a confirmed stakeholder
// decision). The radius circle plays no part here - it is a fallback visual the
// caller draws when this hook reports `no-match`.
//
// "Match" = exactly one containing district. Zero, or more than one (not
// expected with clean admin-boundary data, but handled), both resolve to
// `no-match` - never an error state.
//
// The decision rule itself lives in serviceCenterMatch.ts as a pure function;
// this hook only adds the async concerns (fetch the districts, report idle /
// loading). Nothing here is persisted with the case.
import { useMemo } from "react";
import { useGetDistrictsQuery } from "@/cms/store/api/area";
import type { Area } from "@/cms/store/api/area";
import type { IncidentRadiusOverlay, MapLatLon } from "@/cms/components/case/createCase/map/mapTypes";
import { buildDistrictPolygonIndex, resolveServiceCenterMatch } from "./serviceCenterMatch";
import { useOrgIncidentRadiusMeters } from "./useOrgIncidentRadiusMeters";

export type ServiceCenterMatchStatus = "idle" | "loading" | "matched" | "no-match";

export interface ServiceCenterMatchResult {
  status: ServiceCenterMatchStatus;
  /** The single containing Service Center, on `matched` only. */
  matchedArea: Area | null;
  /**
   * The fallback circle to draw around the incident pin, on `no-match` only.
   * Null on every other status - the circle must never render when a match
   * succeeded, is pending, or matching is disabled.
   */
  incidentRadius: IncidentRadiusOverlay | null;
}

interface UseServiceCenterMatchOptions {
  /** The resolved incident coordinate, or null before one is placed. */
  incident: MapLatLon | null;
  /** The Area rows the manual picker also uses (one country+province+district triple each). */
  areaList: readonly Area[];
  /**
   * Run matching only where the Service Center field is editable at create time.
   * Edit-after-create screens already lock the field (capabilities.lockArea) and
   * must be left untouched, so they pass `false`.
   */
  enabled: boolean;
}

/** How many district rows to pull for containment testing. Area counts are in the tens. */
const DISTRICT_FETCH_LENGTH = 100000;

const IDLE: ServiceCenterMatchResult = { status: "idle", matchedArea: null, incidentRadius: null };

export function useServiceCenterMatch({
  incident,
  areaList,
  enabled
}: UseServiceCenterMatchOptions): ServiceCenterMatchResult {
  const shouldQuery = enabled && Boolean(incident);

  const {
    data: districtsResponse,
    isFetching,
    isSuccess,
    isError
  } = useGetDistrictsQuery({ start: 0, length: DISTRICT_FETCH_LENGTH }, { skip: !shouldQuery });

  const polygonByKey = useMemo(
    () => buildDistrictPolygonIndex(districtsResponse?.data ?? []),
    [districtsResponse]
  );

  const radiusMeters = useOrgIncidentRadiusMeters();

  return useMemo<ServiceCenterMatchResult>(() => {
    if (!enabled || !incident) {
      return IDLE;
    }
    // A failed district load leaves the manual picker fully usable; treat it as
    // "no unambiguous match" rather than surfacing an error the dispatcher can do
    // nothing about. No circle either - a radius over unknown coverage misleads.
    if (isError) {
      return { status: "no-match", matchedArea: null, incidentRadius: null };
    }
    if (isFetching || !isSuccess) {
      return { status: "loading", matchedArea: null, incidentRadius: null };
    }
    return resolveServiceCenterMatch({ incident, areaList, polygonByKey, radiusMeters });
  }, [enabled, incident, isError, isFetching, isSuccess, areaList, polygonByKey, radiusMeters]);
}
