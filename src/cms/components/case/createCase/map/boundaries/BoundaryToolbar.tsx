// Boundary controls for the map's top-right toolbar row.
//
// Two different kinds of control, deliberately in one shell:
//
//   - the three level toggles, which apply INSTANTLY (per the requirement that
//     choosing which levels to stack is not gated), and
//   - the button that opens the picker, whose selection IS gated behind Apply.
//
// Plain React rather than an Esri widget, for the same reasons as
// BasemapSwitcher: the labels come from the app's translation catalogues and it
// has to work in the app's dark mode.
//
// What it shows depends on how much map there is to spare (see BoundaryMapField,
// which decides): a small map gets the level toggles collapsed behind one icon
// and no picker at all, the expanded map gets everything laid out.
import { memo } from "react";
import { Layers3, Shapes } from "lucide-react";
import { useTranslation } from "@/core/hooks/useTranslation";
import MapControlGroup from "../MapControlGroup";
import { MAP_CONTROL_SEGMENT_CLASS } from "../mapControlStyles";
import { ADMIN_LEVELS, type AdminLevel, type BoundaryVisibility } from "./boundaryTypes";

/**
 * Short labels - the row already carries map style, expand and (in the case
 * detail view) the staff controls, so the full level names would not fit.
 */
const LEVEL_SHORT_KEYS: Readonly<Record<AdminLevel, string>> = {
  province: "case.display.map_boundary_province_short",
  district: "case.display.map_boundary_district_short",
  subdistrict: "case.display.map_boundary_subdistrict_short"
};

const LEVEL_LABEL_KEYS: Readonly<Record<AdminLevel, string>> = {
  province: "case.display.map_boundary_province",
  district: "case.display.map_boundary_district",
  subdistrict: "case.display.map_boundary_subdistrict"
};

interface BoundaryToolbarProps {
  visibility: BoundaryVisibility;
  onToggleLevel: (level: AdminLevel) => void;
  onOpenPicker: () => void;
  isPickerOpen: boolean;
  /**
   * Show the area picker trigger. Off on the small maps: choosing WHICH areas
   * to draw needs a panel that would cover a 220px map, so those maps offer the
   * level toggles only and the picker lives on the expanded map.
   */
  showPicker?: boolean;
  /**
   * Collapse to a single icon until hovered/focused/clicked. On by default -
   * only the expanded map has room to show the toggles permanently.
   */
  collapsible?: boolean;
  className?: string;
}

function BoundaryToolbarBase({
  visibility,
  onToggleLevel,
  onOpenPicker,
  isPickerOpen,
  showPicker = true,
  collapsible = false,
  className = ""
}: BoundaryToolbarProps) {
  const { t } = useTranslation();
  const pickerLabel = t("case.display.map_boundary");
  // Also drives the collapsed trigger's highlight, so a small map still shows
  // at a glance that boundaries are switched on.
  const isAnyLevelVisible = ADMIN_LEVELS.some((level) => visibility[level]);

  return (
    <MapControlGroup
      icon={<Layers3 className="h-3.5 w-3.5" />}
      label={t("case.display.map_boundary_levels")}
      collapsible={collapsible}
      isActive={isAnyLevelVisible}
      className={className}
    >
      {ADMIN_LEVELS.map((level) => {
        const isActive = visibility[level];
        const label = t(LEVEL_LABEL_KEYS[level]);
        return (
          <button
            key={level}
            type="button"
            onClick={() => onToggleLevel(level)}
            title={label}
            aria-label={label}
            aria-pressed={isActive}
            className={`${MAP_CONTROL_SEGMENT_CLASS} ${
              isActive
                ? "bg-blue-50 font-medium text-blue-700 dark:bg-blue-500/20 dark:text-blue-300"
                : "text-gray-700 hover:bg-black/5 dark:text-gray-200 dark:hover:bg-white/10"
            }`}
          >
            {t(LEVEL_SHORT_KEYS[level])}
          </button>
        );
      })}

      {showPicker && (
        <>
          <span aria-hidden className="w-px shrink-0 bg-gray-200 dark:bg-gray-700" />
          <button
            type="button"
            onClick={onOpenPicker}
            title={pickerLabel}
            aria-label={pickerLabel}
            aria-expanded={isPickerOpen}
            className={`${MAP_CONTROL_SEGMENT_CLASS} ${
              isPickerOpen
                ? "bg-blue-50 font-medium text-blue-700 dark:bg-blue-500/20 dark:text-blue-300"
                : "text-gray-700 hover:bg-black/5 dark:text-gray-200 dark:hover:bg-white/10"
            }`}
          >
            <Shapes className="h-3.5 w-3.5 shrink-0" />
          </button>
        </>
      )}
    </MapControlGroup>
  );
}

export const BoundaryToolbar = memo(BoundaryToolbarBase);
BoundaryToolbar.displayName = "BoundaryToolbar";

export default BoundaryToolbar;
