// Draws and edits one boundary polygon on a MapTiler map.
//
// The counterpart of useBoundarySketchLayer / useLongdoSketchOverlay, honouring
// the same BoundarySketchConfig - so the owner (useBoundarySketchState), the
// toolbar and the Escape handling stay provider-neutral.
//
// WRITE-BACK CADENCE is the rule this shares with both and must not break: a
// gesture commits when it FINISHES, never per vertex. The owner's state is a
// JSON string a textarea also edits, so a per-vertex commit would re-render the
// whole form on every click AND hand parsePolygonRings a two-point ring. Live
// feedback is the rubber band plus the vertex count reported through
// onVertexCountChange.
//
// HAND-ROLLED, no draw library. MapLibre has no create tool, and the app already
// owns BoundaryDrawToolbar (in three languages, wired to the controlsRef
// contract); a vendor draw plugin would bring a second toolbar. So the gesture
// is built from primitives: map clicks, a GeoJSON source for the rubber band,
// and draggable Markers for the vertex handles - the same shape the Longdo hook
// takes.
//
// FINISHING a ring: the toolbar Finish button, the Enter key, or clicking the
// first vertex (drawn larger and hollow to advertise itself). Never
// double-click - it emits two clicks and would add a stray vertex first.
//
// A source + layers, so the committed polygon re-adds itself on `styleEpoch`.
import { useCallback, useEffect, useRef } from "react";
import { LngLatBounds, Marker, type Map as MlMap, type MapMouseEvent, type GeoJSONSource } from "maplibre-gl";
import type { Feature, FeatureCollection } from "geojson";
import type { PolygonCoordinates } from "@/cms/types/area";
import { MIN_RING_POINTS, closeRing, ringsSignature, roundRing } from "@/cms/utils/areaGeometry";
import type { BoundarySketchConfig, BoundarySketchControls } from "../../sketch/sketchTypes";
import { sanitizeRing } from "../maptilerGeometry";
import { asLayer, setPaintExpr } from "../mlTypes";
import {
  createSketchVertexElement,
  sketchFillPaint,
  sketchLinePaint
} from "./maptilerSketchSymbols";

const COMMITTED_SOURCE = "maptiler-sketch";
const COMMITTED_FILL = "maptiler-sketch-fill";
const COMMITTED_LINE = "maptiler-sketch-line";
const DRAFT_SOURCE = "maptiler-sketch-draft";
const DRAFT_FILL = "maptiler-sketch-draft-fill";
const DRAFT_LINE = "maptiler-sketch-draft-line";

/** How close a click has to land to the first vertex to close the ring. */
const CLOSE_RING_HIT_RADIUS_PX = 14;
/** Vertices needed before a ring can be closed. */
const MIN_DRAWN_VERTICES = 3;

interface UseMapTilerSketchOverlayOptions {
  mapRef: React.MutableRefObject<MlMap | null>;
  isReady: boolean;
  styleEpoch: number;
  sketch?: BoundarySketchConfig;
  isDarkTheme: boolean;
  /** Set true while a gesture owns the map's clicks (see MapTilerAddressMap). */
  activeRef: React.MutableRefObject<boolean>;
}

type Ring = number[][];

function renderSignature(
  rings: PolygonCoordinates | undefined,
  mode: string,
  isDarkTheme: boolean
): string {
  return `${ringsSignature(rings)}:${mode}:${isDarkTheme ? "d" : "l"}`;
}

/** Drawn vertices -> stored rings. Round then close, per areaGeometry's rule. */
function draftToRings(draft: readonly number[][]): PolygonCoordinates {
  if (draft.length < MIN_DRAWN_VERTICES) {
    return [];
  }
  const closed = closeRing(roundRing(draft.map((point) => [point[0], point[1]])));
  return closed.length >= MIN_RING_POINTS ? [closed] : [];
}

/** An open working ring (no closing duplicate) from stored rings. */
function toOpenRing(rings: PolygonCoordinates | undefined): Ring {
  const outer = rings?.[0];
  if (!outer || outer.length < MIN_RING_POINTS) {
    return [];
  }
  const points = sanitizeRing(outer);
  // Drop the closing duplicate if present.
  if (
    points.length >= 2 &&
    points[0][0] === points[points.length - 1][0] &&
    points[0][1] === points[points.length - 1][1]
  ) {
    points.pop();
  }
  return points;
}

