// Grouping overlapping Place markers, and deciding whether zooming would help.
//
// A thin adapter over shared/proximityClustering.ts - same union-find and
// separation-zoom maths staff clustering uses (see staffClusters.ts), with no
// staff-only concept attached: a Place has no availability, so a group carries
// no colour ranking, only its members' ids and centroid.
import {
  getSeparationZoom as getSharedSeparationZoom,
  groupByProximity,
  DEFAULT_CLUSTER_RADIUS_PX,
  type ProximityPoint,
  type ScreenPoint
} from "../shared/proximityClustering";
import type { PlaceMarker } from "./placeTypes";

export type { ScreenPoint };

export interface PlaceGroup {
  /** Sorted member ids joined. Stable across recomputes, same reason as staff. */
  id: string;
  placeIds: string[];
  /** Centroid of the members - where the group's circle is drawn. */
  latitude: number;
  longitude: number;
  /**
   * Smallest pairwise screen distance, at the zoom this grouping was computed
   * at. Decides whether zooming in can separate the group.
   */
  minPairwisePx: number;
}

export interface PlaceGrouping {
  singles: PlaceMarker[];
  groups: PlaceGroup[];
}

export const PLACE_CLUSTER_RADIUS_PX = DEFAULT_CLUSTER_RADIUS_PX;

interface PlaceProximityPoint extends ProximityPoint {
  marker: PlaceMarker;
}

export function groupPlacesByProximity(
  markers: readonly PlaceMarker[],
  toScreen: (marker: PlaceMarker) => ScreenPoint | null,
  radiusPx: number = PLACE_CLUSTER_RADIUS_PX
): PlaceGrouping {
  const points: PlaceProximityPoint[] = markers.map((marker) => ({
    id: marker.id,
    lat: marker.latitude,
    lon: marker.longitude,
    marker
  }));

  const grouping = groupByProximity(points, (point) => toScreen(point.marker), radiusPx);

  return {
    singles: grouping.singles.map((point) => point.marker),
    groups: grouping.groups.map((group) => ({
      id: group.id,
      placeIds: group.members.map((point) => point.marker.id).sort(),
      latitude: group.latitude,
      longitude: group.longitude,
      minPairwisePx: group.minPairwisePx
    }))
  };
}

/** See staffClusters.ts:getSeparationZoom for the maths and the two dead ends. */
export function getSeparationZoom(
  group: PlaceGroup,
  currentZoom: number,
  maxZoom: number,
  radiusPx: number = PLACE_CLUSTER_RADIUS_PX
): number | null {
  return getSharedSeparationZoom(group, currentZoom, maxZoom, radiusPx);
}
