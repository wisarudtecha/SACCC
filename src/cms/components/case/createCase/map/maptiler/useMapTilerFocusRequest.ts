// Moves the MapTiler (MapLibre) camera when the caller issues a new
// MapFocusRequest - the counterpart of useArcgisFocusRequest. Always moves, even
// when the target is already on screen: it answers an explicit "focus" press.
//
// A request either centres on one point, or - when it carries `framePoints` -
// shows all of them in one view. MapLibre's `fitBounds` does the framing itself,
// including the asymmetric padding that keeps the points clear of the docked
// cards, so no projection maths is needed here (unlike Longdo).
import { LngLatBounds, type Map as MlMap } from "maplibre-gl";
import { FRAME_MAX_ZOOM, clampInsets, NO_INSETS } from "../frameBounds";
import type { MapFocusRequest } from "../mapTypes";
import { useFocusRequestEffect } from "../useFocusRequestEffect";

/** Below this many points there is nothing to frame: fall back to centring. */
const MIN_FRAME_POINTS = 2;

interface UseMapTilerFocusRequestOptions {
  mapRef: React.MutableRefObject<MlMap | null>;
  /** True once the map's style has loaded. */
  isReady: boolean;
  focusRequest: MapFocusRequest | null | undefined;
}

/** Shows every requested point in one view. Returns false when there is nothing to frame. */
function frameOnPoints(map: MlMap, request: MapFocusRequest): boolean {
  const framePoints = request.framePoints ?? [];
  if (framePoints.length < MIN_FRAME_POINTS) {
    return false;
  }

  const bounds = new LngLatBounds();
  framePoints.forEach((point) => bounds.extend([point.longitude, point.latitude]));

  const container = map.getContainer();
  // `fitBounds` gives up silently when the padding leaves no room, so shrink
  // insets that would - a narrow window with both cards open does exactly that.
  const insets = clampInsets(request.insets ?? NO_INSETS, {
    width: container.clientWidth,
    height: container.clientHeight
  });
  map.fitBounds(bounds, {
    padding: insets,
    // Without a ceiling, a pin and a responder at the same spot would zoom in forever.
    maxZoom: FRAME_MAX_ZOOM
  });
  return true;
}

export function useMapTilerFocusRequest({
  mapRef,
  isReady,
  focusRequest
}: UseMapTilerFocusRequestOptions): void {
  useFocusRequestEffect({
    focusRequest,
    isReady,
    apply: (request) => {
      const map = mapRef.current;
      if (!map) {
        return;
      }
      if (frameOnPoints(map, request)) {
        return;
      }
      const currentZoom = map.getZoom();
      map.easeTo({
        center: [request.longitude, request.latitude],
        zoom: Math.max(currentZoom, request.zoom ?? currentZoom)
      });
    }
  });
}
