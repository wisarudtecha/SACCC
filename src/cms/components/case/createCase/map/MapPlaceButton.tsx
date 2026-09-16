// "Place" control for the map's toolbar row: a master show/hide toggle plus a
// dropdown list of category filters (Police Station / Hospital / Fire
// Station), styled after BasemapSwitcher's "Map Style" menu so the category
// list can grow without widening the toolbar (REQ 8).
//
// State is owned by usePlaceLayer (called in BoundaryMapField); this
// component only renders it and reports clicks.
import { memo, useMemo } from "react";
import { MapPinned } from "lucide-react";
import { useTranslation } from "@/core/hooks/useTranslation";
import MapLayerDropdownButton from "./MapLayerDropdownButton";
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

  const categories = useMemo(
    () =>
      PLACE_CATEGORIES.map((category) => ({
        value: category,
        label: t(getPlaceCategoryLabelKey(category)),
        rgb: getPlaceCategoryRgb(category)
      })),
    [t]
  );

  return (
    <MapLayerDropdownButton
      icon={<MapPinned className="h-3.5 w-3.5 shrink-0" />}
      label={label}
      toggleLabel={toggleLabel}
      isActive={isActive}
      onToggle={onToggle}
      categories={categories}
      categoryVisibility={categoryVisibility}
      onToggleCategory={onToggleCategory}
      notice={notice}
      compact={compact}
      className={className}
    />
  );
}

export const MapPlaceButton = memo(MapPlaceButtonBase);
MapPlaceButton.displayName = "MapPlaceButton";

export default MapPlaceButton;
