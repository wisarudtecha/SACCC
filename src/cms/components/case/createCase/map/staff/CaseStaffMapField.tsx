// The case map with the staff overlay attached.
//
// This is the only file that knows both about dispatch data and about the map.
// ArcgisAddressMapField / ArcgisAddressMap stay generic: they receive markers,
// a selection, and a slot of controls to render over the map.
//
// State lives here, ABOVE ArcgisAddressMapField, because that component renders
// a second MapView when expanded. Owning `isStaffVisible` / `selectedStaffId`
// any lower would reset the layer between renders of the large map and fetch the
// unit list twice. It now SURVIVES the large map closing - only what the layer
// actually draws (`effectiveShowStaff`) is gated on `isExpanded`, so reopening
// restores the toggle state and the selected officer/group without a refetch.
//
// The whole staff layer is large-map only. Dispatch work needs room: at the
// inline map's 320px there is space for the case, not for a roster of officers
// and a detail card. The inline map keeps just "view larger map" and map style.
import { memo, useCallback, useMemo, useState } from "react";
import { PermissionGate } from "@/core/components/auth/PermissionGate";
import { useTranslation } from "@/core/hooks/useTranslation";
import BoundaryMapField from "../BoundaryMapField";
import type { MapSlotContext } from "../ArcgisAddressMapField";
import type { ArcgisAddressResult, ArcgisLatLon } from "../ArcgisAddressMap";
import StaffDetailPanel from "./StaffDetailPanel";
import StaffGroupPanel from "./StaffGroupPanel";
import StaffMapControls from "./StaffMapControls";
import type { StaffSectionContext } from "./staffPanelSections";
import type { StaffMarker, StaffSelection } from "./staffTypes";
import { useCaseRoute } from "./useCaseRoute";
import { useClusterRouteSummaries } from "./useClusterRouteSummaries";
import { useStaffPositions } from "./useStaffPositions";
import { useStaffTrails } from "./useStaffTrails";

/**
 * Everything the panel needs to offer assign / remove, supplied by the owner of
 * the case (CaseDetailView). This layer only knows whether a button is enabled
 * and what to call when it is pressed - payload construction, SOP lookups,
 * toasts, confirmation and refetching all stay upstream.
 */
export interface StaffAssignmentOverlay {
  /** Case number shown to the user - the work order number, not the internal id. */
  caseLabel: string;
  /** Units already on this case, from the SOP `unitLists`. */
  assignedUnitIds: ReadonlySet<string>;
  /** Each assigned unit's status ON THIS CASE - distinct from their global duty
   *  status. Absent key = not assigned to this case. */
  assignedUnitStatusById: ReadonlyMap<string, string>;
  canAssign: boolean;
  canCancel: boolean;
  /** Unit with a request in flight, or null. Scoped per unit so one pending
   *  request disables only that card instead of the whole map. */
  submittingUnitId: string | null;
  onRequestAssign: (marker: StaffMarker) => void;
  onRequestCancel: (marker: StaffMarker) => void;
  /** Opens the full case record. Rendered upstream - the map clips its own children. */
  onRequestCaseDetails: () => void;
}

interface CaseStaffMapFieldProps {
  /** Case whose dispatch units are shown. Required - the endpoint is per-case. */
  caseId: string;
  value?: ArcgisLatLon | null;
  onSelect: (result: ArcgisAddressResult) => void;
  onError?: (message: string) => void;
  readOnly?: boolean;
  height?: number | string;
  className?: string;
  /** Required: every panel section renders against this context. */
  assignment: StaffAssignmentOverlay;
}

/** Viewing officer positions is part of assigning them. */
const STAFF_LAYER_PERMISSION = "case.assign";

