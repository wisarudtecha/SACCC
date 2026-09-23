// Grouping overlapping Device markers, and deciding whether zooming would help.
//
// A thin adapter over shared/proximityClustering.ts - same union-find and
// separation-zoom maths staff/Place clustering use. No availability concept,
// same as Place: a group carries only its members' ids and centroid.
import {
  getSeparationZoom as getSharedSeparationZoom,
  groupByProximity,
  DEFAULT_CLUSTER_RADIUS_PX,
  type ProximityPoint,
  type ScreenPoint
} from "../shared/proximityClustering";
import type { DeviceMarker } from "./deviceTypes";

export type { ScreenPoint };

export interface DeviceGroup {
  /** Sorted member ids joined. Stable across recomputes, same reason as staff. */
  id: string;
  deviceIds: string[];
  /** Centroid of the members - where the group's circle is drawn. */
  latitude: number;
  longitude: number;
  /**
   * Smallest pairwise screen distance, at the zoom this grouping was computed
   * at. Decides whether zooming in can separate the group.
   */
  minPairwisePx: number;
}

export interface DeviceGrouping {
  singles: DeviceMarker[];
  groups: DeviceGroup[];
}

export const DEVICE_CLUSTER_RADIUS_PX = DEFAULT_CLUSTER_RADIUS_PX;

interface DeviceProximityPoint extends ProximityPoint {
  marker: DeviceMarker;
}

export function groupDevicesByProximity(
  markers: readonly DeviceMarker[],
  toScreen: (marker: DeviceMarker) => ScreenPoint | null,
  radiusPx: number = DEVICE_CLUSTER_RADIUS_PX
): DeviceGrouping {
  const points: DeviceProximityPoint[] = markers.map((marker) => ({
    id: marker.deviceId,
    lat: marker.latitude,
    lon: marker.longitude,
    marker
  }));

  const grouping = groupByProximity(points, (point) => toScreen(point.marker), radiusPx);

  return {
    singles: grouping.singles.map((point) => point.marker),
    groups: grouping.groups.map((group) => ({
      id: group.id,
      deviceIds: group.members.map((point) => point.marker.deviceId).sort(),
      latitude: group.latitude,
      longitude: group.longitude,
      minPairwisePx: group.minPairwisePx
    }))
  };
}

/** See staffClusters.ts:getSeparationZoom for the maths and the two dead ends. */
export function getSeparationZoom(
  group: DeviceGroup,
  currentZoom: number,
  maxZoom: number,
  radiusPx: number = DEVICE_CLUSTER_RADIUS_PX
): number | null {
  return getSharedSeparationZoom(group, currentZoom, maxZoom, radiusPx);
}
