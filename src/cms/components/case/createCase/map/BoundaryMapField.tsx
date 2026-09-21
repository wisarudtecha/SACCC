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
import { memo, useCallback, useEffect } from "react";
import type { TrailPoint } from "./staff/useStaffTrails";
import { useTheme } from "@/core/context/ThemeContext";
import AddressMapField from "./AddressMapField";
import type {
  AddressResult,
  IncidentRadiusOverlay,
  MapFocusRequest,
  MapLatLon,
  MapSlot,
  MapSlotContext,
  RouteOverlay,
  StaffConnector
} from "./mapTypes";
import MapPlaceButton from "./MapPlaceButton";
import BoundaryPickerPanel from "./boundaries/BoundaryPickerPanel";
import BoundaryToolbar from "./boundaries/BoundaryToolbar";
import { useBoundarySelection } from "./boundaries/useBoundarySelection";
import PlaceInfoPopup from "./place/PlaceInfoPopup";
import { usePlaceLayer } from "./place/usePlaceLayer";
import MapDeviceButton from "./device/MapDeviceButton";
import DeviceInfoPopup from "./device/DeviceInfoPopup";
import { useDeviceLayer } from "./device/useDeviceLayer";
import { useMapThemeOverride } from "./useMapThemeOverride";
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
  /** Show the Place layer control (org-curated facilities). */
  showPlaceButton?: boolean;
  /** Show the Device layer control (viewport-scoped IoT devices). */
  showDeviceButton?: boolean;
  /**
   * Link the selected device to the case. Only the create form passes this; when
   * omitted the Device info popup is read-only (no Link/Unlink buttons). The
   * argument is the device id, or null on unlink.
   */
  onDeviceSelect?: (deviceId: string | null) => void;
  /** The case's current `iotDevice`, so the popup can show the linked state. */
  linkedDeviceId?: string | null;
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
  /** Incident-pin click and camera-focus command, forwarded untouched for CaseStaffMapField. */
  onIncidentSelect?: () => void;
  focusRequest?: MapFocusRequest | null;
  /** Straight dashed staff -> incident lines, forwarded untouched for CaseStaffMapField. */
  staffConnectors?: readonly StaffConnector[];
  /**
   * No-match fallback circle around the incident pin, forwarded untouched. Set
   * by CaseLocationSection only when the incident coordinate matched no single
   * Service Center polygon.
   */
  incidentRadius?: IncidentRadiusOverlay | null;
  /** Caller's own controls, rendered to the right of the boundary group. */
  extraToolbarSlot?: MapSlot;
  /** Caller's own overlay cards. The picker owns the top-right corner. */
  extraOverlaySlot?: MapSlot;
  onExpandedChange?: (isExpanded: boolean) => void;
  /**
   * Start every boundary level unselected, and every level but District
   * hidden, instead of the historical one-level auto-default. The case
   * create/assignment screens pass this so polygons only appear once the
   * dispatcher explicitly asks for them - District starts as the active
   * level, but with nothing checked under it yet, so nothing draws until a
   * selection is made. Other consumers (e.g. the read-only Case Preview map)
   * omit it and keep today's behavior.
   */
  manualOnly?: boolean;
  /**
   * The dispatcher's authorized District ids. Narrows the boundary picker to
   * those districts plus the provinces/countries they roll up into. Omit or
   * pass empty for no restriction (the create screen has no notion of "area
   * of responsibility").
   */
  authorizedDistrictIds?: readonly string[];
  /**
   * A resolved Service Center match's district code. When set, forces the
   * District level on and adds this code to the selection, on top of
   * whatever the user already picked - the case-assignment auto-show
   * exception to `manualOnly` (only the assignment/edit screen passes this).
   */
  autoShowDistrictCode?: string | null;
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
  showDeviceButton = false,
  onDeviceSelect,
  linkedDeviceId = null,
  staff,
  showStaff = false,
  selectedStaffId = null,
  onStaffSelect,
  route,
  showRoute = false,
  trail,
  showTrail = false,
  onIncidentSelect,
  focusRequest,
  staffConnectors,
  incidentRadius,
  extraToolbarSlot,
  extraOverlaySlot,
  onExpandedChange,
  manualOnly = false,
  authorizedDistrictIds,
  autoShowDistrictCode = null
}: BoundaryMapFieldProps) {
  const { theme } = useTheme();
  const isDarkTheme = theme === "dark";
  const { effectiveTheme, effectiveLanguage, setThemeOverride, setLanguageOverride } =
    useMapThemeOverride();
  const boundary = useBoundarySelection({ startAllHidden: manualOnly, authorizedDistrictIds });

  const { showDistrict } = boundary;
  // The one exception to manual-only display: a resolved Service Center match
  // auto-shows its district even though nothing else was turned on (REQ 4).
  useEffect(() => {
    if (autoShowDistrictCode) {
      showDistrict(autoShowDistrictCode);
    }
  }, [autoShowDistrictCode, showDistrict]);
  // Place layer state. Owned here (not in AddressMapField) for the same reason as
  // the boundary state: AddressMapField renders a second MapView when expanded,
  // so the layer's toggle, filters and selection have to survive that. Being the
  // one component all three case-map surfaces go through, none of them need to
  // know the Place layer exists. Gated on `showPlaceButton`, which every surface
  // that wants Place already passes.
  const {
    places: placeMarkers,
    showPlace,
    toggleShowPlace,
    categoryVisibility: placeCategoryVisibility,
    toggleCategory: togglePlaceCategory,
    selectedPlace,
    selectedPlaceId,
    selectPlace,
    notice: placeNotice
  } = usePlaceLayer();
  const isPlaceLayerOn = showPlaceButton && showPlace;

  // Device layer state. Owned here for the same reason as the Place / boundary
  // state (a second MapView is mounted on expand). Selecting a marker only opens
  // the popup; the popup's Link button is the only writer of `iotDevice`, via
  // the `onDeviceSelect` prop this component received from the surface.
  const {
    devices: deviceMarkers,
    showDevice,
    toggleShowDevice,
    categoryVisibility: deviceCategoryVisibility,
    toggleCategory: toggleDeviceCategory,
    selectedDevice,
    selectedDeviceId: selectedDeviceMarkerId,
    selectDevice,
    linkSelectedDevice,
    unlinkDevice,
    linkedDeviceId: currentLinkedDeviceId,
    reportBounds: reportDeviceBounds,
    notice: deviceNotice
  } = useDeviceLayer({ onSelect: onDeviceSelect, linkedDeviceId });
  const isDeviceLayerOn = showDeviceButton && showDevice;

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
        {/* Boundary + Place are both layer toggles - keep them as one tight
            cluster (`gap-1`), set apart from staff / basemap / expand by the
            toolbar row's own `gap-2`. */}
        <div className="flex items-start gap-1">
          <BoundaryToolbar
            visibility={boundary.visibility}
            onToggleLevel={boundary.toggleLevel}
            onOpenPicker={boundary.openPanel}
            isPickerOpen={boundary.isPanelOpen}
            showPicker={context.isExpanded}
            asDropdown={!context.isExpanded}
          />
          {/* The master toggle works at both sizes; only the category
              checklist (a dropdown that needs real room) is large-map-only. */}
          {showPlaceButton && (
            <MapPlaceButton
              isActive={showPlace}
              onToggle={toggleShowPlace}
              categoryVisibility={placeCategoryVisibility}
              onToggleCategory={togglePlaceCategory}
              notice={placeNotice}
              compact={!context.isExpanded}
              showCategoryDropdown={context.isExpanded}
            />
          )}
          {showDeviceButton && (
            <MapDeviceButton
              isActive={showDevice}
              onToggle={toggleShowDevice}
              categoryVisibility={deviceCategoryVisibility}
              onToggleCategory={toggleDeviceCategory}
              notice={deviceNotice}
              compact={!context.isExpanded}
              showCategoryDropdown={context.isExpanded}
            />
          )}
        </div>
        {extraToolbarSlot?.(context)}
      </>
    ),
    [
      boundary.visibility,
      boundary.toggleLevel,
      boundary.openPanel,
      boundary.isPanelOpen,
      showPlaceButton,
      showPlace,
      toggleShowPlace,
      placeCategoryVisibility,
      togglePlaceCategory,
      placeNotice,
      showDeviceButton,
      showDevice,
      toggleShowDevice,
      deviceCategoryVisibility,
      toggleDeviceCategory,
      deviceNotice,
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

  const renderBottomLeftSlot = useCallback(
    (context: MapSlotContext) => (
      <>
        {/* Stacks below the address/coordinates card the caller already
            renders above this slot (see AddressMapProps.bottomLeftSlot).
            Read-only: closing it writes nothing to the case (Q1).
            Expanded-only: a 220px small map has nowhere for this card to go
            without covering the map's other controls. The click that
            selected it still highlights the marker on the small map - only
            the popup's render is deferred until the map is expanded. */}
        {context.isExpanded && showPlaceButton && selectedPlace && (
          <PlaceInfoPopup
            place={selectedPlace}
            onClose={() => selectPlace(null)}
            className="z-20 max-w-[16rem]"
          />
        )}
        {/* Both selected at once is a rare edge case; now that this is a flex
            child rather than an absolutely-positioned overlap, both simply
            stack instead of one hiding the other. */}
        {context.isExpanded && showDeviceButton && selectedDevice && (
          <DeviceInfoPopup
            device={selectedDevice}
            canLink={Boolean(onDeviceSelect)}
            isLinked={selectedDevice.deviceId === currentLinkedDeviceId}
            onClose={() => selectDevice(null)}
            onLink={linkSelectedDevice}
            onUnlink={unlinkDevice}
            className="z-20 max-w-[16rem]"
          />
        )}
      </>
    ),
    [
      showPlaceButton,
      selectedPlace,
      selectPlace,
      showDeviceButton,
      onDeviceSelect,
      selectedDevice,
      currentLinkedDeviceId,
      selectDevice,
      linkSelectedDevice,
      unlinkDevice
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
      places={placeMarkers}
      showPlace={isPlaceLayerOn}
      selectedPlaceId={selectedPlaceId}
      onPlaceSelect={selectPlace}
      devices={deviceMarkers}
      showDevice={isDeviceLayerOn}
      selectedDeviceId={selectedDeviceMarkerId}
      onDeviceSelect={selectDevice}
      onBoundsChange={reportDeviceBounds}
      route={route}
      showRoute={showRoute}
      trail={trail}
      showTrail={showTrail}
      onIncidentSelect={onIncidentSelect}
      focusRequest={focusRequest}
      staffConnectors={staffConnectors}
      incidentRadius={incidentRadius}
      boundaries={boundary.boundaries}
      mapTheme={effectiveTheme}
      onMapThemeChange={setThemeOverride}
      mapLanguage={effectiveLanguage}
      onMapLanguageChange={setLanguageOverride}
      toolbarSlot={renderToolbarSlot}
      overlaySlot={renderOverlaySlot}
      bottomLeftSlot={renderBottomLeftSlot}
      onExpandedChange={handleExpandedChange}
    />
  );
}

export const BoundaryMapField = memo(BoundaryMapFieldBase);
BoundaryMapField.displayName = "BoundaryMapField";

export default BoundaryMapField;
