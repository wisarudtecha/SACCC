// AddressMapField with the administrative boundary controls attached.
//
// This is the component feature code should use. Three surfaces need boundaries
// now - the case creation form, the case command/detail map, and the small map
// in the Case Preview modal - and the rules for what renders where are not
// trivial enough to repeat three times:
//
//   small map     level toggles, collapsed behind one icon; Place button in
//                 compact form; NO area picker (its panel would cover a 220px
//                 map, and there is nowhere for it to go)
//   expanded map  the same toggles laid out, plus the picker and its panel
//
// Collapsing the picker away on small maps is safe because every area starts
// selected: the toggles alone are enough to control what is drawn, and refining
// WHICH areas is a large-map job.
//
// State lives here rather than inside AddressMapField because that
// component renders a SECOND MapView when expanded - exactly the reason
// CaseStaffMapField owns the staff state instead of letting the map own it.
import { memo, useCallback } from "react";
import type { TrailPoint } from "./staff/useStaffTrails";
import { useTheme } from "@/core/context/ThemeContext";
import AddressMapField from "./AddressMapField";
import type { AddressResult, MapLatLon, MapSlot, MapSlotContext, RouteOverlay } from "./mapTypes";
import MapPlaceButton from "./MapPlaceButton";
import BoundaryPickerPanel from "./boundaries/BoundaryPickerPanel";
import BoundaryToolbar from "./boundaries/BoundaryToolbar";
import { useBoundarySelection } from "./boundaries/useBoundarySelection";
import type { StaffMarker, StaffSelection } from "./staff/staffTypes";

interface BoundaryMapFieldProps {
  value?: MapLatLon | null;
  onSelect: (result: AddressResult) => void;
  onError?: (message: string) => void;
  /** Free-text location description, forwarded to AddressMapField. */
  address?: string;
  readOnly?: boolean;
  searchMode?: "always" | "expanded-only" | "never";
  height?: number | string;
  className?: string;
  /** Show the (disabled, in-development) Place control. */
  showPlaceButton?: boolean;
  /** Staff overlay, forwarded untouched for CaseStaffMapField. */
  staff?: readonly StaffMarker[];
  showStaff?: boolean;
  selectedStaffId?: string | null;
  onStaffSelect?: (selection: StaffSelection | null) => void;
  /** Route overlay, forwarded untouched for CaseStaffMapField. */
  route?: RouteOverlay | null;
  showRoute?: boolean;
  /** Breadcrumb overlay, forwarded untouched for CaseStaffMapField. */
  trail?: readonly TrailPoint[] | null;
  showTrail?: boolean;
  /** Caller's own controls, rendered to the right of the boundary group. */
  extraToolbarSlot?: MapSlot;
  /** Caller's own overlay cards. The picker owns the top-right corner. */
  extraOverlaySlot?: MapSlot;
  onExpandedChange?: (isExpanded: boolean) => void;
}

function BoundaryMapFieldBase({
  value,
  onSelect,
  onError,
  address,
  readOnly = false,
  searchMode,
  height = 320,
  className = "",
  showPlaceButton = false,
  staff,
  showStaff = false,
  selectedStaffId = null,
  onStaffSelect,
  route,
  showRoute = false,
  trail,
  showTrail = false,
  extraToolbarSlot,
  extraOverlaySlot,
  onExpandedChange
}: BoundaryMapFieldProps) {
  const { theme } = useTheme();
  const isDarkTheme = theme === "dark";
  const boundary = useBoundarySelection();

  const { closePanel } = boundary;
  // Closing the large map has to take the picker with it. The panel only renders
  // while expanded, so a picker left open would otherwise stay "open" in state -
  // invisible, un-closeable, and still holding a half-edited draft.
  const handleExpandedChange = useCallback(
    (isExpanded: boolean) => {
      if (!isExpanded) {
        closePanel();
      }
      onExpandedChange?.(isExpanded);
    },
    [closePanel, onExpandedChange]
  );

  const renderToolbarSlot = useCallback(
    (context: MapSlotContext) => (
      <>
        <BoundaryToolbar
          visibility={boundary.visibility}
          onToggleLevel={boundary.toggleLevel}
          onOpenPicker={boundary.openPanel}
          isPickerOpen={boundary.isPanelOpen}
          showPicker={context.isExpanded}
          collapsible={!context.isExpanded}
        />
        {showPlaceButton && <MapPlaceButton compact={!context.isExpanded} />}
        {extraToolbarSlot?.(context)}
      </>
    ),
    [
      boundary.visibility,
      boundary.toggleLevel,
      boundary.openPanel,
      boundary.isPanelOpen,
      showPlaceButton,
      extraToolbarSlot
    ]
  );

  const renderOverlaySlot = useCallback(
    (context: MapSlotContext) => (
      <>
        {/* Right edge, under the trigger that opens it. Staff cards own the left
            edge, so the two never compete for the same space. */}
        {context.isExpanded && boundary.isPanelOpen && (
          <BoundaryPickerPanel
            options={boundary.options}
            draft={boundary.draft}
            onToggleCode={boundary.toggleCode}
            onSetCodes={boundary.setLevelCodes}
            isDirty={boundary.isDirty}
            isLoading={boundary.isLoading}
            onApply={boundary.apply}
            onCancel={boundary.cancel}
            isDarkTheme={isDarkTheme}
            className="absolute right-2 top-12 z-20 max-h-[calc(100%-3.5rem)]"
          />
        )}
        {extraOverlaySlot?.(context)}
      </>
    ),
    [
      boundary.isPanelOpen,
      boundary.options,
      boundary.draft,
      boundary.toggleCode,
      boundary.setLevelCodes,
      boundary.isDirty,
      boundary.isLoading,
      boundary.apply,
      boundary.cancel,
      isDarkTheme,
      extraOverlaySlot
    ]
  );

  return (
    <AddressMapField
      value={value}
      onSelect={onSelect}
      onError={onError}
      address={address}
      readOnly={readOnly}
      searchMode={searchMode}
      height={height}
      className={className}
      staff={staff}
      showStaff={showStaff}
      selectedStaffId={selectedStaffId}
      onStaffSelect={onStaffSelect}
      route={route}
      showRoute={showRoute}
      trail={trail}
      showTrail={showTrail}
      boundaries={boundary.boundaries}
      toolbarSlot={renderToolbarSlot}
      overlaySlot={renderOverlaySlot}
      onExpandedChange={handleExpandedChange}
    />
  );
}

export const BoundaryMapField = memo(BoundaryMapFieldBase);
BoundaryMapField.displayName = "BoundaryMapField";

export default BoundaryMapField;
