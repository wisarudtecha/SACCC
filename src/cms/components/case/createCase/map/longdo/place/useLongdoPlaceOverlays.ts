// Keeps the Place overlays in sync with a PlaceMarker[], on a Longdo map. The
// counterpart of useArcgisPlaceLayer / useLongdoStaffOverlays: Places that
// overlap on screen are drawn as ONE circle carrying a count, same rules as
// staff clustering - the grouping is computed at the current zoom, so the draw
// effect depends on it too.
//
// It keeps the two rules that matter: overlays are added to the EXISTING map,
// and updates diff rather than clear-and-redraw - each overlay carries a
// SIGNATURE of what its drawing depends on, and only the ones whose signature
// changed are replaced, so a data refresh does not flicker the layer.
//
// Clicks use the same resolver-slot pattern as the staff layer: this hook
// fills `resolverRef.current` while it is live and clears it on unmount, and
// LongdoAddressMap's `overlayClick` handler consults it. Selecting a Place is
// informational only (Q1) - the resolver just reports which marker was hit,
// or zooms into a separable cluster itself.
import { useCallback, useEffect, useRef } from "react";
import {
  getSeparationZoom,
  groupPlacesByProximity,
  PLACE_CLUSTER_RADIUS_PX,
  type PlaceGroup,
  type PlaceGrouping,
  type ScreenPoint
} from "../../place/placeClusters";
import type { PlaceMarker, PlaceSelection } from "../../place/placeTypes";
import type { LongdoGlobal, LongdoMap, LongdoOverlay } from "../longdoApi";
import { toWorldPixel } from "../longdoGeometry";
import { createPlaceGroupMarkerOptions, createPlaceMarkerOptions } from "./longdoPlaceMarkers";

/**
 * What clicking an overlay meant. Mirrors StaffOverlayClickOutcome: `null`
 * from the resolver means "not one of ours"; a result with a null `selection`
 * means "ours, and handled" (a group we zoomed into), which must NOT fall
 * through to a reverse geocode.
 */
export interface PlaceOverlayClickOutcome {
  selection: PlaceSelection | null;
}

export type PlaceOverlayClickResolver = (overlay: LongdoOverlay) => PlaceOverlayClickOutcome | null;

interface UseLongdoPlaceOverlaysOptions {
  longdoRef: React.MutableRefObject<LongdoGlobal | null>;
  mapRef: React.MutableRefObject<LongdoMap | null>;
  isReady: boolean;
  places: readonly PlaceMarker[];
  selectedPlaceId: string | null;
  visible: boolean;
  /** The view's settled zoom - the grouping is computed at this scale. */
  zoom: number;
  /** The map's Place-click resolver slot; filled while this layer is live. */
  resolverRef: React.MutableRefObject<PlaceOverlayClickResolver | null>;
}

type PlaceOverlayTarget = { type: "place"; id: string } | { type: "group"; groupId: string };

interface TrackedOverlay {
  overlay: LongdoOverlay;
  signature: string;
  target: PlaceOverlayTarget;
}

/** Longdo's own zoom ceiling, used when the SDK does not report one. */
const FALLBACK_MAX_ZOOM = 20;

const placeKey = (id: string) => `place:${id}`;
const groupKey = (groupId: string) => `group:${groupId}`;

/** Coordinates rounded to ~1m, so float noise alone does not redraw a marker. */
function roundCoord(value: number): number {
  return Number(value.toFixed(5));
}

