// Self-contained MapTiler address picker - the MapLibre GL implementation of
// AddressMapProps, and the mirror of ArcgisAddressMap / LongdoAddressMap.
//
// It resolves a location the same two ways: an app-built search box (forward
// geocode) and a click on the map (reverse geocode). Same props, same
// callbacks, same behaviour under `readOnly`.
//
// THE ONE STRUCTURAL DIFFERENCE from the other two providers is style swapping.
// ArcGIS swaps its basemap in place (`map.basemap = ...`) and Longdo swaps its
// base layer in place (`Layers.setBase(...)`); MapLibre's basemap IS the style,
// and `map.setStyle(url)` DROPS every source and layer this app added. So every
// overlay that is a source/layer (boundaries, the route line, the breadcrumb,
// the sketch rubber band) re-adds itself when `styleEpoch` bumps - which this
// component does once per completed style load. DOM markers (the case pin, staff
// markers, sketch vertex handles) are not part of the style and survive a swap
// untouched, so they do not depend on `styleEpoch`.
//
// Label LANGUAGE also rides the style: maplibre-gl 6 has no `map.setLanguage`,
// so the language is a query parameter on the MapTiler style URL and a language
// change is just another style swap.
import { memo, useCallback, useEffect, useRef, useState } from "react";
import { Maximize2 } from "lucide-react";
import { Map as MlMap, Marker, NavigationControl, type MapMouseEvent } from "maplibre-gl";
import { useTheme } from "@/core/context/ThemeContext";
import { useTranslation } from "@/core/hooks/useTranslation";
import BasemapSwitcher from "../BasemapSwitcher";
import {
  MAP_CONTROL_BORDER_CLASS,
  MAP_CONTROL_REVEAL_ON_GROUP,
  mapBottomLeftRowClass
} from "../mapControlStyles";
import { BasemapOptionId, DEFAULT_BASEMAP_ID } from "../basemaps";
import AnchoredOverlayLayer from "../AnchoredOverlayLayer";
import type { AddressMapProps, MapAnchoredOverlay, MapLatLon, StaffConnector } from "../mapTypes";
import type { StaffMarker } from "../staff/staffTypes";
import type { PlaceMarker } from "../place/placeTypes";
import type { DeviceMarker } from "../device/deviceTypes";
import { maptilerGeocodeService, type PlaceCandidate } from "../services/maptilerGeocode";
import { ensureMapTilerWorker } from "./maptilerSetup";
import { mapTilerStyleFor, mapTilerStyleSignature } from "./maptilerBasemaps";
import { createCaseMarkerElement, setCaseMarkerClickable } from "./maptilerSymbols";
import { useMapTilerFocusRequest } from "./useMapTilerFocusRequest";
import MapTilerSearchBox from "./MapTilerSearchBox";
import { useMapTilerBoundaryOverlays } from "./boundaries/useMapTilerBoundaryOverlays";
import { useMapTilerStaffOverlays } from "./staff/useMapTilerStaffOverlays";
import { useMapTilerStaffDrag } from "./staff/useMapTilerStaffDrag";
import { useMapTilerScreenProjector } from "./useMapTilerScreenProjector";
import { useMapTilerPlaceOverlays } from "./place/useMapTilerPlaceOverlays";
import { useMapTilerDeviceOverlays } from "./device/useMapTilerDeviceOverlays";
import { useMapTilerRouteOverlay } from "./staff/useMapTilerRouteOverlay";
import { useMapTilerStaffConnectorOverlay } from "./staff/useMapTilerStaffConnectorOverlay";
import { useMapTilerBreadcrumbOverlay } from "./staff/useMapTilerBreadcrumbOverlay";
import { useMapTilerSketchOverlay } from "./sketch/useMapTilerSketchOverlay";
import { useMapTilerIncidentRadiusOverlay } from "./incidentRadius/useMapTilerIncidentRadiusOverlay";

const DEFAULT_CENTER: [number, number] = [100.5018, 13.7563]; // Bangkok
const DEFAULT_ZOOM = 12;

// Stable empty list so maps without a staff overlay don't re-run the sync
// effect on every render.
const EMPTY_STAFF: readonly StaffMarker[] = [];
const EMPTY_PLACES: readonly PlaceMarker[] = [];
const EMPTY_DEVICES: readonly DeviceMarker[] = [];
const EMPTY_CONNECTORS: readonly StaffConnector[] = [];
const EMPTY_DRAGGABLE_IDS: ReadonlySet<string> = new Set();
const EMPTY_ANCHORED_OVERLAYS: readonly MapAnchoredOverlay[] = [];

