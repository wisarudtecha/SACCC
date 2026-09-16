// "Devices" control for the map's toolbar row: a master show/hide toggle plus
// a dropdown list of category filters (Camera / Fire Hydrant / AED), styled
// after BasemapSwitcher's "Map Style" menu so the category list can grow
// without widening the toolbar (REQ 8).
//
// A copy of MapPlaceButton, sharing the same MapLayerDropdownButton control.
// State is owned by useDeviceLayer (called in BoundaryMapField); this
// component only renders it and reports clicks.
import { memo, useMemo } from "react";
import { Cctv } from "lucide-react";
import { useTranslation } from "@/core/hooks/useTranslation";
import MapLayerDropdownButton from "../MapLayerDropdownButton";
import { getDeviceCategoryLabelKey, getDeviceCategoryRgb } from "./deviceSymbols";
import { DEVICE_CATEGORIES } from "./deviceTypes";
import type { DeviceCategory } from "./deviceTypes";

interface MapDeviceButtonProps {
  /** Whether the Device layer is currently shown. */
  isActive: boolean;
  /** Toggle the whole layer on/off. */
  onToggle: () => void;
  /** Per-category on/off state. */
  categoryVisibility: Record<DeviceCategory, boolean>;
  /** Toggle one category's visibility. */
  onToggleCategory: (category: DeviceCategory) => void;
  /** Status line for the layer (error / nothing in view), shown below the buttons. */
  notice?: string;
  /** Collapse to a single icon until hovered/focused/clicked (small inline maps). */
  compact?: boolean;
  /** Positioning classes; the caller places the control over the map. */
  className?: string;
}

function MapDeviceButtonBase({
  isActive,
  onToggle,
  categoryVisibility,
  onToggleCategory,
  notice,
  compact = false,
  className = ""
}: MapDeviceButtonProps) {
  const { t } = useTranslation();
  const label = t("case.display.map_device");
  const toggleLabel = isActive ? t("case.display.map_device_hide") : label;

  const categories = useMemo(
    () =>
      DEVICE_CATEGORIES.map((category) => ({
        value: category,
        label: t(getDeviceCategoryLabelKey(category)),
        rgb: getDeviceCategoryRgb(category)
      })),
    [t]
  );

  return (
    <MapLayerDropdownButton
      icon={<Cctv className="h-3.5 w-3.5 shrink-0" />}
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

export const MapDeviceButton = memo(MapDeviceButtonBase);
MapDeviceButton.displayName = "MapDeviceButton";

export default MapDeviceButton;
