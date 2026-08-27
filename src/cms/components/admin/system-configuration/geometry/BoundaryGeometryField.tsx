// One boundary field: a map to draw it on, and the JSON it produces.
//
// Both are shown, and both edit the SAME string. That is the whole design - the
// map is not a separate authoring mode with its own state to reconcile, it is a
// second view of the field's value. Consequences worth knowing:
//
//   - the host's validation, Reset and Restore keep working untouched, because
//     from where they sit nothing about the field has changed;
//   - pasting rings from elsewhere draws them, and drawing writes rings you can
//     copy back out;
//   - a typo in the JSON shows an error without the polygon disappearing, since
//     the map keeps rendering the last text that parsed.
//
// Used by two hosts with different form machinery - AreaFormModal's descriptor
// list and crm/Form's customRender - so it renders NO label: both wrap their
// fields in one already.
import { Suspense, lazy, useCallback, useId } from "react";
import Loading from "@/core/components/common/Loading";
import { useTranslation } from "@/core/hooks/useTranslation";
import { describeGeometry } from "@/cms/utils/areaGeometry";
import { useBoundarySketchState } from "./useBoundarySketchState";

// The heavy @arcgis/core SDK. Lazy so that opening a form whose boundary field
// nobody touches does not download a megabyte of map - the same reason
// CaseLocationSection lazy-loads its own map.
const BoundarySketchMapField = lazy(() => import("./BoundarySketchMapField"));

const TEXTAREA_CLASS =
  "dark:bg-dark-900 h-auto w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 " +
  "text-sm font-mono text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 " +
  "focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 " +
  "dark:text-white/90 dark:placeholder:text-white/30 disabled:cursor-not-allowed disabled:opacity-60";

interface BoundaryGeometryFieldProps {
  /** GeoJSON rings as text - the field's value, shared by the map and the textarea. */
  value: string;
  onChange: (next: string) => void;
  /** Id for the textarea, so a host label's htmlFor still resolves. */
  id?: string;
  placeholder?: string;
  hint?: string;
  /**
   * The host's own validation message. Takes precedence over the live parse
   * error, which would otherwise say the same thing twice on a failed save.
   */
  error?: string;
  disabled?: boolean;
  /** Height of the inline map. The expanded one sizes itself to the modal. */
  height?: number | string;
}

export function BoundaryGeometryField({
  value,
  onChange,
  id,
  placeholder,
  hint,
  error,
  disabled = false,
  height = 320
}: BoundaryGeometryFieldProps) {
  const { t } = useTranslation();
  const generatedId = useId();
  const textareaId = id ?? generatedId;

  const sketchState = useBoundarySketchState({ value, onChange, readOnly: disabled });
  const {
    rings,
    errorKey,
    mode,
    vertexCount,
    hasGeometry,
    startDraw,
    startEdit,
    finish,
    cancel,
    clear,
    handleExpandedChange,
    sketch
  } = sketchState;

  const handleTextChange = useCallback(
    (event: React.ChangeEvent<HTMLTextAreaElement>) => onChange(event.target.value),
    [onChange]
  );

  const geometry = describeGeometry(rings);
  const parseError = errorKey ? t(`crud.areaTemplate.geometry.error.${errorKey}`) : "";
  const message = error || parseError;

  // While drawing, the count of what is on the map beats the count of what is
  // saved - the ring being laid down is the thing the user is looking at.
  const summary = mode === "draw"
    ? t("crud.areaTemplate.geometry.vertices").replace("_COUNT_", String(vertexCount))
    : geometry.hasGeometry
      ? t("crud.areaTemplate.geometry.summary").replace("_POINTS_", String(geometry.pointCount))
      : t("crud.areaTemplate.geometry.none");

  return (
    <div className="space-y-2">
      <Suspense fallback={<Loading />}>
        <BoundarySketchMapField
          sketch={sketch}
          mode={mode}
          hasGeometry={hasGeometry}
          vertexCount={vertexCount}
          readOnly={disabled}
          height={height}
          onDraw={startDraw}
          onEdit={startEdit}
          onFinish={finish}
          onCancel={cancel}
          onClear={clear}
          onExpandedChange={handleExpandedChange}
        />
      </Suspense>

      <div className="flex items-center justify-between gap-3 text-xs">
        <span className="text-gray-600 dark:text-gray-300 cursor-default">{summary}</span>
        {mode !== "idle" && (
          <span className="text-gray-500 dark:text-gray-400 cursor-default">
            {t(
              mode === "draw"
                ? "crud.areaTemplate.geometry.hint.drawing"
                : "crud.areaTemplate.geometry.hint.editing"
            )}
          </span>
        )}
      </div>

      <textarea
        id={textareaId}
        rows={3}
        placeholder={placeholder}
        value={value}
        disabled={disabled}
        onChange={handleTextChange}
        className={TEXTAREA_CLASS}
      />

      {message
        ? <span className="text-red-500 dark:text-red-400 text-xs">{message}</span>
        : hint && <span className="text-gray-500 dark:text-gray-400 text-xs">{hint}</span>}
    </div>
  );
}

export default BoundaryGeometryField;
