// Inline map + "expand to large modal" control.
//
// This is the component feature code should use (rather than a provider's map
// directly), so the expand behaviour is written once and shared by the editable
// case form and the read-only case detail / preview views.
//
// Provider-agnostic on purpose: everything it owns - the modal, the shared
// basemap choice, the restored viewpoint - is the same whichever SDK draws the
// tiles, and it only ever speaks AddressMapProps (see mapTypes.ts). Which SDK
// actually draws is decided one level down, in AddressMap.
//
// The modal renders a SECOND map instance. It only exists while open - Modal
// returns null when closed - so there is no idle second map.
import { memo, useCallback, useMemo, useRef, useState } from "react";
import { X } from "lucide-react";
import type { TrailPoint } from "./staff/useStaffTrails";
import { Modal } from "@/core/components/ui/modal";
import { useTranslation } from "@/core/hooks/useTranslation";
import AddressMap from "./AddressMap";
import { BasemapOptionId, readBasemapPreference, writeBasemapPreference } from "./basemaps";
import type {
  AddressResult,
  IncidentRadiusOverlay,
  MapAnchoredOverlay,
  MapBounds,
  MapFocusRequest,
  MapLatLon,
  MapSearchMode,
  MapSlot,
  MapViewpoint,
  RouteOverlay,
  StaffConnector
} from "./mapTypes";
import type { Language } from "@/core/config/i18n";
import type { StaffMarker, StaffSelection } from "./staff/staffTypes";
import type { PlaceMarker, PlaceSelection } from "./place/placeTypes";
import type { DeviceMarker, DeviceSelection } from "./device/deviceTypes";
import type { BoundaryLayerConfig } from "./boundaries/boundaryTypes";
import type { BoundarySketchConfig } from "./sketch/sketchTypes";

