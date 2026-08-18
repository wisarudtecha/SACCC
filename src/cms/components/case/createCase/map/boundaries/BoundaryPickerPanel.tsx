// The boundary picker: three cascaded multi-select lists behind an Apply gate.
//
// The Apply gate is the requirement, not a nicety - the polygons must not move
// while the user is still choosing. So this panel edits a DRAFT selection and
// only useBoundarySelection's `apply` promotes it to what the map draws.
// Dismissing the panel any other way (Cancel, the close button) discards the
// draft, so there is never an invisible half-edited state.
//
// Level VISIBILITY is not here: those toggles are instant and live in the
// toolbar, next to the other map controls.
import { memo } from "react";
import { X } from "lucide-react";
import { useTranslation } from "@/core/hooks/useTranslation";
import BoundaryLevelSection from "./BoundaryLevelSection";
import { ADMIN_LEVELS, type AdminLevel, type BoundaryOption, type BoundarySelection } from "./boundaryTypes";

const LEVEL_LABEL_KEYS: Readonly<Record<AdminLevel, string>> = {
  province: "case.display.map_boundary_province",
  district: "case.display.map_boundary_district",
  subdistrict: "case.display.map_boundary_subdistrict"
};

interface BoundaryPickerPanelProps {
  options: Readonly<Record<AdminLevel, readonly BoundaryOption[]>>;
  draft: BoundarySelection;
  onToggleCode: (level: AdminLevel, code: string) => void;
  onSetCodes: (level: AdminLevel, codes: readonly string[]) => void;
  isDirty: boolean;
  isLoading: boolean;
  onApply: () => void;
  onCancel: () => void;
  isDarkTheme: boolean;
  /** Positioning classes; the caller places the panel over the map. */
  className?: string;
}

function BoundaryPickerPanelBase({
  options,
  draft,
  onToggleCode,
  onSetCodes,
  isDirty,
  isLoading,
  onApply,
  onCancel,
  isDarkTheme,
  className = ""
}: BoundaryPickerPanelProps) {
  const { t } = useTranslation();

  return (
    <div
      className={`flex w-72 flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-800 dark:bg-gray-900 ${className}`}
    >
      <div className="flex shrink-0 items-center justify-between border-b border-gray-200 px-3 py-2 dark:border-gray-800">
        <span className="text-xs font-semibold text-gray-900 dark:text-gray-100">
          {t("case.display.map_boundary")}
        </span>
        <button
          type="button"
          onClick={onCancel}
          title={t("case.display.map_boundary_close")}
          aria-label={t("case.display.map_boundary_close")}
          className="rounded p-0.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-gray-100"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {isLoading ? (
        <p className="px-3 py-6 text-center text-xs text-gray-500 dark:text-gray-400">
          {t("case.display.map_boundary_loading")}
        </p>
      ) : (
        // Scrolls as a whole as well as per section: three expanded sections are
        // taller than the panel's share of the map.
        <div className="min-h-0 flex-1 overflow-y-auto">
          {ADMIN_LEVELS.map((level) => (
            <BoundaryLevelSection
              key={level}
              level={level}
              labelKey={LEVEL_LABEL_KEYS[level]}
              options={options[level]}
              selectedCodes={draft[level]}
              onToggleCode={onToggleCode}
              onSetCodes={onSetCodes}
              isDarkTheme={isDarkTheme}
              // District is the level dispatchers work in and the only one
              // visible by default, so it is the one worth opening.
              defaultOpen={level === "district"}
            />
          ))}
        </div>
      )}

      <div className="flex shrink-0 items-center justify-between gap-2 border-t border-gray-200 px-3 py-2 dark:border-gray-800">
        <span className="text-[10px] text-gray-500 dark:text-gray-400">
          {isDirty ? t("case.display.map_boundary_pending") : t("case.display.map_boundary_applied")}
        </span>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onCancel}
            className="rounded px-2 py-1 text-xs text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/10"
          >
            {t("case.display.map_boundary_cancel")}
          </button>
          <button
            type="button"
            onClick={onApply}
            disabled={!isDirty}
            className="rounded bg-blue-600 px-2.5 py-1 text-xs font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {t("case.display.map_boundary_apply")}
          </button>
        </div>
      </div>
    </div>
  );
}

export const BoundaryPickerPanel = memo(BoundaryPickerPanelBase);
BoundaryPickerPanel.displayName = "BoundaryPickerPanel";

export default BoundaryPickerPanel;
