// Draws the selected officer's breadcrumb trail on a Longdo map.
//
// The counterpart of useBreadcrumbGraphicsLayer, and it keeps that hook's one
// distinctive rule: THE TRAIL NEVER TOUCHES THE CAMERA. It grows a point at a
// time while the operator is working, and a map that re-framed itself every few
// seconds would be unusable - it would also fight the settle-driven staff
// re-clustering and the viewpoint the map restores when the large map reopens.
//
// Deliberately not route-like: dashed, thinner and dimmer than the solved route,
// in the neutral slate the map uses for context rather than instruction. The
// route is where the officer is GOING; the trail is where they have BEEN, and
// two similar lines saying opposite things is worse than one line.
import { useEffect, useRef } from "react";
import { BREADCRUMB_TOKENS } from "../../staff/breadcrumbSymbols";
import { MIN_TRAIL_POINTS, type TrailPoint } from "../../staff/useStaffTrails";
import type { LongdoGlobal, LongdoMap, LongdoOverlay } from "../longdoApi";

interface UseLongdoBreadcrumbOverlayOptions {
  longdoRef: React.MutableRefObject<LongdoGlobal | null>;
  mapRef: React.MutableRefObject<LongdoMap | null>;
  isReady: boolean;
  points: readonly TrailPoint[] | null;
  visible: boolean;
  isDarkTheme: boolean;
}

function toCssColor(rgb: readonly [number, number, number], alpha: number): string {
  return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})`;
}

/**
 * Identifies the drawn trail cheaply.
 *
 * A trail only ever grows at the end, so its length plus its newest point is
 * enough to tell "one more fix arrived" from "nothing changed" - and the polling
 * hook hands back a new array every refresh whether or not it did.
 */
function trailSignature(points: readonly TrailPoint[] | null): string {
  if (!points?.length) {
    return "";
  }
  const last = points[points.length - 1];
  return `${points.length}:${last.latitude},${last.longitude}`;
}

export function useLongdoBreadcrumbOverlay({
  longdoRef,
  mapRef,
  isReady,
  points,
  visible,
  isDarkTheme
}: UseLongdoBreadcrumbOverlayOptions): void {
  const overlayRef = useRef<LongdoOverlay | null>(null);
  const signatureRef = useRef<string>("");

  useEffect(() => {
    const longdo = longdoRef.current;
    const map = mapRef.current;
    if (!isReady || !longdo || !map) {
      return;
    }

    const signature = visible ? `${trailSignature(points)}:${isDarkTheme ? "d" : "l"}` : "";

    // Nothing to redraw. Skipping here is what keeps a position poll that added
    // no new fix from rebuilding the line.
    if (signature === signatureRef.current) {
      return;
    }
    signatureRef.current = signature;

    if (overlayRef.current) {
      map.Overlays.remove(overlayRef.current);
      overlayRef.current = null;
    }

    // Two points are the minimum that can describe a path; below that there is
    // nothing to draw, not a degenerate line to draw.
    if (!visible || !points || points.length < MIN_TRAIL_POINTS) {
      return;
    }

    const rgb = isDarkTheme ? BREADCRUMB_TOKENS.darkRgb : BREADCRUMB_TOKENS.lightRgb;
    const overlay = new longdo.Polyline(
      points.map((point) => ({ lon: point.longitude, lat: point.latitude })),
      {
        lineColor: toCssColor(rgb, BREADCRUMB_TOKENS.alpha),
        lineWidth: BREADCRUMB_TOKENS.width,
        lineStyle: longdo.LineStyle.Dashed,
        // Non-interactive by construction, so it can never take a click meant
        // for the map or for an officer standing on their own trail.
        clickable: false,
        pointer: false
      }
    );

    map.Overlays.add(overlay);
    overlayRef.current = overlay;
  }, [longdoRef, mapRef, isReady, points, visible, isDarkTheme]);

  // Drop the line when this hook goes away. The ref is read IN the cleanup
  // because the map is built asynchronously and is still null when this effect
  // first runs.
  useEffect(() => {
    return () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      const map = mapRef.current;
      if (overlayRef.current) {
        map?.Overlays.remove(overlayRef.current);
        overlayRef.current = null;
      }
      signatureRef.current = "";
    };
  }, [mapRef]);
}
