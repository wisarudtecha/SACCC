// Shared vocabulary for the boundary sketch overlay.
//
// Kept free of any @arcgis/core import, for the same reason boundaryTypes.ts is:
// the field component that OWNS this state renders a textarea and a couple of
// buttons, and must not drag the SDK into the chunk it lives in. Only the layer
// hook on the other side of the lazy boundary imports ArcGIS.
import type { MutableRefObject } from "react";
import type { PolygonCoordinates } from "@/cms/types/area";

/**
 * What the sketch is doing right now.
 *
 * `draw` lays down a new ring and `edit` reshapes the existing one; they are
 * separate because starting a create over an existing polygon REPLACES it, and
 * that is a different intent from dragging one of its vertices.
 */
export type BoundarySketchMode = "idle" | "draw" | "edit";

/**
 * The two ways to end a gesture from OUTSIDE the map.
 *
 * Both exist because the map's own way of ending one is not discoverable:
 * finishing a polygon means double-clicking, pressing Enter or clicking the
 * first vertex again, and abandoning it means Escape - which this field has to
 * intercept anyway (see BoundaryGeometryField), so it must be able to issue the
 * cancel itself.
 */
export interface BoundarySketchControls {
  /** Finish the gesture and keep what was drawn. */
  complete: () => void;
  /** Abandon it and leave the last committed geometry alone. */
  cancel: () => void;
}

/**
 * Everything the map needs to draw and edit one polygon, handed to
 * ArcgisAddressMap as a single opaque prop - the same contract as
 * BoundaryLayerConfig, so the generic map component never learns what an area
 * boundary is.
 *
 * The state behind it must be owned ABOVE AddressMapField: that component
 * renders a second MapView when expanded, so state owned any lower would be
 * thrown away the moment the user expanded the map.
 */
export interface BoundarySketchConfig {
  /** Rings to render, GeoJSON-ordered ([ring][point][lng, lat]). Empty = nothing drawn. */
  rings: PolygonCoordinates;
  mode: BoundarySketchMode;
  /** True on a form the user may not edit - renders the polygon, refuses gestures. */
  readOnly?: boolean;
  /**
   * A gesture finished and produced new geometry. Fired on completion only, not
   * per vertex - see useBoundarySketchLayer for why.
   */
  onCommit: (rings: PolygonCoordinates) => void;
  /** A gesture ended for any reason (completed, cancelled), so the owner can return to idle. */
  onModeEnd: () => void;
  /** Vertex count of the ring being drawn, for the live readout. */
  onVertexCountChange?: (count: number) => void;
  /**
   * The layer hook publishes its gesture controls here while its mode is not
   * idle, so the toolbar and the Escape key can end a gesture from outside the
   * map.
   *
   * Only the instance with a live gesture ever holds it, so the second MapView
   * that appears when the map is expanded cannot steal it from the first.
   */
  controlsRef?: MutableRefObject<BoundarySketchControls | null>;
}
