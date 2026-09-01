// Draws the officer -> case route on a Longdo map.
//
// This hook does NOT draw a line it was handed, and that is the whole reason it
// exists rather than being a second copy of the breadcrumb hook. Longdo's
// routing API returns turn-by-turn guidance with distances and NO geometry
// (verified against the live service - see services/longdoRoute.ts). The only
// source of a route SHAPE in this SDK is `map.Route`, which solves and draws it
// itself. So this hook hands the SDK the two endpoints and lets it draw.
//
// The consequence worth knowing: under Longdo a displayed route costs TWO
// requests - one to services/longdoRoute for the metrics the panel shows (ETA,
// distance, TTL), and one inside the SDK for the line. That is deliberate. The
// metrics have to come from a headless call because the SAME solver serves
// useClusterRouteSummaries, which solves one route per cluster member purely to
// print numbers and must never draw anything. The doubled request applies only
// to the single route a dispatcher explicitly asks for, which is already behind
// a button and a cooldown.
//
// The line is drawn in the SDK's own style. `map.Route.line()` exists but its
// contract was not verified, so nothing here tries to restyle it - a route in
// the vendor's colours is a smaller problem than a route that fails to draw.
import { useEffect, useRef } from "react";
import type { RouteOverlay } from "../../mapTypes";
import type { LongdoMap } from "../longdoApi";

interface UseLongdoRouteOverlayOptions {
  mapRef: React.MutableRefObject<LongdoMap | null>;
  isReady: boolean;
  /** The route to draw, or null when there is none. */
  route: RouteOverlay | null;
  visible: boolean;
}

/** Rounded to ~11m, so a re-render with a jittered position does not re-solve. */
function roundCoord(value: number): number {
  return Number(value.toFixed(4));
}

function routeSignature(route: RouteOverlay | null): string {
  if (!route) {
    return "";
  }
  return [
    roundCoord(route.from.latitude),
    roundCoord(route.from.longitude),
    roundCoord(route.to.latitude),
    roundCoord(route.to.longitude)
  ].join(":");
}

export function useLongdoRouteOverlay({
  mapRef,
  isReady,
  route,
  visible
}: UseLongdoRouteOverlayOptions): void {
  // The endpoints currently handed to the SDK's router. Guards against
  // re-issuing a search - which is a network request and a redraw - when a
  // re-render hands over the same route again.
  const signatureRef = useRef<string>("");

  useEffect(() => {
    const map = mapRef.current;
    if (!isReady || !map) {
      return;
    }

    const signature = visible ? routeSignature(route) : "";
    if (signature === signatureRef.current) {
      return;
    }
    signatureRef.current = signature;

    // Clear first either way: the router owns its stops, and leaving the
    // previous pair in place would solve a route from the wrong officer.
    map.Route.clear();

    if (!visible || !route) {
      return;
    }

    map.Route.add({ lon: route.from.longitude, lat: route.from.latitude });
    map.Route.add({ lon: route.to.longitude, lat: route.to.latitude });
    map.Route.search();
    // No framing call here: the SDK frames the solved route itself (its own
    // theme carries a `route.zoomResult` padding/maxZoom pair for exactly that),
    // which matches the ArcGIS side framing once when the route first resolves.
  }, [mapRef, isReady, route, visible]);

  // Clear the route when this hook goes away. The ref is read IN the cleanup
  // because the map is built asynchronously and is still null when this effect
  // first runs.
  useEffect(() => {
    return () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      const map = mapRef.current;
      map?.Route.clear();
      signatureRef.current = "";
    };
  }, [mapRef]);
}
