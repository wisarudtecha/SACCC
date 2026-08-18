// Accumulates where each officer has been, for the breadcrumb trail.
//
// This is a SESSION trail, not a history. There is no endpoint that returns a
// unit's past positions - MOB's UpdateUserTracking is the mobile app writing its
// own track, and nothing reads it back - so the only path anyone can draw is the
// one observed while the layer was open. It starts empty, and it is gone on
// reload. The copy in the tracking section says so; do not let it drift into
// claiming otherwise.
//
// What makes it worth drawing at all is cadence. The analysis brief dismissed a
// session trail as "four points half an hour apart", and it was right to at the
// time: positions then only moved when the unit list was refetched. TRACKING
// events changed that, and a trail sampled at reporting cadence is a real path.
//
// Fed from the `staff` array rather than from the socket directly, so it
// inherits useStaffPositions' coalescing and its validation - a point can only
// enter a trail if toStaffMarkers was willing to draw a marker at it.
import { useEffect, useState } from "react";
import type { StaffMarker } from "./staffTypes";

export interface TrailPoint {
  latitude: number;
  longitude: number;
  /** Epoch ms of the fix, or of the observation when the unit reported no fix time. */
  atMs: number;
}

/**
 * How far a unit must move before the trail records it again.
 *
 * Without this a parked unit reporting every few seconds would stack thousands
 * of identical points on one spot - all the cost of a long trail, none of the
 * information. Set above typical GPS jitter so a stationary vehicle does not
 * draw a small angry scribble where it is standing.
 */
const TRAIL_MIN_MOVE_METERS = 10;

/** Hard cap per unit, so a long shift cannot grow the trail without limit. */
const TRAIL_MAX_POINTS = 200;

/** How far back a trail reaches. Older points are dropped as new ones arrive. */
const TRAIL_WINDOW_MS = 30 * 60 * 1000;

/**
 * A line needs two ends; one observed position is a dot, not a trail. Shared so
 * the control that offers the trail and the layer that draws it cannot disagree
 * about whether there is one - a button that does nothing when pressed is worse
 * than a button that is plainly not available yet.
 */
export const MIN_TRAIL_POINTS = 2;

const EARTH_RADIUS_M = 6_371_000;

/**
 * Equirectangular approximation, which at a ten-metre threshold is accurate to
 * far better than the GPS reading it is filtering. Haversine would cost more
 * trigonometry per point to decide the same question.
 */
function distanceMeters(from: TrailPoint, to: TrailPoint): number {
  const meanLatRad = (((from.latitude + to.latitude) / 2) * Math.PI) / 180;
  const deltaLatRad = ((to.latitude - from.latitude) * Math.PI) / 180;
  const deltaLonRad = ((to.longitude - from.longitude) * Math.PI) / 180;
  const x = deltaLonRad * Math.cos(meanLatRad);
  return Math.hypot(deltaLatRad, x) * EARTH_RADIUS_M;
}

/** Prefer the fix's own time; fall back to when we saw it. */
function toTrailPoint(marker: StaffMarker, nowMs: number): TrailPoint {
  const fixMs = marker.gpsTime ? Date.parse(marker.gpsTime) : Number.NaN;
  return {
    latitude: marker.latitude,
    longitude: marker.longitude,
    atMs: Number.isFinite(fixMs) ? fixMs : nowMs
  };
}

export type StaffTrails = Readonly<Record<string, readonly TrailPoint[]>>;

/**
 * @param staff   The markers currently drawn, from useStaffPositions.
 * @param enabled Whether the staff layer is open. Accumulation runs for the whole
 *                time it is - NOT only while the trail is being drawn - so that
 *                switching the trail on shows the path already travelled instead
 *                of an empty map and a wait. Points are two numbers each; this is
 *                far cheaper than the disappointment.
 */
export function useStaffTrails(staff: readonly StaffMarker[], enabled: boolean): StaffTrails {
  const [trails, setTrails] = useState<Record<string, readonly TrailPoint[]>>({});

  useEffect(() => {
    if (!enabled) {
      return;
    }
    setTrails((previous) => {
      const nowMs = Date.now();
      const cutoffMs = nowMs - TRAIL_WINDOW_MS;
      const next = { ...previous };
      let hasChanged = false;

      staff.forEach((marker) => {
        const point = toTrailPoint(marker, nowMs);
        // A fix older than the window would be pruned the moment it landed.
        if (point.atMs < cutoffMs) {
          return;
        }

        const existing = previous[marker.unitId] ?? [];
        const last = existing[existing.length - 1];
        if (last) {
          // Re-delivery of a fix already recorded, or a unit that has not moved
          // far enough to be worth a new vertex.
          if (point.atMs <= last.atMs || distanceMeters(last, point) < TRAIL_MIN_MOVE_METERS) {
            return;
          }
        }

        const appended = [...existing, point].filter((item) => item.atMs >= cutoffMs);
        next[marker.unitId] =
          appended.length > TRAIL_MAX_POINTS
            ? appended.slice(appended.length - TRAIL_MAX_POINTS)
            : appended;
        hasChanged = true;
      });

      // The staff array is rebuilt on a timer even when nothing moved (see the
      // staleness note in useStaffPositions), so most passes change nothing and
      // must not re-render.
      return hasChanged ? next : previous;
    });
  }, [staff, enabled]);

  // Closing the layer discards the trails, matching how the live patches and the
  // selection are dropped: reopening starts from what is true now, not from a
  // path that may be hours old.
  useEffect(() => {
    if (enabled) {
      return;
    }
    setTrails((previous) => (Object.keys(previous).length > 0 ? {} : previous));
  }, [enabled]);

  return trails;
}
