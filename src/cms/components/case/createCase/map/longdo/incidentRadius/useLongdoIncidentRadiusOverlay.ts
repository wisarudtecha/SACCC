// Draws the no-match fallback radius circle on a Longdo map.
//
// Mirrors useLongdoBoundaryOverlays' shape - a non-interactive overlay rebuilt
// when its appearance changes - but far smaller: one polygon, no fetch, no
// per-level bookkeeping. Longdo ships no buffer primitive, so the ring comes
// from the shared SDK-free haversine generator (generateIncidentCircleRing) and
// is drawn as a plain Polygon.
//
// It renders ONLY while `incidentRadius` is set, which the owner does only when
// the incident point matched no single Service Center polygon. `clickable` /
// `pointer` are false so it never competes for a map click (the SDK still routes
// overlay clicks to `overlayClick`, which LongdoAddressMap converts back into a
// map click - same as the boundary polygons).
import { useEffect, useRef } from "react";
import type { IncidentRadiusOverlay } from "../../mapTypes";
import { generateIncidentCircleRing } from "@/cms/utils/incidentRadius";
import type { LongdoGlobal, LongdoMap, LongdoOverlay } from "../longdoApi";
import { toLongdoLocations } from "../longdoGeometry";
import {
  INCIDENT_RADIUS_OUTLINE_WIDTH,
  incidentRadiusFillCss,
  incidentRadiusStrokeCss
} from "../../incidentRadius/incidentRadiusSymbols";

interface UseLongdoIncidentRadiusOverlayOptions {
  longdoRef: React.MutableRefObject<LongdoGlobal | null>;
  mapRef: React.MutableRefObject<LongdoMap | null>;
  isReady: boolean;
  incidentRadius?: IncidentRadiusOverlay | null;
  isDarkTheme: boolean;
}

/** Centre, radius and theme as one comparable string, so an unchanged circle is not redrawn. */
function circleSignature(incidentRadius: IncidentRadiusOverlay | null | undefined, isDarkTheme: boolean): string {
  if (!incidentRadius) {
    return "";
  }
  const { center, radiusMeters } = incidentRadius;
  return `${center.latitude},${center.longitude},${radiusMeters},${isDarkTheme ? "d" : "l"}`;
}

export function useLongdoIncidentRadiusOverlay({
  longdoRef,
  mapRef,
  isReady,
  incidentRadius,
  isDarkTheme
}: UseLongdoIncidentRadiusOverlayOptions): void {
  const overlayRef = useRef<LongdoOverlay | null>(null);
  const renderedSignatureRef = useRef<string>("");

  useEffect(() => {
    const longdo = longdoRef.current;
    const map = mapRef.current;
    if (!isReady || !longdo || !map) {
      return;
    }

    const signature = circleSignature(incidentRadius, isDarkTheme);
    if (signature === renderedSignatureRef.current) {
      return;
    }
    renderedSignatureRef.current = signature;

    if (overlayRef.current) {
      map.Overlays.remove(overlayRef.current);
      overlayRef.current = null;
    }
    if (!incidentRadius) {
      return;
    }

    const ring = generateIncidentCircleRing(incidentRadius.center, incidentRadius.radiusMeters);
    const locations = toLongdoLocations(ring);
    if (locations.length < 3) {
      return;
    }

    const polygon = new longdo.Polygon(locations, {
      lineWidth: INCIDENT_RADIUS_OUTLINE_WIDTH,
      lineColor: incidentRadiusStrokeCss(isDarkTheme),
      fillColor: incidentRadiusFillCss(isDarkTheme),
      lineStyle: longdo.LineStyle.Dashed,
      clickable: false,
      pointer: false
    });
    map.Overlays.add(polygon);
    overlayRef.current = polygon;
  }, [longdoRef, mapRef, isReady, incidentRadius, isDarkTheme]);

  // Drop the overlay when the hook goes away. The ref is read in the cleanup
  // because the map is built asynchronously and is still null on first run.
  useEffect(() => {
    return () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      const map = mapRef.current;
      if (overlayRef.current) {
        map?.Overlays.remove(overlayRef.current);
        overlayRef.current = null;
      }
      renderedSignatureRef.current = "";
    };
  }, [mapRef]);
}
