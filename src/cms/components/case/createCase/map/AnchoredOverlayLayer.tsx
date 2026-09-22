// Draws React content pinned to map coordinates (e.g. the "assigned - undo?"
// popup beside an officer's icon).
//
// The provider owns the projection, this component owns the layout: each map
// hands in a `project` function and a `revision` that changes whenever the view
// moves, so the overlays follow pans and zooms without this file knowing which
// SDK is underneath. Off-screen anchors are hidden rather than pinned to an edge
// (see computeAnchorPlacement).
//
// The layer itself ignores the pointer so the map stays draggable under the
// empty parts of it; each overlay turns pointer events back on.
import { memo, useEffect, useMemo, useRef, useState } from "react";
import { computeAnchorPlacement, type AnchorBox, type AnchorPoint } from "./anchorPlacement";
import type { MapAnchoredOverlay } from "./mapTypes";

interface AnchoredOverlayLayerProps {
  overlays: readonly MapAnchoredOverlay[];
  /** Container-relative pixels for a coordinate, or null when it cannot be projected. */
  project: (latitude: number, longitude: number) => AnchorPoint | null;
  /** Changes whenever the view moves, so positions are recomputed. */
  revision: number;
}

function AnchoredOverlayLayerBase({ overlays, project, revision }: AnchoredOverlayLayerProps) {
  const layerRef = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState<AnchorBox>({ width: 0, height: 0 });

  // The layer fills the map's box, so its own size IS the visible area.
  useEffect(() => {
    const layer = layerRef.current;
    if (!layer) {
      return;
    }
    const measure = () => setBox({ width: layer.clientWidth, height: layer.clientHeight });
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(layer);
    return () => observer.disconnect();
  }, []);

  // `revision` never appears in the body: it is a dependency purely so positions
  // are recomputed when the provider says the view moved.
  const placed = useMemo(
    () =>
      overlays.map((overlay) => ({
        overlay,
        placement: computeAnchorPlacement(project(overlay.latitude, overlay.longitude), box)
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [overlays, project, box, revision]
  );

  return (
    <div ref={layerRef} className="pointer-events-none absolute inset-0 z-20 overflow-hidden">
      {placed.map(({ overlay, placement }) =>
        placement.isVisible ? (
          <div
            key={overlay.id}
            className="pointer-events-auto absolute"
            // Bottom-centre of the content sits on the anchor, so the popup rises
            // above the icon instead of covering it.
            style={{ left: placement.x, top: placement.y, transform: "translate(-50%, calc(-100% - 18px))" }}
          >
            {overlay.content}
          </div>
        ) : null
      )}
    </div>
  );
}

export const AnchoredOverlayLayer = memo(AnchoredOverlayLayerBase);
AnchoredOverlayLayer.displayName = "AnchoredOverlayLayer";

export default AnchoredOverlayLayer;