interface AddressMapFieldProps {
  value?: MapLatLon | null;
  onSelect: (result: AddressResult) => void;
  onError?: (message: string) => void;
  /**
   * Free-text location description, shown together with `value`'s coordinates
   * on the expanded map only - see AddressMapProps' `showLocationInfo`.
   */
  address?: string;
  /** View-only: clicks don't change the location. */
  readOnly?: boolean;
  /** Defaults to "always" for an editable map, "never" for a view-only one. */
  searchMode?: MapSearchMode;
  /** Height of the inline (non-expanded) map. */
  height?: number | string;
  /**
   * Staff overlay, forwarded verbatim to both map instances. This component
   * only plumbs it through - the state must be owned above so that expanding
   * doesn't reset the layer or lose the selected officer.
   */
  staff?: readonly StaffMarker[];
  showStaff?: boolean;
  selectedStaffId?: string | null;
  onStaffSelect?: (selection: StaffSelection | null) => void;
  /** Drag-to-assign and anchored popups, forwarded verbatim - see AddressMapProps. */
  draggableStaffIds?: ReadonlySet<string>;
  onStaffDropOnIncident?: (unitId: string) => void;
  anchoredOverlays?: readonly MapAnchoredOverlay[];
  /**
   * Place overlay (org-curated facilities), forwarded verbatim to both map
   * instances - same contract as `staff`. Read-only: `onPlaceSelect` drives the
   * caller's own info popup, never a case write (Q1).
   */
  places?: readonly PlaceMarker[];
  showPlace?: boolean;
  selectedPlaceId?: string | null;
  onPlaceSelect?: (selection: PlaceSelection | null) => void;
  /**
   * Device overlay (viewport-scoped IoT devices), forwarded verbatim to both map
   * instances - same contract as `staff`. `onDeviceSelect` reports a marker
   * click; the case write ("link") lives above in useDeviceLayer.
   * `onBoundsChange` lets that hook refetch for the new viewport.
   */
  devices?: readonly DeviceMarker[];
  showDevice?: boolean;
  selectedDeviceId?: string | null;
  onDeviceSelect?: (selection: DeviceSelection | null) => void;
  onBoundsChange?: (bounds: MapBounds) => void;
  /**
   * Incident-pin click and camera-focus command, forwarded verbatim to both map
   * instances - see AddressMapProps.onIncidentSelect / focusRequest.
   */
  onIncidentSelect?: () => void;
  focusRequest?: MapFocusRequest | null;
  /**
   * Straight dashed staff -> incident lines, forwarded verbatim to both map
   * instances - see AddressMapProps.staffConnectors.
   */
  staffConnectors?: readonly StaffConnector[];
  /**
   * Route overlay, forwarded verbatim to both map instances - same contract as
   * `staff`.
   */
  route?: RouteOverlay | null;
  showRoute?: boolean;
  /**
   * Breadcrumb overlay, forwarded verbatim to both map instances - same contract
   * as `route`.
   */
  trail?: readonly TrailPoint[] | null;
  showTrail?: boolean;
  /**
   * Boundary overlay, forwarded verbatim to both map instances. Like `staff`
   * this component only plumbs it through - the state is owned above so that
   * expanding does not reset the layers or lose the confirmed selection.
   */
  boundaries?: BoundaryLayerConfig;
  /**
   * Editable boundary polygon, forwarded to both map instances - same contract
   * as `boundaries`, with one difference this component enforces itself: only
   * ONE of the two views may run a gesture, see `inlineSketch` below.
   */
  sketch?: BoundarySketchConfig;
  /**
   * No-match fallback circle, forwarded verbatim to both map instances - same
   * contract as `boundaries`. Set only when the incident point matched no single
   * Service Center polygon; null otherwise.
   */
  incidentRadius?: IncidentRadiusOverlay | null;
  /**
   * Map-local theme/language override, forwarded verbatim to both map
   * instances - see AddressMapProps.mapTheme/onMapThemeChange for the
   * contract. State is owned above (e.g. BoundaryMapField's
   * useMapThemeOverride) so it survives the expanded map's remount, same as
   * `basemapId`.
   */
  mapTheme?: "light" | "dark";
  onMapThemeChange?: (theme: "light" | "dark") => void;
  mapLanguage?: Language;
  onMapLanguageChange?: (language: Language) => void;
  /** Free-floating controls over the map; the callee positions them. */
  overlaySlot?: MapSlot;
  /**
   * Controls stacked below the address/coordinates card in the bottom-left
   * column - see AddressMapProps.bottomLeftSlot.
   */
  bottomLeftSlot?: MapSlot;
  /** Controls for the map's top-right toolbar row. */
  toolbarSlot?: MapSlot;
  /**
   * Fires when the large map opens or closes. Callers that render controls in
   * the expanded map only use this to drop the state behind them.
   */
  onExpandedChange?: (isExpanded: boolean) => void;
  /**
   * Show the "expand to large map" button (and its modal). On by default. Turn
   * it OFF when this field is itself embedded in a Modal: the app's Modal is not
   * nest-safe - it fires every open modal's onClose on Escape and does not
   * depth-count the body scroll lock - so a nested expand modal would close the
   * host modal too.
   */
  showExpand?: boolean;
  className?: string;
}

// Sized to sit inside the fullscreen modal shell (100vh, minus the outer
// fullscreenPadding and the compact title/close row above the map).
const MODAL_MAP_HEIGHT = "calc(100vh - 4rem)";