function MapTilerAddressMapBase({
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
  onStaffSelect,
  draggableStaffIds = EMPTY_DRAGGABLE_IDS,
  onStaffDropOnIncident,
  anchoredOverlays = EMPTY_ANCHORED_OVERLAYS,
  staff,
  showStaff = false,
  selectedStaffId = null,
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
  // See ArcgisAddressMap's identical comment: `effectiveTheme`/
  // `effectiveLanguage` feed the map's own rendered style/language, while
  // `theme`/`language` (unchanged) still drive this component's own UI text.
  const effectiveTheme = mapTheme ?? theme;
  const effectiveLanguage = mapLanguage ?? language;
  const isDarkTheme = effectiveTheme === "dark";
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
  const mapRef = useRef<MlMap | null>(null);
  const markerRef = useRef<Marker | null>(null);
  const appliedStyleRef = useRef<string | null>(null);
  const didRestoreViewpointRef = useRef(false);
  // True while a sketch gesture owns the map's clicks, so the map's own click
  // handler does not also reverse-geocode them. The sketch hook flips it.
  const isSketchActiveRef = useRef(false);

  const [isReady, setIsReady] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  // Bumped once per completed style load. Every source/layer overlay hook keys
  // its build effect on this so it re-adds what `setStyle` discarded.
  const [styleEpoch, setStyleEpoch] = useState(0);
  // The view's zoom as of the last settle. Held in state - not read on demand -
  // because the boundary overlays' label thresholds depend on it.
  const [settledZoom, setSettledZoom] = useState(initialZoom);
  const [internalBasemapId, setInternalBasemapId] = useState<BasemapOptionId>(
    basemapIdProp ?? DEFAULT_BASEMAP_ID
  );

  const basemapId = basemapIdProp ?? internalBasemapId;
  const isSearchEnabled = showSearch ?? !readOnly;

  // Latest callbacks in refs, so the map is built exactly once while its
  // handlers still see current values.
  const onSelectRef = useRef(onSelect);
  const onErrorRef = useRef(onError);
  const readOnlyRef = useRef(readOnly);
  const onBasemapChangeRef = useRef(onBasemapChange);
  const onBoundsChangeRef = useRef(onBoundsChange);
  const onIncidentSelectRef = useRef(onIncidentSelect);
  const languageRef = useRef(effectiveLanguage);
  // Only the dispatch map passes `onIncidentSelect`; everywhere else the pin stays
  // transparent to the pointer and a click near it moves it, as before.
  const isIncidentClickable = Boolean(onIncidentSelect);
  const isIncidentClickableRef = useRef(isIncidentClickable);
  onSelectRef.current = onSelect;
  onErrorRef.current = onError;
  readOnlyRef.current = readOnly;
  onBasemapChangeRef.current = onBasemapChange;
  onBoundsChangeRef.current = onBoundsChange;
  onIncidentSelectRef.current = onIncidentSelect;
  isIncidentClickableRef.current = isIncidentClickable;
  languageRef.current = effectiveLanguage;

  const reportError = useCallback((message: string, error?: unknown) => {
    console.error(message, error);
    onErrorRef.current?.(message);
  }, []);

  // Administrative boundary polygons. Source + fill/line/symbol layers, re-added
  // on every style swap.
  const { isError: hasBoundaryError } = useMapTilerBoundaryOverlays({
    mapRef,
    isReady,
    styleEpoch,
    boundaries,
    language: effectiveLanguage,
    isDarkTheme,
    zoom: settledZoom,
    suppressLabels: showStaff
  });

  // Staff markers, with the clustering shared with the ArcGIS / Longdo layers.
  // DOM markers, so no styleEpoch dependency.
  useMapTilerStaffOverlays({
    mapRef,
    isReady,
    staff: staff ?? EMPTY_STAFF,
    selectedStaffId,
    visible: showStaff,
    zoom: settledZoom,
    onSelect: onStaffSelect
  });

  // Drag an officer onto the case pin to assign them. Inert while
  // `draggableStaffIds` is empty; never moves the pin or reports a location.
  useMapTilerStaffDrag({
    mapRef,
    isReady,
    draggableStaffIds,
    staff: staff ?? EMPTY_STAFF,
    caseLocation: value,
    onDrop: onStaffDropOnIncident
  });

  // Anchored popups (e.g. assign-undo) follow the map as it moves; the "move"
  // listener only runs while there is something anchored.
  const { project: projectToScreen, revision: viewRevision } = useMapTilerScreenProjector({
    mapRef,
    isReady,
    enabled: anchoredOverlays.length > 0
  });

  // Org-curated Place markers. DOM markers with their own click listener, so no
  // styleEpoch, no zoom re-sync, and no map-click surgery: the element's
  // stopPropagation() keeps a marker click off the map. Read-only (Q1).
  useMapTilerPlaceOverlays({
    mapRef,
    isReady,
    places: places ?? EMPTY_PLACES,
    selectedPlaceId,
    visible: showPlace,
    zoom: settledZoom,
    onSelect: onPlaceSelect
  });

  // Viewport-scoped IoT device markers. DOM markers with their own click
  // listener (stopPropagation keeps a marker click off the map), so no
  // styleEpoch, no zoom re-sync, no map-click surgery. A hit opens the caller's
  // info popup; the "link" write happens only from its button (Q2).
  useMapTilerDeviceOverlays({
    mapRef,
    isReady,
    devices: devices ?? EMPTY_DEVICES,
    selectedDeviceId,
    visible: showDevice,
    zoom: settledZoom,
    onSelect: onDeviceSelect
  });

  // Straight dashed lines from each staff member to the incident pin. Not a route:
  // nothing is solved. Called BEFORE the route overlay, because layers added later
  // draw on top and a solved route has to stay above these.
  useMapTilerStaffConnectorOverlay({
    mapRef,
    isReady,
    styleEpoch,
    connectors: staffConnectors ?? EMPTY_CONNECTORS,
    incident: value,
    visible: showStaff,
    isDarkTheme
  });

  // The solved officer -> case route. ORS returns geometry, so this draws the
  // path directly (like the ArcGIS overlay, unlike Longdo's re-solve).
  useMapTilerRouteOverlay({
    mapRef,
    isReady,
    styleEpoch,
    route: route ?? null,
    visible: showRoute,
    isDarkTheme
  });

  // Where the selected officer has been.
  useMapTilerBreadcrumbOverlay({
    mapRef,
    isReady,
    styleEpoch,
    points: trail ?? null,
    visible: showTrail,
    isDarkTheme
  });

  // The boundary being drawn / reshaped. Called last, matching the other two
  // providers' hook ordering.
  useMapTilerSketchOverlay({
    mapRef,
    isReady,
    styleEpoch,
    sketch,
    isDarkTheme,
    activeRef: isSketchActiveRef
  });

  // The no-match fallback radius circle. Source + fill/line layers, re-added on
  // every style swap. Only ever renders when `incidentRadius` is set - i.e. the
  // incident matched no single Service Center polygon.
  useMapTilerIncidentRadiusOverlay({
    mapRef,
    isReady,
    styleEpoch,
    incidentRadius,
    isDarkTheme
  });

  // "Focus" commands from the caller (e.g. centre on a responder).
  useMapTilerFocusRequest({ mapRef, isReady, focusRequest });

  /** Draw (or move) the single selection marker. */
  const setMarker = useCallback((location: MapLatLon) => {
    const map = mapRef.current;
    if (!map) {
      return;
    }
    if (!markerRef.current) {
      const element = createCaseMarkerElement();
      setCaseMarkerClickable(element, isIncidentClickableRef.current);
      // Same shape as the staff / place markers: the element owns its click and
      // stopPropagation() keeps it off the map's own click (which would
      // reverse-geocode). A no-op unless the caller passed `onIncidentSelect`.
      element.addEventListener("click", (event) => {
        if (!onIncidentSelectRef.current) {
          return;
        }
        event.stopPropagation();
        onIncidentSelectRef.current();
      });
      markerRef.current = new Marker({ element, anchor: "center" });
    }
    markerRef.current.setLngLat([location.longitude, location.latitude]).addTo(map);
  }, []);

  // A pin that already exists when the callback appears or goes away (the marker
  // is created lazily, so it can predate this flag changing).
  useEffect(() => {
    const element = markerRef.current?.getElement();
    if (element) {
      setCaseMarkerClickable(element, isIncidentClickable);
    }
  }, [isIncidentClickable, isReady]);

  /** Reverse geocode a location and report it. Shared by both click paths. */
  const resolveLocation = useCallback(
    async (location: MapLatLon) => {
      setMarker(location);
      setIsGeocoding(true);
      try {
        const resolved = await maptilerGeocodeService.reverseGeocode(location, languageRef.current);
        onSelectRef.current({ address: resolved, ...location });
      } catch (error: unknown) {
        onSelectRef.current({ address: "", ...location });
        reportError("Failed to look up address for the selected point", error);
      } finally {
        setIsGeocoding(false);
      }
    },
    [reportError, setMarker]
  );
  const resolveLocationRef = useRef(resolveLocation);
  resolveLocationRef.current = resolveLocation;

  const handleBasemapChange = useCallback((id: BasemapOptionId) => {
    setInternalBasemapId(id);
    onBasemapChangeRef.current?.(id);
  }, []);

  /** A picked search result: navigate in view-only mode, otherwise move the pin. */
  const handleSearchSelect = useCallback(
    (candidate: PlaceCandidate) => {
      const map = mapRef.current;
      const location: MapLatLon = {
        latitude: candidate.latitude,
        longitude: candidate.longitude
      };
      map?.easeTo({ center: [location.longitude, location.latitude] });

      if (readOnlyRef.current) {
        return;
      }
      setMarker(location);
      onSelectRef.current({
        address: candidate.address || candidate.name,
        ...location
      });
    },
    [setMarker]
  );

  // Build the map once on mount.
  //
  // Async, like LongdoAddressMap's mount effect: the tile worker URL has to be
  // pinned (a dynamic import - see maptilerSetup) before the first
  // `maplibregl.Map` is constructed, or tiles never decode.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    let isCancelled = false;
    let map: MlMap | null = null;

    ensureMapTilerWorker()
      .then(() => {
        if (isCancelled || !containerRef.current) {
          return;
        }

        const restoredViewpoint = viewpointRef?.current ?? null;
        didRestoreViewpointRef.current = Boolean(restoredViewpoint);
        const center =
          restoredViewpoint?.center ??
          (value ? [value.longitude, value.latitude] : initialCenter);
        const style = mapTilerStyleFor(basemapId, isDarkTheme, languageRef.current);
        appliedStyleRef.current = mapTilerStyleSignature(
          basemapId,
          isDarkTheme,
          languageRef.current
        );

        map = new MlMap({
          container: containerRef.current,
          style,
          center: center as [number, number],
          zoom: restoredViewpoint?.zoom ?? initialZoom,
          attributionControl: { compact: true }
        });
        mapRef.current = map;
        map.addControl(new NavigationControl({ showCompass: false }), "bottom-right");

        map.on("load", () => {
          if (value) {
            setMarker(value);
          }
          setIsReady(true);
          setStyleEpoch((epoch) => epoch + 1);
          // Kick off the first Device fetch for the initial viewport.
          const current = mapRef.current;
          if (onBoundsChangeRef.current && current) {
            const b = current.getBounds();
            onBoundsChangeRef.current({
              minLat: b.getSouth(),
              minLon: b.getWest(),
              maxLat: b.getNorth(),
              maxLon: b.getEast()
            });
          }
        });

        // A completed style swap: let every source/layer overlay hook rebuild
        // what setStyle discarded.
        map.on("style.load", () => {
          setStyleEpoch((epoch) => epoch + 1);
        });

        map.on("error", (event) => {
          // MapLibre surfaces tile / style / source failures here. Logged rather
          // than routed through onError, which callers render as a geocode
          // failure.
          console.error("MapTiler map error", (event as { error?: unknown })?.error ?? event);
        });

        map.on("click", (event: MapMouseEvent) => {
          if (readOnlyRef.current || isSketchActiveRef.current) {
            return;
          }
          void resolveLocationRef.current({
            latitude: event.lngLat.lat,
            longitude: event.lngLat.lng
          });
        });

        map.on("moveend", () => {
          const current = mapRef.current;
          if (!current) {
            return;
          }
          const zoom = current.getZoom();
          setSettledZoom((previous) => (previous === zoom ? previous : zoom));
          if (viewpointRef) {
            const centre = current.getCenter();
            viewpointRef.current = { center: [centre.lng, centre.lat], zoom };
          }
          // The current visible extent, for the Device layer's viewport fetch.
          // `useDeviceLayer` debounces + de-dupes these, so reporting on every
          // settle (including programmatic moves) is cheap.
          if (onBoundsChangeRef.current) {
            const b = current.getBounds();
            onBoundsChangeRef.current({
              minLat: b.getSouth(),
              minLon: b.getWest(),
              maxLat: b.getNorth(),
              maxLon: b.getEast()
            });
          }
        });
      })
      .catch((error: unknown) => {
        if (!isCancelled) {
          reportError("Failed to initialise map", error);
        }
      });

    return () => {
      isCancelled = true;
      map?.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // Build-once: initial center/zoom are read at mount; later `value` changes
    // are handled by the sync effect below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Apply basemap / theme / language changes made after mount by swapping the
  // style.
  useEffect(() => {
    const map = mapRef.current;
    if (!isReady || !map) {
      return;
    }
    const signature = mapTilerStyleSignature(basemapId, isDarkTheme, effectiveLanguage);
    if (appliedStyleRef.current === signature) {
      return;
    }
    appliedStyleRef.current = signature;
    try {
      map.setStyle(mapTilerStyleFor(basemapId, isDarkTheme, effectiveLanguage));
    } catch (error: unknown) {
      reportError("Failed to switch the map style", error);
    }
  }, [isReady, basemapId, isDarkTheme, effectiveLanguage, reportError]);

  // Re-centre + re-mark when a controlled `value` arrives after mount.
  useEffect(() => {
    const map = mapRef.current;
    if (!isReady || !map || !value) {
      return;
    }
    if (didRestoreViewpointRef.current) {
      didRestoreViewpointRef.current = false;
      return;
    }
    setMarker(value);
    map.easeTo({
      center: [value.longitude, value.latitude],
      zoom: Math.max(map.getZoom(), initialZoom)
    });
  }, [isReady, value, initialZoom, setMarker]);

  return (
    <div
      className={`relative overflow-hidden rounded-lg border border-gray-200 dark:border-gray-800 ${className}`}
      style={{ height }}
    >
      <div ref={containerRef} className="h-full w-full" />

      {anchoredOverlays.length > 0 && (
        <AnchoredOverlayLayer
          overlays={anchoredOverlays}
          project={projectToScreen}
          revision={viewRevision}
        />
      )}

      {isSearchEnabled && isReady && (
        // `z-20`, a step above the rest of the map's overlays (`z-10`): the
        // results list drops down the top-left column that the staff
        // detail/group card also occupies (see CaseStaffMapField), and the
        // card - rendered last - would otherwise cover the list.
        <div className="absolute left-2 top-2 z-20">
          <MapTilerSearchBox
            onSelect={handleSearchSelect}
            onError={onError}
            compact={compactControls}
          />
        </div>
      )}

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
            <button
              type="button"
              onClick={onExpand}
              title={t("case.display.map_expand")}
              aria-label={t("case.display.map_expand")}
              className={`group flex items-center gap-1 rounded-md bg-white/90 px-2 py-1 text-xs text-gray-700 shadow-sm transition-colors hover:bg-white dark:bg-gray-800/90 dark:text-gray-200 dark:hover:bg-gray-800 ${MAP_CONTROL_BORDER_CLASS}`}
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

      {/* Bottom-left row: address/coordinates card, one status line, then any
          Place/Device group or info popup (bottomLeftSlot) - left-to-right,
          not stacked, so the group's height stays bounded by its tallest
          single card. CaseStaffMapField's CARD_DOCK_CLASS reserves
          MAP_BOTTOM_LEFT_CLEARANCE_CLASS of clearance at the very bottom so
          an open Case/Staff card can't grow down into this row. */}
      <div className={mapBottomLeftRowClass(showLocationInfo)}>
        {showLocationInfo && value && (
          <div className={`max-w-xs rounded-md bg-white/90 px-2 py-1 text-xs text-gray-700 shadow-sm dark:bg-gray-800/90 dark:text-gray-200 ${MAP_CONTROL_BORDER_CLASS}`}>
            {address && <div className="truncate font-medium">{address}</div>}
            <div className="text-gray-500 dark:text-gray-400">
              {t("case.display.location_coordinates")}: {value.latitude}, {value.longitude}
            </div>
          </div>
        )}
        {isGeocoding ? (
          <div className="rounded bg-black/60 px-2 py-1 text-xs text-white">
            {t("case.display.map_geocoding")}
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

export const MapTilerAddressMap = memo(MapTilerAddressMapBase);
MapTilerAddressMap.displayName = "MapTilerAddressMap";

export default MapTilerAddressMap;
