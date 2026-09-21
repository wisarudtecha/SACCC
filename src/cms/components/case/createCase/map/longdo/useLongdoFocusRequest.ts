// Moves the Longdo camera when the caller issues a new MapFocusRequest - the
// counterpart of useArcgisFocusRequest. Always moves, even when the target is
// already on screen: it answers an explicit "focus" press.
//
// A request either centres on one point, or - when it carries `framePoints` -
// shows all of them in one view, clear of the docked cards.
//
// Framing is the awkward part on this SDK. There is no padding option, and
// `map.bound()` as a setter is not verified against the live SDK (see
// longdoApi.ts), so this uses only the two calls that are: `location()` and
// `zoom()`. That means working out the camera by hand in Web Mercator
// (frameBounds.ts) - where to centre, and at what zoom one pixel spans enough
// ground - and applying it.
//
// Longdo zooms in whole levels, so the zoom is rounded DOWN. That can only zoom
// OUT, which is the safe direction: the centre stays put and a coarser scale
// pulls every point toward it, so nothing ends up under a card or off the view.
// The price is a frame up to one zoom level looser than the other providers'.
import { FRAME_MAX_ZOOM, NO_INSETS, computeFrameView, zoomForUnitsPerPixel } from "../frameBounds";
import type { MapFocusRequest } from "../mapTypes";
import { useFocusRequestEffect } from "../useFocusRequestEffect";
import { lngLatToMeters, metersToLngLat } from "../webMercator";
import type { LongdoMap } from "./longdoApi";

/** Below this many points there is nothing to frame: fall back to centring. */
const MIN_FRAME_POINTS = 2;
/** The widest view a frame will ask for - the whole world is never a useful answer. */
const MIN_FRAME_ZOOM = 1;

interface UseLongdoFocusRequestOptions {
  mapRef: React.MutableRefObject<LongdoMap | null>;
  /** The map's container, for the viewport size the framing is worked out against. */
  containerRef: React.RefObject<HTMLElement | null>;
  /** True once the map has been built. */
  isReady: boolean;
  focusRequest: MapFocusRequest | null | undefined;
}

/** Shows every requested point in one view. Returns false when there is nothing to frame. */
function frameOnPoints(
  map: LongdoMap,
  container: HTMLElement | null,
  request: MapFocusRequest
): boolean {
  const framePoints = request.framePoints ?? [];
  if (framePoints.length < MIN_FRAME_POINTS || !container) {
    return false;
  }
  const viewport = { width: container.clientWidth, height: container.clientHeight };

  const view = computeFrameView(
    framePoints.map(lngLatToMeters),
    viewport,
    request.insets ?? NO_INSETS
  );
  if (!view) {
    return false;
  }

  const center = metersToLngLat(view.center);
  const wholeZoom = Math.floor(zoomForUnitsPerPixel(view.unitsPerPixel));
  const zoom = Math.min(Math.max(wholeZoom, MIN_FRAME_ZOOM), FRAME_MAX_ZOOM);

  map.location({ lon: center.longitude, lat: center.latitude }, true);
  map.zoom(zoom, true);
  return true;
}

export function useLongdoFocusRequest({
  mapRef,
  containerRef,
  isReady,
  focusRequest
}: UseLongdoFocusRequestOptions): void {
  useFocusRequestEffect({
    focusRequest,
    isReady,
    apply: (request) => {
      const map = mapRef.current;
      if (!map) {
        return;
      }
      if (frameOnPoints(map, containerRef.current, request)) {
        return;
      }
      map.location({ lon: request.longitude, lat: request.latitude }, true);
      const currentZoom = map.zoom();
      if (request.zoom !== undefined && request.zoom > currentZoom) {
        map.zoom(request.zoom, true);
      }
    }
  });
}
