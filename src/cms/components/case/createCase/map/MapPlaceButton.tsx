// "Place" control for the map's toolbar row: shows or hides place-of-interest
// icons on the basemap.
//
// Declared and rendered, but not wired: the layer behind it does not exist yet.
// It ships disabled and says so, rather than being left out entirely, so the
// toolbar's final shape is visible to everyone reviewing the map now.
//
// Plain React rather than an Esri widget, for the same reasons as
// BasemapSwitcher: app translations, app dark mode.
import { memo } from "react";
import { MapPinned } from "lucide-react";
import { useTranslation } from "@/core/hooks/useTranslation";
import {
  MAP_CONTROL_REVEAL_ON_GROUP,
  MAP_CONTROL_SEGMENT_CLASS,
  MAP_CONTROL_SHELL_CLASS
} from "./mapControlStyles";

interface MapPlaceButtonProps {
  /**
   * Icon-only, revealing the label on hover or focus. Used on the small maps,
   * where a labelled button covers the map it belongs to.
   *
   * A lone button does not get a MapControlGroup of its own - there would be
   * nothing to disclose but itself, and the user would have to click a trigger
   * before reaching the action. It borrows the group's reveal transition
   * instead, so the two behave identically side by side.
   */
  compact?: boolean;
  /** Extra classes for the control. */
  className?: string;
}

function MapPlaceButtonBase({ compact = false, className = "" }: MapPlaceButtonProps) {
  const { t } = useTranslation();

  const label = t("case.display.map_place");
  const title = `${label} - ${t("case.display.map_staff_in_development")}`;

  // The hover target is this wrapper, not the button: the button is disabled,
  // and a disabled button receives no pointer events in Chrome, so hovering it
  // would never reveal the label.
  return (
    <div className={`group ${MAP_CONTROL_SHELL_CLASS} ${className}`}>
      <button
        type="button"
        disabled
        title={title}
        aria-label={title}
        className={`${MAP_CONTROL_SEGMENT_CLASS} text-gray-700 dark:text-gray-200`}
      >
        <MapPinned className="h-3.5 w-3.5 shrink-0" />
        {compact ? (
          <span className={MAP_CONTROL_REVEAL_ON_GROUP}>{label}</span>
        ) : (
          <span className="hidden sm:inline">{label}</span>
        )}
      </button>
    </div>
  );
}

export const MapPlaceButton = memo(MapPlaceButtonBase);
MapPlaceButton.displayName = "MapPlaceButton";

export default MapPlaceButton;
