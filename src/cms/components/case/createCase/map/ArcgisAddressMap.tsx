// Self-contained ArcGIS address picker.
//
// The user finds a place two ways:
//   - the Search widget (forward geocode: type an address, pick a candidate), or
//   - clicking anywhere on the map (reverse geocode: coordinate -> address).
//
// Either way the component resolves a single { address, latitude, longitude }
// result and hands it to `onSelect`. It owns no form logic and can be dropped
// anywhere. The heavy `@arcgis/core` modules are imported here, so consumers
// should lazy-load this file to keep the SDK out of the initial bundle.
import { memo, useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Maximize2 } from "lucide-react";
import esriMap from "@arcgis/core/Map.js";
import MapView from "@arcgis/core/views/MapView.js";
import Graphic from "@arcgis/core/Graphic.js";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer.js";
import Point from "@arcgis/core/geometry/Point.js";
import type Polyline from "@arcgis/core/geometry/Polyline.js";
import Search from "@arcgis/core/widgets/Search.js";
import Zoom from "@arcgis/core/widgets/Zoom.js";
import Compass from "@arcgis/core/widgets/Compass.js";
import * as reactiveUtils from "@arcgis/core/core/reactiveUtils.js";
import * as locator from "@arcgis/core/rest/locator.js";
import * as promiseUtils from "@arcgis/core/core/promiseUtils.js";
import "@arcgis/core/assets/esri/themes/light/main.css";
import { API_CONFIG } from "@/core/config/api";
import { useTheme } from "@/core/context/ThemeContext";
import { useTranslation } from "@/core/hooks/useTranslation";
import { initArcgis } from "./arcgisSetup";
import BasemapSwitcher from "./BasemapSwitcher";
import { MAP_CONTROL_REVEAL_ON_GROUP } from "./mapControlStyles";
import {
  BasemapOptionId,
  DEFAULT_BASEMAP_ID,
  createBasemap,
  createFallbackBasemap,
  toEsriLanguage
} from "./basemaps";
import { useStaffGraphicsLayer } from "./staff/useStaffGraphicsLayer";
import type { StaffMarker, StaffSelection } from "./staff/staffTypes";
import { useRouteGraphicsLayer } from "./staff/useRouteGraphicsLayer";
import { useBreadcrumbGraphicsLayer } from "./staff/useBreadcrumbGraphicsLayer";
import type { TrailPoint } from "./staff/useStaffTrails";
import { useAdminBoundaryLayers } from "./boundaries/useAdminBoundaryLayers";
import type { BoundaryLayerConfig } from "./boundaries/boundaryTypes";
import { useBoundarySketchLayer } from "./sketch/useBoundarySketchLayer";
import type { BoundarySketchConfig } from "./sketch/sketchTypes";

export interface ArcgisLatLon {
  latitude: number;
  longitude: number;
}

/** Camera position captured/restored via `viewpointRef` - see its doc below. */
export interface ArcgisMapViewpoint {
  center: [number, number];
  zoom: number;
}

export interface ArcgisAddressResult extends ArcgisLatLon {
  address: string;
}

