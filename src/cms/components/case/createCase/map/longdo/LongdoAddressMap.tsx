// Self-contained Longdo address picker - the Longdo implementation of
// AddressMapProps, and the mirror of ArcgisAddressMap.
//
// It resolves a location the same two ways: an app-built search box (forward
// geocode) and a click on the map (reverse geocode). Same props, same
// callbacks, same behaviour under `readOnly`.
//
// THE CLICK PATH IS NOT THE OBVIOUS ONE, and that is the important thing to
// know before editing this file. An overlay consumes the map's click: clicking
// a Longdo overlay fires `overlayClick` and NOT `click`, even when the overlay
// was created with `clickable: false` (verified against the SDK). So a boundary
// polygon drawn over the case area would silently kill the reverse geocode -
// the map's whole job on the case form.
//
// The fix has two halves:
//   1. Every DOM click on the container is recorded (position only).
//   2. `overlayClick` decides what was hit. An overlay the map treats as
//      interactive - a staff marker - reports a selection. Anything else is a
//      click that should have reached the map, so the recorded position is
//      converted back into a location (locationFromScreen) and handled exactly
//      as a map click.
// The SDK's own `click` still handles clicks that land on no overlay at all,
// and its coordinates are used verbatim when it does.
import { memo, useCallback, useEffect, useRef, useState } from "react";
import { Maximize2 } from "lucide-react";
import { useTheme } from "@/core/context/ThemeContext";
import { useTranslation } from "@/core/hooks/useTranslation";
import BasemapSwitcher from "../BasemapSwitcher";
import { MAP_CONTROL_REVEAL_ON_GROUP } from "../mapControlStyles";
import { BasemapOptionId, DEFAULT_BASEMAP_ID } from "../basemaps";
import type { AddressMapProps, MapLatLon } from "../mapTypes";
import type { StaffMarker } from "../staff/staffTypes";
import { longdoGeocodeService, type PlaceCandidate } from "../services/longdoGeocode";
import { applyLongdoBasemap, toLongdoLanguage } from "./longdoBasemaps";
import type { LongdoGlobal, LongdoLocation, LongdoMap, LongdoOverlay } from "./longdoApi";
import { locationFromScreen, readEventLocation } from "./longdoGeometry";
import { createCaseMarkerOptions } from "./longdoSymbols";
import { loadLongdo } from "./longdoSetup";
import { hideRedundantLongdoUi } from "./longdoUi";
import LongdoSearchBox from "./LongdoSearchBox";
import { useLongdoBoundaryOverlays } from "./boundaries/useLongdoBoundaryOverlays";
import {
  useLongdoStaffOverlays,
  type StaffOverlayClickResolver
} from "./staff/useLongdoStaffOverlays";
import { useLongdoBreadcrumbOverlay } from "./staff/useLongdoBreadcrumbOverlay";
import { useLongdoRouteOverlay } from "./staff/useLongdoRouteOverlay";
import { useLongdoSketchOverlay } from "./sketch/useLongdoSketchOverlay";

const DEFAULT_CENTER: [number, number] = [100.5018, 13.7563]; // Bangkok
const DEFAULT_ZOOM = 12;

// Stable empty list so maps without a staff overlay don't re-run the sync
// effect on every render.
const EMPTY_STAFF: readonly StaffMarker[] = [];

interface ScreenPosition {
  clientX: number;
  clientY: number;
}

function toLongdoLocation({ latitude, longitude }: MapLatLon): LongdoLocation {
  return { lon: longitude, lat: latitude };
}

