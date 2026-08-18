// Picker for officers who share a spot on the map.
//
// Shown when a group circle is clicked and zooming in would NOT separate its
// members - which is the case that matters, because officers reporting the same
// coordinates never separate at any zoom. Without this card one of them is
// simply unreachable.
//
// Rendered in the same slot and at the same anchor as StaffDetailPanel, and the
// two are mutually exclusive, so they can never collide.
import { memo, useMemo } from "react";
import { ChevronRight, Loader2, X } from "lucide-react";
import { useTranslation } from "@/core/hooks/useTranslation";
import { formatDistanceKm, formatDriveTime, routeErrorKey } from "./routeFormat";
import {
  getCaseStatusName,
  getStaffInitials,
  getUnitStatusName,
  readCaseStatuses,
  readUnitStatuses
} from "./staffDisplay";
import { getStaffStatusDotClass } from "./staffSymbols";
import type { StaffMarker } from "./staffTypes";
import type { ClusterMemberRoute } from "./useClusterRouteSummaries";

interface StaffGroupPanelProps {
  /** The officers in the group, in the order they should be listed. */
  markers: readonly StaffMarker[];
  onSelect: (unitId: string) => void;
  onClose: () => void;
  /** Each assigned unit's status ON THIS CASE. Absent key = not assigned here. */
  assignedUnitStatusById: ReadonlyMap<string, string>;
  /** Distance/ETA per member, solved automatically - no button, no drawn line. */
  clusterRoutes: readonly ClusterMemberRoute[];
  /** Positioning classes - the caller places the card over the map. */
  className?: string;
}

function StaffGroupPanelBase({
  markers,
  onSelect,
  onClose,
  assignedUnitStatusById,
  clusterRoutes,
  className = ""
}: StaffGroupPanelProps) {
  const { t, language } = useTranslation();
  const unitStatuses = useMemo(readUnitStatuses, []);
  const caseStatuses = useMemo(readCaseStatuses, []);
  const routeByUnitId = useMemo(
    () => new Map(clusterRoutes.map((entry) => [entry.unitId, entry.state])),
    [clusterRoutes]
  );

  return (
    // Flex column so the list below scrolls internally instead of spilling out
    // of the map container, which clips overflow. The height budget is the
    // CALLER's, as with StaffDetailPanel.
    <div
      className={`flex w-64 flex-col overflow-hidden rounded-lg border border-gray-200 bg-white/95 shadow-lg backdrop-blur-sm sm:w-72 dark:border-gray-700 dark:bg-gray-900/95 ${className}`}
    >
      <div className="flex shrink-0 items-start gap-2 border-b border-gray-200 p-3 dark:border-gray-700">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-gray-900 dark:text-white">
            {t("case.display.map_staff_group_title", { count: markers.length })}
          </p>
          <p className="mt-0.5 text-[11px] leading-relaxed text-gray-500 dark:text-gray-400">
            {t("case.display.map_staff_group_hint")}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          title={t("case.display.map_staff_close")}
          aria-label={t("case.display.map_staff_close")}
          className="shrink-0 rounded p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-200"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto custom-scrollbar">
        {markers.map((marker) => {
          const routeState = routeByUnitId.get(marker.unitId);
          return (
            <button
              key={marker.unitId}
              type="button"
              onClick={() => onSelect(marker.unitId)}
              className="flex w-full items-center gap-2 border-b border-gray-200 px-3 py-2 text-left transition-colors last:border-b-0 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-white/5"
            >
              <div className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-200 text-[10px] font-semibold text-gray-700 dark:bg-gray-700 dark:text-gray-100">
                {marker.photo ? (
                  <img src={marker.photo} alt="" className="h-full w-full object-cover" />
                ) : (
                  getStaffInitials(marker.unitName)
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium text-gray-900 dark:text-white">
                  {marker.unitName}
                </p>
                {/* Each officer's OWN status, so the group's single colour never
                    hides the fact that only some of them are dispatchable. */}
                <span className="mt-0.5 flex items-center gap-1.5">
                  <span
                    className={`h-1.5 w-1.5 shrink-0 rounded-full ${getStaffStatusDotClass(marker.statusId, marker.isLogin)}`}
                  />
                  <span className="truncate text-[11px] text-gray-500 dark:text-gray-400">
                    {getUnitStatusName(unitStatuses, marker.statusId)}
                  </span>
                </span>
                {/* This officer's status ON THIS CASE, only when assigned here. */}
                {Boolean(assignedUnitStatusById.get(marker.unitId)) && (
                  <p className="mt-0.5 truncate text-[11px] text-blue-600 dark:text-blue-300">
                    {getCaseStatusName(caseStatuses, assignedUnitStatusById.get(marker.unitId)!, language)}
                  </p>
                )}
                {/* Distance/ETA, solved automatically for every member - no
                    button here, no drawn polyline; that stays the single-officer
                    panel's job. */}
                {routeState?.status === "solving" && (
                  <span className="mt-0.5 flex items-center gap-1 text-[11px] text-gray-400 dark:text-gray-500">
                    <Loader2 className="h-2.5 w-2.5 shrink-0 animate-spin" />
                    {t("case.display.map_staff_route_solving")}
                  </span>
                )}
                {routeState?.status === "ready" && (
                  <p className="mt-0.5 truncate text-[11px] text-gray-500 dark:text-gray-400">
                    {formatDistanceKm(routeState.result.distanceKm, t)} ·{" "}
                    {formatDriveTime(routeState.result.travelMinutes, t)}
                  </p>
                )}
                {routeState?.status === "error" && (
                  <p className="mt-0.5 truncate text-[11px] text-amber-600 dark:text-amber-400">
                    {t(routeErrorKey(routeState.reason))}
                  </p>
                )}
              </div>
              <ChevronRight className="h-3.5 w-3.5 shrink-0 text-gray-400" />
            </button>
          );
        })}
      </div>
    </div>
  );
}

export const StaffGroupPanel = memo(StaffGroupPanelBase);
StaffGroupPanel.displayName = "StaffGroupPanel";

export default StaffGroupPanel;
