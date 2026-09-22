// Keeps administrative boundary GeoJSONLayers in sync with the applied
// selection.
//
// Follows the same three rules as useStaffGraphicsLayer:
//
//   1. Layers are added to the EXISTING map. Rebuilding the MapView to change
//      boundaries would discard the user's pan/zoom, the case marker and the
//      staff layer - the same reason the basemap is swapped in place.
//   2. Everything updates in place where possible. Selection (within an
//      already-fetched level), language, theme and label suppression each
//      reassign one property; none of them recreate a layer, which would
//      re-download and re-parse the geometry for a colour change.
//   3. Draw order is set explicitly, never inferred from insertion order. Three
//      different components now add layers to this map.
//
// ONE exception to rule 2: the "district" level is special-cased, because
// under orgAreaSource it is genuinely level-of-detail (see boundarySource.ts) -
// getLayerUrl("district", selection) fetches ONLY the selected provinces'
// district geometry, so a change to WHICH PROVINCES are selected has to
// re-fetch and swap that one layer's url, not just its definitionExpression.
// Country and province stay build-once (both sources always fetch their
// whole dataset for those two levels), and the district layer's OWN
// definitionExpression still applies afterward, to filter within whichever
// provinces' districts are currently fetched down to the ones actually
// checked (REQ: a province being fetched is not the same as every district
// in it being drawn).
//
// Labels are suppressed (not the fill/outline) while the staff layer is on:
// the ArcGIS label engine composites GeoJSONLayer labels in a pass above
// GraphicsLayer content regardless of `map.layers` order, so a cluster's icon
// and count can end up unreadable under a province/district/subdistrict name.
// `layer.labelsVisible` is the only runtime lever for this - there is no way
// to draw the staff graphics "above" the label pass instead.
//
// GeoJSONLayer rather than a GraphicsLayer of polygons: only a feature-based
// layer gives us the label engine (placement, deconfliction, scale ranges) and
// SQL filtering. Hand-drawn graphics would mean reimplementing all of it.
import { useEffect, useRef, useState } from "react";
import GeoJSONLayer from "@arcgis/core/layers/GeoJSONLayer.js";
import type esriMap from "@arcgis/core/Map.js";
import type { Language } from "@/core/config/i18n";
import { boundarySource } from "./boundarySource";
import { BOUNDARY_LEVELS, buildDefinitionExpression, outFieldsFor, type BoundaryLevelConfig } from "./boundaryLevels";
import { createBoundaryLabelClass, createBoundaryRenderer } from "./boundarySymbols";
import { EMPTY_BOUNDARY_SELECTION, type BoundaryLayerConfig } from "./boundaryTypes";

interface UseAdminBoundaryLayersOptions {
  mapRef: React.MutableRefObject<esriMap | null>;
  /** True once the MapView has resolved; refs are only safe to touch after this. */
  isReady: boolean;
  /** Undefined on maps that do not show boundaries at all. */
  boundaries?: BoundaryLayerConfig;
  language: Language;
  isDarkTheme: boolean;
  /** True while the staff layer is visible - see the header comment. */
  suppressLabels: boolean;
}

export interface UseAdminBoundaryLayersResult {
  /** True if any level failed to load, for the controls' status line. */
  isError: boolean;
}

/** Every level except "district" - built once on mount, never re-fetched. */
const BUILD_ONCE_LEVELS: readonly BoundaryLevelConfig[] = BOUNDARY_LEVELS.filter(
  (config) => config.level !== "district"
);

/** Undefined only if a future level table drops "district" entirely. */
const DISTRICT_CONFIG: BoundaryLevelConfig | undefined = BOUNDARY_LEVELS.find(
  (config) => config.level === "district"
);

function buildLayer(
  config: BoundaryLevelConfig,
  url: string,
  selection: BoundaryLayerConfig["selection"],
  visible: boolean,
  language: Language,
  isDarkTheme: boolean,
  labelsVisible: boolean
): GeoJSONLayer {
  const layer = new GeoJSONLayer({
    id: `boundary-${config.level}`,
    url,
    objectIdField: "OBJECTID",
    // Every feature the source emits is a Polygon. Declared rather than
    // inferred so a level with nothing drawn yet (country today, and all
    // three for a brand-new org) stays a valid EMPTY polygon layer:
    // GeoJSONLayer infers `null` from an empty FeatureCollection, and
    // `isTable` (loaded && geometryType == null) makes the layer view refuse
    // to create with `featurelayerview:table-not-supported` - which
    // `layer.load()` below cannot catch, since a table loads just fine. This
    // also makes the SDK read ONLY Polygon features, so it has to change
    // alongside the MultiPolygon note in boundarySource.ts if the backend
    // starts returning multi-part geometry.
    geometryType: "polygon",
    outFields: outFieldsFor(config),
    // REQUIRED. A popup would swallow map clicks, breaking the reverse-geocode
    // in create mode and the staff hit-test in detail mode.
    popupEnabled: false,
    legendEnabled: false,
    visible,
    definitionExpression: buildDefinitionExpression(config, selection),
    renderer: createBoundaryRenderer(config, isDarkTheme),
    labelingInfo: [createBoundaryLabelClass(config, language, isDarkTheme)],
    labelsVisible
  });
  return layer;
}

