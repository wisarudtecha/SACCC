// Picker for Places that share a spot on the map.
//
// Shown when a group circle is clicked and zooming in would NOT separate its
// members. A stripped-down StaffGroupPanel: Place has no availability and no
// route summary, so each row is just a category-coloured glyph swatch, name
// and category label.
import { memo, useState } from "react";
import { ChevronRight, X } from "lucide-react";
import { useTranslation } from "@/core/hooks/useTranslation";
import PanelCollapseToggle from "../PanelCollapseToggle";
import { getPlaceCategoryLabelKey, getPlaceCategoryRgb } from "./placeSymbols";
import type { PlaceMarker } from "./placeTypes";

interface PlaceGroupPanelProps {
  /** The Places in the group, in the order they should be listed. */
  markers: readonly PlaceMarker[];
  onSelect: (placeId: string) => void;
  onClose: () => void;
  className?: string;
}

function PlaceGroupPanelBase({ markers, onSelect, onClose, className = "" }: PlaceGroupPanelProps) {
  const { t } = useTranslation();
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div
      className={`flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white/95 shadow-lg backdrop-blur-sm dark:border-gray-700 dark:bg-gray-900/95 ${
        isCollapsed ? "w-48" : "w-64 sm:w-72"
      } ${className}`}
    >
      <div
        className={`flex shrink-0 items-start gap-2 p-3 dark:border-gray-700 ${
          isCollapsed ? "" : "border-b border-gray-200"
        }`}
      >
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-gray-900 dark:text-white">
            {t("case.display.map_place_group_title", { count: markers.length })}
          </p>
          {!isCollapsed && (
            <p className="mt-0.5 text-[11px] leading-relaxed text-gray-500 dark:text-gray-400">
              {t("case.display.map_place_group_hint")}
            </p>
          )}
        </div>
        <PanelCollapseToggle isCollapsed={isCollapsed} onToggle={() => setIsCollapsed((value) => !value)} />
        <button
          type="button"
          onClick={onClose}
          title={t("case.display.map_place_close")}
          aria-label={t("case.display.map_place_close")}
          className="shrink-0 rounded p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-200"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className={`min-h-0 flex-1 overflow-y-auto custom-scrollbar ${isCollapsed ? "hidden" : ""}`}>
        {markers.map((marker) => {
          const [r, g, b] = getPlaceCategoryRgb(marker.category);
          return (
            <button
              key={marker.id}
              type="button"
              onClick={() => onSelect(marker.id)}
              className="flex w-full items-center gap-2 border-b border-gray-200 px-3 py-2 text-left transition-colors last:border-b-0 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-white/5"
            >
              <span
                className="h-3 w-3 shrink-0 rounded-full"
                style={{ backgroundColor: `rgb(${r}, ${g}, ${b})` }}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium text-gray-900 dark:text-white">
                  {marker.name}
                </p>
                <p className="mt-0.5 truncate text-[11px] text-gray-500 dark:text-gray-400">
                  {t(getPlaceCategoryLabelKey(marker.category))}
                </p>
              </div>
              <ChevronRight className="h-3.5 w-3.5 shrink-0 text-gray-400" />
            </button>
          );
        })}
      </div>
    </div>
  );
}

export const PlaceGroupPanel = memo(PlaceGroupPanelBase);
PlaceGroupPanel.displayName = "PlaceGroupPanel";

export default PlaceGroupPanel;
