// Moves the ArcGIS camera when the caller issues a new MapFocusRequest.
//
// Unlike the staff layer's "bring the selected officer into view" effect, this
// always moves: it answers an explicit press on a "focus" button, where leaving
// the camera alone because the target happens to be on screen would look like
// the button did nothing. When a request counts as new is decided once, for all
// providers, in useFocusRequestEffect.
//
// A request either centres on one point, or - when it carries `framePoints` -
// shows all of them in one view. Framing is worked out in Web Mercator metres
// (frameBounds.ts) so a straight line and a pixel size behave linearly, then
// handed to goTo as an extent.
import Extent from "@arcgis/core/geometry/Extent.js";
import Point from "@arcgis/core/geometry/Point.js";
import * as webMercatorUtils from "@arcgis/core/geometry/support/webMercatorUtils.js";
import type MapView from "@arcgis/core/views/MapView.js";
import { computeFramedBounds, NO_INSETS } from "./frameBounds";
import type { MapFocusRequest } from "./mapTypes";
import { useFocusRequestEffect } from "./useFocusRequestEffect";

const WEB_MERCATOR_WKID = 102100;
/** Below this many points there is nothing to frame: fall back to centring. */
const MIN_FRAME_POINTS = 2;

interface UseArcgisFocusRequestOptions {
  viewRef: React.MutableRefObject<MapView | null>;
  /** True once the MapView has resolved; refs are only safe to use after this. */
  isReady: boolean;
  focusRequest: MapFocusRequest | null | undefined;
}

/** The extent that shows every requested point clear of the docked cards, or null. */
function buildFrameExtent(view: MapView, request: MapFocusRequest): Extent | null {
  const framePoints = request.framePoints ?? [];
  if (framePoints.length < MIN_FRAME_POINTS) {
    return null;
  }
  const planarPoints = framePoints.map((point) => {
    const [x, y] = webMercatorUtils.lngLatToXY(point.longitude, point.latitude);
    return { x, y };
  });
  const bounds = computeFramedBounds(
    planarPoints,
    { width: view.width, height: view.height },
    request.insets ?? NO_INSETS
  );
  if (!bounds) {
    return null;
  }
  return new Extent({
    ...bounds,
    spatialReference: { wkid: WEB_MERCATOR_WKID }
  });
}

export function useArcgisFocusRequest({
  viewRef,
  isReady,
  focusRequest
}: UseArcgisFocusRequestOptions): void {
  useFocusRequestEffect({
    focusRequest,
    isReady,
    apply: (request) => {
      const view = viewRef.current;
      if (!view) {
        return;
      }

      const frame = buildFrameExtent(view, request);
      const navigation = frame
        ? view.goTo(frame)
        : view.goTo({
            target: new Point({ latitude: request.latitude, longitude: request.longitude }),
            zoom: Math.max(view.zoom, request.zoom ?? view.zoom)
          });
      navigation.catch(() => {
        /* goTo rejects when interrupted by a newer navigation - safe to ignore */
      });
    }
  });
}
