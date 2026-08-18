// The staff cluster on the map: show/hide, refresh, and the layer's status line.
//
// Everything staff-related lives in this one corner. The generic map controls
// (map style, expand) own the opposite edge, so the two groups never interleave.
//
// Like BasemapSwitcher this is plain React rather than an Esri widget - the
// labels come from the app's translation catalogues and it has to work in dark
// mode. Positioning is the caller's job, again matching BasemapSwitcher.
//
// The refresh button is disabled for STAFF_REFRESH_COOLDOWN_MS after a press. It
// shows no countdown: MOB websocket events already refetch in the background
// (see useStaffPositions), so the button is a "check now", not the only way the
// map stays current, and a visible timer would read as noise rather than
// feedback. Only a press arms that cooldown - a background reconcile does not,
// or a busy shift would keep the button disabled for good.
import { memo } from "react";
import { RefreshCcw, Users } from "lucide-react";
import { useTranslation } from "@/core/hooks/useTranslation";

interface StaffMapControlsProps {
  isActive: boolean;
  onToggle: () => void;
  onRefresh: () => void;
  canRefresh: boolean;
  isLoading: boolean;
  /** Number of officers currently drawn; shown as a badge when the layer is on. */
  count: number;
  /**
   * Status line for the layer (error / nothing to show / units without a
   * position). Rendered below the buttons so they stay anchored to the top edge
   * of the map and don't shift when a message appears or clears.
   */
  notice?: string;
  /** Positioning classes; the caller places the cluster over the map. */
  className?: string;
}

const SEGMENT_CLASS =
  "flex items-center gap-1 px-2 py-1 text-xs transition-colors disabled:cursor-not-allowed disabled:opacity-50";

function StaffMapControlsBase({
  isActive,
  onToggle,
  onRefresh,
  canRefresh,
  isLoading,
  count,
  notice,
  className = ""
}: StaffMapControlsProps) {
  const { t } = useTranslation();

  const toggleLabel = isActive ? t("case.display.map_staff_hide") : t("case.display.map_staff");
  const refreshLabel = t("case.display.map_staff_refresh");

  return (
    <div className={`flex flex-col items-end gap-1 ${className}`}>
      {/* One segmented shell, so the two buttons read as a single staff control. */}
      <div className="flex items-stretch overflow-hidden rounded-md bg-white/90 shadow-sm dark:bg-gray-800/90">
        <button
          type="button"
          onClick={onToggle}
          title={toggleLabel}
          aria-label={toggleLabel}
          aria-pressed={isActive}
          className={`${SEGMENT_CLASS} ${
            isActive
              ? "bg-blue-50 font-medium text-blue-700 dark:bg-blue-500/20 dark:text-blue-300"
              : "text-gray-700 hover:bg-black/5 dark:text-gray-200 dark:hover:bg-white/10"
          }`}
        >
          <Users className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">{t("case.display.map_staff")}</span>
          {isActive && (
            <span className="rounded bg-white/70 px-1 text-[10px] font-medium text-blue-700 dark:bg-gray-900/40 dark:text-blue-200">
              {count}
            </span>
          )}
        </button>

        {isActive && (
          <>
            <span aria-hidden className="w-px bg-gray-200 dark:bg-gray-700" />
            <button
              type="button"
              onClick={onRefresh}
              disabled={!canRefresh}
              title={refreshLabel}
              aria-label={refreshLabel}
              className={`${SEGMENT_CLASS} text-gray-700 hover:bg-black/5 dark:text-gray-200 dark:hover:bg-white/10`}
            >
              <RefreshCcw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
            </button>
          </>
        )}
      </div>

      {notice && (
        <div className="max-w-60 rounded bg-black/60 px-2 py-1 text-right text-xs text-white">
          {notice}
        </div>
      )}
    </div>
  );
}

export const StaffMapControls = memo(StaffMapControlsBase);
StaffMapControls.displayName = "StaffMapControls";

export default StaffMapControls;
