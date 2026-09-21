// The case map with the staff overlay attached.
//
// This is the only file that knows both about dispatch data and about the map.
// AddressMapField / the map itself stay generic: they receive markers,
// a selection, and a slot of controls to render over the map.
//
// State lives here, ABOVE AddressMapField, because that component renders
// a second MapView when expanded. Owning `isStaffVisible` / `selectedStaffId`
// any lower would reset the layer between renders of the large map and fetch the
// unit list twice. It SURVIVES the large map closing, so reopening restores the
// toggle state and the selected officer/group without a refetch.
//
// The staff MARKERS show on both maps: the inline map has a compact Staff toggle,
// so a dispatcher can see where people are without expanding. Everything that
// needs room stays large-map only - the detail / group / case cards, refresh, and
// the selected officer's route and trail. Dispatch work needs room: at the inline
// map's 320px there is space for the case, not for a roster and a detail card.
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CaseDetails } from "@/cms/types/case";
import { useUnitWorkloads } from "@/cms/components/assignOfficer/workload/useUnitWorkloads";
import type { CaseSopUnit } from "@/cms/types/dispatch";
import { PermissionGate } from "@/core/components/auth/PermissionGate";
import { useTranslation } from "@/core/hooks/useTranslation";
import BoundaryMapField from "../BoundaryMapField";
import { dockedCardsWidthPx } from "../frameBounds";
import type {
  AddressResult,
  IncidentRadiusOverlay,
  MapFocusRequest,
  MapLatLon,
  MapSlotContext,
  RouteOverlay,
  StaffConnector
} from "../mapTypes";
import CasePanel from "./CasePanel";
import { collectFramePoints, resolveFocusTarget } from "./casePanelModel";
import StaffDetailPanel from "./StaffDetailPanel";
import StaffGroupPanel from "./StaffGroupPanel";
import StaffMapControls from "./StaffMapControls";
import {
  DEFAULT_STAFF_FILTER_MODE,
  filterStaffForMode,
  type StaffFilterMode
} from "./staffFilter";
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
  /** The same SOP `unitLists`, whole - the Case Panel lists who was assigned and by whom. */
  assignedUnits: readonly CaseSopUnit[];
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
  /**
   * Drag-and-drop assignment: assigns immediately, no confirmation. Resolves true
   * when the officer ended up dispatched. Upstream owns the toasts and refetch.
   */
  onAssignNow: (marker: StaffMarker) => Promise<boolean>;
  /** Undoes a drag-and-drop assignment. Resolves true when the cancel went through. */
  onUndoAssign: (marker: StaffMarker) => Promise<boolean>;
  /** Opens the full case record. Rendered upstream - the map clips its own children. */
  onRequestCaseDetails: () => void;
}

interface CaseStaffMapFieldProps {
  /** Case whose dispatch units are shown. Required - the endpoint is per-case. */
  caseId: string;
  value?: MapLatLon | null;
  onSelect: (result: AddressResult) => void;
  onError?: (message: string) => void;
  /** Free-text location description, forwarded to BoundaryMapField. */
  address?: string;
  readOnly?: boolean;
  height?: number | string;
  className?: string;
  /**
   * No-match fallback circle around the incident pin, forwarded untouched to
   * BoundaryMapField. Set by CaseDisplay when the saved incident coordinate
   * matched no single Service Center polygon; null otherwise.
   */
  incidentRadius?: IncidentRadiusOverlay | null;
  /**
   * Start every boundary level hidden and unselected instead of the historical
   * one-level auto-default. The case-assignment (dispatch) map passes this so
   * layers and polygons only appear once the dispatcher explicitly asks for
   * them - forwarded untouched to BoundaryMapField.
   */
  manualOnly?: boolean;
  /**
   * The dispatcher's authorized District ids, forwarded untouched to
   * BoundaryMapField. Narrows the boundary picker to those districts plus the
   * provinces/countries they roll up into. Omit or pass empty for no
   * restriction.
   */
  authorizedDistrictIds?: readonly string[];
  /**
   * A resolved Service Center match's district code, forwarded untouched to
   * BoundaryMapField. When set, forces the District level on and adds this
   * code to the selection - the case-assignment auto-show exception to
   * `manualOnly`.
   */
  autoShowDistrictCode?: string | null;
  /** Required: every panel section renders against this context. */
  assignment: StaffAssignmentOverlay;
  /** The case itself, for the Case Panel opened from the incident pin. */
  caseData?: CaseDetails;
}

