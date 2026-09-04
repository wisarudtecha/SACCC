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
import type { BasemapOptionId } from "./basemaps";
import type { BoundaryLayerConfig } from "./boundaries/boundaryTypes";
import type { BoundarySketchConfig } from "./sketch/sketchTypes";
import type { StaffMarker, StaffSelection } from "./staff/staffTypes";
import type { TrailPoint } from "./staff/useStaffTrails";

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
 * Which of the two map instances a slot is rendering into. Controls that belong
 * to the large map only (the staff layer) return null for the inline one.
 */
export interface MapSlotContext {
  isExpanded: boolean;
}

export type MapSlot = (context: MapSlotContext) => ReactNode;

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
   * Optional staff overlay. The component stays generic: it draws whatever
   * markers it is handed and reports clicks on them. Where the list comes from
   * (and what a click means) is the caller's business - see CaseStaffMapField.
   */
  staff?: readonly StaffMarker[];
  showStaff?: boolean;
  selectedStaffId?: string | null;
  onStaffSelect?: (selection: StaffSelection | null) => void;
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
   * Controls rendered inside the map container, on top of the map. The caller
   * positions them (e.g. `absolute bottom-2 left-2`), as the expand button does.
   */
  overlaySlot?: ReactNode;
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
