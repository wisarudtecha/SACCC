// Turns a coordinate into container pixels on the ArcGIS view, and says when the
// answer has changed, so anchored overlays (see AnchoredOverlayLayer) follow the
// map as it pans and zooms.
//
// `enabled` matters: watching the view's extent re-renders the caller on every
// frame of a pan, which is only worth paying while something is actually
// anchored.
import { useCallback, useEffect, useState } from "react";
import Point from "@arcgis/core/geometry/Point.js";
import * as reactiveUtils from "@arcgis/core/core/reactiveUtils.js";
import type MapView from "@arcgis/core/views/MapView.js";
import type { AnchorPoint } from "./anchorPlacement";

interface UseArcgisScreenProjectorOptions {
  viewRef: React.MutableRefObject<MapView | null>;
  /** True once the MapView has resolved; refs are only safe to use after this. */
  isReady: boolean;
  enabled: boolean;
}

export interface UseArcgisScreenProjectorResult {
  project: (latitude: number, longitude: number) => AnchorPoint | null;
  /** Changes when the view moves; a render dependency, not a value to read. */
  revision: number;
}

export function useArcgisScreenProjector({
  viewRef,
  isReady,
  enabled
}: UseArcgisScreenProjectorOptions): UseArcgisScreenProjectorResult {
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    const view = viewRef.current;
    if (!isReady || !view || !enabled) {
      return;
    }

    // At most one bump per frame: the extent changes many times inside one.
    let frame = 0;
    const scheduleBump = () => {
      if (frame) {
        return;
      }
      frame = requestAnimationFrame(() => {
        frame = 0;
        setRevision((current) => current + 1);
      });
    };

    const handle = reactiveUtils.watch(() => view.extent, scheduleBump);
    return () => {
      handle.remove();
      if (frame) {
        cancelAnimationFrame(frame);
      }
    };
  }, [isReady, enabled, viewRef]);

  const project = useCallback(
    (latitude: number, longitude: number): AnchorPoint | null => {
      const view = viewRef.current;
      if (!view) {
        return null;
      }
      const screenPoint = view.toScreen(new Point({ latitude, longitude }));
      return screenPoint ? { x: screenPoint.x, y: screenPoint.y } : null;
    },
    [viewRef]
  );

  return { project, revision };
}
