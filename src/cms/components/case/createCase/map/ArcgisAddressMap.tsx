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
import { memo, useCallback, useEffect, useRef, useState } from "react";
import { Maximize2 } from "lucide-react";
import esriMap from "@arcgis/core/Map.js";
import MapView from "@arcgis/core/views/MapView.js";
import Graphic from "@arcgis/core/Graphic.js";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer.js";
import Point from "@arcgis/core/geometry/Point.js";
import type Extent from "@arcgis/core/geometry/Extent.js";
import * as webMercatorUtils from "@arcgis/core/geometry/support/webMercatorUtils.js";
import Search from "@arcgis/core/widgets/Search.js";
import Zoom from "@arcgis/core/widgets/Zoom.js";
import Compass from "@arcgis/core/widgets/Compass.js";
import * as reactiveUtils from "@arcgis/core/core/reactiveUtils.js";
import * as promiseUtils from "@arcgis/core/core/promiseUtils.js";
import "@arcgis/core/assets/esri/themes/light/main.css";
import { useTheme } from "@/core/context/ThemeContext";
import { useTranslation } from "@/core/hooks/useTranslation";
import { initArcgis } from "./arcgisSetup";
import { arcgisGeocodeService } from "./services/arcgisGeocode";
import BasemapSwitcher from "./BasemapSwitcher";
import { MAP_CONTROL_REVEAL_ON_GROUP } from "./mapControlStyles";
import { BasemapOptionId, DEFAULT_BASEMAP_ID } from "./basemaps";
import { createBasemap, createFallbackBasemap, toEsriLanguage } from "./arcgisBasemaps";
import { useStaffGraphicsLayer } from "./staff/useStaffGraphicsLayer";
import type { StaffMarker } from "./staff/staffTypes";
import { useRouteGraphicsLayer } from "./staff/useRouteGraphicsLayer";
import { useBreadcrumbGraphicsLayer } from "./staff/useBreadcrumbGraphicsLayer";
import { useAdminBoundaryLayers } from "./boundaries/useAdminBoundaryLayers";
import { useBoundarySketchLayer } from "./sketch/useBoundarySketchLayer";
import { useArcgisIncidentRadiusLayer } from "./incidentRadius/useArcgisIncidentRadiusLayer";
import { useArcgisPlaceLayer } from "./place/useArcgisPlaceLayer";
import type { PlaceMarker } from "./place/placeTypes";
import { useArcgisDeviceLayer } from "./device/useArcgisDeviceLayer";
import type { DeviceMarker } from "./device/deviceTypes";
import { useArcgisIncidentClick } from "./incident/useArcgisIncidentClick";
import { useArcgisFocusRequest } from "./useArcgisFocusRequest";
import { useStaffConnectorLayer } from "./staff/useStaffConnectorLayer";
import type { AddressMapProps, MapLatLon, StaffConnector } from "./mapTypes";

const DEFAULT_CENTER: [number, number] = [100.5018, 13.7563]; // Bangkok
const DEFAULT_ZOOM = 12;

/**
 * Don't ask the geocoder for suggestions until the term is this long. The Search
 * widget debounces the request itself; the delay is not configurable, so this
 * character floor is the throttle we do control.
 */
const SEARCH_MIN_CHARACTERS = 3;

// Stable empty lists so maps without a staff / place overlay don't re-run the
// sync effect on every render.
const EMPTY_STAFF: readonly StaffMarker[] = [];
const EMPTY_PLACES: readonly PlaceMarker[] = [];
const EMPTY_DEVICES: readonly DeviceMarker[] = [];
const EMPTY_CONNECTORS: readonly StaffConnector[] = [];

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

// Sized so the pin reads as something to click (it opens the Case Panel on the
// dispatch map). The Longdo and MapTiler pins are drawn 4px larger than this, at
// 20 - see MARKER_DIAMETER in longdoSymbols.ts / maptilerSymbols.ts.
const MARKER_SYMBOL = {
  type: "simple-marker" as const,
  style: "circle" as const,
  color: [37, 99, 235, 0.9], // brand blue
  size: 16,
  outline: { color: [255, 255, 255], width: 2 }
};