function openRingToRings(ring: Ring): PolygonCoordinates {
  if (ring.length < MIN_DRAWN_VERTICES) {
    return [];
  }
  const closed = closeRing(roundRing(ring.map((point) => [point[0], point[1]])));
  return closed.length >= MIN_RING_POINTS ? [closed] : [];
}

function polygonFeature(ring: Ring): Feature {
  const closed = ring.length >= 3 ? [...ring, ring[0]] : ring;
  return {
    type: "Feature",
    properties: {},
    geometry: { type: "Polygon", coordinates: [closed.map((p) => [p[0], p[1]])] }
  };
}

function lineFeature(points: Ring): Feature {
  return {
    type: "Feature",
    properties: {},
    geometry: { type: "LineString", coordinates: points.map((p) => [p[0], p[1]]) }
  };
}

function emptyCollection(): FeatureCollection {
  return { type: "FeatureCollection", features: [] };
}

export function useMapTilerSketchOverlay({
  mapRef,
  isReady,
  styleEpoch,
  sketch,
  isDarkTheme,
  activeRef
}: UseMapTilerSketchOverlayOptions): void {
  const draftRef = useRef<Ring>([]);
  const draftMarkersRef = useRef<Marker[]>([]);
  const editRingRef = useRef<Ring>([]);
  const editMarkersRef = useRef<Marker[]>([]);
  const renderedSignatureRef = useRef<string>("");
  const hasFramedRef = useRef(false);
  const isTearingDownRef = useRef(false);

  const isEnabled = Boolean(sketch);
  const mode = sketch?.mode ?? "idle";
  const rings = sketch?.rings;
  const controlsRef = sketch?.controlsRef;
  const isReadOnly = Boolean(sketch?.readOnly);

  const configRef = useRef(sketch);
  const isDarkThemeRef = useRef(isDarkTheme);
  const modeRef = useRef(mode);
  configRef.current = sketch;
  isDarkThemeRef.current = isDarkTheme;
  modeRef.current = mode;

  const clearDraftMarkers = useCallback(() => {
    draftMarkersRef.current.forEach((marker) => marker.remove());
    draftMarkersRef.current = [];
  }, []);

  const clearEditMarkers = useCallback(() => {
    editMarkersRef.current.forEach((marker) => marker.remove());
    editMarkersRef.current = [];
  }, []);

  const setDraftData = useCallback(
    (data: FeatureCollection) => {
      const map = mapRef.current;
      if (!map) {
        return;
      }
      const source = map.getSource(DRAFT_SOURCE);
      if (source && "setData" in source) {
        (source as GeoJSONSource).setData(data);
        return;
      }
      map.addSource(DRAFT_SOURCE, { type: "geojson", data });
      map.addLayer(
        asLayer({
          id: DRAFT_FILL,
          type: "fill",
          source: DRAFT_SOURCE,
          filter: ["==", ["geometry-type"], "Polygon"],
          paint: sketchFillPaint(isDarkThemeRef.current)
        })
      );
      map.addLayer(
        asLayer({
          id: DRAFT_LINE,
          type: "line",
          source: DRAFT_SOURCE,
          paint: sketchLinePaint(isDarkThemeRef.current, true)
        })
      );
    },
    [mapRef]
  );

  const removeDraftLayers = useCallback(() => {
    const map = mapRef.current;
    if (!map) {
      return;
    }
    [DRAFT_FILL, DRAFT_LINE].forEach((id) => {
      if (map.getLayer(id)) {
        map.removeLayer(id);
      }
    });
    if (map.getSource(DRAFT_SOURCE)) {
      map.removeSource(DRAFT_SOURCE);
    }
  }, [mapRef]);

  /** Redraw the in-progress ring: the rubber band plus a handle per vertex. */
  const renderDraft = useCallback(() => {
    const map = mapRef.current;
    if (!map) {
      return;
    }
    const draft = draftRef.current;
    clearDraftMarkers();

    if (draft.length === 0) {
      setDraftData(emptyCollection());
      return;
    }

    const feature =
      draft.length >= MIN_DRAWN_VERTICES ? polygonFeature(draft) : lineFeature(draft);
    setDraftData({ type: "FeatureCollection", features: [feature] });

    draft.forEach((point, index) => {
      const element = createSketchVertexElement(isDarkThemeRef.current, index === 0);
      if (index === 0) {
        element.addEventListener("click", (event) => {
          event.stopPropagation();
          completeRef.current();
        });
      }
      const marker = new Marker({ element, anchor: "center" })
        .setLngLat([point[0], point[1]])
        .addTo(map);
      draftMarkersRef.current.push(marker);
    });
  }, [mapRef, clearDraftMarkers, setDraftData]);

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

  const complete = useCallback(() => {
    const currentMode = modeRef.current;
    if (currentMode === "draw") {
      const nextRings = draftToRings(draftRef.current);
      draftRef.current = [];
      clearDraftMarkers();
      removeDraftLayers();
      if (nextRings.length > 0) {
        hasFramedRef.current = true;
        commit(nextRings);
      } else {
        renderedSignatureRef.current = "";
      }
    } else if (currentMode === "edit") {
      const nextRings = openRingToRings(editRingRef.current);
      if (nextRings.length > 0) {
        commit(nextRings);
      }
    }
    configRef.current?.onVertexCountChange?.(0);
    if (!isTearingDownRef.current) {
      configRef.current?.onModeEnd();
    }
  }, [clearDraftMarkers, removeDraftLayers, commit]);

  const cancel = useCallback(() => {
    draftRef.current = [];
    clearDraftMarkers();
    removeDraftLayers();
    // Force the committed-render effect to redraw the stored geometry.
    renderedSignatureRef.current = "";
    configRef.current?.onVertexCountChange?.(0);
    if (!isTearingDownRef.current) {
      configRef.current?.onModeEnd();
    }
  }, [clearDraftMarkers, removeDraftLayers]);

  const completeRef = useRef(complete);
  const cancelRef = useRef(cancel);
  completeRef.current = complete;
  cancelRef.current = cancel;

  // The draw gesture: clicks become vertices. Bound only while drawing.
  useEffect(() => {
    const map = mapRef.current;
    if (!isReady || !map || !isEnabled || isReadOnly || mode !== "draw") {
      return;
    }
    draftRef.current = [];
    clearDraftMarkers();
    configRef.current?.onVertexCountChange?.(0);
    renderDraft();

    const handleClick = (event: MapMouseEvent) => {
      const draft = draftRef.current;
      const point: [number, number] = [event.lngLat.lng, event.lngLat.lat];

      if (draft.length >= MIN_DRAWN_VERTICES && map) {
        const first = map.project(draft[0] as [number, number]);
        const here = map.project(point);
        if (Math.hypot(first.x - here.x, first.y - here.y) <= CLOSE_RING_HIT_RADIUS_PX) {
          completeRef.current();
          return;
        }
      }

      draftRef.current = [...draft, point];
      renderDraft();
      configRef.current?.onVertexCountChange?.(draftRef.current.length);
    };

    const handleKeyDown = (keyEvent: KeyboardEvent) => {
      if (keyEvent.key === "Enter") {
        keyEvent.preventDefault();
        completeRef.current();
      }
    };

    map.on("click", handleClick);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      map.off("click", handleClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [mapRef, isReady, isEnabled, isReadOnly, mode, clearDraftMarkers, renderDraft]);

  // The edit gesture: the committed polygon's vertices become draggable.
  useEffect(() => {
    const map = mapRef.current;
    if (!isReady || !map || !isEnabled || isReadOnly || mode !== "edit") {
      return;
    }
    editRingRef.current = toOpenRing(rings);
    clearEditMarkers();

    const redrawShape = () => {
      const source = map.getSource(COMMITTED_SOURCE);
      if (source && "setData" in source) {
        (source as GeoJSONSource).setData({
          type: "FeatureCollection",
          features: editRingRef.current.length >= 3 ? [polygonFeature(editRingRef.current)] : []
        });
      }
    };

    editRingRef.current.forEach((point, index) => {
      const marker = new Marker({
        element: createSketchVertexElement(isDarkThemeRef.current, false),
        anchor: "center",
        draggable: true
      })
        .setLngLat([point[0], point[1]])
        .addTo(map);
      marker.on("drag", () => {
        const lngLat = marker.getLngLat();
        editRingRef.current = editRingRef.current.map((existing, i) =>
          i === index ? [lngLat.lng, lngLat.lat] : existing
        );
        redrawShape();
      });
      marker.on("dragend", () => {
        const nextRings = openRingToRings(editRingRef.current);
        if (nextRings.length > 0) {
          commit(nextRings);
        }
      });
      editMarkersRef.current.push(marker);
    });

    return () => {
      clearEditMarkers();
    };
  }, [mapRef, isReady, isEnabled, isReadOnly, mode, rings, clearEditMarkers, commit]);

  // Stored rings -> the committed polygon on the map. Skipped while a DRAW
  // gesture owns the geometry.
  useEffect(() => {
    const map = mapRef.current;
    if (!isReady || !map || !isEnabled || mode === "draw") {
      return;
    }
    const signature = renderSignature(rings, mode, isDarkTheme);
    if (signature === renderedSignatureRef.current && map.getSource(COMMITTED_SOURCE)) {
      return;
    }
    renderedSignatureRef.current = signature;

    const openRing = toOpenRing(rings);
    const data: FeatureCollection = {
      type: "FeatureCollection",
      features: openRing.length >= 3 ? [polygonFeature(openRing)] : []
    };

    const source = map.getSource(COMMITTED_SOURCE);
    if (source && "setData" in source) {
      (source as GeoJSONSource).setData(data);
    } else {
      map.addSource(COMMITTED_SOURCE, { type: "geojson", data });
      map.addLayer(
        asLayer({
          id: COMMITTED_FILL,
          type: "fill",
          source: COMMITTED_SOURCE,
          paint: sketchFillPaint(isDarkTheme)
        })
      );
      map.addLayer(
        asLayer({
          id: COMMITTED_LINE,
          type: "line",
          source: COMMITTED_SOURCE,
          paint: sketchLinePaint(isDarkTheme, false)
        })
      );
    }
    if (map.getLayer(COMMITTED_FILL)) {
      setPaintExpr(
        map,
        COMMITTED_FILL,
        "fill-color",
        sketchFillPaint(isDarkTheme)["fill-color"]
      );
      setPaintExpr(
        map,
        COMMITTED_LINE,
        "line-color",
        sketchLinePaint(isDarkTheme, false)["line-color"]
      );
    }
  }, [mapRef, isReady, isEnabled, rings, mode, isDarkTheme, styleEpoch]);

  // Frame the geometry once per map instance.
  useEffect(() => {
    const map = mapRef.current;
    if (!isReady || !map || !isEnabled || hasFramedRef.current) {
      return;
    }
    const openRing = toOpenRing(rings);
    if (openRing.length < MIN_DRAWN_VERTICES) {
      return;
    }
    const bounds = new LngLatBounds();
    openRing.forEach((point) => bounds.extend([point[0], point[1]]));
    if (bounds.isEmpty()) {
      return;
    }
    hasFramedRef.current = true;
    map.fitBounds(bounds, { padding: 56, maxZoom: 15 });
  }, [mapRef, isReady, isEnabled, rings]);

  // Publish the gesture controls while one is running.
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

  // Tell the map a gesture owns the clicks, so it does not also reverse-geocode.
  useEffect(() => {
    activeRef.current = isEnabled && mode !== "idle";
    return () => {
      activeRef.current = false;
    };
  }, [activeRef, isEnabled, mode]);

  // Teardown.
  useEffect(() => {
    isTearingDownRef.current = false;
    const draftMarkers = draftMarkersRef;
    const editMarkers = editMarkersRef;
    return () => {
      isTearingDownRef.current = true;
      // eslint-disable-next-line react-hooks/exhaustive-deps
      const map = mapRef.current;
      draftMarkers.current.forEach((marker) => marker.remove());
      draftMarkers.current = [];
      editMarkers.current.forEach((marker) => marker.remove());
      editMarkers.current = [];
      if (map) {
        [COMMITTED_FILL, COMMITTED_LINE, DRAFT_FILL, DRAFT_LINE].forEach((id) => {
          if (map.getLayer(id)) {
            map.removeLayer(id);
          }
        });
        [COMMITTED_SOURCE, DRAFT_SOURCE].forEach((id) => {
          if (map.getSource(id)) {
            map.removeSource(id);
          }
        });
      }
      draftRef.current = [];
      editRingRef.current = [];
      renderedSignatureRef.current = "";
      hasFramedRef.current = false;
    };
  }, [mapRef]);
}
