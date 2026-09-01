// Draws and edits one boundary polygon on a Longdo map.
//
// The counterpart of useBoundarySketchLayer, honouring the same
// BoundarySketchConfig - so the owner (useBoundarySketchState), the toolbar and
// the Escape handling are untouched and entirely provider-neutral.
//
// WRITE-BACK CADENCE is the rule this shares with the ArcGIS hook and must not
// break: a gesture commits when it FINISHES, never per vertex. The owner's
// state is a JSON string that a textarea also edits, so a per-vertex commit
// would re-render the whole form on every click AND hand parsePolygonRings a
// two-point ring, which it rightly rejects - flashing a validation error
// through the entire draw. Live feedback is the rubber band plus the vertex
// count reported through onVertexCountChange.
//
// WHY THIS IS HAND-ROLLED. Longdo does ship a drawing tool (Terra Draw - see
// `longdo.MapTheme.ui.terraDrawOptions`, and the DrawCreate/DrawDelete event
// names), but it arrives as the vendor's own toolbar UI with its own buttons,
// its own select/delete modes and its own labels. This field already has a
// toolbar - BoundaryDrawToolbar, in the app's three languages, wired to the
// controlsRef contract - and two competing toolbars over one 320px map is worse
// than writing the gesture. So the create gesture is built from the primitives
// that were actually verified against the SDK: map clicks, polygon overlays and
// marker overlays.
//
// FINISHING a ring has three routes, none of them double-click. A double-click
// also emits two `click` events, so it would silently add two stray vertices
// before finishing, and the SDK's ordering there was never established. The
// three that do work: the toolbar's Finish button, the Enter key, and clicking
// the first vertex - which is drawn larger and hollow precisely to advertise
// itself as the target (see longdoSketchSymbols.ts).
import { useCallback, useEffect, useRef } from "react";
import type { PolygonCoordinates } from "@/cms/types/area";
import { MIN_RING_POINTS, closeRing, ringsSignature, roundRing } from "@/cms/utils/areaGeometry";
import type { BoundarySketchConfig, BoundarySketchControls } from "../../sketch/sketchTypes";
import type { LongdoGlobal, LongdoLocation, LongdoMap, LongdoOverlay } from "../longdoApi";
import { boundOf, pixelDistance, readEventLocation, toOuterRing, toRing } from "../longdoGeometry";
import {
  createSketchPolygonOptions,
  createSketchPreviewOptions,
  createSketchVertexOptions
} from "./longdoSketchSymbols";

/** How close a click has to land to the first vertex to close the ring. */
const CLOSE_RING_HIT_RADIUS_PX = 14;

/** Vertices needed before a ring can be closed - three corners make a polygon. */
const MIN_DRAWN_VERTICES = 3;

interface UseLongdoSketchOverlayOptions {
  longdoRef: React.MutableRefObject<LongdoGlobal | null>;
  mapRef: React.MutableRefObject<LongdoMap | null>;
  isReady: boolean;
  /** Undefined on every map that is not a boundary editor. */
  sketch?: BoundarySketchConfig;
  isDarkTheme: boolean;
  /** The view's settled zoom, for the close-the-ring proximity test. */
  zoom: number;
  /**
   * Set true while a gesture owns the map's clicks, so the map's own click
   * handler does not also reverse-geocode them. The ArcGIS SketchViewModel
   * swallows the click implicitly; here it has to be stated.
   */
  activeRef: React.MutableRefObject<boolean>;
}

/**
 * Rings read back off an overlay the SDK has been reshaping.
 *
 * `_geojson` is the SDK's own internal representation, so this validates rather
 * than trusts: anything that is not a list of [lon, lat] pairs yields no rings,
 * and the caller keeps the geometry it already had.
 */
function readOverlayRings(overlay: LongdoOverlay | null): PolygonCoordinates {
  const coordinates = overlay?._geojson?.geometry?.coordinates;
  if (!Array.isArray(coordinates)) {
    return [];
  }
  return coordinates.reduce<PolygonCoordinates>((rings, ring) => {
    if (!Array.isArray(ring)) {
      return rings;
    }
    const points = ring.reduce<number[][]>((accumulated, point) => {
      if (
        !Array.isArray(point) ||
        typeof point[0] !== "number" ||
        typeof point[1] !== "number" ||
        !Number.isFinite(point[0]) ||
        !Number.isFinite(point[1])
      ) {
        return accumulated;
      }
      return [...accumulated, [point[0], point[1]]];
    }, []);

    // Round before closing, not after: rounding the two ends of an already
    // closed ring can move them apart and leave it open again.
    const closed = closeRing(roundRing(points));
    return closed.length >= MIN_RING_POINTS ? [...rings, closed] : rings;
  }, []);
}

