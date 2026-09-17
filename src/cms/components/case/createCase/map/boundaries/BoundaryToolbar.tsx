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
// which decides): a small map renders the level toggles as a single dropdown
// trigger, matching MapPlaceButton/MapDeviceButton/BasemapSwitcher, and no
// picker at all; the expanded map gets the full segmented row plus the picker.
import { memo, useCallback, useEffect, useState } from "react";
import { Check, ChevronDown, Layers3, Shapes } from "lucide-react";
import { Dropdown } from "@/core/components/ui/dropdown/Dropdown";
import { DropdownItem } from "@/core/components/ui/dropdown/DropdownItem";
import { useTranslation } from "@/core/hooks/useTranslation";
import MapControlGroup from "../MapControlGroup";
import { MAP_CONTROL_SEGMENT_CLASS, mapControlRevealClass } from "../mapControlStyles";
import { BOUNDARY_LEVELS } from "./boundaryLevels";
import type { AdminLevel, BoundaryVisibility } from "./boundaryTypes";

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
   * only the expanded map has room to show the toggles permanently. Ignored
   * when `asDropdown` is set.
   */
  collapsible?: boolean;
  /**
   * Render as a single dropdown trigger (a checklist of levels) instead of the
   * segmented button row - matching MapPlaceButton/MapDeviceButton/
   * BasemapSwitcher. Set on the small maps, where a labelled row of buttons
   * covers the map it belongs to; the expanded map keeps the row laid out and
   * this is left `false`. The area-picker trigger (`showPicker`) never applies
   * in this mode - the small map does not show it either way.
   */
  asDropdown?: boolean;
  className?: string;
}

function BoundaryToolbarBase({
  visibility,
  onToggleLevel,
  onOpenPicker,
  isPickerOpen,
  showPicker = true,
  collapsible = false,
  asDropdown = false,
  className = ""
}: BoundaryToolbarProps) {
  const { t } = useTranslation();
  const pickerLabel = t("case.display.map_boundary");
  const groupLabel = t("case.display.map_boundary_levels");
  // Also drives the collapsed/dropdown trigger's highlight, so a small map
  // still shows at a glance that boundaries are switched on.
  const isAnyLevelVisible = BOUNDARY_LEVELS.some((config) => visibility[config.level]);

  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const closeMenu = useCallback(() => setIsOpen(false), []);
  const toggleMenu = useCallback(() => setIsOpen((open) => !open), []);

  // Dropdown dismisses on outside click but not on keyboard - same as BasemapSwitcher.
  useEffect(() => {
    if (!asDropdown || !isOpen) {
      return;
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [asDropdown, isOpen]);

  if (asDropdown) {
    const isLabelVisible = isOpen || isHovered || isFocused;
    return (
      <div
        className={`relative ${className}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
      >
        {/* `dropdown-toggle` is required by Dropdown's outside-click handler,
            same as BasemapSwitcher/MapLayerDropdownButton. */}
        <button
          type="button"
          onClick={toggleMenu}
          title={groupLabel}
          aria-label={groupLabel}
          aria-haspopup="true"
          aria-expanded={isOpen}
          className={`dropdown-toggle flex items-center gap-1 rounded-md px-2 py-1 text-xs shadow-sm transition-colors ${
            isAnyLevelVisible
              ? "bg-blue-50 font-medium text-blue-700 dark:bg-blue-500/20 dark:text-blue-300"
              : "bg-white/90 text-gray-700 hover:bg-white dark:bg-gray-800/90 dark:text-gray-200 dark:hover:bg-gray-800"
          }`}
        >
          <Layers3 className="h-3.5 w-3.5 shrink-0" />
          <span className={mapControlRevealClass(isLabelVisible)}>{groupLabel}</span>
          <ChevronDown className="h-3.5 w-3.5 shrink-0" />
        </button>

        <Dropdown isOpen={isOpen} onClose={closeMenu} className="top-full w-44 p-1">
          {BOUNDARY_LEVELS.map(({ level, labelKey }) => {
            const isActive = visibility[level];
            return (
              <DropdownItem
                key={level}
                tag="button"
                onItemClick={() => onToggleLevel(level)}
                baseClassName={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                  isActive
                    ? "bg-gray-100 font-medium text-gray-900 dark:bg-white/10 dark:text-white"
                    : "text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-white/5 dark:hover:text-white"
                }`}
              >
                <span>{t(labelKey)}</span>
                {isActive && <Check className="h-4 w-4 shrink-0" />}
              </DropdownItem>
            );
          })}
        </Dropdown>
      </div>
    );
  }

  return (
    <MapControlGroup
      icon={<Layers3 className="h-3.5 w-3.5" />}
      label={groupLabel}
      collapsible={collapsible}
      isActive={isAnyLevelVisible}
      className={className}
    >
      {BOUNDARY_LEVELS.map(({ level, labelKey, shortLabelKey }) => {
        const isActive = visibility[level];
        const label = t(labelKey);
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
            {t(shortLabelKey)}
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