export function useLongdoPlaceOverlays({
  longdoRef,
  mapRef,
  isReady,
  places,
  selectedPlaceId,
  visible,
  zoom,
  resolverRef
}: UseLongdoPlaceOverlaysOptions): void {
  const trackedRef = useRef<Map<string, TrackedOverlay>>(new Map());
  // Overlay -> what it stands for, for the click resolver. Keyed by the
  // overlay object itself, which is exactly what `overlayClick` hands back.
  const targetsRef = useRef<Map<LongdoOverlay, PlaceOverlayTarget>>(new Map());
  // The grouping currently drawn, so a click on a group circle can be traced
  // to its members without recomputing.
  const groupingRef = useRef<PlaceGrouping>({ singles: [], groups: [] });

  useEffect(() => {
    const longdo = longdoRef.current;
    const map = mapRef.current;
    if (!isReady || !longdo || !map) {
      return;
    }

    const tracked = trackedRef.current;
    const targets = targetsRef.current;

    const dropAll = () => {
      tracked.forEach((entry) => map.Overlays.remove(entry.overlay));
      tracked.clear();
      targets.clear();
      groupingRef.current = { singles: [], groups: [] };
    };

    if (!visible) {
      dropAll();
      return;
    }

    // World pixels at the current zoom. Only DISTANCES matter to the
    // grouping, and those are identical in world space and screen space - so
    // this needs neither the map's centre nor its size, and stays correct
    // mid-pan.
    const toScreen = (marker: PlaceMarker): ScreenPoint | null =>
      toWorldPixel({ lon: marker.longitude, lat: marker.latitude }, zoom);

    const grouping = groupPlacesByProximity(places, toScreen, PLACE_CLUSTER_RADIUS_PX);
    groupingRef.current = grouping;

    const desired = new Map<
      string,
      { signature: string; build: () => LongdoOverlay; target: PlaceOverlayTarget }
    >();

    grouping.singles.forEach((marker) => {
      const isSelected = marker.id === selectedPlaceId;
      desired.set(placeKey(marker.id), {
        signature: [
          roundCoord(marker.latitude),
          roundCoord(marker.longitude),
          marker.category,
          isSelected ? "sel" : ""
        ].join(":"),
        target: { type: "place", id: marker.id },
        build: () =>
          new longdo.Marker(
            { lon: marker.longitude, lat: marker.latitude },
            {
              ...createPlaceMarkerOptions({ category: marker.category, isSelected }, marker.name),
              weight: longdo.OverlayWeight.Top
            }
          )
      });
    });

    grouping.groups.forEach((group) => {
      const isSelected = Boolean(selectedPlaceId && group.placeIds.includes(selectedPlaceId));
      const count = group.placeIds.length;
      desired.set(groupKey(group.id), {
        signature: [
          roundCoord(group.latitude),
          roundCoord(group.longitude),
          count,
          isSelected ? "sel" : ""
        ].join(":"),
        target: { type: "group", groupId: group.id },
        build: () =>
          new longdo.Marker(
            { lon: group.longitude, lat: group.latitude },
            {
              ...createPlaceGroupMarkerOptions(count, isSelected),
              weight: longdo.OverlayWeight.Top
            }
          )
      });
    });

    // Remove what is gone or has changed appearance; leave the rest untouched.
    tracked.forEach((entry, key) => {
      const next = desired.get(key);
      if (next && next.signature === entry.signature) {
        return;
      }
      map.Overlays.remove(entry.overlay);
      targets.delete(entry.overlay);
      tracked.delete(key);
    });

    desired.forEach((spec, key) => {
      if (tracked.has(key)) {
        return;
      }
      const overlay = spec.build();
      map.Overlays.add(overlay);
      tracked.set(key, { overlay, signature: spec.signature, target: spec.target });
      targets.set(overlay, spec.target);
    });
  }, [longdoRef, mapRef, isReady, places, selectedPlaceId, visible, zoom]);

  /**
   * Resolve a click on one of this layer's overlays. Zoom is the natural way
   * out of a crowd, so take it when it would actually work - see
   * useLongdoStaffOverlays' resolveOverlayClick for the two cases where it
   * cannot.
   */
  const resolveOverlayClick = useCallback<PlaceOverlayClickResolver>(
    (overlay) => {
      const target = targetsRef.current.get(overlay);
      if (!target) {
        return null;
      }
      if (target.type === "place") {
        return { selection: { type: "place", id: target.id } };
      }

      const group: PlaceGroup | undefined = groupingRef.current.groups.find(
        (candidate) => candidate.id === target.groupId
      );
      if (!group) {
        return { selection: null };
      }

      const map = mapRef.current;
      const separationZoom = map
        ? getSeparationZoom(group, map.zoom(), FALLBACK_MAX_ZOOM, PLACE_CLUSTER_RADIUS_PX)
        : null;

      if (map && separationZoom !== null) {
        map.location({ lon: group.longitude, lat: group.latitude }, true);
        map.zoom(separationZoom, true);
        return { selection: null };
      }

      return { selection: { type: "group", placeIds: group.placeIds } };
    },
    [mapRef]
  );

  // Publish the resolver only while this layer is live.
  useEffect(() => {
    resolverRef.current = resolveOverlayClick;
    return () => {
      resolverRef.current = null;
    };
  }, [resolverRef, resolveOverlayClick]);

  // Drop every overlay when this hook goes away. The ref is read IN the
  // cleanup because the map is built asynchronously and is still null when
  // this runs.
  useEffect(() => {
    const tracked = trackedRef.current;
    const targets = targetsRef.current;
    return () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      const map = mapRef.current;
      tracked.forEach((entry) => map?.Overlays.remove(entry.overlay));
      tracked.clear();
      targets.clear();
    };
  }, [mapRef]);
}
