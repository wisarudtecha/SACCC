// "Place" control for the map's toolbar row: a master show/hide toggle plus one
// filter per category (Police Station / Hospital / Fire Station).
//
// Structured like BoundaryToolbar - a MapControlGroup that collapses to a single
// icon on the small maps and lays its buttons out on the expanded one. Its state
// is owned by usePlaceLayer (called in BoundaryMapField); this component only
// renders it and reports clicks.
//
// Plain React rather than an Esri widget, for the same reasons as BasemapSwitcher:
// app translations, app dark mode.
import { memo } from "react";
import { MapPinned } from "lucide-react";
import { useTranslation } from "@/core/hooks/useTranslation";
import MapControlGroup from "./MapControlGroup";
import { MAP_CONTROL_SEGMENT_CLASS } from "./mapControlStyles";
import { getPlaceCategoryLabelKey, getPlaceCategoryRgb } from "./place/placeSymbols";
import { PLACE_CATEGORIES } from "./place/placeTypes";
import type { PlaceCategory } from "./place/placeTypes";

interface MapPlaceButtonProps {
  /** Whether the Place layer is currently shown. */
  isActive: boolean;
  /** Toggle the whole layer on/off. */
  onToggle: () => void;
  /** Per-category on/off state. */
  categoryVisibility: Record<PlaceCategory, boolean>;
  /** Toggle one category's visibility. */
  onToggleCategory: (category: PlaceCategory) => void;
  /** Status line for the layer (error / nothing to show), shown below the buttons. */
  notice?: string;
  /**
   * Collapse to a single icon until hovered/focused/clicked. Set on the small
   * inline maps, where a labelled button covers the map it belongs to.
   */
  compact?: boolean;
  /** Positioning classes; the caller places the control over the map. */
  className?: string;
}

const ACTIVE_SEGMENT = "bg-blue-50 font-medium text-blue-700 dark:bg-blue-500/20 dark:text-blue-300";
const IDLE_SEGMENT = "text-gray-700 hover:bg-black/5 dark:text-gray-200 dark:hover:bg-white/10";

function MapPlaceButtonBase({
  isActive,
  onToggle,
  categoryVisibility,
  onToggleCategory,
  notice,
  compact = false,
  className = ""
}: MapPlaceButtonProps) {
  const { t } = useTranslation();
  const label = t("case.display.map_place");
  const toggleLabel = isActive ? t("case.display.map_place_hide") : label;

  return (
    // `group` + `relative`: the notice below is positioned out of flow so it
    // never widens this control in the toolbar row (which would push the
    // Boundary group away), and it is revealed on hover/focus of the whole
    // control - see its classes below.
    <div className={`group relative flex flex-col items-end ${className}`}>
      <MapControlGroup
        icon={<MapPinned className="h-3.5 w-3.5" />}
        label={label}
        collapsible={compact}
        isActive={isActive}
      >
        <button
          type="button"
          onClick={onToggle}
          title={toggleLabel}
          aria-label={toggleLabel}
          aria-pressed={isActive}
          className={`${MAP_CONTROL_SEGMENT_CLASS} ${isActive ? ACTIVE_SEGMENT : IDLE_SEGMENT}`}
        >
          <span className="hidden sm:inline">{label}</span>
        </button>

        <span aria-hidden className="w-px shrink-0 bg-gray-200 dark:bg-gray-700" />

        {PLACE_CATEGORIES.map((category) => {
          const categoryLabel = t(getPlaceCategoryLabelKey(category));
          const [r, g, b] = getPlaceCategoryRgb(category);
          const on = categoryVisibility[category];
          return (
            <button
              key={category}
              type="button"
              onClick={() => onToggleCategory(category)}
              disabled={!isActive}
              title={categoryLabel}
              aria-label={categoryLabel}
              aria-pressed={on}
              className={`${MAP_CONTROL_SEGMENT_CLASS} ${
                isActive && on ? ACTIVE_SEGMENT : IDLE_SEGMENT
              } ${isActive && !on ? "opacity-40" : ""}`}
            >
              <span
                aria-hidden
                className="inline-block h-2.5 w-2.5 shrink-0 rounded-full ring-1 ring-black/10"
                style={{ backgroundColor: `rgb(${r}, ${g}, ${b})` }}
              />
            </button>
          );
        })}
      </MapControlGroup>

      {/* Layer status line. Absolute, so it does not widen the control. Shown
          while the layer is on (you turned it on expecting markers - you need to
          know why there are none), otherwise only while pointing at / tabbed
          into the control. */}
      {notice && (
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

export const MapPlaceButton = memo(MapPlaceButtonBase);
MapPlaceButton.displayName = "MapPlaceButton";

export default MapPlaceButton;