/**
 * What is currently drawn, as one comparable string.
 *
 * The MODE is part of it, not just the geometry: `editable` is fixed at
 * construction, so entering or leaving edit mode is itself a reason to rebuild
 * the polygon even when its shape has not changed. The theme is in it for the
 * same reason - the colours are baked in at construction too.
 */
function renderSignature(
  rings: PolygonCoordinates | undefined,
  mode: string,
  isDarkTheme: boolean
): string {
  return `${ringsSignature(rings)}:${mode}:${isDarkTheme ? "d" : "l"}`;
}

/** Drawn vertices -> stored rings. Same rounding and closing rule as above. */
function draftToRings(draft: readonly LongdoLocation[]): PolygonCoordinates {
  if (draft.length < MIN_DRAWN_VERTICES) {
    return [];
  }
  const closed = closeRing(roundRing(toRing(draft)));
  return closed.length >= MIN_RING_POINTS ? [closed] : [];
}

export function useLongdoSketchOverlay({
  longdoRef,
  mapRef,
  isReady,
  sketch,
  isDarkTheme,
  zoom,
  activeRef
}: UseLongdoSketchOverlayOptions): void {
  /** The committed polygon, or the one being reshaped. */
  const polygonRef = useRef<LongdoOverlay | null>(null);
  /** Rubber band and vertex handles - everything that exists only mid-draw. */
  const draftOverlaysRef = useRef<LongdoOverlay[]>([]);
  /** Vertices collected so far in a draw gesture. */
  const draftRef = useRef<LongdoLocation[]>([]);
  /** Signature of the rings currently drawn, so a commit does not redraw itself. */
  const renderedSignatureRef = useRef<string>("");
  /** The camera is framed on the geometry once per map instance, never per edit. */
  const hasFramedRef = useRef(false);
  /** Set during cleanup so a cancel-triggered event cannot call back into a dead owner. */
  const isTearingDownRef = useRef(false);

  const isEnabled = Boolean(sketch);
  const mode = sketch?.mode ?? "idle";
  const rings = sketch?.rings;
  const controlsRef = sketch?.controlsRef;
  const isReadOnly = Boolean(sketch?.readOnly);

  // Read through refs so the click handler registered once can stay current.
  const configRef = useRef(sketch);
  const isDarkThemeRef = useRef(isDarkTheme);
  const modeRef = useRef(mode);
  const zoomRef = useRef(zoom);
  configRef.current = sketch;
  isDarkThemeRef.current = isDarkTheme;
  modeRef.current = mode;
  zoomRef.current = zoom;

  /** Remove the rubber band and the vertex handles. */
  const clearDraftOverlays = useCallback(() => {
    const map = mapRef.current;
    draftOverlaysRef.current.forEach((overlay) => map?.Overlays.remove(overlay));
    draftOverlaysRef.current = [];
  }, [mapRef]);

  /** Redraw the in-progress ring: the band through the points, plus a handle each. */
  const renderDraft = useCallback(() => {
    const longdo = longdoRef.current;
    const map = mapRef.current;
    if (!longdo || !map) {
      return;
    }
    clearDraftOverlays();

    const draft = draftRef.current;
    if (draft.length === 0) {
      return;
    }

    const created: LongdoOverlay[] = [];

    // The shape so far. A closed polygon once there are three points, an open
    // line before that - which is what the ring actually is at that stage.
    if (draft.length >= MIN_DRAWN_VERTICES) {
      const polygon = new longdo.Polygon(draft, {
        ...createSketchPolygonOptions(isDarkThemeRef.current, false),
        clickable: false,
        pointer: false
      });
      map.Overlays.add(polygon);
      created.push(polygon);
    }
    else if (draft.length === 2) {
      const line = new longdo.Polyline(
        draft,
        createSketchPreviewOptions(isDarkThemeRef.current, longdo.LineStyle.Dashed)
      );
      map.Overlays.add(line);
      created.push(line);
    }

    draft.forEach((location, index) => {
      const marker = new longdo.Marker(location, {
        ...createSketchVertexOptions(isDarkThemeRef.current, index === 0),
        weight: longdo.OverlayWeight.Top
      });
      map.Overlays.add(marker);
      created.push(marker);
    });

    draftOverlaysRef.current = created;
  }, [longdoRef, mapRef, clearDraftOverlays]);

  /**
   * Hand rings to the owner and remember what is now on screen.
   *
   * Recording the signature AT THE CURRENT MODE is what makes a commit
   * mid-reshape safe. The committed rings come back through the owner a moment
   * later; without this the rings effect would see new geometry, rebuild the
   * polygon, and destroy the very overlay the user is still dragging. Recorded
   * this way it matches and the effect skips - while a commit made during a
   * DRAW still forces a redraw, because the mode has moved on to idle by the
   * time the effect runs and the signatures differ.
   */
  const commit = useCallback((nextRings: PolygonCoordinates) => {
    if (isTearingDownRef.current) {
      return;
    }
    renderedSignatureRef.current = renderSignature(
      nextRings,
      modeRef.current,
      isDarkThemeRef.current
    );
    configRef.current?.onCommit(nextRings);
  }, []);

  /** Finish the running gesture, keeping what it produced. */
  const complete = useCallback(() => {
    const currentMode = modeRef.current;
    if (currentMode === "draw") {
      const nextRings = draftToRings(draftRef.current);
      draftRef.current = [];
      clearDraftOverlays();
      // A ring too short to be a polygon is dropped rather than repaired:
      // inventing a point would store geometry the user never drew. The stored
      // rings are untouched, so the redraw below puts the previous shape back.
      if (nextRings.length > 0) {
        // Already on screen as the draft, so the framing effect must not treat
        // it as geometry arriving for the first time and fly the camera to it.
        hasFramedRef.current = true;
        commit(nextRings);
      }
      else {
        renderedSignatureRef.current = "";
      }
    }
    else if (currentMode === "edit") {
      // Read back whatever the reshape left behind. Done HERE, not only on the
      // SDK's drag events, so finishing captures the final shape even if those
      // events never arrive.
      const nextRings = readOverlayRings(polygonRef.current);
      if (nextRings.length > 0) {
        commit(nextRings);
      }
    }
    configRef.current?.onVertexCountChange?.(0);
    if (!isTearingDownRef.current) {
      configRef.current?.onModeEnd();
    }
  }, [clearDraftOverlays, commit]);

  /** Abandon the running gesture and leave the committed geometry alone. */
  const cancel = useCallback(() => {
    draftRef.current = [];
    clearDraftOverlays();
    // Force the rings effect to redraw from the stored geometry: a cancelled
    // draw left the map showing a shape that was never committed.
    renderedSignatureRef.current = "";
    configRef.current?.onVertexCountChange?.(0);
    if (!isTearingDownRef.current) {
      configRef.current?.onModeEnd();
    }
  }, [clearDraftOverlays]);

  const completeRef = useRef(complete);
  const cancelRef = useRef(cancel);
  completeRef.current = complete;
  cancelRef.current = cancel;

  // The draw gesture: clicks become vertices. Bound only while drawing, so an
  // idle map carries no listener of ours at all.
  useEffect(() => {
    const map = mapRef.current;
    if (!isReady || !map || !isEnabled || isReadOnly || mode !== "draw") {
      return;
    }

    draftRef.current = [];
    clearDraftOverlays();
    configRef.current?.onVertexCountChange?.(0);

    const handleClick = (event: unknown) => {
      const location = readEventLocation(event);
      if (!location) {
        return;
      }
      const draft = draftRef.current;

      // Clicking the first vertex closes the ring - the only way to finish with
      // the pointer alone, which is why that handle is drawn larger and hollow.
      if (
        draft.length >= MIN_DRAWN_VERTICES &&
        pixelDistance(draft[0], location, zoomRef.current) <= CLOSE_RING_HIT_RADIUS_PX
      ) {
        completeRef.current();
        return;
      }

      draftRef.current = [...draft, location];
      renderDraft();
      configRef.current?.onVertexCountChange?.(draftRef.current.length);
    };

    // Enter finishes, matching what SketchViewModel does natively on the ArcGIS
    // map. Escape is deliberately NOT handled here - the owner takes it at the
    // capture phase, because two modals are also listening for it.
    const handleKeyDown = (keyEvent: KeyboardEvent) => {
      if (keyEvent.key === "Enter") {
        keyEvent.preventDefault();
        completeRef.current();
      }
    };

    map.Event.bind("click", handleClick);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      map.Event.unbind("click", handleClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isReady, isEnabled, isReadOnly, mode, mapRef, clearDraftOverlays, renderDraft]);

  // The edit gesture: the committed polygon becomes reshapeable, and the SDK's
  // own drag events feed the textarea while it is being dragged.
  //
  // Those events are a CONVENIENCE, not the mechanism: `complete` above reads
  // the geometry back itself when the gesture ends, so the final shape is
  // committed whether or not the SDK reports anything mid-drag.
  useEffect(() => {
    const map = mapRef.current;
    if (!isReady || !map || !isEnabled || isReadOnly || mode !== "edit") {
      return;
    }

    const handleReshape = (event: unknown) => {
      // Only the polygon this hook owns; the same events fire for every overlay
      // on the map, including staff markers on a case map.
      if (event !== polygonRef.current) {
        return;
      }
      const nextRings = readOverlayRings(polygonRef.current);
      if (nextRings.length > 0) {
        commit(nextRings);
      }
    };

    map.Event.bind("overlayDrop", handleReshape);
    map.Event.bind("overlayChange", handleReshape);

    return () => {
      map.Event.unbind("overlayDrop", handleReshape);
      map.Event.unbind("overlayChange", handleReshape);
    };
  }, [isReady, isEnabled, isReadOnly, mode, mapRef, commit]);

  // Stored rings -> what is on the map.
  //
  // Skipped while a DRAW gesture owns the geometry: the draft is authoritative
  // then, and redrawing underneath it would replace what the user is building.
  // `mode` is a dependency rather than a guard read through a ref because
  // RETURNING to idle is itself a reason to redraw - a cancelled draw left the
  // stored rings unchanged, so nothing else would ever put the polygon back.
  useEffect(() => {
    const longdo = longdoRef.current;
    const map = mapRef.current;
    if (!isReady || !longdo || !map || !isEnabled || mode === "draw") {
      return;
    }

    // The polygon has to be rebuilt when the mode changes even if the geometry
    // did not: `editable` is fixed at construction, so entering or leaving edit
    // mode is the only way to turn the vertex handles on and off.
    const signature = renderSignature(rings, mode, isDarkTheme);
    if (signature === renderedSignatureRef.current) {
      return;
    }
    renderedSignatureRef.current = signature;

    if (polygonRef.current) {
      map.Overlays.remove(polygonRef.current);
      polygonRef.current = null;
    }

    const ring = toOuterRing(rings ?? []);
    if (ring.length === 0) {
      return;
    }

    const polygon = new longdo.Polygon(
      ring,
      createSketchPolygonOptions(isDarkTheme, mode === "edit" && !isReadOnly)
    );
    map.Overlays.add(polygon);
    polygonRef.current = polygon;
  }, [longdoRef, mapRef, isReady, isEnabled, rings, mode, isDarkTheme, isReadOnly]);

  // Frame the geometry once per map instance - on mount for a record that
  // already has a boundary, or the first time one is drawn. Deliberately not on
  // every edit: a camera that jumped after each dragged vertex is unusable.
  useEffect(() => {
    const map = mapRef.current;
    if (!isReady || !map || !isEnabled || hasFramedRef.current) {
      return;
    }
    const ring = toOuterRing(rings ?? []);
    const bound = boundOf(ring);
    if (!bound) {
      return;
    }
    hasFramedRef.current = true;
    map.bound(bound);
  }, [mapRef, isReady, isEnabled, rings]);

  // Publish the gesture controls while one is running, so the toolbar and the
  // Escape key can end it from outside the map. Only the instance actually
  // holding a gesture registers, so the second map that appears when the view
  // is expanded cannot take them from the first.
  useEffect(() => {
    if (!controlsRef || mode === "idle") {
      return;
    }
    const controls: BoundarySketchControls = {
      complete: () => completeRef.current(),
      cancel: () => cancelRef.current()
    };
    controlsRef.current = controls;
    return () => {
      if (controlsRef.current === controls) {
        controlsRef.current = null;
      }
    };
  }, [controlsRef, mode]);

  // Tell the map a gesture owns the clicks, so it does not also reverse-geocode
  // them. Every map that renders a sketch is read-only today, which already
  // stops that - this covers the case where one is not.
  useEffect(() => {
    activeRef.current = isEnabled && mode !== "idle";
    return () => {
      activeRef.current = false;
    };
  }, [activeRef, isEnabled, mode]);

  // Teardown. The refs are read IN the cleanup because the map is built
  // asynchronously and is still null when this effect first runs.
  useEffect(() => {
    isTearingDownRef.current = false;
    return () => {
      isTearingDownRef.current = true;
      // eslint-disable-next-line react-hooks/exhaustive-deps
      const map = mapRef.current;
      draftOverlaysRef.current.forEach((overlay) => map?.Overlays.remove(overlay));
      draftOverlaysRef.current = [];
      if (polygonRef.current) {
        map?.Overlays.remove(polygonRef.current);
        polygonRef.current = null;
      }
      draftRef.current = [];
      renderedSignatureRef.current = "";
      hasFramedRef.current = false;
    };
  }, [mapRef]);
}