function makePoint({ latitude, longitude }: MapLatLon): Point {
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
  places,
  showPlace = false,
  selectedPlaceId = null,
  onPlaceSelect,
  devices,
  showDevice = false,
  selectedDeviceId = null,
  onDeviceSelect,
  onIncidentSelect,
  focusRequest,
  staffConnectors,
  onBoundsChange,
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
  onExpand,
  compactControls = false,
  viewpointRef,
  address,
  showLocationInfo = false,
  className = ""
}: AddressMapProps) {
  const { t, language, setLanguage } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  // The map's OWN rendered theme/language - an override when the caller wires
  // one (see AddressMapProps.mapTheme), else the live global value. Only this
  // effective value feeds the basemap/Esri-widget application below; anything
  // reading `theme`/`language` directly (e.g. this component's own UI text)
  // stays on the real global value.
  const effectiveTheme = mapTheme ?? theme;
  const effectiveLanguage = mapLanguage ?? language;
  const isDarkTheme = effectiveTheme === "dark";
  // Fallback for callers that don't wire a map-local override: preserves the
  // exact previous behavior of writing straight to the global context.
  const handleSelectTheme = useCallback(
    (nextTheme: "light" | "dark") => {
      if (onMapThemeChange) {
        onMapThemeChange(nextTheme);
        return;
      }
      if (nextTheme !== theme) {
        toggleTheme();
      }
    },
    [onMapThemeChange, theme, toggleTheme]
  );
  const handleSelectLanguage = onMapLanguageChange ?? setLanguage;
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
  const esriLanguage = toEsriLanguage(effectiveLanguage);
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
  const onPlaceSelectRef = useRef(onPlaceSelect);
  const onDeviceSelectRef = useRef(onDeviceSelect);
  const onIncidentSelectRef = useRef(onIncidentSelect);
  const onBoundsChangeRef = useRef(onBoundsChange);
  onSelectRef.current = onSelect;
  onErrorRef.current = onError;
  readOnlyRef.current = readOnly;
  onBasemapChangeRef.current = onBasemapChange;
  onStaffSelectRef.current = onStaffSelect;
  onPlaceSelectRef.current = onPlaceSelect;
  onDeviceSelectRef.current = onDeviceSelect;
  onIncidentSelectRef.current = onIncidentSelect;
  onBoundsChangeRef.current = onBoundsChange;

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

  // Draws the org-curated Place markers and answers "did this click hit one?".
  // Read-only: a hit opens the caller's info popup and nothing else (Q1).
  const { resolvePlaceClick } = useArcgisPlaceLayer({
    mapRef,
    viewRef,
    isReady,
    places: places ?? EMPTY_PLACES,
    selectedPlaceId,
    visible: showPlace
  });
  const resolvePlaceClickRef = useRef(resolvePlaceClick);
  resolvePlaceClickRef.current = resolvePlaceClick;

  // Draws the viewport-scoped IoT device markers and answers "did this click hit
  // one?". A hit opens the caller's info popup; the case write ("link") happens
  // only from that popup's button (stakeholder decision Q2).
  const { resolveDeviceClick } = useArcgisDeviceLayer({
    mapRef,
    viewRef,
    isReady,
    devices: devices ?? EMPTY_DEVICES,
    selectedDeviceId,
    visible: showDevice
  });
  const resolveDeviceClickRef = useRef(resolveDeviceClick);
  resolveDeviceClickRef.current = resolveDeviceClick;

  // Answers "did this click hit the incident pin?". Only switched on when the
  // caller wants pin clicks (the dispatch map) - everywhere else a click near the
  // pin keeps its old meaning.
  const { resolveIncidentClick } = useArcgisIncidentClick({
    viewRef,
    markerLayerRef,
    isReady,
    enabled: Boolean(onIncidentSelect)
  });
  const resolveIncidentClickRef = useRef(resolveIncidentClick);
  resolveIncidentClickRef.current = resolveIncidentClick;

  // "Focus" commands from the caller (e.g. centre on a responder).
  useArcgisFocusRequest({ viewRef, isReady, focusRequest });

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
    path: route?.path ?? null,
    visible: showRoute,
    isDarkTheme
  });

  // Straight dashed lines from each staff member to the incident pin. Not a route:
  // no solving, no roads. Called AFTER the route hook so a solved route (same
  // draw slot) stays on top, non-interactive - see useStaffConnectorLayer.ts.
  useStaffConnectorLayer({
    mapRef,
    isReady,
    connectors: staffConnectors ?? EMPTY_CONNECTORS,
    incident: value,
    visible: showStaff,
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

  // The no-match fallback radius circle. Non-interactive, drawn just above the
  // boundary layers - see useArcgisIncidentRadiusLayer. Only ever renders when
  // `incidentRadius` is set, i.e. the incident matched no single Service Center.
  useArcgisIncidentRadiusLayer({
    mapRef,
    isReady,
    incidentRadius,
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

    // Report the current visible extent (in WGS84 degrees) to `onBoundsChange`.
    // `view.extent` is Web Mercator, so it has to be projected back first. The
    // Device layer debounces + de-dupes these before they drive a refetch.
    const emitBounds = () => {
      const report = onBoundsChangeRef.current;
      if (!report || !view.extent) {
        return;
      }
      const geographic = webMercatorUtils.webMercatorToGeographic(view.extent) as Extent | null;
      if (!geographic) {
        return;
      }
      report({
        minLat: geographic.ymin,
        minLon: geographic.xmin,
        maxLat: geographic.ymax,
        maxLon: geographic.xmax
      });
    };

    view.when(
      () => {
        if (value) {
          setMarker(makePoint(value));
        }
        setIsReady(true);
        // Kick off the first Device fetch for the initial viewport.
        emitBounds();
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

      // Place markers next, and before the readOnly guard: a Place is
      // informational on every surface, so a hit opens the popup and never
      // moves the incident pin. Staff still wins a tie.
      const placeHit = await resolvePlaceClickRef.current(event);
      if (placeHit) {
        onPlaceSelectRef.current?.(placeHit);
        return;
      }

      // Device markers next, also before the readOnly guard: a hit opens the
      // caller's popup and never moves the incident pin. Staff, then Place, then
      // Device is the tie order.
      const deviceHit = await resolveDeviceClickRef.current(event);
      if (deviceHit) {
        onDeviceSelectRef.current?.(deviceHit);
        return;
      }

      // The incident pin last of the pins, still before the readOnly guard: a
      // hit is a request to see the case, never a request to move it.
      if (await resolveIncidentClickRef.current(event)) {
        onIncidentSelectRef.current?.();
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
      // `latitude`/`longitude` convert out of the view's Web Mercator for a
      // single point on read, which is why the geocode can take them directly.
      const latitude = mapPoint.latitude ?? 0;
      const longitude = mapPoint.longitude ?? 0;
      try {
        const address = await arcgisGeocodeService.reverseGeocode({ latitude, longitude });
        onSelectRef.current({ address, latitude, longitude });
      } catch (error: unknown) {
        // Still surface the coordinates even if the address lookup fails.
        onSelectRef.current({ address: "", latitude, longitude });
        reportError("Failed to look up address for the selected point", error);
      } finally {
        setIsGeocoding(false);
      }
    });

    // Capture the camera into `viewpointRef` whenever the view settles, so the
    // NEXT mount (after this one unmounts on modal close) can restore it. Only
    // set up when a ref was supplied - the inline map is never remounted this
    // way and has nothing to gain from tracking it.
    let settleHandle: { remove: () => void } | null = null;
    if (viewpointRef || onBoundsChange) {
      settleHandle = reactiveUtils.watch(
        () => view.stationary,
        (stationary: boolean) => {
          if (!stationary) {
            return;
          }
          if (viewpointRef) {
            viewpointRef.current = {
              center: [view.center.longitude ?? 0, view.center.latitude ?? 0],
              zoom: view.zoom
            };
          }
          emitBounds();
        }
      );
    }

    return () => {
      searchHandle?.remove();
      clickHandle.remove();
      settleHandle?.remove();
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
              effectiveTheme={effectiveTheme}
              onSelectTheme={handleSelectTheme}
              effectiveLanguage={effectiveLanguage}
              onSelectLanguage={handleSelectLanguage}
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
          there once the lookup finishes.

          Lifted to `bottom-8` on the large map only (`showLocationInfo` is
          passed by the expanded instance alone): down at `bottom-2` the
          coordinates card overlaps the Esri attribution / provider URL strip
          the SDK draws along the bottom edge. The inline map keeps `bottom-2`
          so its transient toasts sit where they always have. */}
      <div
        className={`absolute left-2 z-10 flex flex-col gap-1 ${
          showLocationInfo ? "bottom-8" : "bottom-2"
        }`}
      >
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
        {bottomLeftSlot}
      </div>
      {overlaySlot}
    </div>
  );
}

export const ArcgisAddressMap = memo(ArcgisAddressMapBase);
ArcgisAddressMap.displayName = "ArcgisAddressMap";

export default ArcgisAddressMap;
