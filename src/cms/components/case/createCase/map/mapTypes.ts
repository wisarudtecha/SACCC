// The contract every map provider implements, and the vocabulary the surfaces
// around it speak.
//
// Kept free of any map SDK import, for the same reason boundaryTypes.ts and
// sketchTypes.ts are: these types are referenced by the case form, the case
// detail view and the admin area editor, none of which should drag a mapping
// SDK into the chunk they live in. Only a provider implementation imports the
// SDK itself.
//
// Everything here was previously declared inside ArcgisAddressMap.tsx /
// ArcgisAddressMapField.tsx under `Arcgis*` names. It moved out - unchanged in
// meaning - when a second provider (Longdo) arrived and made those names wrong.
import type { ReactNode } from "react";
import type { MapProviderId } from "@/core/config/api";
import type { Language } from "@/core/config/i18n";
import type { BasemapOptionId } from "./basemaps";
import type { BoundaryLayerConfig } from "./boundaries/boundaryTypes";
import type { BoundarySketchConfig } from "./sketch/sketchTypes";
import type { StaffMarker, StaffSelection } from "./staff/staffTypes";
import type { TrailPoint } from "./staff/useStaffTrails";
import type { PlaceMarker, PlaceSelection } from "./place/placeTypes";
import type { DeviceMarker, DeviceSelection } from "./device/deviceTypes";

export type { MapProviderId };

export interface MapLatLon {
  latitude: number;
  longitude: number;
}

/** Camera position captured/restored via `viewpointRef` - see its doc below. */
export interface MapViewpoint {
  center: [number, number];
  zoom: number;
}

export interface AddressResult extends MapLatLon {
  address: string;
}

/**
 * The map's current visible extent, in WGS84 degrees. Reported (debounced)
 * whenever the view settles - see `AddressMapProps.onBoundsChange`. Kept here,
 * structurally identical to `DeviceBoundsRequest` in `@/cms/types/deviceIoT`,
 * so this SDK-/entity-free file does not have to import from the entity layer.
 */
export interface MapBounds {
  minLat: number;
  minLon: number;
  maxLat: number;
  maxLon: number;
}

/**
 * A route's shape, in GeoJSON coordinate order ([lng, lat]) and WGS84 degrees.
 *
 * Deliberately a plain data shape rather than a provider's polyline class: the
 * route is SOLVED by one service and DRAWN by another, and those two are not
 * necessarily the same vendor. Each provider's layer builds its own geometry
 * from this. Identity is meaningful - the layer hooks use it to tell "the same
 * route re-rendered" from "a new route", so pass the same object through rather
 * than rebuilding it per render.
 */
export interface RoutePath {
  paths: readonly (readonly [number, number])[][];
}

/**
 * The route overlay: what to draw, and - when the provider has to solve it
 * itself - what to draw it BETWEEN.
 *
 * The endpoints are here rather than just the path because the two providers
 * get their geometry from opposite directions. ArcGIS solves the route through
 * a service and hands back a polyline, so `path` is everything the map needs.
 * Longdo's routing API returns turn-by-turn text with distances and NO
 * geometry at all, so its map has to hand the endpoints to the SDK's own router
 * (`map.Route`), which solves and draws the line itself. Carrying both keeps
 * each provider able to draw the same route from what it actually has.
 */
export interface RouteOverlay {
  from: MapLatLon;
  to: MapLatLon;
  /** Solved geometry, or null when the provider's router does not return any. */
  path: RoutePath | null;
}

/**
 * The no-match fallback circle: an incident pin, and how far around it to draw a
 * flat-distance radius ring.
 *
 * Same "state owned above, component draws what it is handed" contract as
 * `boundaries` / `sketch` / `staff`. It is ONLY ever set when polygon matching
 * against the Service Center boundaries found no unambiguous match - it is a
 * visual decision aid, never an input to matching, and nothing about it is
 * persisted with the case. Null (or omitted) means "draw no circle".
 */
export interface IncidentRadiusOverlay {
  center: MapLatLon;
  radiusMeters: number;
}

/**
 * A one-shot command to move the camera to a point.
 *
 * A command rather than state: the same target can be requested twice (press
 * "focus" on a person, pan away, press it again), and only a changing `nonce`
 * tells the map that the second request is new. A map that mounts while a request
 * already exists (the large map reopening) must NOT replay it - it compares the
 * nonce it was born with, see useArcgisFocusRequest.
 */
