// Turns a coordinate into container pixels on the Longdo map, and says when the
// answer has changed, so anchored overlays (see AnchoredOverlayLayer) follow the
// map as it pans and zooms. The counterpart of useArcgisScreenProjector.
//
// Two things are different here:
//
//   - The SDK has no location -> pixel call, so the position is worked out from
//     the view's current bound (screenFromLocation).
//   - There is no continuous "the view is moving" event this app knows of, and it
//     does not trust `Event.unbind` (see LongdoAddressMap), so instead of binding
//     to one this watches the bound once per frame. That runs ONLY while
//     something is anchored - a few seconds at a time - and bumps `revision` only
//     when the bound actually changed, so a still map costs no re-renders.
import { useCallback, useEffect, useState } from "react";
import type { AnchorPoint } from "../anchorPlacement";
import type { LongdoBound, LongdoMap } from "./longdoApi";
import { screenFromLocation } from "./longdoGeometry";

interface UseLongdoScreenProjectorOptions {
  mapRef: React.MutableRefObject<LongdoMap | null>;
  containerRef: React.RefObject<HTMLElement | null>;
  isReady: boolean;
  enabled: boolean;
}

export interface UseLongdoScreenProjectorResult {
  project: (latitude: number, longitude: number) => AnchorPoint | null;
  /** Changes when the view moves; a render dependency, not a value to read. */
  revision: number;
}

function boundSignature(bound: LongdoBound | null | undefined): string {
  return bound ? `${bound.minLon},${bound.minLat},${bound.maxLon},${bound.maxLat}` : "";
}

export function useLongdoScreenProjector({
  mapRef,
  containerRef,
  isReady,
  enabled
}: UseLongdoScreenProjectorOptions): UseLongdoScreenProjectorResult {
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    const map = mapRef.current;
    if (!isReady || !map || !enabled) {
      return;
    }

    let lastSignature = boundSignature(map.bound());
    let frame = 0;
    const watch = () => {
      const signature = boundSignature(map.bound());
      if (signature !== lastSignature) {
        lastSignature = signature;
        setRevision((current) => current + 1);
      }
      frame = requestAnimationFrame(watch);
    };
    frame = requestAnimationFrame(watch);

    return () => cancelAnimationFrame(frame);
  }, [mapRef, isReady, enabled]);

  const project = useCallback(
    (latitude: number, longitude: number): AnchorPoint | null => {
      const map = mapRef.current;
      const container = containerRef.current;
      if (!map || !container) {
        return null;
      }
      const { width, height } = container.getBoundingClientRect();
      return screenFromLocation(map.bound(), { width, height }, { lon: longitude, lat: latitude });
    },
    [mapRef, containerRef]
  );

  return { project, revision };
}