interface ArcgisAddressMapProps {
  /** Existing coordinates to centre on / mark (e.g. when editing a saved case). */
  value?: ArcgisLatLon | null;
  /** Called whenever the user resolves a new location via search or map click. */
  onSelect: (result: ArcgisAddressResult) => void;
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
   * Show the Search widget. Defaults to "whenever the map is editable".
   *
   * Turning it on together with `readOnly` gives navigate-only search: picking a
   * result moves the view there and nothing else - no pin, no `onSelect` - so a
   * dispatcher can look around without appearing to move the case.
   */
  showSearch?: boolean;
  /**
   * Active basemap. Controlled when supplied together with `onBasemapChange`
   * (which is how ArcgisAddressMapField keeps the inline and expanded maps in
   * sync); otherwise the component tracks the selection itself.
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
   * contract as `staff` - this component draws whatever polyline it is handed
   * and is entirely non-interactive, so it can never intercept a map click.
   */
  route?: Polyline | null;
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
   * state must be owned ABOVE ArcgisAddressMapField - see useBoundarySelection.
   */
  boundaries?: BoundaryLayerConfig;
  /**
   * Optional editable boundary polygon: the one the user is drawing or
   * reshaping. Same contract as `boundaries` - this component draws what it is
   * handed and knows nothing about what the polygon means. The state must be
   * owned ABOVE ArcgisAddressMapField, since expanding renders a second view;
   * see BoundaryGeometryField.
   *
   * Only ever set on the area-boundary editor. Every case map leaves it
   * undefined, and the layer hook is inert without it.
   */
  sketch?: BoundarySketchConfig;
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
   * map unmounts it on close (see ArcgisAddressMapField), so every reopen is a
   * brand new MapView that would otherwise always re-centre on the case at the
   * default zoom. The ref itself must be owned above ArcgisAddressMapField to
   * survive that unmount - same reasoning as the staff/boundary state.
   */
  viewpointRef?: React.MutableRefObject<ArcgisMapViewpoint | null>;
  /**
   * Free-text location description to show alongside the coordinates in the
   * on-map readout (see `showLocationInfo`). Owned by the caller - this
   * component only knows `{ latitude, longitude }` via `value`, never an
   * address string.
   */
  address?: string;
  /**
   * Show a persistent address + coordinates card, bottom-left. Off by default:
   * ArcgisAddressMapField turns it on for the expanded map only, which has the
   * room for it - the inline map does not.
   */
  showLocationInfo?: boolean;
  className?: string;
}

const DEFAULT_CENTER: [number, number] = [100.5018, 13.7563]; // Bangkok
const DEFAULT_ZOOM = 12;

/**
 * Don't ask the geocoder for suggestions until the term is this long. The Search
 * widget debounces the request itself; the delay is not configurable, so this
 * character floor is the throttle we do control.
 */
const SEARCH_MIN_CHARACTERS = 3;

// Stable empty list so maps without a staff overlay don't re-run the sync effect
// on every render.
const EMPTY_STAFF: readonly StaffMarker[] = [];

// Minimal shapes for the only two event fields we read. The SDK's generated
// event types aren't reliably importable across major versions, so we type just
// what we use.
interface ViewClickEventLike {
  mapPoint: Point | null;
}
interface SearchSelectResultEventLike {
  result?: {
    name?: string | null;
    feature?: { geometry?: Point | null } | null;
  } | null;
}

const MARKER_SYMBOL = {
  type: "simple-marker" as const,
  style: "circle" as const,
  color: [37, 99, 235, 0.9], // brand blue
  size: 12,
  outline: { color: [255, 255, 255], width: 2 }
};

function makePoint({ latitude, longitude }: ArcgisLatLon): Point {
  return new Point({ latitude, longitude });
}

/**
 * True for the `AbortError` the SDK rejects a basemap/view load with when its
 * request is cancelled mid-flight - most commonly React Strict Mode's dev-only
 * mount -> unmount -> remount, which aborts the first mount's in-flight loads.
 * The second mount's loads complete normally, so these are expected noise, not
 * failures worth reporting.
 *
 * Delegates to the SDK helper rather than testing `instanceof Error`: an
 * @arcgis/core/core/Error is a standalone class that does NOT extend the native
 * Error, so that test never matched and every abort was reported as a failure.
 */
function isAbortError(error: unknown): boolean {
  return promiseUtils.isAbortError(error);
}

