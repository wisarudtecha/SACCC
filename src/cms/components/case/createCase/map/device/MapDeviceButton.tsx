// "Devices" control for the map's toolbar row: a master show/hide toggle plus
// one filter per category (Camera / Fire Hydrant / AED).
//
// A copy of MapPlaceButton - same MapControlGroup structure, same absolute
// notice pill gated on active/hover so it never widens the control in the
// toolbar cluster. Its state is owned by useDeviceLayer (called in
// BoundaryMapField); this component only renders it and reports clicks.
import { memo } from "react";
import { Cctv } from "lucide-react";
import { useTranslation } from "@/core/hooks/useTranslation";
import MapControlGroup from "../MapControlGroup";
import { MAP_CONTROL_SEGMENT_CLASS } from "../mapControlStyles";
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

const ACTIVE_SEGMENT = "bg-blue-50 font-medium text-blue-700 dark:bg-blue-500/20 dark:text-blue-300";
const IDLE_SEGMENT = "text-gray-700 hover:bg-black/5 dark:text-gray-200 dark:hover:bg-white/10";

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

  return (
    <div className={`group relative flex flex-col items-end ${className}`}>
      <MapControlGroup
        icon={<Cctv className="h-3.5 w-3.5" />}
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

        {DEVICE_CATEGORIES.map((category) => {
          const categoryLabel = t(getDeviceCategoryLabelKey(category));
          const [r, g, b] = getDeviceCategoryRgb(category);
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
          while the layer is on, otherwise only while pointing at / tabbed into
          the control. */}
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

export const MapDeviceButton = memo(MapDeviceButtonBase);
MapDeviceButton.displayName = "MapDeviceButton";

export default MapDeviceButton;
