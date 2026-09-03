// Typing for the Longdo Map v3 global.
//
// Hand-written rather than taken from the `longdomap-type` package on npm: that
// package types a location as `{ lat, lng }`, and the SDK this app loads answers
// `map.location()` with `{ lon, lat }` (verified against api.longdo.com/map3).
// Getting that wrong is silent - the map just centres on the Gulf of Guinea -
// so the shapes here follow the SDK that actually loads, not the published
// types.
//
// Only what this app calls is declared. Members marked UNVERIFIED were read from
// the vendor's API reference but not yet exercised against the live SDK; treat a
// surprise from one of those as a typing bug rather than a caller bug.

/** Longitude first in name, but an object either way - never a tuple. */
export interface LongdoLocation {
  lon: number;
  lat: number;
}

export interface LongdoBound {
  minLon: number;
  minLat: number;
  maxLon: number;
  maxLat: number;
}

/** Zoom range over which an overlay is drawn. */
export interface LongdoVisibleRange {
  min: number;
  max: number;
}

export interface LongdoGeometryOptions {
  /** Text drawn on the geometry itself. */
  label?: string;
  title?: string;
  detail?: string;
  lineWidth?: number;
  /** Any CSS colour string. */
  lineColor?: string;
  fillColor?: string;
  /** A dash array from longdo.LineStyle - Solid [0], Dashed [6,4], Dot [2,2]. */
  lineStyle?: readonly number[];
  /** Draw order within the overlay set; see longdo.OverlayWeight. */
  weight?: number;
  visibleRange?: LongdoVisibleRange;
  /** False keeps the shape from consuming a click meant for the map. */
  clickable?: boolean;
  /** False keeps the cursor from changing over the shape. */
  pointer?: boolean;
  draggable?: boolean;
  /** Vertex handles for reshaping. */
  editable?: boolean;
  popup?: unknown;
}

export interface LongdoMarkerOptions {
  title?: string;
  detail?: string;
  /** `{ html, offset }` - an HTML icon, which is how the staff symbols render. */
  icon?: { html?: string; offset?: { x: number; y: number } };
  visibleRange?: LongdoVisibleRange;
  draggable?: boolean;
  clickable?: boolean;
  weight?: number;
  popup?: unknown;
}

/**
 * An overlay handle. Opaque on purpose - it is only ever handed back to the SDK.
 * `_geojson` is the SDK's own internal representation and is read (defensively)
 * when an edited polygon's vertices have to come back out.
 */
export interface LongdoOverlay {
  _geojson?: {
    geometry?: { type?: string; coordinates?: unknown };
  };
  /** UNVERIFIED - present on some overlay kinds only. */
  location?: () => LongdoLocation;
}

export interface LongdoMapOptions {
  placeholder: HTMLElement;
  zoom?: number;
  zoomRange?: { min: number; max: number };
  location?: LongdoLocation;
  language?: string;
  /** Built-in UI components to create. Passing [] suppresses the default set. */
  ui?: unknown;
  lastView?: boolean;
}

/**
 * One of the map's built-in on-map controls (zoom bar, layer selector,
 * fullscreen button, ...). Reached as `map.Ui.<Name>` and toggled with
 * `.visible(false)`. UNVERIFIED beyond `LayerSelector` / `Fullscreen`, which is
 * all `hideRedundantLongdoUi` touches.
 */
export interface LongdoUiControl {
  visible(visible?: boolean): boolean;
}

export interface LongdoMap {
  /** Getter with no argument; setter with one. `animate` pans instead of jumping. */
  location(location?: LongdoLocation, animate?: boolean): LongdoLocation;
  zoom(zoom?: number, animate?: boolean): number;
  /** UNVERIFIED as a setter - used for framing a solved route. */
  bound(bound?: LongdoBound): LongdoBound;
  rotate?(rotation?: number): number;
  resize(): void;
  language(language?: string): string;
  Layers: {
    setBase(layer: unknown): void;
    add(layer: unknown): void;
    remove(layer: unknown): void;
    clear(): void;
  };
  Overlays: {
    add(overlay: LongdoOverlay): void;
    remove(overlay: LongdoOverlay): void;
    clear(): void;
    list(): LongdoOverlay[];
  };
  Event: {
    bind(eventName: string, callback: (event: unknown) => void): void;
    unbind(eventName: string, callback?: (event: unknown) => void): void;
  };
  Search: {
    /** Reverse geocode. The app uses the REST endpoint instead - see longdoGeocode.ts. */
    address(location: LongdoLocation): void;
  };
  /**
   * The SDK's own router: it solves AND draws, and it is the only source of a
   * route SHAPE in this SDK - the REST routing API returns guidance without
   * geometry. See useLongdoRouteOverlay.
   *
   * Members verified present on the live SDK; `line`/`label`/`mode` are declared
   * because they exist, not because anything calls them yet.
   */
  Route: {
    /** Append a stop. Solving runs over the stops in the order they were added. */
    add(location: LongdoLocation): void;
    /** Solve and draw. Completion arrives as the `guideComplete` event. */
    search(): void;
    clear(): void;
    /** Total distance of the solved route, in metres. */
    distance(): number;
    /** Total travel time of the solved route, in seconds. */
    interval(): number;
    list(): unknown[];
    mode(mode?: unknown): unknown;
    line(line?: unknown): unknown;
    label(label?: unknown): unknown;
  };
  /**
   * The map's built-in UI controls, as named in Longdo's `longdomap-type`
   * package. Every entry is optional because the active UI preset (see the
   * constructor `ui` option) may not include all of them.
   */
  Ui: Partial<
    Record<
      | "DPad"
      | "Zoombar"
      | "Geolocation"
      | "Terrain"
      | "LayerSelector"
      | "Crosshair"
      | "Scale"
      | "ContextMenu"
      | "Fullscreen"
      | "Toolbar",
      LongdoUiControl
    >
  >;
}

export interface LongdoGlobal {
  Map: new (options: LongdoMapOptions) => LongdoMap;
  Marker: new (location: LongdoLocation, options?: LongdoMarkerOptions) => LongdoOverlay;
  Polygon: new (locations: LongdoLocation[], options?: LongdoGeometryOptions) => LongdoOverlay;
  Polyline: new (locations: LongdoLocation[], options?: LongdoGeometryOptions) => LongdoOverlay;
  /** Base and overlay layer constants - NORMAL, DARK, GRAY, SPHERE_HYBRID, ... */
  Layers: Record<string, unknown>;
  /** Draw-order constants. */
  OverlayWeight: Record<string, number>;
  /** Event name constants. Their VALUES are the lowercase strings bind() takes. */
  EventName: Record<string, string>;
  /** Dash-array constants for geometry outlines. */
  LineStyle: Record<string, readonly number[]>;
}

declare global {
  interface Window {
    longdo?: LongdoGlobal;
  }
}