export function useAdminBoundaryLayers({
  mapRef,
  isReady,
  boundaries,
  language,
  isDarkTheme,
  suppressLabels
}: UseAdminBoundaryLayersOptions): UseAdminBoundaryLayersResult {
  const buildOnceLayersRef = useRef<GeoJSONLayer[]>([]);
  const districtLayerRef = useRef<GeoJSONLayer | null>(null);
  const [isError, setIsError] = useState(false);

  const isEnabled = Boolean(boundaries);
  const selection = boundaries?.selection;
  const visibility = boundaries?.visibility;
  // The set of selected provinces, as a stable primitive - selection.province
  // is a new array on every apply, so an effect keyed on the array itself
  // would re-run whenever ANY level's selection changed, not just province's.
  const districtProvinceKey = selection?.province.join(",") ?? "";

  // The mount effect reads these through refs so that it can stay a build-once
  // effect: including them as dependencies would tear down and re-download every
  // layer whenever the user changed a checkbox or flipped the theme.
  const selectionRef = useRef(selection);
  const visibilityRef = useRef(visibility);
  const languageRef = useRef(language);
  const isDarkThemeRef = useRef(isDarkTheme);
  const suppressLabelsRef = useRef(suppressLabels);
  selectionRef.current = selection;
  visibilityRef.current = visibility;
  languageRef.current = language;
  isDarkThemeRef.current = isDarkTheme;
  suppressLabelsRef.current = suppressLabels;

  /** Every currently-built layer paired with its config - country/province plus district, if built. */
  function forEachLayer(fn: (layer: GeoJSONLayer, config: BoundaryLevelConfig) => void): void {
    BUILD_ONCE_LEVELS.forEach((config, index) => {
      const layer = buildOnceLayersRef.current[index];
      if (layer) {
        fn(layer, config);
      }
    });
    if (DISTRICT_CONFIG && districtLayerRef.current) {
      fn(districtLayerRef.current, DISTRICT_CONFIG);
    }
  }

  // Build country/province once. Deliberately does NOT depend on selection/
  // language/theme - those are applied by the effects below, onto the same
  // layer objects.
  //
  // Async, because a server-backed source has to fetch before it can produce a
  // URL (see boundarySource.ts). That makes two things load-bearing: the
  // `isCancelled` guard, since the effect can resolve after unmount or after a
  // re-run, and releasing the URLs in cleanup, since a blob: URL that is never
  // revoked leaks its whole FeatureCollection for the life of the document.
  useEffect(() => {
    const map = mapRef.current;
    if (!isReady || !map || !isEnabled || BUILD_ONCE_LEVELS.length === 0) {
      return;
    }
    setIsError(false);

    let isCancelled = false;
    // Populated as the effect resolves, and read by cleanup - which may run
    // before any of it exists.
    let created: GeoJSONLayer[] = [];
    let retainedUrls: string[] = [];

    const build = async () => {
      const urls = await Promise.all(
        BUILD_ONCE_LEVELS.map((config) =>
          boundarySource.getLayerUrl(config.level, selectionRef.current ?? EMPTY_BOUNDARY_SELECTION)
        )
      );

      // Unmounted while fetching: hand the URLs straight back, since cleanup has
      // already run and will not see them.
      if (isCancelled) {
        urls.forEach((url) => boundarySource.releaseLayerUrl(url));
        return;
      }
      retainedUrls = urls;

      // Read AFTER the await, not before it. The selection is empty on the first
      // render and only fills in once the index resolves, so a value captured at
      // the top of the effect would usually be the empty one - and because the
      // selection effect below runs while the ref is still empty, its update
      // would be lost and every layer would stay filtered to "1=0", drawing
      // nothing at all. The ref is reassigned on every render, so by the time
      // this line runs it holds the current applied selection.
      const selectionNow = selectionRef.current ?? EMPTY_BOUNDARY_SELECTION;

      created = BUILD_ONCE_LEVELS.map((config, index) =>
        buildLayer(
          config,
          urls[index],
          selectionNow,
          visibilityRef.current?.[config.level] ?? false,
          languageRef.current,
          isDarkThemeRef.current,
          // From the ref, not a literal true: the effect below may already have
          // run and found no layers to suppress, so a layer built afterwards has
          // to start in whatever state that effect would have put it in.
          !suppressLabelsRef.current
        )
      );

      created.forEach((layer, index) => {
        layer.load().catch((error: unknown) => {
          console.error(`Failed to load the ${BUILD_ONCE_LEVELS[index].level} boundary layer`, error);
          setIsError(true);
        });
      });

      map.addMany(created);
      // Bottom of the stack, finest level highest within the group, so the case
      // marker and the staff layer always stay clickable above them. Done after
      // addMany because reorder needs the layer to already be in the map.
      BUILD_ONCE_LEVELS.forEach((config, index) => map.reorder(created[index], config.drawIndex));
      buildOnceLayersRef.current = created;
    };

    build().catch((error: unknown) => {
      if (isCancelled) {
        return;
      }
      console.error("Failed to build the administrative boundary layers", error);
      setIsError(true);
    });

    return () => {
      isCancelled = true;
      created.forEach((layer) => {
        map.remove(layer);
        layer.destroy();
      });
      retainedUrls.forEach((url) => boundarySource.releaseLayerUrl(url));
      buildOnceLayersRef.current = [];
    };
  }, [isReady, isEnabled, mapRef]);

  // District: built on mount like the levels above, but ALSO rebuilt whenever
  // the set of selected provinces changes - see the header comment. Every
  // other level ignores selection changes entirely; this is the one place a
  // selection change re-fetches instead of just re-filtering.
  useEffect(() => {
    const map = mapRef.current;
    if (!isReady || !map || !isEnabled || !DISTRICT_CONFIG) {
      return;
    }

    let isCancelled = false;
    let created: GeoJSONLayer | null = null;
    let retainedUrl: string | null = null;
    const config = DISTRICT_CONFIG;

    const build = async () => {
      const selectionNow = selectionRef.current ?? EMPTY_BOUNDARY_SELECTION;
      const url = await boundarySource.getLayerUrl(config.level, selectionNow);

      if (isCancelled) {
        boundarySource.releaseLayerUrl(url);
        return;
      }
      retainedUrl = url;

      const layer = buildLayer(
        config,
        url,
        selectionRef.current ?? EMPTY_BOUNDARY_SELECTION,
        visibilityRef.current?.[config.level] ?? false,
        languageRef.current,
        isDarkThemeRef.current,
        !suppressLabelsRef.current
      );
      layer.load().catch((error: unknown) => {
        console.error(`Failed to load the ${config.level} boundary layer`, error);
        setIsError(true);
      });

      map.add(layer);
      map.reorder(layer, config.drawIndex);
      created = layer;
      districtLayerRef.current = layer;
    };

    build().catch((error: unknown) => {
      if (isCancelled) {
        return;
      }
      console.error("Failed to build the district boundary layer", error);
      setIsError(true);
    });

    return () => {
      isCancelled = true;
      if (created) {
        map.remove(created);
        created.destroy();
      }
      if (retainedUrl) {
        boundarySource.releaseLayerUrl(retainedUrl);
      }
      districtLayerRef.current = null;
    };
    // districtProvinceKey (not selection itself) is the dependency: a change to
    // which DISTRICTS are checked within an already-selected province must not
    // re-fetch - only a change to the set of selected PROVINCES should.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReady, isEnabled, mapRef, districtProvinceKey]);

  // Applied selection -> which areas are drawn, within whatever each layer has
  // already fetched. Still a pure client-side filter: country/province always
  // hold their whole dataset, and district holds every district of whichever
  // provinces are currently selected (see the district effect above) - so
  // narrowing to the actually-checked codes is definitionExpression's job in
  // all three cases, same as before this file supported level-of-detail.
  useEffect(() => {
    if (!isReady || !selection) {
      return;
    }
    forEachLayer((layer, config) => {
      layer.definitionExpression = buildDefinitionExpression(config, selection);
    });
  }, [isReady, selection]);

  // Level toggles. Instant by design - unlike the selection, these are not gated
  // behind the picker's Apply button. Label suppression rides along here rather
  // than getting its own effect: same layers, same iteration, same "isReady"
  // gate - a level that's already invisible just gets its (invisible) labels
  // toggled too, which is harmless.
  useEffect(() => {
    if (!isReady || !visibility) {
      return;
    }
    forEachLayer((layer, config) => {
      layer.visible = visibility[config.level];
      layer.labelsVisible = !suppressLabels;
    });
  }, [isReady, visibility, suppressLabels]);

  // Language and theme. Both rebuild their object rather than mutating it -
  // Accessor does not observe mutation of a nested symbol, so editing the
  // existing TextSymbol in place would appear to do nothing.
  useEffect(() => {
    if (!isReady) {
      return;
    }
    forEachLayer((layer, config) => {
      layer.renderer = createBoundaryRenderer(config, isDarkTheme);
      layer.labelingInfo = [createBoundaryLabelClass(config, language, isDarkTheme)];
    });
  }, [isReady, language, isDarkTheme]);

  return { isError };
}