function ArcgisAddressMapBase({
  value,
  onSelect,
  onError,
  initialCenter = DEFAULT_CENTER,
  initialZoom = DEFAULT_ZOOM,
  height = 360,
  readOnly = false,
  showSearch,
  basemapId: basemapIdProp,
  onBasemapChange,
  showBasemapSwitcher = true,
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
  overlaySlot,
  toolbarSlot,
  onExpand,
  compactControls = false,
  viewpointRef,
  address,
  showLocationInfo = false,
  className = ""
}: ArcgisAddressMapProps) {
  const { t, language } = useTranslation();
  const { theme } = useTheme();
  const isDarkTheme = theme === "dark";
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<MapView | null>(null);
  const mapRef = useRef<esriMap | null>(null);
  const markerLayerRef = useRef<GraphicsLayer | null>(null);
  // Signature (`id:language`) of the basemap currently applied to the map, so
  // the sync effect can skip the value the mount path already set and so a slow
  // basemap load can tell whether a newer selection has superseded it.
  const appliedBasemapRef = useRef<string | null>(null);
  // True for exactly one render after a mount that seeded its camera from
  // `viewpointRef` - lets the "re-centre on value" effect below skip its jump
  // back to the case marker on THIS mount only, without disturbing that effect
  // for genuine value changes afterwards (edit mode).
  const didRestoreViewpointRef = useRef(false);

  const [isReady, setIsReady] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  // Fallback for uncontrolled use; ignored when `basemapIdProp` is supplied.
  const [internalBasemapId, setInternalBasemapId] = useState<BasemapOptionId>(
    basemapIdProp ?? DEFAULT_BASEMAP_ID
  );

  const basemapId = basemapIdProp ?? internalBasemapId;
  const esriLanguage = toEsriLanguage(language);
  // Editable maps search by default; a view-only map opts in for navigate-only
  // search. Read at mount - the parent remounts the view when the mode changes.
  const isSearchEnabled = showSearch ?? !readOnly;

  // Keep the latest callbacks/flags in refs so the map is built exactly once
  // while its handlers still see current values (no stale closures, no rebuild).
  const onSelectRef = useRef(onSelect);
  const onErrorRef = useRef(onError);
  const readOnlyRef = useRef(readOnly);
  const onBasemapChangeRef = useRef(onBasemapChange);
  const onStaffSelectRef = useRef(onStaffSelect);
  onSelectRef.current = onSelect;
  onErrorRef.current = onError;
  readOnlyRef.current = readOnly;
  onBasemapChangeRef.current = onBasemapChange;
  onStaffSelectRef.current = onStaffSelect;

  // Draws the staff markers and answers "did this click hit an officer?".
  // `resolveStaffClick` is stable, so the mount-time click handler can call it.
  const { resolveStaffClick } = useStaffGraphicsLayer({
    mapRef,
    viewRef,
    isReady,
    staff: staff ?? EMPTY_STAFF,
    selectedStaffId,
    visible: showStaff
  });
  const resolveStaffClickRef = useRef(resolveStaffClick);
  resolveStaffClickRef.current = resolveStaffClick;

  // Administrative boundary polygons. Drawn beneath the marker and staff layers,
  // and with popups disabled, so they never intercept a map click. Labels are
  // suppressed while staff is visible - see useAdminBoundaryLayers.ts.
  const { isError: hasBoundaryError } = useAdminBoundaryLayers({
    mapRef,
    isReady,
    boundaries,
    language,
    isDarkTheme,
    suppressLabels: showStaff
  });

  // The solved officer -> case route. Drawn above the boundary layers and
  // below the case marker / staff layers, and entirely non-interactive - see
  // useRouteGraphicsLayer.ts.
  useRouteGraphicsLayer({
    mapRef,
    viewRef,
    isReady,
    geometry: route ?? null,
    visible: showRoute,
    isDarkTheme
  });

  // Where the selected officer has been. Sits just above the route and below the
  // case marker / staff layers, non-interactive, and never moves the camera -
  // see useBreadcrumbGraphicsLayer.ts.
  useBreadcrumbGraphicsLayer({
    mapRef,
    isReady,
    points: trail ?? null,
    visible: showTrail,
    isDarkTheme
  });

  // The boundary being drawn. Called LAST of the layer hooks on purpose: it is
  // the only interactive overlay, and its layer has to sit above every other
  // one for a vertex handle to be grabbable - which appending gives it for free.
  useBoundarySketchLayer({
    mapRef,
    viewRef,
    isReady,
    sketch,
    isDarkTheme
  });

  const reportError = useCallback((message: string, error?: unknown) => {
    console.error(message, error);
    onErrorRef.current?.(message);
  }, []);

  // Draw (or move) the single selection marker.
  const setMarker = useCallback((point: Point) => {
    const layer = markerLayerRef.current;
    if (!layer) {
      return;
    }
    layer.removeAll();
    layer.add(new Graphic({ geometry: point, symbol: MARKER_SYMBOL }));
  }, []);

  // Swap the map's basemap in place. Never rebuild the MapView for this - that
  // would throw away the user's pan/zoom and the selection marker.
  const applyBasemap = useCallback(
    (map: esriMap, id: BasemapOptionId, lang: string | undefined, isDark: boolean) => {
      // The theme is part of the signature: switching to dark mode has to
      // re-apply the same option as its night style.
      const signature = `${id}:${lang ?? ""}:${isDark ? "dark" : "light"}`;
      appliedBasemapRef.current = signature;

      const basemap = createBasemap(id, lang, isDark);
      map.basemap = basemap;

      basemap.load().catch((error: unknown) => {
        if (isAbortError(error)) {
          // Cancelled, not failed (see isAbortError) - nothing to fall back
          // from, since a newer selection or an unmount already superseded it.
          return;
        }
        // The Basemap Styles service rejected the request - most likely the API
        // key lacks the Basemaps privilege. Fall back to the legacy well-known
        // basemap so the user still gets a usable map. Not routed through
        // `onError`: callers surface that as a geocoding failure message, which
        // would be misleading here, and the fallback is a silent recovery.
        console.error(
          "Failed to load basemap from the ArcGIS styles service; using fallback",
          error
        );
        if (appliedBasemapRef.current !== signature) {
          return; // a newer selection already replaced this one
        }
        const fallback = createFallbackBasemap(id, isDark);
        if (fallback) {
          map.basemap = fallback;
        }
      });
    },
    []
  );

  const handleBasemapChange = useCallback((id: BasemapOptionId) => {
    setInternalBasemapId(id);
    onBasemapChangeRef.current?.(id);
  }, []);

  // Build the map once on mount.
  useEffect(() => {
    if (!containerRef.current) {
      return;
    }
    initArcgis();

    const markerLayer = new GraphicsLayer();
    markerLayerRef.current = markerLayer;

    const map = new esriMap({ layers: [markerLayer] });
    mapRef.current = map;
    // Assigned synchronously, before the view renders, so there is no flash of
    // an empty map.
    applyBasemap(map, basemapId, esriLanguage, isDarkTheme);

    // A restored viewpoint - the dispatcher's last camera position before this
    // instance was unmounted - takes precedence over the case marker. Consumed
    // once below so the "re-centre on value" effect does not immediately snap
    // back to the marker on this same mount.
    const restoredViewpoint = viewpointRef?.current ?? null;
    didRestoreViewpointRef.current = Boolean(restoredViewpoint);

    const view = new MapView({
      container: containerRef.current,
      map,
      center: restoredViewpoint?.center ?? (value ? [value.longitude, value.latitude] : initialCenter),
      zoom: restoredViewpoint?.zoom ?? initialZoom
    });
    // Every widget on this map is added explicitly, so none of the lazily
    // created defaults are wanted. Passing `ui` to the constructor instead would
    // make MapView destroy the DefaultUI it just created and swap in a
    // replacement, for no benefit.
    //
    // Zoom and compass are built here rather than named in `ui.components` and
    // repositioned with `ui.move(...)`: DefaultUI creates named components when
    // the view resolves, so a move issued now - before `view.when()` - finds
    // nothing to move and silently leaves them top-left. Adding instances is the
    // same path the Search widget below already uses successfully.
    view.ui.components = [];
    view.ui.add([new Zoom({ view }), new Compass({ view })], "bottom-right");
    viewRef.current = view;

    // `readOnly` / `isSearchEnabled` are fixed for the life of the view (the
    // parent remounts on mode change), so reading them here rather than from a
    // ref is intentional.
    let searchHandle: { remove: () => void } | null = null;
    if (isSearchEnabled) {
      const search = new Search({
        view,
        popupEnabled: false,
        // Suggest only once the term is specific enough to be worth a request.
        minSuggestCharacters: SEARCH_MIN_CHARACTERS,
        // The widget's own result pin would either duplicate our marker (edit
        // mode) or imply the case moved (view-only mode).
        resultGraphicEnabled: false
      });
      view.ui.add(search, "top-left");

      // Forward geocode: user picked a search candidate.
      searchHandle = search.on("select-result", (event: SearchSelectResultEventLike) => {
        const geometry = event?.result?.feature?.geometry;
        if (!geometry) {
          return;
        }
        // View-only: go there and stop. Moving the pin or reporting a selection
        // would look like the case location had been changed.
        if (readOnlyRef.current) {
          view.goTo({ target: geometry }).catch(() => {
            /* rejects when interrupted by a newer navigation - safe to ignore */
          });
          return;
        }
        const address = event.result?.name ?? "";
        setMarker(geometry);
        onSelectRef.current({
          address,
          latitude: geometry.latitude ?? 0,
          longitude: geometry.longitude ?? 0
        });
      });
    }

    view.when(
      () => {
        if (value) {
          setMarker(makePoint(value));
        }
        setIsReady(true);
      },
      (error: unknown) => {
        if (isAbortError(error)) {
          // This mount was unmounted before the view finished loading (see
          // isAbortError) - `setIsReady` correctly never fires, and cleanup
          // below has already run `view.destroy()`.
          return;
        }
        reportError("Failed to initialise map", error);
      }
    );

    // Reverse geocode: user clicked a point on the map.
    const clickHandle = view.on("click", async (event: ViewClickEventLike) => {
      // Staff markers win the click. This has to be decided here rather than in a
      // second listener calling stopPropagation(): hitTest is async, so by the
      // time it answered, the geocode below would already have run.
      const staffSelection = await resolveStaffClickRef.current(event);
      if (staffSelection) {
        onStaffSelectRef.current?.(staffSelection);
        return;
      }

      if (readOnlyRef.current) {
        return;
      }
      const mapPoint = event.mapPoint;
      if (!mapPoint) {
        return;
      }
      setMarker(mapPoint);
      setIsGeocoding(true);
      try {
        const candidate = await locator.locationToAddress(API_CONFIG.ARCGIS_GEOCODE_URL, {
          location: mapPoint
        });
        onSelectRef.current({
          address: candidate?.address ?? "",
          latitude: mapPoint.latitude ?? 0,
          longitude: mapPoint.longitude ?? 0
        });
      } catch (error: unknown) {
        // Still surface the coordinates even if the address lookup fails.
        onSelectRef.current({
          address: "",
          latitude: mapPoint.latitude ?? 0,
          longitude: mapPoint.longitude ?? 0
        });
        reportError("Failed to look up address for the selected point", error);
      } finally {
        setIsGeocoding(false);
      }
    });

    // Capture the camera into `viewpointRef` whenever the view settles, so the
    // NEXT mount (after this one unmounts on modal close) can restore it. Only
    // set up when a ref was supplied - the inline map is never remounted this
    // way and has nothing to gain from tracking it.
    let viewpointHandle: { remove: () => void } | null = null;
    if (viewpointRef) {
      viewpointHandle = reactiveUtils.watch(
        () => view.stationary,
        (stationary: boolean) => {
          if (stationary) {
            viewpointRef.current = {
              center: [view.center.longitude ?? 0, view.center.latitude ?? 0],
              zoom: view.zoom
            };
          }
        }
      );
    }

    return () => {
      searchHandle?.remove();
      clickHandle.remove();
      viewpointHandle?.remove();
      view.destroy();
      viewRef.current = null;
      mapRef.current = null;
      markerLayerRef.current = null;
    };
    // Build-once: initial center/zoom are read at mount; later `value` changes are
    // handled by the sync effect below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Apply basemap changes made after mount (user picked one, the app language
  // changed and the labels should follow, or the app switched to dark mode).
  useEffect(() => {
    const map = mapRef.current;
    if (!isReady || !map) {
      return;
    }
    const signature = `${basemapId}:${esriLanguage ?? ""}:${isDarkTheme ? "dark" : "light"}`;
    if (appliedBasemapRef.current === signature) {
      return;
    }
    applyBasemap(map, basemapId, esriLanguage, isDarkTheme);
  }, [isReady, basemapId, esriLanguage, isDarkTheme, applyBasemap]);

  // Re-centre + re-mark when a controlled `value` arrives after mount (edit mode).
  useEffect(() => {
    const view = viewRef.current;
    if (!isReady || !view || !value) {
      return;
    }
    // This effect also fires on the render where `isReady` first turns true -
    // normally a harmless re-confirmation of the marker mount already placed.
    // But when this mount seeded its camera from a restored viewpoint, jumping
    // back to the marker here would immediately undo that restore. Skip it
    // exactly once; a genuine value change afterwards still re-centres.
    if (didRestoreViewpointRef.current) {
      didRestoreViewpointRef.current = false;
      return;
    }
    const point = makePoint(value);
    setMarker(point);
    view.goTo({ target: point, zoom: Math.max(view.zoom, initialZoom) }).catch(() => {
      /* goTo rejects if interrupted by a newer navigation - safe to ignore */
    });
  }, [isReady, value, initialZoom, setMarker]);

  return (
    // `calcite-mode-dark` re-themes the Esri widgets rendered inside this
    // container (search, zoom, compass). The SDK's light stylesheet defines that
    // class as a Calcite token override, so the whole widget set follows the app
    // theme without swapping stylesheets at runtime - which is not possible from
    // a static import anyway.
    <div
      className={`relative overflow-hidden rounded-lg border border-gray-200 dark:border-gray-800 ${
        isDarkTheme ? "calcite-mode-dark" : ""
      } ${className}`}
      style={{ height }}
    >
      {/* Pan/zoom stay enabled in readOnly mode - only location-changing
          interactions (search, click-to-geocode) are withheld. */}
      <div ref={containerRef} className="h-full w-full" />

      {/* One toolbar row in the top-right corner. Children render left to right,
          so the last ones sit on the outside edge: reading inward from the right
          it is expand, map style, then the caller's own controls.

          Under `compactControls` every control here is icon-only until hovered
          or focused. The row is right-anchored, so a control that expands grows
          leftward into the map rather than pushing its neighbours off the edge. */}
      {(showBasemapSwitcher || toolbarSlot || onExpand) && (
        <div className="absolute right-2 top-2 z-10 flex items-start gap-2">
          {toolbarSlot}
          {showBasemapSwitcher && (
            <BasemapSwitcher
              value={basemapId}
              onChange={handleBasemapChange}
              compact={compactControls}
            />
          )}
          {onExpand && (
            // `group` on the button itself, not a wrapper: unlike the disabled
            // Place control this button is interactive, so it reports its own
            // hover and focus and needs no stand-in.
            <button
              type="button"
              onClick={onExpand}
              title={t("case.display.map_expand")}
              aria-label={t("case.display.map_expand")}
              className="group flex items-center gap-1 rounded-md bg-white/90 px-2 py-1 text-xs text-gray-700 shadow-sm transition-colors hover:bg-white dark:bg-gray-800/90 dark:text-gray-200 dark:hover:bg-gray-800"
            >
              <Maximize2 className="h-3.5 w-3.5 shrink-0" />
              {compactControls ? (
                <span className={MAP_CONTROL_REVEAL_ON_GROUP}>
                  {t("case.display.map_expand")}
                </span>
              ) : (
                <span className="hidden sm:inline">{t("case.display.map_expand")}</span>
              )}
            </button>
          )}
        </div>
      )}
      {/* Bottom-left column: the persistent address/coordinates card (when
          enabled) on top, then one status line below it. Geocoding wins over
          the boundary error: it is transient and tied to something the user
          just did, whereas a failed boundary load persists and will still be
          there once the lookup finishes. */}
      <div className="absolute bottom-2 left-2 z-10 flex flex-col gap-1">
        {showLocationInfo && value && (
          <div className="max-w-xs rounded-md bg-white/90 px-2 py-1 text-xs text-gray-700 shadow-sm dark:bg-gray-800/90 dark:text-gray-200">
            {address && <div className="truncate font-medium">{address}</div>}
            <div className="text-gray-500 dark:text-gray-400">
              {t("case.display.location_coordinates")}: {value.latitude}, {value.longitude}
            </div>
          </div>
        )}
        {isGeocoding ? (
          <div className="rounded bg-black/60 px-2 py-1 text-xs text-white">
            Looking up address…
          </div>
        ) : (
          hasBoundaryError && (
            <div className="rounded bg-black/60 px-2 py-1 text-xs text-white">
              {t("case.display.map_boundary_error")}
            </div>
          )
        )}
      </div>
      {overlaySlot}
    </div>
  );
}

export const ArcgisAddressMap = memo(ArcgisAddressMapBase);
ArcgisAddressMap.displayName = "ArcgisAddressMap";

export default ArcgisAddressMap;
