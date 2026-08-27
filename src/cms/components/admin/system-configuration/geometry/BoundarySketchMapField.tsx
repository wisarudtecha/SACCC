// The map half of the boundary field. Lazy-loaded: this module is what pulls
// @arcgis/core, so BoundaryGeometryField must never import it directly.
//
// Almost all of this is configuration rather than code, because
// ArcgisAddressMapField already supports the exact mode a boundary editor
// needs:
//
//   readOnly + search   "navigate-only search" (see ArcgisAddressMap) - typing
//                       a district name flies there, but a click neither drops
//                       a pin nor reverse-geocodes it, so every click on the
//                       map belongs to the sketch.
//   value={null}        no case marker to compete with the polygon.
//   expand modal        the full-size drawing surface, for free.
//
// `readOnly` is fixed at true rather than following the field's own read-only
// state: it is part of ArcgisAddressMapField's map key, so flipping it rebuilds
// the MapView and would destroy the sketch mid-gesture. Whether the user may
// EDIT is carried by the sketch config and by withholding the toolbar.
import { memo, useCallback } from "react";
import ArcgisAddressMapField, {
  type MapSlotContext
} from "@/cms/components/case/createCase/map/ArcgisAddressMapField";
import type { BoundarySketchConfig, BoundarySketchMode } from "@/cms/components/case/createCase/map/sketch/sketchTypes";
import BoundaryDrawToolbar from "./BoundaryDrawToolbar";

interface BoundarySketchMapFieldProps {
  sketch: BoundarySketchConfig;
  mode: BoundarySketchMode;
  hasGeometry: boolean;
  vertexCount: number;
  /** No drawing controls at all - the map becomes a preview. */
  readOnly?: boolean;
  height?: number | string;
  onDraw: () => void;
  onEdit: () => void;
  onFinish: () => void;
  onCancel: () => void;
  onClear: () => void;
  onExpandedChange: (isExpanded: boolean) => void;
}

/**
 * `onSelect` is required by the map but meaningless here - a read-only map
 * never resolves an address. Declared at module scope so the prop identity is
 * stable across renders.
 */
const noopSelect = () => {
  /* the boundary map never selects a location */
};

function BoundarySketchMapFieldBase({
  sketch,
  mode,
  hasGeometry,
  vertexCount,
  readOnly = false,
  height = 320,
  onDraw,
  onEdit,
  onFinish,
  onCancel,
  onClear,
  onExpandedChange
}: BoundarySketchMapFieldProps) {
  const renderToolbarSlot = useCallback(
    (context: MapSlotContext) => (
      readOnly ? null : (
        <BoundaryDrawToolbar
          mode={mode}
          hasGeometry={hasGeometry}
          vertexCount={vertexCount}
          onDraw={onDraw}
          onEdit={onEdit}
          onFinish={onFinish}
          onCancel={onCancel}
          onClear={onClear}
          // The inline map is ~320px; a row of labelled buttons covers too much
          // of the thing it controls. The expanded map keeps them laid out.
          collapsible={!context.isExpanded}
        />
      )
    ),
    [readOnly, mode, hasGeometry, vertexCount, onDraw, onEdit, onFinish, onCancel, onClear]
  );

  return (
    <ArcgisAddressMapField
      value={null}
      onSelect={noopSelect}
      readOnly
      // The search box is nearly as wide as the inline map, and finding a place
      // before drawing is a large-map job anyway.
      searchMode="expanded-only"
      height={height}
      sketch={sketch}
      toolbarSlot={renderToolbarSlot}
      onExpandedChange={onExpandedChange}
    />
  );
}

export const BoundarySketchMapField = memo(BoundarySketchMapFieldBase);
BoundarySketchMapField.displayName = "BoundarySketchMapField";

export default BoundarySketchMapField;