function LongdoAddressMapBase({
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
  staff,
  showStaff = false,
  selectedStaffId = null,
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
}: AddressMapProps) {
  const { t, language } = useTranslation();
  const { theme } = useTheme();
  const isDarkTheme = theme === "dark";

  const containerRef = useRef<HTMLDivElement>(null);
  const longdoRef = useRef<LongdoGlobal | null>(null);
  const mapRef = useRef<LongdoMap | null>(null);
  const markerRef = useRef<LongdoOverlay | null>(null);
  // Signature of the basemap currently applied, so the sync effect can skip the
  // value the mount path already set - same bookkeeping as the ArcGIS side.
  const appliedBasemapRef = useRef<string | null>(null);
  const didRestoreViewpointRef = useRef(false);
  // Where the pointer last went down on the map, for the overlay-click recovery
  // described in the header. Position only - never a location, since the view
  // may have moved between the DOM event and the SDK's.
  const lastPointerRef = useRef<ScreenPosition | null>(null);
  // Answers "is this overlay one the staff layer owns, and what did clicking it
  // mean?". Populated by the staff layer hook while it is live. Three outcomes,
  // and the middle one is the one that is easy to get wrong:
  //   null                  not ours - treat the click as the map click the SDK
  //                         swallowed (this is the boundary-polygon case)
  //   { selection: null }   ours and already handled - a group we zoomed into.
  //                         Must NOT fall through to a reverse geocode.
  //   { selection }         report it.
  const resolveOverlaySelectionRef = useRef<StaffOverlayClickResolver | null>(null);
  // True while a sketch gesture owns the map's clicks. The ArcGIS
  // SketchViewModel swallows the click implicitly; here it has to be stated, or
  // every vertex placed while drawing would also drop a pin and reverse-geocode.
  const isSketchActiveRef = useRef(false);

  const [isReady, setIsReady] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  // The view's zoom as of the last settle. Held in state - not read from the
  // map on demand - because the boundary overlays' label thresholds depend on
  // it and have to re-evaluate when it changes. Updated on `idle` rather than
  // on every wheel step, so a pinch does not re-render per frame.
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
  const onStaffSelectRef = useRef(onStaffSelect);
  const languageRef = useRef(language);
  onSelectRef.current = onSelect;
  onErrorRef.current = onError;
  readOnlyRef.current = readOnly;
  onBasemapChangeRef.current = onBasemapChange;
  onStaffSelectRef.current = onStaffSelect;
  languageRef.current = language;

  const reportError = useCallback((message: string, error?: unknown) => {
    console.error(message, error);
    onErrorRef.current?.(message);
  }, []);

  // Administrative boundary polygons. Added to the existing map, drawn beneath
  // the case marker (which claims OverlayWeight.Top - see setMarker), and
  // rebuilt from cached geometry rather than refetched. See the hook's header
  // for why a rebuild is the right shape here and an assignment is not.
  const { isError: hasBoundaryError } = useLongdoBoundaryOverlays({
    longdoRef,
    mapRef,
    isReady,
    boundaries,
    language,
    isDarkTheme,
    zoom: settledZoom,
    suppressLabels: showStaff
  });

  // Staff markers, with the clustering shared with the ArcGIS layer. Installs
  // the overlay-click resolver above while it is live; a map without a staff
  // overlay leaves it null, and every overlay click is then a map click.
  useLongdoStaffOverlays({
    longdoRef,
    mapRef,
    isReady,
    staff: staff ?? EMPTY_STAFF,
    selectedStaffId,
    visible: showStaff,
    zoom: settledZoom,
    resolverRef: resolveOverlaySelectionRef
  });

  // The solved officer -> case route. Unlike every other overlay on this map it
  // is not drawn from geometry we hold: Longdo's router returns no shape, so the
  // SDK's own router is handed the endpoints and draws the line itself.
  useLongdoRouteOverlay({
    mapRef,
    isReady,
    route: route ?? null,
    visible: showRoute
  });

  // Where the selected officer has been. Sits above the boundaries and below the
  // case marker and staff markers, non-interactive, and never moves the camera.
  useLongdoBreadcrumbOverlay({
    longdoRef,
    mapRef,
    isReady,
    points: trail ?? null,
    visible: showTrail,
    isDarkTheme
  });

  // The boundary being drawn. Called LAST of the overlay hooks, matching the
  // ArcGIS map's ordering: it is the only interactive overlay here, and adding
  // it last is what puts its vertex handles above everything else.
  useLongdoSketchOverlay({
    longdoRef,
    mapRef,
    isReady,
    sketch,
    isDarkTheme,
    zoom: settledZoom,
    activeRef: isSketchActiveRef
  });

  /** Draw (or move) the single selection marker. */
  const setMarker = useCallback((location: LongdoLocation) => {
    const longdo = longdoRef.current;
    const map = mapRef.current;
    if (!longdo || !map) {
      return;
    }
    if (markerRef.current) {
      map.Overlays.remove(markerRef.current);
    }
    // OverlayWeight.Top, because insertion order decides draw order here and the
    // boundary polygons are rebuilt (and so re-added) long after this marker
    // was placed. Without it, switching on a boundary level would draw the
    // polygons over the case pin.
    const marker = new longdo.Marker(location, {
      ...createCaseMarkerOptions(""),
      weight: longdo.OverlayWeight.Top
    });
    markerRef.current = marker;
    map.Overlays.add(marker);
  }, []);

  /** Reverse geocode a location and report it. Shared by both click paths. */
  const resolveLocation = useCallback(
    async (location: LongdoLocation) => {
      setMarker(location);
      setIsGeocoding(true);
      const latitude = location.lat;
      const longitude = location.lon;
      try {
        const resolved = await longdoGeocodeService.reverseGeocode(
          { latitude, longitude },
          languageRef.current
        );
        onSelectRef.current({ address: resolved, latitude, longitude });
      } catch (error: unknown) {
        // Still surface the coordinates even if the address lookup fails.
        onSelectRef.current({ address: "", latitude, longitude });
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
      const location: LongdoLocation = { lon: candidate.longitude, lat: candidate.latitude };
      map?.location(location, true);

      // View-only: go there and stop. Moving the pin or reporting a selection
      // would look like the case location had been changed.
      if (readOnlyRef.current) {
        return;
      }
      setMarker(location);
      onSelectRef.current({
        address: candidate.address || candidate.name,
        latitude: candidate.latitude,
        longitude: candidate.longitude
      });
    },
    [setMarker]
  );

  // Build the map once on mount.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    let isCancelled = false;
    let map: LongdoMap | null = null;

    // Position only, captured on the way down: by the time `overlayClick`
    // arrives the SDK may already have moved the view.
    const handlePointerDown = (event: MouseEvent) => {
      lastPointerRef.current = { clientX: event.clientX, clientY: event.clientY };
    };
    container.addEventListener("mousedown", handlePointerDown, true);

    loadLongdo()
      .then((longdo) => {
        if (isCancelled) {
          return;
        }
        longdoRef.current = longdo;

        const restoredViewpoint = viewpointRef?.current ?? null;
        didRestoreViewpointRef.current = Boolean(restoredViewpoint);

        const center =
          restoredViewpoint?.center ??
          (value ? [value.longitude, value.latitude] : initialCenter);

        map = new longdo.Map({
          placeholder: container,
          location: { lon: center[0], lat: center[1] },
          zoom: restoredViewpoint?.zoom ?? initialZoom,
          language: toLongdoLanguage(languageRef.current)
        });
        mapRef.current = map;

        // Drop the native controls the app replaces (map-style selector,
        // fullscreen button). Registers a `ready` handler - v3 wires map.Ui
        // only then; see longdoUi.ts for why each control has to go.
        hideRedundantLongdoUi(map);

        applyLongdoBasemap(longdo, map, basemapId, isDarkTheme);
        appliedBasemapRef.current = `${basemapId}:${isDarkTheme ? "dark" : "light"}`;

        // A click that reached the map: the SDK reports where.
        map.Event.bind("click", (event: unknown) => {
          // A live sketch gesture owns every click - the vertex it just placed
          // must not also drop a pin. The sketch hook binds its own handler.
          if (readOnlyRef.current || isSketchActiveRef.current) {
            return;
          }
          const location = readEventLocation(event);
          if (location) {
            void resolveLocationRef.current(location);
          }
        });

        // A click the SDK gave to an overlay instead. See the header: this is
        // the only way a click on a boundary polygon can still place a pin.
        map.Event.bind("overlayClick", (event: unknown) => {
          const overlay = event as LongdoOverlay;

          // Staff markers are the only interactive overlay; the layer hook that
          // owns them resolves the click. Everything else - boundaries, the case
          // marker itself - is a click that belongs to the map.
          const outcome = resolveOverlaySelectionRef.current?.(overlay) ?? null;
          if (outcome) {
            // Ours either way. A null selection means the layer handled it by
            // zooming into a cluster, and must not also drop a pin.
            if (outcome.selection) {
              onStaffSelectRef.current?.(outcome.selection);
            }
            return;
          }

          // Same rule as the map's own click handler: a live sketch gesture owns
          // the click, including one that landed on the polygon being drawn.
          if (readOnlyRef.current || isSketchActiveRef.current || !map) {
            return;
          }
          const pointer = lastPointerRef.current;
          const bound = map.bound();
          if (!pointer || !bound) {
            return;
          }
          const location = locationFromScreen(
            bound,
            container.getBoundingClientRect(),
            pointer.clientX,
            pointer.clientY
          );
          if (location) {
            void resolveLocationRef.current(location);
          }
        });

        // Everything that cares about the view having settled, in one listener.
        // Bound once and never unbound - the SDK's `unbind` contract for a
        // specific callback is not something this app should rely on, and the
        // map is destroyed wholesale on teardown anyway.
        map.Event.bind("idle", () => {
          const settled = mapRef.current;
          if (!settled) {
            return;
          }
          const currentZoom = settled.zoom();
          // Feeds the boundary label thresholds. Same value in means no
          // re-render, so a pan costs nothing.
          setSettledZoom((previous) => (previous === currentZoom ? previous : currentZoom));

          // The camera the NEXT mount restores, after the modal closes and
          // reopens. Only tracked when a ref was supplied.
          if (viewpointRef) {
            const location = settled.location();
            viewpointRef.current = {
              center: [location.lon, location.lat],
              zoom: currentZoom
            };
          }
        });

        if (value) {
          setMarker(toLongdoLocation(value));
        }
        setIsReady(true);
      })
      .catch((error: unknown) => {
        if (isCancelled) {
          return;
        }
        reportError("Failed to initialise map", error);
      });

    return () => {
      isCancelled = true;
      container.removeEventListener("mousedown", handlePointerDown, true);

      // The SDK exposes no documented teardown, so take whichever it has and
      // fall back to emptying the container. Leaving a live map behind would
      // leak a WebGL context every time the expand modal closes.
      const disposable = map as unknown as { destroy?: () => void; remove?: () => void } | null;
      if (typeof disposable?.destroy === "function") {
        disposable.destroy();
      } else if (typeof disposable?.remove === "function") {
        disposable.remove();
      }
      container.innerHTML = "";

      mapRef.current = null;
      markerRef.current = null;
      longdoRef.current = null;
    };
    // Build-once: initial center/zoom are read at mount; later `value` changes
    // are handled by the sync effect below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Apply basemap changes made after mount (user picked one, or the app
  // switched to dark mode).
  useEffect(() => {
    const longdo = longdoRef.current;
    const map = mapRef.current;
    if (!isReady || !longdo || !map) {
      return;
    }
    const signature = `${basemapId}:${isDarkTheme ? "dark" : "light"}`;
    if (appliedBasemapRef.current === signature) {
      return;
    }
    appliedBasemapRef.current = signature;
    applyLongdoBasemap(longdo, map, basemapId, isDarkTheme);
  }, [isReady, basemapId, isDarkTheme]);

  // Follow the app language.
  useEffect(() => {
    const map = mapRef.current;
    if (!isReady || !map) {
      return;
    }
    map.language(toLongdoLanguage(language));
  }, [isReady, language]);

  // Re-centre + re-mark when a controlled `value` arrives after mount.
  useEffect(() => {
    const map = mapRef.current;
    if (!isReady || !map || !value) {
      return;
    }
    // Skip exactly once on a mount that restored its camera - jumping to the
    // marker here would immediately undo that restore.
    if (didRestoreViewpointRef.current) {
      didRestoreViewpointRef.current = false;
      return;
    }
    const location = toLongdoLocation(value);
    setMarker(location);
    map.location(location, true);
    if (map.zoom() < initialZoom) {
      map.zoom(initialZoom, true);
    }
  }, [isReady, value, initialZoom, setMarker]);

  return (
    <div
      className={`relative overflow-hidden rounded-lg border border-gray-200 dark:border-gray-800 ${className}`}
      style={{ height }}
    >
      <div ref={containerRef} className="h-full w-full" />

      {isSearchEnabled && isReady && (
        // `left-14`, not `left-2`: Longdo draws its own zoom / geolocation
        // buttons in the top-left corner, and at `left-2` the search box sits
        // right on top of them.
        <div className="absolute left-14 top-2 z-10">
          <LongdoSearchBox
            onSelect={handleSearchSelect}
            onError={onError}
            compact={compactControls}
          />
        </div>
      )}

      {/* One toolbar row in the top-right corner, laid out exactly as the ArcGIS
          map lays it out: reading inward from the right it is expand, map style,
          then the caller's own controls.

          `top-2`, same as the ArcGIS map: Longdo's own Map-style and Full-Screen
          buttons would sit here too, but hideRedundantLongdoUi removes both, so
          this corner is clear. */}
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

      {/* Lifted to `bottom-8` on the large map only (`showLocationInfo` is set
          by the expanded instance alone): at `bottom-2` the coordinates card
          covers Longdo's own zoom-level / depth readout in the bottom strip.
          The inline map keeps `bottom-2` for its transient toasts. */}
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
        {/* Geocoding wins over the boundary error: it is transient and tied to
            something the user just did, whereas a failed boundary load persists
            and will still be there once the lookup finishes. Same ordering the
            ArcGIS map uses. */}
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
      </div>
      {overlaySlot}
    </div>
  );
}

export const LongdoAddressMap = memo(LongdoAddressMapBase);
LongdoAddressMap.displayName = "LongdoAddressMap";

export default LongdoAddressMap;
