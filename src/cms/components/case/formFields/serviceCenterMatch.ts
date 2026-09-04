// The pure core of the incident -> Service Center match.
//
// Split out of useServiceCenterMatch so the decision rule can be tested without
// React or RTK Query. The hook keeps the async concerns (fetching districts,
// idle / loading status); everything here is a plain function of its inputs.
//
// Rule (confirmed with the stakeholder):
//   - exactly one Area whose district polygon contains the point  -> `matched`,
//     that Area is adopted and the field locks for the create flow.
//   - zero, or more than one                                      -> `no-match`,
//     the field stays manually selectable and the caller draws the radius
//     circle as a decision aid.
// Nothing here is persisted with the case.
import type { Area } from "@/cms/store/api/area";
import type { AreaDistrict, PolygonCoordinates } from "@/cms/types/area";
import type { IncidentRadiusOverlay, MapLatLon } from "@/cms/components/case/createCase/map/mapTypes";
import { isPointInPolygon } from "@/cms/utils/pointInPolygon";

export type ResolvedMatchStatus = "matched" | "no-match";

export interface ResolvedServiceCenterMatch {
  status: ResolvedMatchStatus;
  /** The single containing Service Center, on `matched` only. */
  matchedArea: Area | null;
  /** The fallback circle, on `no-match` only. Null when a match succeeded. */
  incidentRadius: IncidentRadiusOverlay | null;
}

/** Key an Area / district on the full triple - `distId` alone is not unique across provinces. */
export const districtKey = (row: {
  countryId?: string;
  provId?: string;
  distId?: string;
}): string => `${row.countryId ?? ""}/${row.provId ?? ""}/${row.distId ?? ""}`;

/** district triple -> its polygon rings, skipping rows with no usable geometry. */
export function buildDistrictPolygonIndex(
  rows: readonly (Partial<AreaDistrict> | null | undefined)[]
): Map<string, PolygonCoordinates> {
  const index = new Map<string, PolygonCoordinates>();
  rows.forEach(row => {
    if (row?.distId && Array.isArray(row.coordinates) && row.coordinates.length > 0) {
      index.set(districtKey(row), row.coordinates);
    }
  });
  return index;
}

interface ResolveOptions {
  incident: MapLatLon;
  areaList: readonly Area[];
  polygonByKey: ReadonlyMap<string, PolygonCoordinates>;
  /** Org-configured circle radius for the no-match path (see useOrgIncidentRadiusMeters). */
  radiusMeters: number;
}

export function resolveServiceCenterMatch({
  incident,
  areaList,
  polygonByKey,
  radiusMeters
}: ResolveOptions): ResolvedServiceCenterMatch {
  const point: [number, number] = [incident.longitude, incident.latitude];

  const containing = areaList.filter(area => {
    const rings = polygonByKey.get(districtKey(area));
    return rings ? isPointInPolygon(point, rings) : false;
  });

  if (containing.length === 1) {
    return { status: "matched", matchedArea: containing[0], incidentRadius: null };
  }

  return {
    status: "no-match",
    matchedArea: null,
    incidentRadius: { center: incident, radiusMeters }
  };
}
