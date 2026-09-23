// Shared control for a map layer that has a master on/off switch plus a set of
// filterable categories - used by MapPlaceButton and MapDeviceButton (REQ 8).
//
// Replaces the old MapControlGroup segmented row, which widened with every new
// category, with the same Dropdown/DropdownItem list BasemapSwitcher uses for
// its own "Map Style" menu: a vertical list that can grow to any length
// without touching the toolbar's width. The on/off toggle stays a SEPARATE
// button from the dropdown trigger (stakeholder decision) - opening the list
// to browse categories must not itself turn the layer on or off.
import { memo, useCallback, useEffect, useState, type ReactNode } from "react";
import { Check, ChevronDown } from "lucide-react";
import { Dropdown } from "@/core/components/ui/dropdown/Dropdown";
import { DropdownItem } from "@/core/components/ui/dropdown/DropdownItem";
import { MAP_CONTROL_BORDER_CLASS, mapControlRevealClass } from "./mapControlStyles";

export interface MapLayerCategoryOption<TCategory extends string> {
  value: TCategory;
  label: string;
  /** Marker colour, for the swatch next to the category's label. */
  rgb: readonly [number, number, number];
}

interface MapLayerDropdownButtonProps<TCategory extends string> {
  icon: ReactNode;
  /** Layer name, shown on the toggle button and as the dropdown's title. */
  label: string;
  /** Accessible name for the toggle button; differs from `label` while active ("Hide ..."). */
  toggleLabel: string;
  isActive: boolean;
  onToggle: () => void;
  categories: readonly MapLayerCategoryOption<TCategory>[];
  categoryVisibility: Record<TCategory, boolean>;
  onToggleCategory: (category: TCategory) => void;
  /** Status line for the layer (error / nothing to show), shown below the controls. */
  notice?: string;
  /**
   * Collapse the toggle button's label to an icon until hovered/focused. Set
   * on the small inline maps, where a labelled control covers the map itself.
   */
  compact?: boolean;
  /**
   * Show the dropdown trigger + category checklist. Off on the small inline
   * maps: the master toggle still works there, but a full category list needs
   * more room than a small map's toolbar row has to spare - that panel is a
   * large-map-only feature. Defaults to `true`.
   */
  showCategoryDropdown?: boolean;
  /** Positioning classes; the caller places the control over the map. */
  className?: string;
  /**
   * Tailwind classes for the toggle button's ACTIVE state, so each layer can
   * match its own marker colour on the map. Defaults to the original blue,
   * used by callers (e.g. the Staff toggle's own component) that have no
   * single marker colour to match.
   */
  activeColorClassName?: string;
}

const DEFAULT_ACTIVE_COLOR_CLASS =
  "bg-blue-50 font-medium text-blue-700 dark:bg-blue-500/20 dark:text-blue-300";

function MapLayerDropdownButtonInner<TCategory extends string>({
  icon,
  label,
  toggleLabel,
  isActive,
  onToggle,
  categories,
  categoryVisibility,
  onToggleCategory,
  notice,
  compact = false,
  showCategoryDropdown = true,
  className = "",
  activeColorClassName = DEFAULT_ACTIVE_COLOR_CLASS
}: MapLayerDropdownButtonProps<TCategory>) {
  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const closeMenu = useCallback(() => setIsOpen(false), []);
  const toggleMenu = useCallback(() => setIsOpen((open) => !open), []);

  // Dropdown dismisses on outside click but not on keyboard - same as BasemapSwitcher.
  useEffect(() => {
    if (!isOpen) {
      return;
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const isLabelVisible = !compact || isOpen || isHovered || isFocused;

  return (
    <div
      className={`group relative flex flex-col items-end ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
    >
      <div className="flex items-stretch gap-1">
        {/* Dedicated on/off toggle - a separate control from the dropdown below. */}
        <button
          type="button"
          onClick={onToggle}
          title={toggleLabel}
          aria-label={toggleLabel}
          aria-pressed={isActive}
          className={`flex items-center gap-1 rounded-md px-2 py-1 text-xs shadow-sm transition-colors ${MAP_CONTROL_BORDER_CLASS} ${
            isActive
              ? activeColorClassName
              : "bg-white/90 text-gray-700 hover:bg-white dark:bg-gray-800/90 dark:text-gray-200 dark:hover:bg-gray-800"
          }`}
        >
          {icon}
          {compact ? (
            <span className={mapControlRevealClass(isLabelVisible)}>{label}</span>
          ) : (
            <span className="hidden sm:inline">{label}</span>
          )}
        </button>

        {/* Dropdown trigger - opens the category list. `dropdown-toggle` is
            required by Dropdown's outside-click handler, same as BasemapSwitcher. */}
        {showCategoryDropdown && (
          <button
            type="button"
            onClick={toggleMenu}
            title={label}
            aria-label={label}
            aria-haspopup="true"
            aria-expanded={isOpen}
            className={`dropdown-toggle flex items-center rounded-md bg-white/90 px-1.5 py-1 text-xs text-gray-700 shadow-sm transition-colors hover:bg-white dark:bg-gray-800/90 dark:text-gray-200 dark:hover:bg-gray-800 ${MAP_CONTROL_BORDER_CLASS}`}
          >
            <ChevronDown className="h-3.5 w-3.5 shrink-0" />
          </button>
        )}
      </div>

      {showCategoryDropdown && (
        <Dropdown isOpen={isOpen} onClose={closeMenu} className="top-full w-48 p-1">
          {categories.map((category) => {
            const [r, g, b] = category.rgb;
            const on = categoryVisibility[category.value];
            return (
              <DropdownItem
                key={category.value}
                tag="button"
                onItemClick={() => onToggleCategory(category.value)}
                baseClassName={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                  on
                    ? "bg-gray-100 font-medium text-gray-900 dark:bg-white/10 dark:text-white"
                    : "text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-white/5 dark:hover:text-white"
                }`}
              >
                <span className="flex items-center gap-2">
                  <span
                    aria-hidden
                    className="inline-block h-2.5 w-2.5 shrink-0 rounded-full ring-1 ring-black/10"
                    style={{ backgroundColor: `rgb(${r}, ${g}, ${b})` }}
                  />
                  {category.label}
                </span>
                {on && <Check className="h-4 w-4 shrink-0" />}
              </DropdownItem>
            );
          })}
        </Dropdown>
      )}

      {/* Layer status line. Hidden while the dropdown is open so the two never
          overlap - both anchor to the same top-full edge. */}
      {notice && !isOpen && (
        <div
          className={`absolute right-0 top-full z-10 mt-1 max-w-60 rounded bg-black/60 px-2 py-1 text-right text-xs text-white ${
            isActive ? "" : "hidden group-hover:block group-focus-within:block"
          }`}
        >
          {notice}
        </div>
      )}
    </div>
  );
}

// memo() erases the generic signature - cast back so callers keep type-checked
// `categories`/`categoryVisibility` per their own category union.
export const MapLayerDropdownButton = memo(MapLayerDropdownButtonInner) as typeof MapLayerDropdownButtonInner;

export default MapLayerDropdownButton;