export interface MapFocusRequest extends MapLatLon {
  /** Zoom to use when it is closer than the current one; the current zoom is kept otherwise. */
  zoom?: number;
  nonce: number;
  /**
   * Show ALL of these points in one view - zooming out as far as needed - instead
   * of centring on `latitude` / `longitude`. Used to frame the incident pin
   * together with every assigned responder. With fewer than two points there is
   * nothing to frame, and the request falls back to centring on the primary point.
   * Every provider frames in its own way (an extent, `fitBounds`, or a hand-worked
   * centre and whole-number zoom on Longdo), so the result is "all of them
   * visible", not identical camera positions.
   */
  framePoints?: readonly MapLatLon[];
  /**
   * Pixels of the view covered on each side (the docked cards), which framing
   * keeps every point clear of. Only meaningful with `framePoints`.
   */
  insets?: { left: number; top: number; right: number; bottom: number };
}

/**
 * One straight line to draw from a staff member to the incident pin. The pin end
 * is the map's own `value`, so only the staff end travels here.
 */
export interface StaffConnector extends MapLatLon {
  unitId: string;
}

/**
 * Which of the two map instances a slot is rendering into. Controls that belong
 * to the large map only (the staff layer) return null for the inline one.
 */
export interface MapSlotContext {
  isExpanded: boolean;
}

export type MapSlot = (context: MapSlotContext) => ReactNode;

/** Content anchored to a coordinate - see `anchoredOverlays`. */
export interface MapAnchoredOverlay {
  id: string;
  latitude: number;
  longitude: number;
  content: ReactNode;
}

/**
 * Where the search box appears. "expanded-only" is for maps whose inline size
 * has no room to spare - the search box is nearly as wide as a 320px map.
 */
export type MapSearchMode = "always" | "expanded-only" | "never";

/**
 * What a provider's map component must accept.
 *
 * Implementations render a single map instance and own nothing above it: the
 * expand modal, the shared basemap choice and the restored viewpoint all live
 * in AddressMapField, and every overlay's state lives higher still (see the
 * notes on `staff` and `boundaries` below).
 */
