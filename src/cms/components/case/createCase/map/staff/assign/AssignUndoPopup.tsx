// The small "assigned - undo?" card that appears beside an officer's icon after a
// drag-and-drop assignment. One per officer, so several can be up at once.
//
// It does not decide when it goes away: the entry's lifecycle belongs to
// useAssignUndo, and this only draws whatever state the entry is in.
import { memo, useEffect, useState } from "react";
import { useTranslation } from "@/core/hooks/useTranslation";
import type { UndoEntry } from "./assignUndoModel";

interface AssignUndoPopupProps {
  entry: UndoEntry;
  onUndo: (unitId: string) => void;
}

function AssignUndoPopupBase({ entry, onUndo }: AssignUndoPopupProps) {
  const { t } = useTranslation();
  const { unitId, unitName, status, expiresAtMs } = entry;
  const isAssigning = status === "assigning";
  const isUndoing = status === "undoing";

  // The countdown bar shrinks from full to empty over the time that is left. It
  // starts one frame after the entry becomes "assigned" so the browser has a
  // full-width bar to transition from.
  const [isShrinking, setIsShrinking] = useState(false);
  useEffect(() => {
    if (expiresAtMs === null) {
      return;
    }
    const frame = requestAnimationFrame(() => setIsShrinking(true));
    return () => cancelAnimationFrame(frame);
  }, [expiresAtMs]);
  const remainingMs = expiresAtMs === null ? 0 : Math.max(0, expiresAtMs - Date.now());

  const message = t(
    isAssigning
      ? "case.display.map_staff_assign_undo_assigning"
      : "case.display.map_staff_assign_undo_assigned",
    { name: unitName }
  );

  return (
    <div
      role="status"
      aria-live="polite"
      className="w-max max-w-[16rem] overflow-hidden rounded-md bg-white text-xs text-gray-800 shadow-lg ring-1 ring-black/10 dark:bg-gray-800 dark:text-gray-100 dark:ring-white/10"
    >
      <div className="flex items-center gap-3 px-3 py-2">
        <span className="min-w-0 truncate font-medium">{message}</span>
        <button
          type="button"
          disabled={isAssigning || isUndoing}
          onClick={() => onUndo(unitId)}
          className="shrink-0 rounded px-2 py-0.5 font-semibold text-blue-600 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50 dark:text-blue-400 dark:hover:bg-white/10"
        >
          {isUndoing ? t("case.display.map_staff_assign_undo_undoing") : t("case.display.map_staff_assign_undo_button")}
        </button>
      </div>
      <div className="h-1 w-full bg-gray-200 dark:bg-gray-700">
        <div
          className="h-full bg-blue-500"
          style={{
            width: isShrinking ? "0%" : "100%",
            transition: isShrinking ? `width ${remainingMs}ms linear` : "none"
          }}
        />
      </div>
    </div>
  );
}

export const AssignUndoPopup = memo(AssignUndoPopupBase);
AssignUndoPopup.displayName = "AssignUndoPopup";

export default AssignUndoPopup;