function CaseStaffMapFieldBase({
  caseId,
  value,
  onSelect,
  onError,
  readOnly = false,
  height = 320,
  className = "",
  assignment
}: CaseStaffMapFieldProps) {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isStaffVisible, setIsStaffVisible] = useState(false);
  const [selection, setSelection] = useState<StaffSelection | null>(null);
  // The group an officer was picked out of, so the detail card can offer a way
  // back to it. Null when they were clicked directly on the map.
  const [groupOrigin, setGroupOrigin] = useState<readonly string[] | null>(null);
  // Whether the breadcrumb trail is drawn. Owned here, not in the tracking
  // section that offers the control, because that section unmounts every time
  // its row is collapsed - and for the same reason the rest of this state lives
  // here rather than below ArcgisAddressMapField.
  const [isTrailVisible, setIsTrailVisible] = useState(false);

  // What the layer actually draws. `isStaffVisible` alone is not enough: it is
  // forwarded to BOTH map instances (see ArcgisAddressMapField), and the inline
  // 320px map has no controls to turn markers back off. Gating on `isExpanded`
  // here - rather than resetting `isStaffVisible` when the modal closes - is
  // what lets the layer's on/off state and the selected officer/group survive a
  // close/reopen instead of forcing a full re-open every time.
  const effectiveShowStaff = isStaffVisible && isExpanded;

  const { staff, isLoading, isError, refresh, canRefresh } = useStaffPositions(
    caseId,
    effectiveShowStaff
  );

  // Where each officer has been, for as long as the layer has been open. Fed
  // from `staff` so it inherits that hook's coalescing and validation, and
  // accumulated whether or not the trail is currently drawn - see useStaffTrails.
  const trails = useStaffTrails(staff, effectiveShowStaff);

  const clearSelection = useCallback(() => {
    setSelection(null);
    setGroupOrigin(null);
  }, []);

  const toggleTrail = useCallback(() => {
    setIsTrailVisible((visible) => !visible);
  }, []);

  const handleToggle = useCallback(() => {
    setIsStaffVisible((visible) => {
      if (visible) {
        clearSelection();
      }
      return !visible;
    });
  }, [clearSelection]);

  const handleStaffSelect = useCallback((next: StaffSelection | null) => {
    setSelection(next);
    // A fresh click on the map starts a new journey, so forget where the last
    // one came from - otherwise "back" would return to an unrelated group.
    setGroupOrigin(null);
  }, []);

  const handlePickFromGroup = useCallback(
    (unitId: string) => {
      if (selection?.type === "group") {
        setGroupOrigin(selection.unitIds);
      }
      setSelection({ type: "staff", unitId });
    },
    [selection]
  );

  const handleBackToGroup = useCallback(() => {
    if (!groupOrigin) {
      return;
    }
    setSelection({ type: "group", unitIds: groupOrigin });
    setGroupOrigin(null);
  }, [groupOrigin]);

  // Only tracks whether the large map is open. The staff layer's on/off state
  // and the current selection are deliberately NOT reset here anymore -
  // `effectiveShowStaff` above already keeps markers off the inline map, so
  // reopening the large map restores the layer and the selected officer/group
  // exactly as they were left.
  const handleExpandedChange = useCallback((expanded: boolean) => {
    setIsExpanded(expanded);
  }, []);

  const selectedStaffId = selection?.type === "staff" ? selection.unitId : null;

  // Falls back to null when the selected officer drops out of the list (e.g. a
  // refresh no longer returns them), which closes the panel on its own.
  const selectedMarker = useMemo(
    () => staff.find((marker) => marker.unitId === selectedStaffId) ?? null,
    [staff, selectedStaffId]
  );

  // One officer's trail at a time, derived from the SAME `selection` that drives
  // the halo and the panel - never a second "who is being tracked" id, which
  // would let the three drift apart. Drawing every unit's trail at once would
  // also re-create exactly the tangle the three-colour marker scheme avoids.
  const selectedTrail = selectedStaffId ? trails[selectedStaffId] ?? null : null;

  // The picker outlives the group that opened it: these are real officers
  // whether or not they are still drawn as one circle, so panning does not close
  // the card. Only officers who have left the list entirely drop out.
  const groupMarkers = useMemo(() => {
    if (selection?.type !== "group") {
      return [];
    }
    return selection.unitIds
      .map((unitId) => staff.find((marker) => marker.unitId === unitId))
      .filter((marker): marker is StaffMarker => Boolean(marker));
  }, [selection, staff]);

  // The officer -> case driving route. Lives here, not in a section component,
  // for the same reason `selection` does: the state has to survive an accordion
  // section collapsing, and it has to be derived from - not merely reset on -
  // every selection change, so a stale polyline can never survive a reselect.
  const { routeState, canSolve: canSolveRoute, cooldownSeconds, solve: solveRoute } = useCaseRoute({
    marker: selectedMarker,
    caseLocation: value ?? null
  });

  // Every cluster member's distance/ETA, solved automatically the moment a
  // group panel opens - no button, no drawn polyline (see useClusterRouteSummaries.ts).
  // `null` rather than `[]` while no group is open, so the hook can tell
  // "closed" apart from "open with nobody in it".
  const { routes: clusterRoutes } = useClusterRouteSummaries({
    members: selection?.type === "group" ? groupMarkers : null,
    caseLocation: value ?? null
  });

  // Binds the case-level assignment wiring to the marker the panel is showing,
  // so the panel and its sections never have to handle "which staff member".
  const sectionContext = useMemo<StaffSectionContext | undefined>(() => {
    if (!selectedMarker) {
      return undefined;
    }
    return {
      caseLabel: assignment.caseLabel,
      isAssigned: assignment.assignedUnitIds.has(selectedMarker.unitId),
      canAssign: assignment.canAssign,
      canCancel: assignment.canCancel,
      isSubmitting: assignment.submittingUnitId === selectedMarker.unitId,
      onRequestAssign: () => assignment.onRequestAssign(selectedMarker),
      onRequestCancel: () => assignment.onRequestCancel(selectedMarker),
      onRequestCaseDetails: assignment.onRequestCaseDetails,
      caseUnitStatusId: assignment.assignedUnitStatusById.get(selectedMarker.unitId),
      route: {
        state: routeState,
        canSolve: canSolveRoute,
        cooldownSeconds,
        onSolve: solveRoute
      },
      trail: {
        isVisible: isTrailVisible,
        pointCount: selectedTrail?.length ?? 0,
        onToggle: toggleTrail
      }
    };
  }, [
    assignment,
    selectedMarker,
    routeState,
    canSolveRoute,
    cooldownSeconds,
    solveRoute,
    isTrailVisible,
    selectedTrail,
    toggleTrail
  ]);

  // One status line for the layer, most serious condition first. Undefined when
  // the layer is off or has nothing to report.
  //
  // Units with no reported position are silently absent: they were counted here
  // once, and that line was dropped by request.
  const notice = useMemo(() => {
    if (!isStaffVisible) {
      return undefined;
    }
    if (isError) {
      return t("case.display.map_staff_error");
    }
    if (!isLoading && staff.length === 0) {
      return t("case.display.map_staff_empty");
    }
    return undefined;
  }, [isStaffVisible, isError, isLoading, staff.length, t]);

  // One gate over the whole staff layer - toolbar and panel alike. The panel's
  // assign / remove buttons live inside it, so they need no gate of their own.
  // Only the staff controls live here now - the boundary group and the Place
  // button are BoundaryMapField's job, and it renders them to the left of this.
  const renderToolbarSlot = useCallback(
    ({ isExpanded }: MapSlotContext) => {
      if (!isExpanded) {
        return null;
      }
      return (
        <PermissionGate permission={STAFF_LAYER_PERMISSION}>
          <StaffMapControls
            isActive={isStaffVisible}
            onToggle={handleToggle}
            onRefresh={refresh}
            canRefresh={canRefresh}
            isLoading={isLoading}
            count={staff.length}
            notice={notice}
          />
        </PermissionGate>
      );
    },
    [canRefresh, handleToggle, isLoading, isStaffVisible, notice, refresh, staff.length]
  );

  const renderOverlaySlot = useCallback(
    ({ isExpanded }: MapSlotContext) => {
      // Below the search box, with an 8px gap at the bottom. This is the ONLY
      // height constraint on either card - a second one on the card itself would
      // compete with this at an unpredictable precedence and let it overflow the
      // map, where the clipped part becomes unreachable by scrolling.
      const anchorClass = "absolute left-2 top-16 z-10 max-h-[calc(100%-4.5rem)]";

      // Staff cards are large-map only, and mutually exclusive by construction:
      // a selection is either one officer or one group, never both. The boundary
      // picker sits on the opposite edge and is rendered by BoundaryMapField.
      if (!isExpanded) {
        return null;
      }
      if (selection?.type === "group" && groupMarkers.length > 0) {
        return (
          <PermissionGate permission={STAFF_LAYER_PERMISSION}>
            <StaffGroupPanel
              markers={groupMarkers}
              onSelect={handlePickFromGroup}
              onClose={clearSelection}
              assignedUnitStatusById={assignment.assignedUnitStatusById}
              clusterRoutes={clusterRoutes}
              className={anchorClass}
            />
          </PermissionGate>
        );
      }
      if (!selectedMarker || !sectionContext) {
        return null;
      }
      return (
        <PermissionGate permission={STAFF_LAYER_PERMISSION}>
          <StaffDetailPanel
            marker={selectedMarker}
            onClose={clearSelection}
            ctx={sectionContext}
            onBack={groupOrigin ? handleBackToGroup : undefined}
            backCount={groupOrigin?.length}
            className={anchorClass}
          />
        </PermissionGate>
      );
    },
    [
      assignment,
      clearSelection,
      clusterRoutes,
      groupMarkers,
      groupOrigin,
      handleBackToGroup,
      handlePickFromGroup,
      sectionContext,
      selectedMarker,
      selection
    ]
  );

  return (
    <BoundaryMapField
      value={value}
      onSelect={onSelect}
      onError={onError}
      readOnly={readOnly}
      // Read-only map, but a dispatcher still needs to look around: selecting a
      // result moves the view without touching the case location. Large map
      // only - the box is nearly as wide as the inline map.
      searchMode="expanded-only"
      height={height}
      className={className}
      showPlaceButton
      staff={staff}
      showStaff={effectiveShowStaff}
      selectedStaffId={selectedStaffId}
      onStaffSelect={handleStaffSelect}
      // Same gating as the staff layer: large-map only, and only while a
      // result actually exists to draw - a selection change or a failed solve
      // already collapses `routeState` back to something with no geometry.
      route={routeState.status === "ready" ? routeState.result.geometry : null}
      showRoute={effectiveShowStaff && routeState.status === "ready"}
      // Same gating again, plus the operator's own toggle: a trail belongs to one
      // selected officer, so there is nothing to draw without a selection.
      trail={selectedTrail}
      showTrail={effectiveShowStaff && isTrailVisible && Boolean(selectedStaffId)}
      extraOverlaySlot={renderOverlaySlot}
      extraToolbarSlot={renderToolbarSlot}
      onExpandedChange={handleExpandedChange}
    />
  );
}

export const CaseStaffMapField = memo(CaseStaffMapFieldBase);
CaseStaffMapField.displayName = "CaseStaffMapField";

export default CaseStaffMapField;
