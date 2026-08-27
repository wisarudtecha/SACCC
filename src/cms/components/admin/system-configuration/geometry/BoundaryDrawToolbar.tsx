// Drawing controls for the boundary map's top-right toolbar row.
//
// Plain React rather than the Esri Sketch widget, for the same reasons as
// BasemapSwitcher and BoundaryToolbar: the labels come from the app's
// translation catalogues, it has to work in the app's dark mode, and the Sketch
// widget's own toolbar offers point / polyline / rectangle / circle tools that
// mean nothing for an administrative boundary.
//
// The button set follows the mode rather than staying constant, because the
// question changes: idle asks "what do you want to do with this boundary",
// while a running gesture only has to answer "keep it or throw it away". A
// Finish button matters more here than it looks - the map's own way to end a
// polygon is a double-click, which nobody discovers.
import { memo } from "react";
import { Check, Pencil, PenLine, Trash2, X } from "lucide-react";
import { useTranslation } from "@/core/hooks/useTranslation";
import MapControlGroup from "@/cms/components/case/createCase/map/MapControlGroup";
import { MAP_CONTROL_SEGMENT_CLASS } from "@/cms/components/case/createCase/map/mapControlStyles";
import type { BoundarySketchMode } from "@/cms/components/case/createCase/map/sketch/sketchTypes";

const BUTTON_IDLE_CLASS =
  "text-gray-700 hover:bg-black/5 dark:text-gray-200 dark:hover:bg-white/10";
const BUTTON_ACTIVE_CLASS =
  "bg-blue-50 font-medium text-blue-700 dark:bg-blue-500/20 dark:text-blue-300";
const BUTTON_DANGER_CLASS =
  "text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10";

interface BoundaryDrawToolbarProps {
  mode: BoundarySketchMode;
  hasGeometry: boolean;
  /** Vertices placed so far, shown while drawing. */
  vertexCount: number;
  onDraw: () => void;
  onEdit: () => void;
  onFinish: () => void;
  onCancel: () => void;
  onClear: () => void;
  /**
   * Collapse to a single icon until hovered/focused/clicked. On by default -
   * only the expanded map has room to show the buttons permanently.
   */
  collapsible?: boolean;
  className?: string;
}

function BoundaryDrawToolbarBase({
  mode,
  hasGeometry,
  vertexCount,
  onDraw,
  onEdit,
  onFinish,
  onCancel,
  onClear,
  collapsible = false,
  className = ""
}: BoundaryDrawToolbarProps) {
  const { t } = useTranslation();
  const isDrawing = mode !== "idle";

  const drawLabel = hasGeometry
    ? t("crud.areaTemplate.geometry.action.redraw")
    : t("crud.areaTemplate.geometry.action.draw");
  const finishLabel = t("crud.areaTemplate.geometry.action.finish");
  const cancelLabel = t("crud.areaTemplate.geometry.action.cancel");
  const editLabel = t("crud.areaTemplate.geometry.action.edit");
  const clearLabel = t("crud.areaTemplate.geometry.action.clear");

  return (
    <MapControlGroup
      icon={<PenLine className="h-3.5 w-3.5" />}
      label={t("crud.areaTemplate.geometry.action.title")}
      collapsible={collapsible}
      isActive={isDrawing}
      className={className}
    >
      {isDrawing ? (
        <>
          {mode === "draw" && (
            // Reads as a status, not a control - it is the only feedback on how
            // much of the ring exists before the polygon closes.
            <span className={`${MAP_CONTROL_SEGMENT_CLASS} text-gray-500 dark:text-gray-400`}>
              {t("crud.areaTemplate.geometry.vertices").replace("_COUNT_", String(vertexCount))}
            </span>
          )}
          <button
            type="button"
            onClick={onFinish}
            title={finishLabel}
            aria-label={finishLabel}
            className={`${MAP_CONTROL_SEGMENT_CLASS} ${BUTTON_ACTIVE_CLASS}`}
          >
            <Check className="h-3.5 w-3.5 shrink-0" />
            {finishLabel}
          </button>
          <button
            type="button"
            onClick={onCancel}
            title={cancelLabel}
            aria-label={cancelLabel}
            className={`${MAP_CONTROL_SEGMENT_CLASS} ${BUTTON_IDLE_CLASS}`}
          >
            <X className="h-3.5 w-3.5 shrink-0" />
          </button>
        </>
      ) : (
        <>
          <button
            type="button"
            onClick={onDraw}
            title={drawLabel}
            aria-label={drawLabel}
            className={`${MAP_CONTROL_SEGMENT_CLASS} ${BUTTON_IDLE_CLASS}`}
          >
            <PenLine className="h-3.5 w-3.5 shrink-0" />
            {drawLabel}
          </button>

          {hasGeometry && (
            <>
              <span aria-hidden className="w-px shrink-0 bg-gray-200 dark:bg-gray-700" />
              <button
                type="button"
                onClick={onEdit}
                title={editLabel}
                aria-label={editLabel}
                className={`${MAP_CONTROL_SEGMENT_CLASS} ${BUTTON_IDLE_CLASS}`}
              >
                <Pencil className="h-3.5 w-3.5 shrink-0" />
                {editLabel}
              </button>
              <button
                type="button"
                onClick={onClear}
                title={clearLabel}
                aria-label={clearLabel}
                className={`${MAP_CONTROL_SEGMENT_CLASS} ${BUTTON_DANGER_CLASS}`}
              >
                <Trash2 className="h-3.5 w-3.5 shrink-0" />
              </button>
            </>
          )}
        </>
      )}
    </MapControlGroup>
  );
}

export const BoundaryDrawToolbar = memo(BoundaryDrawToolbarBase);
BoundaryDrawToolbar.displayName = "BoundaryDrawToolbar";

export default BoundaryDrawToolbar;
