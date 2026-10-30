// Picker for officers who share a spot on the map.
//
// Shown when a group circle is clicked and zooming in would NOT separate its
// members - which is the case that matters, because officers reporting the same
// coordinates never separate at any zoom. Without this card one of them is
// simply unreachable.
//
// Rendered in the same slot and at the same anchor as StaffDetailPanel, and the
// two are mutually exclusive, so they can never collide.
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { ChevronRight, Loader2, X } from "lucide-react";
import { useTranslation } from "@/core/hooks/useTranslation";
import PanelCollapseToggle from "../PanelCollapseToggle";
import PersonAvatar from "./PersonAvatar";
import { formatDistanceKm, formatDriveTime, routeErrorKey } from "./routeFormat";
import {
  getCaseStatusName,
  getUnitStatusName,
  readCaseStatuses,
  readUnitStatuses
} from "./staffDisplay";
import { getStaffStatusDotClass } from "./staffSymbols";
import {
  MAX_BATCH_ASSIGN_OFFICERS,
  canSelectMore,
  isSelectAllDisabled,
  pruneSelection
} from "@/cms/components/assignOfficer/batchAssignSelection";
import StaffActionButton from "./StaffActionButton";
import type { StaffMarker } from "./staffTypes";
import { CLUSTER_ROUTE_AUTO_SOLVE_LIMIT, type ClusterMemberRoute } from "./useClusterRouteSummaries";

interface StaffGroupPanelProps {
  /** The officers in the group, in the order they should be listed. */
  markers: readonly StaffMarker[];
  onSelect: (unitId: string) => void;
  onClose: () => void;
  /** Each assigned unit's status ON THIS CASE. Absent key = not assigned here. */
  assignedUnitStatusById: ReadonlyMap<string, string>;
  /** Distance/ETA per member, solved automatically - no button, no drawn line. */
  clusterRoutes: readonly ClusterMemberRoute[];
  /** Manually solves one member past the auto-solve limit (see StaffGroupPanel's Calculate button). */
  onSolveMember: (unitId: string) => void;
  /** False when the SOP stage forbids assignment - the batch button disables. */
  canAssign: boolean;
  /**
   * Batch-assign the checked members. Cluster mode only by construction: this
   * panel only renders for a staff GROUP - the single-officer detail panel keeps
   * its own confirm flow, untouched. One request per member, sent sequentially
   * by the caller through the EXISTING single-assignment endpoint; a dedicated
   * batch endpoint is documented future intent, not near-term.
   */
  onBatchAssign: (markers: readonly StaffMarker[]) => Promise<void>;
  /** Positioning classes - the caller places the card over the map. */
  className?: string;
}

