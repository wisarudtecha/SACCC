// Draws one editable boundary polygon on the existing map.
//
// Follows the same discipline as useRouteGraphicsLayer / useAdminBoundaryLayers:
//
//   1. The layer is added to the EXISTING map, never a rebuilt MapView.
//   2. Everything updates in place - the polygon, the symbol, the mode.
//   3. This hook is called LAST among the layer hooks in ArcgisAddressMap, so a
//      plain map.add() puts it on top. It is the only interactive overlay here,
//      and a vertex handle underneath another layer cannot be grabbed.
//
// WRITE-BACK CADENCE is the non-obvious part. The owner's state is a JSON
// string that a textarea also edits, so every commit re-renders the whole form.
// Committing per vertex would therefore do two bad things: run that render on
// every click AND hand parsePolygonRings a two-point ring, which it rightly
// rejects - the field would flash a validation error through the entire draw.
// So a gesture commits when it FINISHES (create complete, a drag stopping, an
// update ending). The live feedback in the meantime is the map's own rubber
// band plus the vertex count reported through onVertexCountChange, which the
// owner keeps in local state and never in the form.
import { useEffect, useRef } from "react";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer.js";
import Graphic from "@arcgis/core/Graphic.js";
import SketchViewModel from "@arcgis/core/widgets/Sketch/SketchViewModel.js";
import type Polygon from "@arcgis/core/geometry/Polygon.js";
import type esriMap from "@arcgis/core/Map.js";
import type MapView from "@arcgis/core/views/MapView.js";
import { createSketchPolygonSymbol } from "./sketchSymbols";
import { polygonToRings, ringsToPolygon } from "./sketchGeometry";
import { ringsSignature } from "@/cms/utils/areaGeometry";
import type { BoundarySketchConfig, BoundarySketchControls } from "./sketchTypes";

/** Padding applied to the polygon's extent before framing it. Pure breathing room. */
const SKETCH_FRAME_PADDING_FACTOR = 1.4;

// Minimal shapes for the event fields actually read here. Same reasoning as
// ArcgisAddressMap's ViewClickEventLike: the SDK's generated event types live in
// a declaration-only module and are not reliably importable across major
// versions, so the safer thing is to describe the handful of fields used.
interface SketchGraphicLike {
  geometry?: unknown;
  symbol?: unknown;
}
interface SketchCreateEventLike {
  graphic?: SketchGraphicLike | null;
  state: "start" | "active" | "complete" | "cancel";
  toolEventInfo?: { type?: string } | null;
}
interface SketchUpdateEventLike {
  graphics?: SketchGraphicLike[] | null;
  state: "start" | "active" | "complete";
  aborted?: boolean;
  toolEventInfo?: { type?: string } | null;
}

/** Narrow an unknown geometry to a Polygon without asserting. */
function asPolygon(geometry: unknown): Polygon | null {
  const candidate = geometry as Polygon | null | undefined;
  return candidate?.type === "polygon" ? candidate : null;
}

/** Vertices in the outer ring, for the live readout while drawing. */
function outerRingLength(polygon: Polygon | null): number {
  return polygon?.rings?.[0]?.length ?? 0;
}

/** True for the drag/reshape events that mark the END of one gesture. */
function isGestureStop(toolEventInfoType?: string): boolean {
  return Boolean(toolEventInfoType?.endsWith("-stop"));
}

interface UseBoundarySketchLayerOptions {
  mapRef: React.MutableRefObject<esriMap | null>;
  viewRef: React.MutableRefObject<MapView | null>;
  /** True once the MapView has resolved; refs are only safe to touch after this. */
  isReady: boolean;
  /** Undefined on every map that is not a boundary editor. */
  sketch?: BoundarySketchConfig;
  isDarkTheme: boolean;
}

