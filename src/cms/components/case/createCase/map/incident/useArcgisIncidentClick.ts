// Makes the incident (case) pin clickable on the ArcGIS map.
//
// The pin is a plain graphic on the map's own marker layer, not a layer of its
// own like staff / place / device, so nothing hit-tested it: a click on it was
// just a click on the map. This hook adds the two pieces those layers have -
// "did this click hit the pin?" for the click chain, and a pointer cursor over
// it - without the marker layer having to know about either.
//
// Inert unless `enabled`. Every editable map (create / edit) leaves it off,
// because there a click near the pin means "move the pin".
import { useCallback, useEffect, useRef } from "react";
import type GraphicsLayer from "@arcgis/core/layers/GraphicsLayer.js";
import type MapView from "@arcgis/core/views/MapView.js";

/**
 * Marks the view container while the pointer is over the pin. The cursor itself
 * is set by a stylesheet rule keyed on this attribute (see globals.css): the
 * staff layer writes `container.style.cursor` from its own pointer-move handler,
 * and two handlers writing the same inline style would overwrite each other with
 * whichever hit-test happened to resolve last.
 */
const HOVER_ATTRIBUTE = "data-incident-hover";

interface HitTestResponseLike {
  results?: { type?: string }[];
}

interface UseArcgisIncidentClickOptions {
  viewRef: React.MutableRefObject<MapView | null>;
  markerLayerRef: React.MutableRefObject<GraphicsLayer | null>;
  /** True once the MapView has resolved; refs are only safe to use after this. */
  isReady: boolean;
  enabled: boolean;
}

export interface UseArcgisIncidentClickResult {
  /**
   * True when the click landed on the incident pin. Stable across renders, so a
   * handler registered once at mount can call it.
   */
  resolveIncidentClick: (event: unknown) => Promise<boolean>;
}

export function useArcgisIncidentClick({
  viewRef,
  markerLayerRef,
  isReady,
  enabled
}: UseArcgisIncidentClickOptions): UseArcgisIncidentClickResult {
  // Read through a ref so `resolveIncidentClick` keeps one identity for the
  // mount-time click handler that holds it.
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;

  // Pure: selects nothing and moves nothing, so the cursor path can share it.
  const isOverIncident = useCallback(async (event: unknown): Promise<boolean> => {
    const view = viewRef.current;
    const layer = markerLayerRef.current;
    if (!enabledRef.current || !view || !layer) {
      return false;
    }
    try {
      // `include` scopes the test to the marker layer, so basemap and overlay
      // features can never be mistaken for the pin.
      const response = (await view.hitTest(
        event as Parameters<MapView["hitTest"]>[0],
        { include: [layer] }
      )) as HitTestResponseLike;
      return response?.results?.some((result) => result.type === "graphic") ?? false;
    }
    catch (error) {
      console.error("Failed to hit-test the incident pin", error);
      return false;
    }
  }, [viewRef, markerLayerRef]);

  useEffect(() => {
    const view = viewRef.current;
    if (!isReady || !view || !enabled) {
      return;
    }
    const container = view.container;

    // Same throttle as the staff cursor: hitTest is async and pointer-move is far
    // faster, so one outstanding test at a time.
    let isTesting = false;
    const handle = view.on("pointer-move", (event: unknown) => {
      if (isTesting) {
        return;
      }
      isTesting = true;
      isOverIncident(event)
        .then((isOver) => {
          if (isOver) {
            container?.setAttribute(HOVER_ATTRIBUTE, "true");
          }
          else {
            container?.removeAttribute(HOVER_ATTRIBUTE);
          }
        })
        .finally(() => {
          isTesting = false;
        });
    });

    return () => {
      handle.remove();
      container?.removeAttribute(HOVER_ATTRIBUTE);
    };
  }, [isReady, enabled, viewRef, isOverIncident]);

  return { resolveIncidentClick: isOverIncident };
}
