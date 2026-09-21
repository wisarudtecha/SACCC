// The read-only card shown when a Place marker is clicked.
//
// Stakeholder decision Q1: selecting a Place decides nothing. This component has
// no case-write path of any kind - it shows the facility's name and category and
// a close button, and that is all. The caller positions it (like StaffMapControls
// / BoundaryPickerPanel) and owns the selection state that mounts it.
//
// Plain React rather than a provider popup: native map popups render in the
// vendor's light theme, cannot reach the app's translation catalogues, and
// swallow the next map click - all of which the staff layer avoids the same way.
import { memo, useState } from "react";
import { X } from "lucide-react";
import { useTranslation } from "@/core/hooks/useTranslation";
import PanelCollapseToggle from "../PanelCollapseToggle";
import { getPlaceCategoryLabelKey, getPlaceCategoryRgb } from "./placeSymbols";
import type { PlaceMarker } from "./placeTypes";

interface PlaceInfoPopupProps {
  place: PlaceMarker;
  onClose: () => void;
  /** Positioning classes; the caller places the card over the map. */
  className?: string;
}

function PlaceInfoPopupBase({ place, onClose, className = "" }: PlaceInfoPopupProps) {
  const { t } = useTranslation();
  // Collapsed to name and category, to leave room when other panels are open.
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [r, g, b] = getPlaceCategoryRgb(place.category);
  const closeLabel = t("case.display.map_place_close");

  return (
    <div
      className={`rounded-md bg-white/95 p-3 text-xs shadow-md dark:bg-gray-800/95 ${className}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-semibold text-gray-900 dark:text-white">{place.name}</p>
          <p className="mt-0.5 flex items-center gap-1 text-gray-600 dark:text-gray-300">
            <span
              aria-hidden
              className="inline-block h-2.5 w-2.5 shrink-0 rounded-full ring-1 ring-black/10"
              style={{ backgroundColor: `rgb(${r}, ${g}, ${b})` }}
            />
            {t(getPlaceCategoryLabelKey(place.category))}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-0.5">
          <PanelCollapseToggle
            isCollapsed={isCollapsed}
            onToggle={() => setIsCollapsed((value) => !value)}
            isCompact
          />
          <button
            type="button"
            onClick={onClose}
            title={closeLabel}
            aria-label={closeLabel}
            className="shrink-0 rounded p-0.5 text-gray-500 hover:bg-black/5 dark:text-gray-400 dark:hover:bg-white/10"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      {!isCollapsed && (
        <p className="mt-2 text-gray-500 dark:text-gray-400">
          {t("case.display.map_place_coordinates")}: {place.latitude.toFixed(5)}, {place.longitude.toFixed(5)}
        </p>
      )}
    </div>
  );
}

export const PlaceInfoPopup = memo(PlaceInfoPopupBase);
PlaceInfoPopup.displayName = "PlaceInfoPopup";

export default PlaceInfoPopup;
