// Turns a coordinate into container pixels on the MapLibre map, and says when the
// answer has changed, so anchored overlays (see AnchoredOverlayLayer) follow the
// map as it pans and zooms. The counterpart of useArcgisScreenProjector.
//
// `enabled` matters: listening to "move" re-renders the caller on every frame of
// a pan, which is only worth paying while something is actually anchored.
import { useCallback, useEffect, useState } from "react";
import type { Map as MlMap } from "maplibre-gl";
import type { AnchorPoint } from "../anchorPlacement";

interface UseMapTilerScreenProjectorOptions {
  mapRef: React.MutableRefObject<MlMap | null>;
  isReady: boolean;
  enabled: boolean;
}

export interface UseMapTilerScreenProjectorResult {
  project: (latitude: number, longitude: number) => AnchorPoint | null;
  /** Changes when the view moves; a render dependency, not a value to read. */
  revision: number;
}

export function useMapTilerScreenProjector({
  mapRef,
  isReady,
  enabled
}: UseMapTilerScreenProjectorOptions): UseMapTilerScreenProjectorResult {
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    const map = mapRef.current;
    if (!isReady || !map || !enabled) {
      return;
    }

    // At most one bump per frame: "move" fires many times inside one.
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

    map.on("move", scheduleBump);
    map.on("resize", scheduleBump);
    return () => {
      map.off("move", scheduleBump);
      map.off("resize", scheduleBump);
      if (frame) {
        cancelAnimationFrame(frame);
      }
    };
  }, [mapRef, isReady, enabled]);

  const project = useCallback(
    (latitude: number, longitude: number): AnchorPoint | null => {
      const map = mapRef.current;
      if (!map) {
        return null;
      }
      const point = map.project([longitude, latitude]);
      return { x: point.x, y: point.y };
    },
    [mapRef]
  );

  return { project, revision };
}
