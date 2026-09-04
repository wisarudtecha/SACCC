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
import type { TrailPoint } from "./staff/useStaffTrails";
import { Modal } from "@/core/components/ui/modal";
import { useTranslation } from "@/core/hooks/useTranslation";
import AddressMap from "./AddressMap";
import { BasemapOptionId, readBasemapPreference, writeBasemapPreference } from "./basemaps";
import type {
  AddressResult,
  IncidentRadiusOverlay,
  MapLatLon,
  MapSearchMode,
  MapSlot,
  MapViewpoint,
  RouteOverlay
} from "./mapTypes";
import type { StaffMarker, StaffSelection } from "./staff/staffTypes";
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
  /** Free-floating controls over the map; the callee positions them. */
  overlaySlot?: MapSlot;
  /** Controls for the map's top-right toolbar row. */
  toolbarSlot?: MapSlot;
  /**
   * Fires when the large map opens or closes. Callers that render controls in
   * the expanded map only use this to drop the state behind them.
   */
  onExpandedChange?: (isExpanded: boolean) => void;
  className?: string;
}

// Sized to sit inside the 85vh modal shell with room for its close button.
const MODAL_MAP_HEIGHT = "calc(85vh - 5rem)";

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
  route,
  showRoute = false,
  trail,
  showTrail = false,
  boundaries,
  sketch,
  incidentRadius,
  overlaySlot,
  toolbarSlot,
  onExpandedChange,
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
        route={route}
        showRoute={showRoute}
        trail={trail}
        showTrail={showTrail}
        boundaries={boundaries}
        sketch={inlineSketch}
        incidentRadius={incidentRadius}
        // The inline map is 220-320px; a row of labelled controls covers too
        // much of it. The expanded map below keeps its labels.
        compactControls
        overlaySlot={overlaySlot?.({ isExpanded: false })}
        toolbarSlot={toolbarSlot?.({ isExpanded: false })}
        onExpand={openExpanded}
      />

      <Modal
        isOpen={isExpanded}
        onClose={closeExpanded}
        className="w-[90vw] max-w-[90vw] h-[90vh] p-4"
      >
        <div className="pt-16">
          <span className="absolute top-6 left-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
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
            route={route}
            showRoute={showRoute}
            trail={trail}
            showTrail={showTrail}
            boundaries={boundaries}
            sketch={sketch}
            incidentRadius={incidentRadius}
            viewpointRef={expandedViewpointRef}
            address={address}
            showLocationInfo
            overlaySlot={overlaySlot?.({ isExpanded: true })}
            toolbarSlot={toolbarSlot?.({ isExpanded: true })}
          />
        </div>
      </Modal>
    </div>
  );
}

export const AddressMapField = memo(AddressMapFieldBase);
AddressMapField.displayName = "AddressMapField";

export default AddressMapField;