export function useBoundarySketchLayer({
  mapRef,
  viewRef,
  isReady,
  sketch,
  isDarkTheme
}: UseBoundarySketchLayerOptions): void {
  const layerRef = useRef<GraphicsLayer | null>(null);
  const sketchRef = useRef<SketchViewModel | null>(null);
  const graphicRef = useRef<Graphic | null>(null);
  /** Signature of the rings currently drawn, so a commit does not redraw itself. */
  const renderedSignatureRef = useRef<string>("");
  /** The camera is framed on the geometry once per map instance, never on every edit. */
  const hasFramedRef = useRef(false);
  /** Set during cleanup so a cancel-triggered event cannot call back into a dead owner. */
  const isTearingDownRef = useRef(false);

  const isEnabled = Boolean(sketch);
  const mode = sketch?.mode ?? "idle";
  const rings = sketch?.rings;
  const controlsRef = sketch?.controlsRef;
  const isReadOnly = Boolean(sketch?.readOnly);
  const onModeEnd = sketch?.onModeEnd;

  // Read through refs so the build-once effect below can register its handlers
  // without going stale and without re-subscribing on every render.
  const configRef = useRef(sketch);
  const isDarkThemeRef = useRef(isDarkTheme);
  configRef.current = sketch;
  isDarkThemeRef.current = isDarkTheme;

  // Build the layer and the sketch model once.
  useEffect(() => {
    const map = mapRef.current;
    const view = viewRef.current;
    if (!isReady || !map || !view || !isEnabled) {
      return;
    }
    isTearingDownRef.current = false;

    const layer = new GraphicsLayer({ id: "boundary-sketch-layer" });
    layerRef.current = layer;
    // No reorder: this hook runs after every other layer hook in
    // ArcgisAddressMap, so appending already puts it on top. See header.
    map.add(layer);

    const model = new SketchViewModel({
      view,
      layer,
      polygonSymbol: createSketchPolygonSymbol(isDarkThemeRef.current),
      // Click per vertex. The default "hybrid" mode turns a drag into one vertex
      // per pointer move, which on a boundary means hundreds of points that
      // nobody asked for and that bloat every payload the ring appears in.
      defaultCreateOptions: { mode: "click" },
      defaultUpdateOptions: { tool: "reshape" },
      // The Edit button starts an update session. Without this, an idle map
      // would start one whenever the user clicked the polygon to look at it.
      updateOnGraphicClick: false
    });
    sketchRef.current = model;

    const commit = (polygon: Polygon | null) => {
      if (isTearingDownRef.current) {
        return;
      }
      const nextRings = polygonToRings(polygon);
      renderedSignatureRef.current = ringsSignature(nextRings);
      configRef.current?.onCommit(nextRings);
    };

    const createHandle = model.on("create", (event: SketchCreateEventLike) => {
      const polygon = asPolygon(event.graphic?.geometry);

      if (event.state === "start" || event.state === "active") {
        configRef.current?.onVertexCountChange?.(outerRingLength(polygon));
        return;
      }

      if (event.state === "complete") {
        graphicRef.current = (event.graphic as Graphic | null) ?? null;
        // What was just drawn is already on screen, so the framing effect below
        // must not treat it as geometry arriving for the first time and fly the
        // camera to it.
        hasFramedRef.current = true;
        commit(polygon);
      }
      else {
        // Cancelled: the model has already discarded its graphic, so the next
        // rings effect has to redraw the last committed geometry from scratch.
        graphicRef.current = null;
        renderedSignatureRef.current = "";
      }
      configRef.current?.onVertexCountChange?.(0);
      if (!isTearingDownRef.current) {
        configRef.current?.onModeEnd();
      }
    });

    const updateHandle = model.on("update", (event: SketchUpdateEventLike) => {
      const graphic = event.graphics?.[0];
      const polygon = asPolygon(graphic?.geometry);

      // A drag that just ended, mid-session: commit it so the textarea keeps up
      // without waiting for the whole edit session to finish.
      if (event.state === "active" && isGestureStop(event.toolEventInfo?.type)) {
        commit(polygon);
        return;
      }
      if (event.state !== "complete") {
        return;
      }
      if (!event.aborted) {
        commit(polygon);
      }
      if (!isTearingDownRef.current) {
        configRef.current?.onModeEnd();
      }
    });

    return () => {
      isTearingDownRef.current = true;
      createHandle.remove();
      updateHandle.remove();
      model.destroy();
      map.remove(layer);
      layer.removeAll();
      layer.destroy();
      sketchRef.current = null;
      layerRef.current = null;
      graphicRef.current = null;
      renderedSignatureRef.current = "";
      hasFramedRef.current = false;
    };
  }, [isReady, isEnabled, mapRef, viewRef]);

  // Stored rings -> what is on the map. Skipped while a gesture owns the
  // geometry: the model is authoritative then, and redrawing underneath it
  // would replace the graphic the user is currently dragging.
  //
  // `mode` is a dependency, not just a guard read through the ref, because
  // RETURNING to idle is itself a reason to redraw: a cancelled create left the
  // layer empty and the stored rings unchanged, so nothing else would ever put
  // the previous boundary back.
  useEffect(() => {
    const layer = layerRef.current;
    if (!isReady || !layer || mode !== "idle") {
      return;
    }
    const signature = ringsSignature(rings);
    if (signature === renderedSignatureRef.current) {
      return;
    }
    renderedSignatureRef.current = signature;

    layer.removeAll();
    graphicRef.current = null;

    const polygon = ringsToPolygon(rings ?? []);
    if (!polygon) {
      return;
    }
    const graphic = new Graphic({
      geometry: polygon,
      symbol: createSketchPolygonSymbol(isDarkThemeRef.current)
    });
    graphicRef.current = graphic;
    layer.add(graphic);
  }, [isReady, rings, mode]);

  // Frame the geometry once per map instance - on mount for a record that
  // already has a boundary, or the first time one is drawn. Deliberately not on
  // every edit: the camera jumping after each dragged vertex is unusable.
  useEffect(() => {
    const view = viewRef.current;
    const graphic = graphicRef.current;
    if (!isReady || !view || hasFramedRef.current || !graphic) {
      return;
    }
    const extent = (graphic.geometry as Polygon | null)?.extent?.expand(SKETCH_FRAME_PADDING_FACTOR);
    if (!extent) {
      return;
    }
    hasFramedRef.current = true;
    view.goTo(extent).catch(() => {
      /* goTo rejects when interrupted by a newer navigation - safe to ignore */
    });
  }, [isReady, rings, viewRef]);

  // Mode -> what the model is doing.
  useEffect(() => {
    const model = sketchRef.current;
    const layer = layerRef.current;
    if (!isReady || !model || !layer) {
      return;
    }

    if (mode === "idle") {
      model.cancel();
      return;
    }
    if (isReadOnly) {
      // Belt and braces: the toolbar is not rendered on a read-only field, but a
      // mode arriving anyway must not turn this into an editable map.
      return;
    }

    if (mode === "draw") {
      // A new ring replaces the old one - PolygonCoordinates is a single
      // polygon's rings and cannot express two separate shapes. Whether to warn
      // about that is the owner's call; by the time the mode is "draw" it has
      // been made.
      model.cancel();
      layer.removeAll();
      graphicRef.current = null;
      renderedSignatureRef.current = "";
      model.create("polygon").catch(() => {
        /* rejects when superseded by another create/cancel - safe to ignore */
      });
      return;
    }

    const graphic = graphicRef.current;
    if (!graphic) {
      // Nothing drawn yet, so there is nothing to reshape.
      onModeEnd?.();
      return;
    }
    model.update([graphic], { tool: "reshape" });
  }, [isReady, mode, isReadOnly, onModeEnd]);

  // Publish the gesture controls while one is running, so the toolbar and the
  // Escape key can end it from outside the map. Only the instance actually
  // holding a gesture registers, so the second MapView that appears when the
  // map is expanded cannot take them from the first.
  useEffect(() => {
    if (!controlsRef || mode === "idle") {
      return;
    }
    const controls: BoundarySketchControls = {
      complete: () => sketchRef.current?.complete(),
      cancel: () => sketchRef.current?.cancel()
    };
    controlsRef.current = controls;
    return () => {
      if (controlsRef.current === controls) {
        controlsRef.current = null;
      }
    };
  }, [controlsRef, mode]);

  // Theme. Rebuilds the symbol rather than mutating it - Accessor does not
  // observe mutation of a nested symbol, the same trap useAdminBoundaryLayers
  // documents for its renderers.
  useEffect(() => {
    const model = sketchRef.current;
    if (!isReady || !model) {
      return;
    }
    const symbol = createSketchPolygonSymbol(isDarkTheme);
    model.polygonSymbol = symbol;
    const graphic = graphicRef.current;
    if (graphic) {
      graphic.symbol = symbol as unknown as Graphic["symbol"];
    }
  }, [isReady, isDarkTheme]);
}