/** Viewing officer positions is part of assigning them. */
const STAFF_LAYER_PERMISSION = "case.assign";

/**
 * Zoom "focus on this responder" brings the map to when it is further out. Street
 * level: close enough that the responder is not swallowed by a group circle.
 */
const RESPONDER_FOCUS_ZOOM = 16;

/**
 * Room left around the points when framing them, on top of whatever the docked
 * cards cover: breathing space on every side, the search box across the top, and
 * the address card and attribution strip along the bottom.
 */
const FRAME_MARGIN_PX = 48;
const FRAME_TOP_INSET_PX = 72;
const FRAME_BOTTOM_INSET_PX = 64;

/**
 * Docks the cards over the map's left edge. Fixed top and bottom, not just a
 * max-height, so a card's own `max-h-full` has something to resolve against.
 * `pointer-events-none` keeps the empty strip between and beside the cards
 * clickable as map; each card turns them back on.
 */
const CARD_DOCK_CLASS =
  "pointer-events-none absolute bottom-2 left-2 top-16 z-10 flex items-start gap-2";
const CARD_CLASS = "pointer-events-auto max-h-full";

function CaseStaffMapFieldBase({
  caseId,
  value,
  onSelect,
  onError,
  address,
  readOnly = false,
  height = 320,
  className = "",
  incidentRadius = null,
  manualOnly = false,
  authorizedDistrictIds,
  autoShowDistrictCode = null,
  assignment,
  caseData
}: CaseStaffMapFieldProps) {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isStaffVisible, setIsStaffVisible] = useState(false);
  // Which officers the layer shows. Recommend is the default, as in the
  // assign-officer modal; see staffFilter.ts. Owned here so it survives the large
  // map closing and is shared by both maps, like the layer's on/off state.
  const [staffFilterMode, setStaffFilterMode] = useState<StaffFilterMode>(DEFAULT_STAFF_FILTER_MODE);
  // Whether the "an assigned case shows its staff by default" rule has been
  // applied or pre-empted, so it fires at most once and never overrides a
  // dispatcher who has since chosen for themselves.
  const hasSettledStaffDefaultRef = useRef(false);
  const [selection, setSelection] = useState<StaffSelection | null>(null);
  // The group an officer was picked out of, so the detail card can offer a way
  // back to it. Null when they were clicked directly on the map.
  const [groupOrigin, setGroupOrigin] = useState<readonly string[] | null>(null);
  // Whether the breadcrumb trail is drawn. Owned here, not in the tracking
  // section that offers the control, because that section unmounts every time
  // its row is collapsed - and for the same reason the rest of this state lives
  // here rather than below AddressMapField.
  const [isTrailVisible, setIsTrailVisible] = useState(false);
  // The Case Panel, opened from the incident pin. Owned here for the same reason
  // as `selection`, and - like it - kept across the large map closing, so
  // reopening restores what the dispatcher had open.
  const [isCasePanelOpen, setIsCasePanelOpen] = useState(false);
  const [isCasePanelCollapsed, setIsCasePanelCollapsed] = useState(false);
  // The camera command behind a responder's "focus" button, and the responder a
  // press is still waiting on: pressing it can also be what turns the staff layer
  // on, in which case the position does not exist yet.
  const [focusRequest, setFocusRequest] = useState<MapFocusRequest | null>(null);
  const [pendingFocusUnitId, setPendingFocusUnitId] = useState<string | null>(null);
  const focusNonceRef = useRef(0);

  // The staff layer is on: fetched and drawn. The flag is forwarded to BOTH map
  // instances (see AddressMapField), and both have a toggle for it, so it is just
  // `isStaffVisible` - the layer stays on across the large map opening and
  // closing, and nothing is refetched for it.
  const isStaffLayerOn = isStaffVisible;

  // What only makes sense with the large map open: the selected officer's route
  // and trail. Selection can only be made there (see handleStaffSelect), so
  // drawing them on the inline map would show a line for a card nobody can see.
  const isExpandedStaffLayerOn = isStaffVisible && isExpanded;

  const { staff, isLoading, isLoaded, isError, refresh, canRefresh } = useStaffPositions(
    caseId,
    isStaffLayerOn
  );

  // Where each officer has been, for as long as the layer has been open. Fed
  // from `staff` so it inherits that hook's coalescing and validation, and
  // accumulated whether or not the trail is currently drawn - see useStaffTrails.
  const trails = useStaffTrails(staff, isStaffLayerOn);

  // Workload, only to rank the shortlist - so only fetched while the layer is on
  // AND the filter needs it. One bulk call for every unit, never one per officer.
  const staffUnitIds = useMemo(() => staff.map((marker) => marker.unitId), [staff]);
  const { byUnitId: workloadByUnitId, isError: isWorkloadError } = useUnitWorkloads({
    unitIds: staffUnitIds,
    enabled: isStaffLayerOn && staffFilterMode === "recommend"
  });

  // The staff actually drawn and listed: `staff` narrowed by the filter. Everyone
  // already on the case is always in it, so the assignment itself is never hidden
  // by a filter. Anything that has to find an ASSIGNED officer (focus, the
  // connectors, the Case Panel's roster) keeps reading the full `staff`.
  const displayedStaff = useMemo(
    () =>
      filterStaffForMode({
        mode: staffFilterMode,
        staff,
        assignedUnitIds: assignment.assignedUnitIds,
        workloadByUnitId,
        isWorkloadError
      }),
    [staffFilterMode, staff, assignment.assignedUnitIds, workloadByUnitId, isWorkloadError]
  );

  // A straight line from each assigned officer to the incident pin. Just the
  // staff end - the map draws to its own `value`. Not routes: nothing is solved.
  const staffConnectors = useMemo<StaffConnector[]>(
    () =>
      staff
        .filter((marker) => assignment.assignedUnitIds.has(marker.unitId))
        .map((marker) => ({
          unitId: marker.unitId,
          latitude: marker.latitude,
          longitude: marker.longitude
        })),
    [staff, assignment.assignedUnitIds]
  );

  // A case that already has someone assigned opens with its staff showing, on
  // both maps. An unassigned case stays hidden - showing every officer there is
  // clutter until the dispatcher asks. Once only: the ref is also set by a manual
  // toggle (see handleToggle), so a later hide is never undone.
  useEffect(() => {
    if (hasSettledStaffDefaultRef.current || assignment.assignedUnitIds.size === 0) {
      return;
    }
    hasSettledStaffDefaultRef.current = true;
    setIsStaffVisible(true);
  }, [assignment.assignedUnitIds]);

  const clearSelection = useCallback(() => {
    setSelection(null);
    setGroupOrigin(null);
    // Dismissing the card also withdraws a focus press still waiting for its
    // position - otherwise the camera would jump later, for a card that is gone.
    setPendingFocusUnitId(null);
  }, []);

  const toggleTrail = useCallback(() => {
    setIsTrailVisible((visible) => !visible);
  }, []);

  const handleToggle = useCallback(() => {
    // A dispatcher's own choice outranks the default, even one made before the
    // assignment list has loaded.
    hasSettledStaffDefaultRef.current = true;
    setIsStaffVisible((visible) => {
      if (visible) {
        clearSelection();
      }
      return !visible;
    });
  }, [clearSelection]);

  // Ignored unless the large map is open. Markers now draw on the inline map too,
  // but its Staff toggle opens no panel, so a click there must not set a
  // selection: the cards only render on the large map, and the next expand would
  // open a Staff Panel nobody asked for. (A cluster that can be separated is
  // zoomed into by the map itself, before this is ever called.)
  const handleStaffSelect = useCallback(
    (next: StaffSelection | null) => {
      if (!isExpanded) {
        return;
      }
      setSelection(next);
      // A fresh click on the map starts a new journey, so forget where the last
      // one came from - otherwise "back" would return to an unrelated group.
      setGroupOrigin(null);
    },
    [isExpanded]
  );

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

  // The pin toggles rather than only opens: a second click on the thing that
  // opened the panel is where people reach for to dismiss it.
  //
  // Ignored unless the large map is open. The callback is forwarded to the inline
  // map too, and a click there would flip state nobody can see - the panel only
  // renders on the large map - so the next click after expanding would appear to
  // close a panel that was never shown.
  const handleIncidentSelect = useCallback(() => {
    if (!isExpanded) {
      return;
    }
    setIsCasePanelOpen((isOpen) => !isOpen);
  }, [isExpanded]);

  const closeCasePanel = useCallback(() => {
    setIsCasePanelOpen(false);
  }, []);

  const toggleCasePanelCollapsed = useCallback(() => {
    setIsCasePanelCollapsed((isCollapsed) => !isCollapsed);
  }, []);

  // "Focus" on a responder in the Case Panel: bring the staff layer up, open that
  // person's Staff Panel, and centre the map on them (the effect below, once their
  // position is known). Deliberately never touches the route - selecting a person
  // does not solve one, that stays the Calculate button's job.
  const handleFocusResponder = useCallback((unitId: string) => {
    setIsStaffVisible(true);
    setGroupOrigin(null);
    setSelection({ type: "staff", unitId });
    setPendingFocusUnitId(unitId);
  }, []);

  // Only tracks whether the large map is open. The staff layer's on/off state
  // and the current selection are deliberately NOT reset here, so reopening the
  // large map restores the layer and the selected officer/group exactly as they
  // were left.
  const handleExpandedChange = useCallback((expanded: boolean) => {
    setIsExpanded(expanded);
  }, []);

  const selectedStaffId = selection?.type === "staff" ? selection.unitId : null;

  // Turns a pending focus press into a camera command as soon as the responder's
  // position exists. If the list has loaded and they are not in it they have no
  // position to go to, so the press is dropped rather than left to fire later.
  //
  // The command asks the map to show the incident pin together with EVERY assigned
  // responder in one view - zooming out as far as that takes - not just to centre
  // on the person whose button was pressed. The pressed responder's own position
  // stays as the fallback for a map that cannot frame, or a case with no location.
  useEffect(() => {
    if (!pendingFocusUnitId) {
      return;
    }
    const target = resolveFocusTarget(pendingFocusUnitId, staff);
    if (target) {
      const dockWidth = dockedCardsWidthPx({
        isCasePanelOpen,
        isCasePanelCollapsed,
        // The pressed responder's Staff Panel opens beside the Case Panel.
        hasStaffCard: true
      });
      focusNonceRef.current += 1;
      setFocusRequest({
        ...target,
        zoom: RESPONDER_FOCUS_ZOOM,
        nonce: focusNonceRef.current,
        framePoints: collectFramePoints(
          value,
          assignment.assignedUnitIds,
          staff,
          pendingFocusUnitId
        ),
        insets: {
          left: Math.max(dockWidth, 0) + FRAME_MARGIN_PX,
          top: FRAME_TOP_INSET_PX,
          right: FRAME_MARGIN_PX,
          bottom: FRAME_BOTTOM_INSET_PX
        }
      });
      setPendingFocusUnitId(null);
      return;
    }
    if (isLoaded) {
      setPendingFocusUnitId(null);
    }
  }, [
    pendingFocusUnitId,
    staff,
    isLoaded,
    value,
    assignment.assignedUnitIds,
    isCasePanelOpen,
    isCasePanelCollapsed
  ]);

  // Falls back to null when the selected officer drops out of the list (e.g. a
  // refresh no longer returns them, or the filter now hides them), which closes
  // the panel on its own.
  const selectedMarker = useMemo(
    () => displayedStaff.find((marker) => marker.unitId === selectedStaffId) ?? null,
    [displayedStaff, selectedStaffId]
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
      .map((unitId) => displayedStaff.find((marker) => marker.unitId === unitId))
      .filter((marker): marker is StaffMarker => Boolean(marker));
  }, [selection, displayedStaff]);

  // The officer -> case driving route. Lives here, not in a section component,
  // for the same reason `selection` does: the state has to survive an accordion
  // section collapsing, and it has to be derived from - not merely reset on -
  // every selection change, so a stale polyline can never survive a reselect.
  const { routeState, canSolve: canSolveRoute, cooldownSeconds, solve: solveRoute } = useCaseRoute({
    marker: selectedMarker,
    caseLocation: value ?? null
  });

  // What the map draws for that route.
  //
  // Carries the ENDPOINTS as well as the solved line, because the two providers
  // get their geometry from opposite directions: ArcGIS solves through a service
  // and returns a polyline, while Longdo's router returns metrics only and its
  // map re-solves from the endpoints to draw (see RouteOverlay in mapTypes.ts).
  // Memoised so a Longdo map can tell "the same route re-rendered" from "a new
  // route to solve" by identity.
  const routeOverlay = useMemo<RouteOverlay | null>(() => {
    if (routeState.status !== "ready" || !selectedMarker || !value) {
      return null;
    }
    return {
      from: { latitude: selectedMarker.latitude, longitude: selectedMarker.longitude },
      to: { latitude: value.latitude, longitude: value.longitude },
      path: routeState.result.geometry
    };
  }, [routeState, selectedMarker, value]);

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
  //
  // Both maps get the control; the inline one gets the compact form (icon and
  // count, no refresh), which shows the markers and nothing else.
  const renderToolbarSlot = useCallback(
    ({ isExpanded }: MapSlotContext) => {
      return (
        <PermissionGate permission={STAFF_LAYER_PERMISSION}>
          <StaffMapControls
            compact={!isExpanded}
            filterMode={staffFilterMode}
            onFilterModeChange={setStaffFilterMode}
            isActive={isStaffVisible}
            onToggle={handleToggle}
            onRefresh={refresh}
            canRefresh={canRefresh}
            isLoading={isLoading}
            count={displayedStaff.length}
            notice={notice}
          />
        </PermissionGate>
      );
    },
    [
      canRefresh,
      displayedStaff.length,
      handleToggle,
      isLoading,
      isStaffVisible,
      notice,
      refresh,
      staffFilterMode
    ]
  );

  // The staff card for the current selection, or null. At most one, by
  // construction: a selection is either one officer or one group, never both.
  const renderStaffCard = useCallback(() => {
    if (selection?.type === "group" && groupMarkers.length > 0) {
      return (
        <StaffGroupPanel
          markers={groupMarkers}
          onSelect={handlePickFromGroup}
          onClose={clearSelection}
          assignedUnitStatusById={assignment.assignedUnitStatusById}
          clusterRoutes={clusterRoutes}
          className={CARD_CLASS}
        />
      );
    }
    if (!selectedMarker || !sectionContext) {
      return null;
    }
    return (
      <StaffDetailPanel
        marker={selectedMarker}
        onClose={clearSelection}
        ctx={sectionContext}
        onBack={groupOrigin ? handleBackToGroup : undefined}
        backCount={groupOrigin?.length}
        className={CARD_CLASS}
      />
    );
  }, [
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
  ]);

  const renderOverlaySlot = useCallback(
    ({ isExpanded }: MapSlotContext) => {
      // Both cards are large-map only. The boundary picker sits on the opposite
      // edge and is rendered by BoundaryMapField.
      if (!isExpanded) {
        return null;
      }
      const staffCard = renderStaffCard();
      if (!isCasePanelOpen && !staffCard) {
        return null;
      }

      // The Case Panel and the staff card share ONE dock, left to right, instead
      // of each anchoring itself: two absolutely positioned cards at the same
      // `left-2` would sit on top of each other, and a hard-coded offset for the
      // second would have to be kept in step with the first's width. In a flex
      // row they cannot overlap whatever their widths become.
      //
      // The dock, not the cards, sets the height budget (below the search box, an
      // 8px gap at the bottom). A second constraint on a card that competed with
      // it would let the card overflow the map, where the clipped part becomes
      // unreachable by scrolling.
      return (
        <PermissionGate permission={STAFF_LAYER_PERMISSION}>
          <div className={CARD_DOCK_CLASS}>
            {isCasePanelOpen && (
              <CasePanel
                caseData={caseData}
                assignedUnits={assignment.assignedUnits}
                staff={staff}
                isStaffLoaded={isLoaded}
                selectedUnitId={selectedStaffId}
                onFocusResponder={handleFocusResponder}
                onRequestCaseDetails={assignment.onRequestCaseDetails}
                onClose={closeCasePanel}
                isCollapsed={isCasePanelCollapsed}
                onToggleCollapsed={toggleCasePanelCollapsed}
                className={CARD_CLASS}
              />
            )}
            {staffCard}
          </div>
        </PermissionGate>
      );
    },
    [
      assignment.assignedUnits,
      assignment.onRequestCaseDetails,
      caseData,
      closeCasePanel,
      handleFocusResponder,
      isCasePanelCollapsed,
      isCasePanelOpen,
      isLoaded,
      renderStaffCard,
      selectedStaffId,
      staff,
      toggleCasePanelCollapsed
    ]
  );

  return (
    <BoundaryMapField
      value={value}
      onSelect={onSelect}
      onError={onError}
      address={address}
      readOnly={readOnly}
      // Read-only map, but a dispatcher still needs to look around: selecting a
      // result moves the view without touching the case location. Large map
      // only - the box is nearly as wide as the inline map.
      searchMode="expanded-only"
      height={height}
      className={className}
      showPlaceButton
      showDeviceButton
      incidentRadius={incidentRadius}
      manualOnly={manualOnly}
      authorizedDistrictIds={authorizedDistrictIds}
      autoShowDistrictCode={autoShowDistrictCode}
      staff={displayedStaff}
      showStaff={isStaffLayerOn}
      staffConnectors={staffConnectors}
      selectedStaffId={selectedStaffId}
      onStaffSelect={handleStaffSelect}
      // Same gating as the staff layer: large-map only, and only while a
      // result actually exists to draw - a selection change or a failed solve
      // already collapses `routeState` back to something with no result.
      route={routeOverlay}
      showRoute={isExpandedStaffLayerOn && routeState.status === "ready"}
      // Same gating again, plus the operator's own toggle: a trail belongs to one
      // selected officer, so there is nothing to draw without a selection.
      trail={selectedTrail}
      showTrail={isExpandedStaffLayerOn && isTrailVisible && Boolean(selectedStaffId)}
      // Clicking the incident pin opens the Case Panel; "focus" on one of its
      // responders is answered with a camera move.
      onIncidentSelect={handleIncidentSelect}
      focusRequest={focusRequest}
      extraOverlaySlot={renderOverlaySlot}
      extraToolbarSlot={renderToolbarSlot}
      onExpandedChange={handleExpandedChange}
    />
  );
}

export const CaseStaffMapField = memo(CaseStaffMapFieldBase);
CaseStaffMapField.displayName = "CaseStaffMapField";

export default CaseStaffMapField;