function StaffGroupPanelBase({
  markers,
  onSelect,
  onClose,
  assignedUnitStatusById,
  clusterRoutes,
  onSolveMember,
  canAssign,
  onBatchAssign,
  className = ""
}: StaffGroupPanelProps) {
  const { t, language } = useTranslation();
  // Collapsed to the title row, to leave room when other panels are open.
  const [isCollapsed, setIsCollapsed] = useState(false);
  // Batch-assign selection (cluster mode only - see onBatchAssign). The panel
  // unmounts when the group card closes or a different one opens, so local
  // state needs no manual reset on close.
  const [selectedUnitIds, setSelectedUnitIds] = useState<string[]>([]);
  const [isBatchSubmitting, setIsBatchSubmitting] = useState(false);
  const unitStatuses = useMemo(readUnitStatuses, []);
  const caseStatuses = useMemo(readCaseStatuses, []);
  const routeByUnitId = useMemo(
    () => new Map(clusterRoutes.map((entry) => [entry.unitId, entry.state])),
    [clusterRoutes]
  );

  // Members already on THIS case stay listed (their on-case status shows) but
  // are never selectable - the same rule the assign-officer table modal applies.
  const selectableMembers = useMemo(
    () => markers.filter((marker) => !assignedUnitStatusById.has(marker.unitId)),
    [markers, assignedUnitStatusById]
  );

  // Live rosters change under an open panel (refresh, websocket updates): a
  // checked member who left the group drops out of the selection, and an
  // over-cap selection is trimmed. Same array returned when nothing changed.
  // Guard: a momentarily-empty member list is a transient gap (position flush,
  // refetch blip), not "the group emptied" - pruning against it would wipe the
  // checkboxes. A group with no real members left unmounts this panel anyway.
  useEffect(() => {
    if (markers.length === 0) return;
    setSelectedUnitIds((prev) => {
      const selectableIds = new Set(selectableMembers.map((marker) => marker.unitId));
      const pruned = pruneSelection(prev, selectableIds);
      return pruned.length === prev.length ? prev : pruned;
    });
  }, [markers, selectableMembers]);

  const toggleMemberSelected = useCallback((unitId: string) => {
    setSelectedUnitIds((prev) =>
      prev.includes(unitId)
        ? prev.filter((id) => id !== unitId)
        // At the batch cap no NEW member may be checked - uncheck first.
        : canSelectMore(prev.length) ? [...prev, unitId] : prev
    );
  }, []);

  const isAllSelected =
    selectableMembers.length > 0 &&
    selectableMembers.every((marker) => selectedUnitIds.includes(marker.unitId));
  const isSomeSelected =
    !isAllSelected &&
    selectableMembers.some((marker) => selectedUnitIds.includes(marker.unitId));
  // "Select all" is disabled when the selectable member list exceeds the batch
  // cap: it may never pick a partial slice that would still look like "all".
  const isSelectAllControlDisabled = isSelectAllDisabled(selectableMembers.length);

  const toggleSelectAll = useCallback(() => {
    const memberIds = selectableMembers.map((marker) => marker.unitId);
    setSelectedUnitIds((prev) => {
      if (memberIds.every((id) => prev.includes(id))) {
        return prev.filter((id) => !memberIds.includes(id));
      }
      // Fills at most the remaining free slots, so the cap can never be broken
      // by a select-all on top of officers checked under a previous filter.
      const remaining = MAX_BATCH_ASSIGN_OFFICERS - prev.length;
      if (remaining <= 0) return prev;
      const toAdd = memberIds.filter((id) => !prev.includes(id)).slice(0, remaining);
      return [...prev, ...toAdd];
    });
  }, [selectableMembers]);

  const selectedMembers = useMemo(
    () => markers.filter((marker) => selectedUnitIds.includes(marker.unitId)),
    [markers, selectedUnitIds]
  );

  const handleBatchAssign = async () => {
    if (selectedMembers.length === 0 || isBatchSubmitting) return;
    setIsBatchSubmitting(true);
    try {
      // Upstream owns the requests, the toasts and the refetch; the selection
      // is cleared either way, matching the table modal's close-after-assign.
      await onBatchAssign(selectedMembers);
      setSelectedUnitIds([]);
    } finally {
      setIsBatchSubmitting(false);
    }
  };

  return (
    // Flex column so the list below scrolls internally instead of spilling out
    // of the map container, which clips overflow. The height budget is the
    // CALLER's, as with StaffDetailPanel.
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
            {t("case.display.map_staff_group_title", { count: markers.length })}
          </p>
          {!isCollapsed && (
            <p className="mt-0.5 text-[11px] leading-relaxed text-gray-500 dark:text-gray-400">
              {t("case.display.map_staff_group_hint")}
            </p>
          )}
        </div>
        <PanelCollapseToggle isCollapsed={isCollapsed} onToggle={() => setIsCollapsed((value) => !value)} />
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

      {/* Select all - same rule as the table view's header checkbox, hidden
          while collapsed. */}
      {!isCollapsed && (
        <div className="flex shrink-0 items-center gap-2 border-b border-gray-200 px-3 py-2 dark:border-gray-700">
          <input
            type="checkbox"
            checked={isAllSelected}
            ref={(el) => {
              if (el) {
                el.indeterminate = isSomeSelected;
              }
            }}
            disabled={isSelectAllControlDisabled}
            onChange={toggleSelectAll}
            aria-label={t("case.display.map_staff_group_select_all")}
            className="h-4 w-4 cursor-pointer accent-blue-600 disabled:cursor-not-allowed disabled:opacity-40 dark:accent-blue-500"
          />
          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
            {t("case.display.map_staff_group_select_all")}
          </span>
        </div>
      )}

      <div
        className={`min-h-0 flex-1 overflow-y-auto custom-scrollbar ${isCollapsed ? "hidden" : ""}`}
      >
        {markers.map((marker, index) => {
          const routeState = routeByUnitId.get(marker.unitId);
          const isAutoSolved = index < CLUSTER_ROUTE_AUTO_SOLVE_LIMIT;
          const isMemberSelected = selectedUnitIds.includes(marker.unitId);
          // Already on this case: listed for its on-case status, never selectable.
          const isMemberAssigned = assignedUnitStatusById.has(marker.unitId);
          return (
            <div
              key={marker.unitId}
              className="flex items-center gap-1 border-b border-gray-200 last:border-b-0 dark:border-gray-700"
            >
              {/* The checkbox is a SIBLING of the drill-in button, never a child
                  of it: HTML forbids interactive content inside <button>. */}
              <div className="shrink-0 pl-3">
                <input
                  type="checkbox"
                  checked={isMemberSelected}
                  disabled={isMemberAssigned || (!isMemberSelected && !canSelectMore(selectedUnitIds.length))}
                  onChange={() => toggleMemberSelected(marker.unitId)}
                  aria-label={marker.unitName}
                  className="h-4 w-4 cursor-pointer accent-blue-600 disabled:cursor-not-allowed disabled:opacity-40 dark:accent-blue-500"
                />
              </div>
            <button
              type="button"
              onClick={() => onSelect(marker.unitId)}
              className="flex min-w-0 flex-1 items-center gap-2 py-2 pr-3 text-left transition-colors hover:bg-gray-50 dark:hover:bg-white/5"
            >
              <PersonAvatar name={marker.unitName} photo={marker.photo} size="sm" />
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
                {/* Distance/ETA, solved automatically for the first
                    CLUSTER_ROUTE_AUTO_SOLVE_LIMIT members - no button, no
                    drawn polyline; that stays the single-officer panel's job.
                    Rows past the limit get a manual trigger instead, so a
                    large cluster doesn't fire N routing requests at once. */}
                {/* A span, not a nested <button>: the whole row is already a
                    button, and HTML forbids a button inside a button. */}
                {!isAutoSolved && (!routeState || routeState.status === "idle") && (
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(event) => {
                      event.stopPropagation();
                      onSolveMember(marker.unitId);
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        event.stopPropagation();
                        onSolveMember(marker.unitId);
                      }
                    }}
                    className="mt-0.5 inline-block text-[11px] text-blue-600 hover:underline dark:text-blue-300"
                  >
                    {t("case.display.map_staff_route_calculate")}
                  </span>
                )}
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
            </div>
          );
        })}
      </div>

      {/* Batch dispatch footer - cluster mode only by construction: this panel
          renders solely for a staff GROUP. Selecting one officer still uses the
          detail panel's single-assign flow, which stays untouched. */}
      {!isCollapsed && (
        <div className="shrink-0 border-t border-gray-200 p-2 dark:border-gray-700">
          <StaffActionButton
            variant="assign"
            label={t("case.display.map_staff_group_batch_assign", { count: selectedUnitIds.length })}
            submittingLabel={t("case.display.map_staff_submitting")}
            isSubmitting={isBatchSubmitting}
            isAllowed={canAssign && selectedUnitIds.length > 0}
            onClick={handleBatchAssign}
          />
          {!canSelectMore(selectedUnitIds.length) && (
            <p className="mt-1 text-center text-[11px] text-amber-600 dark:text-amber-400">
              {t("case.display.map_staff_group_batch_limit_hint", { count: MAX_BATCH_ASSIGN_OFFICERS })}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export const StaffGroupPanel = memo(StaffGroupPanelBase);
StaffGroupPanel.displayName = "StaffGroupPanel";

export default StaffGroupPanel;