export interface AddressMapProps {
  /** Existing coordinates to centre on / mark (e.g. when editing a saved case). */
  value?: MapLatLon | null;
  /** Called whenever the user resolves a new location via search or map click. */
  onSelect: (result: AddressResult) => void;
  /** Optional error reporter (e.g. show a toast). Falls back to console.error. */
  onError?: (message: string) => void;
  /** [longitude, latitude]. Defaults to Bangkok. */
  initialCenter?: [number, number];
  initialZoom?: number;
  /** Map height in px or any CSS length. */
  height?: number | string;
  /**
   * View-only mode: map clicks no longer move the pin, so the location can't be
   * changed. Pan/zoom and the marker stay fully usable.
   *
   * This does NOT decide whether the search box exists - see `showSearch`. The
   * two were one flag until dispatchers needed to search in view-only mode.
   */
  readOnly?: boolean;
  /**
   * Show the search box. Defaults to "whenever the map is editable".
   *
   * Turning it on together with `readOnly` gives navigate-only search: picking a
   * result moves the view there and nothing else - no pin, no `onSelect` - so a
   * dispatcher can look around without appearing to move the case.
   */
  showSearch?: boolean;
  /**
   * Active basemap. Controlled when supplied together with `onBasemapChange`
   * (which is how AddressMapField keeps the inline and expanded maps in sync);
   * otherwise the component tracks the selection itself.
   */
  basemapId?: BasemapOptionId;
  onBasemapChange?: (id: BasemapOptionId) => void;
  /**
   * Show the basemap ("layers") control. On by default even in `readOnly` mode:
   * the basemap is a view preference, not a change to the case location.
   */
  showBasemapSwitcher?: boolean;
  /**
   * Theme applied to the map's OWN rendered content (basemap style, and Esri's
   * `calcite-mode-dark` widget theming) - NOT the app's global theme. When
   * supplied together with `onMapThemeChange`, BasemapSwitcher's theme picker
   * writes here instead of the global ThemeContext, so choosing a theme from
   * the map affects only the map. Falls back to the live global theme when
   * omitted, for any caller that does not need a map-local override (in which
   * case BasemapSwitcher keeps writing to the global theme, as before).
   */
  mapTheme?: "light" | "dark";
  onMapThemeChange?: (theme: "light" | "dark") => void;
  /** Same contract as `mapTheme`/`onMapThemeChange`, for the map's language. */
  mapLanguage?: Language;
  onMapLanguageChange?: (language: Language) => void;
  /**
   * Optional staff overlay. The component stays generic: it draws whatever
   * markers it is handed and reports clicks on them. Where the list comes from
   * (and what a click means) is the caller's business - see CaseStaffMapField.
   */
  staff?: readonly StaffMarker[];
  showStaff?: boolean;
  selectedStaffId?: string | null;
  onStaffSelect?: (selection: StaffSelection | null) => void;
  /**
   * Officers who may be dragged onto the incident pin to be assigned. Empty or
   * omitted turns drag-to-assign off. The caller owns the eligibility rules (see
   * staff/assign/dragEligibility.ts); the map only starts a drag from one of
   * these ids, and only from an INDIVIDUAL marker - clustered officers never drag.
   */
  draggableStaffIds?: ReadonlySet<string>;
  /** An officer was dropped on the incident pin. Never moves the pin itself. */
  onStaffDropOnIncident?: (unitId: string) => void;
  /**
   * React content pinned to map coordinates and kept there as the view moves,
   * e.g. the assign-undo popup. Rendered by the provider map, because only the
   * map can project a coordinate to a pixel (a slot is evaluated above it).
   */
  anchoredOverlays?: readonly MapAnchoredOverlay[];
  /**
   * Optional straight dashed lines from each of these staff members to the
   * incident pin (the map's `value`). NOT a route: no road network, no solving -
   * just "where is everyone relative to the incident". Same contract as `staff`:
   * this component draws what it is handed, and the layer is non-interactive so
   * it can never intercept a click.
   */
  staffConnectors?: readonly StaffConnector[];
  /**
   * Optional route overlay: the solved officer -> case driving route. Same
   * contract as `staff` - this component draws whatever it is handed and is
   * entirely non-interactive, so it can never intercept a map click.
   */
  route?: RouteOverlay | null;
  showRoute?: boolean;
  /**
   * Optional breadcrumb overlay: where ONE officer has been, newest point last.
   * Same contract again - this component draws the points it is handed and knows
   * nothing about how they were collected (see useStaffTrails).
   */
  trail?: readonly TrailPoint[] | null;
  showTrail?: boolean;
  /**
   * Optional administrative boundary overlay (province / district /
   * sub-district polygons). Same contract as `staff`: this component draws
   * whatever it is handed and knows nothing about what an area means. The
   * state must be owned ABOVE AddressMapField - see useBoundarySelection.
   */
  boundaries?: BoundaryLayerConfig;
  /**
   * Optional editable boundary polygon: the one the user is drawing or
   * reshaping. Same contract as `boundaries` - this component draws what it is
   * handed and knows nothing about what the polygon means. The state must be
   * owned ABOVE AddressMapField, since expanding renders a second view; see
   * BoundaryGeometryField.
   *
   * Only ever set on the area-boundary editor. Every case map leaves it
   * undefined, and the layer hook is inert without it.
   */
  sketch?: BoundarySketchConfig;
  /**
   * Optional no-match fallback circle around the incident pin. Set only when the
   * incident coordinate matched no single Service Center polygon; a successful
   * match leaves it null and nothing is drawn. Same contract as `boundaries` -
   * the component draws what it is handed, the state is owned above
   * AddressMapField, and the overlay is entirely non-interactive so it can never
   * intercept a map click. Purely a visual aid; never persisted.
   */
  incidentRadius?: IncidentRadiusOverlay | null;
  /**
   * Optional Place overlay: org-curated facility markers (Police Station /
   * Hospital / Fire Station). Same "state owned above, component draws what it
   * is handed" contract as `staff` - the component draws the markers it is given
   * and reports a click on one. A Place click is informational only: it never
   * changes the case (stakeholder decision Q1), so `onPlaceSelect` is for the
   * caller's own UI (info popup, highlight), not a write-back.
   */
  places?: readonly PlaceMarker[];
  showPlace?: boolean;
  selectedPlaceId?: string | null;
  onPlaceSelect?: (selection: PlaceSelection | null) => void;
  /**
   * Optional Device overlay: IoT device markers (Camera / Fire Hydrant / AED)
   * within the current map extent. Same contract as `staff`. Unlike Place, a
   * Device click DOES feed a decision - the caller sets `caseState.iotDevice` to
   * the selected device's id and nothing else (stakeholder decision Q2) - but
   * that write lives in the caller; this component only reports the click.
   */
  devices?: readonly DeviceMarker[];
  showDevice?: boolean;
  selectedDeviceId?: string | null;
  onDeviceSelect?: (selection: DeviceSelection | null) => void;
  /**
   * Fires when the incident (case) pin itself is clicked. Staff, Place and Device
   * markers win a click that lands on them as well, so this only fires when none
   * of those was hit. Omit it and the pin is not clickable - which is how every
   * editable map (create / edit) keeps clicking near the pin meaning "move it".
   */
  onIncidentSelect?: () => void;
  /**
   * Moves the camera when it changes to a new request. See MapFocusRequest.
   */
  focusRequest?: MapFocusRequest | null;
  /**
   * Fires (debounced) whenever the map view settles, with the current visible
   * extent in WGS84 degrees. The Device layer uses it to refetch devices for
   * the new viewport (ticket Decision 4 - "full visible-extent set"). Callers
   * that do not show the Device layer omit it, and a provider that has not wired
   * it yet simply never calls it (the layer then fetches nothing).
   */
  onBoundsChange?: (bounds: MapBounds) => void;
  /**
   * Controls rendered inside the map container, on top of the map. The caller
   * positions them (e.g. `absolute bottom-2 left-2`), as the expand button does.
   */
  overlaySlot?: ReactNode;
  /**
   * Controls rendered as the LAST child inside the bottom-left address/
   * coordinates column (see `showLocationInfo`), below the address card and
   * status line. Distinct from `overlaySlot`: that renders as an independent,
   * caller-positioned sibling, so anything placed there has no layout
   * relationship to the address card. This slot exists so content that must
   * always sit immediately below the address card (e.g. Place/Device info
   * popups) does so via normal flex-column flow, not by coincidentally
   * non-overlapping absolute positions. Renders nothing when omitted.
   */
  bottomLeftSlot?: ReactNode;
  /**
   * Controls rendered in the map's top-right toolbar row, to the LEFT of the
   * basemap switcher. Reading right to left the row is: expand, map style, then
   * whatever the caller puts here.
   */
  toolbarSlot?: ReactNode;
  /**
   * Adds an "expand" button at the right end of the toolbar row. Omitted by the
   * map that is already expanded, which has nothing left to expand into.
   */
  onExpand?: () => void;
  /**
   * Render every toolbar control icon-only, revealing its label on hover or
   * focus. Set on the small inline maps (220-320px), where a row of labelled
   * buttons covers a meaningful fraction of the map it is controlling.
   *
   * Passed explicitly rather than inferred from `onExpand` being present: the
   * two happen to coincide today, but "is there something to expand into" and
   * "is this map short of space" are different questions.
   */
  compactControls?: boolean;
  /**
   * Ref this component reads its INITIAL camera from (when present, in place of
   * `value`/`initialCenter`/`initialZoom`) and writes its CURRENT camera into
   * whenever the view settles. Exists because the modal that hosts the expanded
   * map unmounts it on close (see AddressMapField), so every reopen is a brand
   * new map that would otherwise always re-centre on the case at the default
   * zoom. The ref itself must be owned above AddressMapField to survive that
   * unmount - same reasoning as the staff/boundary state.
   */
  viewpointRef?: React.MutableRefObject<MapViewpoint | null>;
  /**
   * Free-text location description to show alongside the coordinates in the
   * on-map readout (see `showLocationInfo`). Owned by the caller - this
   * component only knows `{ latitude, longitude }` via `value`, never an
   * address string.
   */
  address?: string;
  /**
   * Show a persistent address + coordinates card, bottom-left. Off by default:
   * AddressMapField turns it on for the expanded map only, which has the room
   * for it - the inline map does not.
   */
  showLocationInfo?: boolean;
  className?: string;
}
