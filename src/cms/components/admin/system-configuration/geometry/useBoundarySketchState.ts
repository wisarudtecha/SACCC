// Owns everything about drawing a boundary except the map itself.
//
// Deliberately free of any @arcgis/core import. The component that calls this
// renders a textarea and three buttons and is imported eagerly by two form
// hosts; only the map below it is lazy. Anything here that touched the SDK
// would put ~1MB into their chunk whether or not anyone opened a map.
//
// This must be called ABOVE the map field. AddressMapField renders a
// SECOND MapView when expanded, so state owned any lower would be thrown away
// the moment the user expanded the map - the same reason useBoundarySelection
// sits where it does.
//
// THE STRING IS THE STATE. `value` is the same JSON the textarea edits, and a
// gesture that finishes writes back through the same `onChange`. That is what
// keeps the map, the textarea, the host's validation and its Reset/Restore
// buttons all describing one thing instead of four.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { PolygonCoordinates } from "@/cms/types/area";
import {
  formatPolygonRings,
  parsePolygonRings,
  type PolygonParseErrorKey
} from "@/cms/utils/areaGeometry";
import type {
  BoundarySketchConfig,
  BoundarySketchControls,
  BoundarySketchMode
} from "@/cms/components/case/createCase/map/sketch/sketchTypes";

/**
 * How long to wait after a keystroke before redrawing the map from the
 * textarea. Long enough that typing a coordinate by hand does not re-render the
 * polygon per character, short enough to still feel like a live preview.
 */
const TEXT_TO_MAP_DEBOUNCE_MS = 300;

const EMPTY_RINGS: PolygonCoordinates = [];

export interface BoundarySketchState {
  /**
   * What the map should draw. Holds the last VALID rings, so mistyping a digit
   * in the textarea shows the error without the polygon vanishing underneath
   * the user while they fix it.
   */
  rings: PolygonCoordinates;
  /** i18n key under crud.areaTemplate.geometry.error, or undefined when the text parses. */
  errorKey?: PolygonParseErrorKey;
  mode: BoundarySketchMode;
  /** Vertices in the ring currently being drawn. Zero unless a create is running. */
  vertexCount: number;
  hasGeometry: boolean;
  isExpanded: boolean;
  startDraw: () => void;
  startEdit: () => void;
  /** Finish the running gesture, keeping what was drawn. */
  finish: () => void;
  /** Abandon the running gesture. */
  cancel: () => void;
  clear: () => void;
  handleExpandedChange: (isExpanded: boolean) => void;
  /** Hand straight to the map field's `sketch` prop. */
  sketch: BoundarySketchConfig;
}

interface UseBoundarySketchStateOptions {
  /** The field's current JSON text - the same string the textarea shows. */
  value: string;
  onChange: (next: string) => void;
  readOnly?: boolean;
}

export function useBoundarySketchState({
  value,
  onChange,
  readOnly = false
}: UseBoundarySketchStateOptions): BoundarySketchState {
  const [mode, setMode] = useState<BoundarySketchMode>("idle");
  const [vertexCount, setVertexCount] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const [debouncedValue, setDebouncedValue] = useState(value);

  const modeRef = useRef<BoundarySketchMode>(mode);
  modeRef.current = mode;
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  /** Filled by whichever map instance holds a live gesture. See sketchTypes. */
  const controlsRef = useRef<BoundarySketchControls | null>(null);
  /** Survives a parse failure so the map keeps showing the last good polygon. */
  const lastValidRingsRef = useRef<PolygonCoordinates>(EMPTY_RINGS);

  // Text -> map, debounced. A gesture's own commit lands in `value` too, but by
  // then the map already draws that geometry and the layer hook's signature
  // check turns the round trip into a no-op.
  useEffect(() => {
    if (value === debouncedValue) {
      return;
    }
    const timer = setTimeout(() => setDebouncedValue(value), TEXT_TO_MAP_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [value, debouncedValue]);

  const parsed = useMemo(() => parsePolygonRings(debouncedValue), [debouncedValue]);
  if (parsed.rings) {
    lastValidRingsRef.current = parsed.rings;
  }
  const rings = parsed.rings ?? lastValidRingsRef.current;
  const hasGeometry = rings.length > 0;

  const handleCommit = useCallback((nextRings: PolygonCoordinates) => {
    lastValidRingsRef.current = nextRings;
    const text = formatPolygonRings(nextRings);
    // Keep the debounced copy in step by hand: the text did not come from the
    // textarea, and letting the debounce feed it back would redraw the polygon
    // the user just finished a third of a second later, mid-edit.
    setDebouncedValue(text);
    onChangeRef.current(text);
  }, []);

  const handleModeEnd = useCallback(() => {
    setMode("idle");
    setVertexCount(0);
  }, []);

  const startDraw = useCallback(() => {
    setVertexCount(0);
    setMode("draw");
  }, []);

  const startEdit = useCallback(() => setMode("edit"), []);

  // Both end the gesture through the map, and the mode returns to idle when the
  // model reports back - not here. Setting it optimistically would tear the
  // gesture down before it had a chance to commit what was drawn.
  const finish = useCallback(() => controlsRef.current?.complete(), []);
  const cancel = useCallback(() => controlsRef.current?.cancel(), []);

  const clear = useCallback(() => {
    controlsRef.current?.cancel();
    setMode("idle");
    setVertexCount(0);
    lastValidRingsRef.current = EMPTY_RINGS;
    setDebouncedValue("");
    onChangeRef.current("");
  }, []);

  const handleExpandedChange = useCallback((nextIsExpanded: boolean) => {
    setIsExpanded(nextIsExpanded);
    if (!nextIsExpanded) {
      // The expanded view is where drawing happens, and closing it unmounts
      // that MapView mid-gesture. Its layer hook is already tearing down by
      // then and cannot report the end itself, so the mode is reset here.
      setMode("idle");
      setVertexCount(0);
    }
  }, []);

  // Escape, which without this would be a trap.
  //
  // Three listeners want that keypress: SketchViewModel cancels the drawing,
  // and BOTH open Modals close - the expanded map and, behind it, the form
  // itself, whose onClose also resets the form. One keypress would therefore
  // throw away a half-filled record. So while this field has something to lose,
  // it takes the key at the CAPTURE phase, before either Modal's document-level
  // handler runs, and decides itself: a live gesture is abandoned, and anything
  // else is swallowed. The expanded map is closed with its own close button or
  // by clicking away - Escape here means exactly one thing, and never destroys
  // the form.
  useEffect(() => {
    if (mode === "idle" && !isExpanded) {
      return;
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") {
        return;
      }
      event.stopPropagation();
      if (modeRef.current === "idle") {
        return;
      }
      // Issued explicitly: capturing the event pre-empted the model's own
      // escape handling along with the modals'.
      controlsRef.current?.cancel();
      setMode("idle");
      setVertexCount(0);
    };
    document.addEventListener("keydown", handleKeyDown, true);
    return () => document.removeEventListener("keydown", handleKeyDown, true);
  }, [mode, isExpanded]);

  const sketch = useMemo<BoundarySketchConfig>(() => ({
    rings,
    mode,
    readOnly,
    controlsRef,
    onCommit: handleCommit,
    onModeEnd: handleModeEnd,
    onVertexCountChange: setVertexCount
  }), [rings, mode, readOnly, handleCommit, handleModeEnd]);

  return {
    rings,
    errorKey: parsed.error,
    mode,
    vertexCount,
    hasGeometry,
    isExpanded,
    startDraw,
    startEdit,
    finish,
    cancel,
    clear,
    handleExpandedChange,
    sketch
  };
}