function AddressMapFieldBase({
  value,
  onSelect,
  onError,
  address,
  readOnly = false,
  searchMode,
  height = 320,
  staff,
  showStaff = false,
  selectedStaffId = null,
  onStaffSelect,
  draggableStaffIds,
  onStaffDropOnIncident,
  anchoredOverlays,
  places,
  showPlace = false,
  selectedPlaceId = null,
  onPlaceSelect,
  devices,
  showDevice = false,
  selectedDeviceId = null,
  onDeviceSelect,
  onBoundsChange,
  onIncidentSelect,
  focusRequest,
  staffConnectors,
  route,
  showRoute = false,
  trail,
  showTrail = false,
  boundaries,
  sketch,
  incidentRadius,
  mapTheme,
  onMapThemeChange,
  mapLanguage,
  onMapLanguageChange,
  overlaySlot,
  bottomLeftSlot,
  toolbarSlot,
  onExpandedChange,
  showExpand = true,
  className = ""
}: AddressMapFieldProps) {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);
  // The basemap choice lives here rather than in the map component because the
  // modal renders a SECOND map: were it owned per-map, expanding would drop the
  // user back to the default basemap. Seeded from (and saved to) the stored
  // preference so it also survives navigation and reload.
  const [basemapId, setBasemapId] = useState<BasemapOptionId>(readBasemapPreference);
  // The expanded map alone: the Modal unmounts it on close, so its MapView
  // starts fresh every reopen and would otherwise always recentre on the case
  // at the default zoom. This ref lives here - same as `basemapId` - because
  // AddressMapField itself does not unmount across that close/reopen.
  const expandedViewpointRef = useRef<MapViewpoint | null>(null);

  const openExpanded = useCallback(() => {
    setIsExpanded(true);
    onExpandedChange?.(true);
  }, [onExpandedChange]);

  const closeExpanded = useCallback(() => {
    setIsExpanded(false);
    onExpandedChange?.(false);
  }, [onExpandedChange]);

  const handleBasemapChange = useCallback((id: BasemapOptionId) => {
    setBasemapId(id);
    writeBasemapPreference(id);
  }, []);

  const resolvedSearchMode: MapSearchMode = searchMode ?? (readOnly ? "never" : "always");
  const showSearchInline = resolvedSearchMode === "always";
  const showSearchExpanded = resolvedSearchMode !== "never";

  // Both flags are baked into the MapView at construction (together they decide
  // whether the Search widget exists and what selecting a result does), so key
  // each map on them to force a clean rebuild if a caller ever flips the mode in
  // place. The two instances resolve `showSearch` differently, so the key has to
  // be built per instance. `basemapId` is deliberately NOT part of it - the
  // basemap is swapped in place so that pan/zoom survive.
  const mapKey = (isSearchShown: boolean) =>
    `${readOnly ? "readonly" : "editable"}-${isSearchShown ? "search" : "nosearch"}`;

  // Both views get the sketch, but only one may act on it. While the modal is
  // open the inline map is behind it and can never receive a click, so a mode
  // of "draw" there would arm a create that no one can finish - and closing the
  // modal would drop the user back onto a map still stuck in draw mode. Pinning
  // the inline instance to "idle" for the duration is the whole fix; the
  // geometry keeps rendering either way.
  const inlineSketch = useMemo(
    () => (sketch && isExpanded ? { ...sketch, mode: "idle" as const } : sketch),
    [sketch, isExpanded]
  );

  return (
    <div className={`relative ${className}`}>
      {/* The expand button lives in the map's own toolbar row - only this
          instance gets `onExpand`, so the expanded map doesn't offer it. */}
      <AddressMap
        key={mapKey(showSearchInline)}
        value={value}
        onSelect={onSelect}
        onError={onError}
        readOnly={readOnly}
        showSearch={showSearchInline}
        height={height}
        basemapId={basemapId}
        onBasemapChange={handleBasemapChange}
        staff={staff}
        showStaff={showStaff}
        selectedStaffId={selectedStaffId}
        onStaffSelect={onStaffSelect}
        draggableStaffIds={draggableStaffIds}
        onStaffDropOnIncident={onStaffDropOnIncident}
        anchoredOverlays={anchoredOverlays}
        places={places}
        showPlace={showPlace}
        selectedPlaceId={selectedPlaceId}
        onPlaceSelect={onPlaceSelect}
        devices={devices}
        showDevice={showDevice}
        selectedDeviceId={selectedDeviceId}
        onDeviceSelect={onDeviceSelect}
        onBoundsChange={onBoundsChange}
        onIncidentSelect={onIncidentSelect}
        focusRequest={focusRequest}
        staffConnectors={staffConnectors}
        route={route}
        showRoute={showRoute}
        trail={trail}
        showTrail={showTrail}
        boundaries={boundaries}
        sketch={inlineSketch}
        incidentRadius={incidentRadius}
        mapTheme={mapTheme}
        onMapThemeChange={onMapThemeChange}
        mapLanguage={mapLanguage}
        onMapLanguageChange={onMapLanguageChange}
        // The inline map is 220-320px; a row of labelled controls covers too
        // much of it. The expanded map below keeps its labels.
        compactControls
        overlaySlot={overlaySlot?.({ isExpanded: false })}
        bottomLeftSlot={bottomLeftSlot?.({ isExpanded: false })}
        toolbarSlot={toolbarSlot?.({ isExpanded: false })}
        onExpand={showExpand ? openExpanded : undefined}
      />

      {showExpand && (
      <Modal
        isOpen={isExpanded}
        onClose={closeExpanded}
        isFullscreen
        fullscreenPadding="p-2"
        showCloseButton={false}
      >
        {/* Icon-only close button: the shared Modal's default is a padded
            circular chip, which this view wants stripped down to just the X. */}
        <button
          type="button"
          onClick={closeExpanded}
          title={t("case.display.map_expand_close")}
          aria-label={t("case.display.map_expand_close")}
          className="absolute right-3 top-3 z-[999] text-gray-500 transition-colors hover:text-gray-800 dark:text-gray-300 dark:hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>
        <div className="pt-10">
          <span className="absolute top-3 left-3 text-lg font-semibold text-gray-900 dark:text-gray-100">
            {t("case.display.map_expand")}
          </span>
          <AddressMap
            key={`${mapKey(showSearchExpanded)}-expanded`}
            value={value}
            onSelect={onSelect}
            onError={onError}
            readOnly={readOnly}
            showSearch={showSearchExpanded}
            height={MODAL_MAP_HEIGHT}
            basemapId={basemapId}
            onBasemapChange={handleBasemapChange}
            staff={staff}
            showStaff={showStaff}
            selectedStaffId={selectedStaffId}
            onStaffSelect={onStaffSelect}
            draggableStaffIds={draggableStaffIds}
            onStaffDropOnIncident={onStaffDropOnIncident}
            anchoredOverlays={anchoredOverlays}
            places={places}
            showPlace={showPlace}
            selectedPlaceId={selectedPlaceId}
            onPlaceSelect={onPlaceSelect}
            devices={devices}
            showDevice={showDevice}
            selectedDeviceId={selectedDeviceId}
            onDeviceSelect={onDeviceSelect}
            onBoundsChange={onBoundsChange}
            onIncidentSelect={onIncidentSelect}
            focusRequest={focusRequest}
            staffConnectors={staffConnectors}
            route={route}
            showRoute={showRoute}
            trail={trail}
            showTrail={showTrail}
            boundaries={boundaries}
            sketch={sketch}
            incidentRadius={incidentRadius}
            mapTheme={mapTheme}
            onMapThemeChange={onMapThemeChange}
            mapLanguage={mapLanguage}
            onMapLanguageChange={onMapLanguageChange}
            viewpointRef={expandedViewpointRef}
            address={address}
            showLocationInfo
            overlaySlot={overlaySlot?.({ isExpanded: true })}
            bottomLeftSlot={bottomLeftSlot?.({ isExpanded: true })}
            toolbarSlot={toolbarSlot?.({ isExpanded: true })}
          />
        </div>
      </Modal>
      )}
    </div>
  );
}

export const AddressMapField = memo(AddressMapFieldBase);
AddressMapField.displayName = "AddressMapField";

export default AddressMapField;
