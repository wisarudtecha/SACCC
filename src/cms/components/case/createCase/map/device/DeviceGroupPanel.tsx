// Picker for Devices that share a spot on the map.
//
// Shown when a group circle is clicked and zooming in would NOT separate its
// members. A stripped-down StaffGroupPanel: Device has no availability and no
// route summary, so each row is just a category-coloured glyph swatch, device
// type/model and category label. No Link action here - linking only ever
// applies to a resolved single device, from DeviceInfoPopup.
import { memo, useState } from "react";
import { ChevronRight, X } from "lucide-react";
import { useTranslation } from "@/core/hooks/useTranslation";
import PanelCollapseToggle from "../PanelCollapseToggle";
import { getDeviceCategoryLabelKey, getDeviceCategoryRgb } from "./deviceSymbols";
import type { DeviceMarker } from "./deviceTypes";

interface DeviceGroupPanelProps {
  /** The Devices in the group, in the order they should be listed. */
  markers: readonly DeviceMarker[];
  onSelect: (deviceId: string) => void;
  onClose: () => void;
  className?: string;
}

function DeviceGroupPanelBase({ markers, onSelect, onClose, className = "" }: DeviceGroupPanelProps) {
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
            {t("case.display.map_device_group_title", { count: markers.length })}
          </p>
          {!isCollapsed && (
            <p className="mt-0.5 text-[11px] leading-relaxed text-gray-500 dark:text-gray-400">
              {t("case.display.map_device_group_hint")}
            </p>
          )}
        </div>
        <PanelCollapseToggle isCollapsed={isCollapsed} onToggle={() => setIsCollapsed((value) => !value)} />
        <button
          type="button"
          onClick={onClose}
          title={t("case.display.map_device_close")}
          aria-label={t("case.display.map_device_close")}
          className="shrink-0 rounded p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-200"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className={`min-h-0 flex-1 overflow-y-auto custom-scrollbar ${isCollapsed ? "hidden" : ""}`}>
        {markers.map((marker) => {
          if (!marker.category) {
            return null;
          }
          const [r, g, b] = getDeviceCategoryRgb(marker.category);
          return (
            <button
              key={marker.deviceId}
              type="button"
              onClick={() => onSelect(marker.deviceId)}
              className="flex w-full items-center gap-2 border-b border-gray-200 px-3 py-2 text-left transition-colors last:border-b-0 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-white/5"
            >
              <span
                className="h-3 w-3 shrink-0 rounded-full"
                style={{ backgroundColor: `rgb(${r}, ${g}, ${b})` }}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium text-gray-900 dark:text-white">
                  {marker.model || marker.deviceType}
                </p>
                <p className="mt-0.5 truncate text-[11px] text-gray-500 dark:text-gray-400">
                  {t(getDeviceCategoryLabelKey(marker.category))}
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

export const DeviceGroupPanel = memo(DeviceGroupPanelBase);
DeviceGroupPanel.displayName = "DeviceGroupPanel";

export default DeviceGroupPanel;
