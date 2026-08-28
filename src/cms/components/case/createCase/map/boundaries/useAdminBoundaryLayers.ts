// Keeps three GeoJSONLayers of administrative boundaries in sync with the
// applied selection.
//
// Follows the same three rules as useStaffGraphicsLayer:
//
//   1. Layers are added to the EXISTING map. Rebuilding the MapView to change
//      boundaries would discard the user's pan/zoom, the case marker and the
//      staff layer - the same reason the basemap is swapped in place.
//   2. Everything updates in place. Selection, language, theme and label
//      suppression each reassign one property; none of them recreate a layer,
//      which would re-download and re-parse the geometry for a colour change.
//   3. Draw order is set explicitly, never inferred from insertion order. Three
//      different components now add layers to this map.
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
import { BOUNDARY_LEVELS, buildDefinitionExpression, outFieldsFor } from "./boundaryLevels";
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

export function useAdminBoundaryLayers({
  mapRef,
  isReady,
  boundaries,
  language,
  isDarkTheme,
  suppressLabels
}: UseAdminBoundaryLayersOptions): UseAdminBoundaryLayersResult {
  const layersRef = useRef<GeoJSONLayer[]>([]);
  const [isError, setIsError] = useState(false);

  const isEnabled = Boolean(boundaries);
  const selection = boundaries?.selection;
  const visibility = boundaries?.visibility;

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

  // Build the layers once. Deliberately does NOT depend on selection/language/
  // theme - those are applied by the effects below, onto the same layer objects.
  //
  // Async, because a server-backed source has to fetch before it can produce a
  // URL (see boundarySource.ts). That makes two things load-bearing: the
  // `isCancelled` guard, since the effect can resolve after unmount or after a
  // re-run, and releasing the URLs in cleanup, since a blob: URL that is never
  // revoked leaks its whole FeatureCollection for the life of the document.
  useEffect(() => {
    const map = mapRef.current;
    if (!isReady || !map || !isEnabled) {
      return;
    }
    setIsError(false);

    let isCancelled = false;
    // Populated as the effect resolves, and read by cleanup - which may run
    // before any of it exists.
    let created: GeoJSONLayer[] = [];
    let retainedUrls: string[] = [];

    const build = async () => {
      // `isEnabled` guarantees the selection is set, but the ref is typed
      // optional and TypeScript cannot narrow through one - fall back to the
      // empty selection rather than assert.
      const urls = await Promise.all(
        BOUNDARY_LEVELS.map((config) =>
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
      // selection effect below runs while layersRef is still empty, its update
      // would be lost and every layer would stay filtered to "1=0", drawing
      // nothing at all. The ref is reassigned on every render, so by the time
      // this line runs it holds the current applied selection.
      const selectionNow = selectionRef.current ?? EMPTY_BOUNDARY_SELECTION;

      created = BOUNDARY_LEVELS.map((config, index) => {
        const layer = new GeoJSONLayer({
          id: `boundary-${config.level}`,
          url: urls[index],
          objectIdField: "OBJECTID",
          // Every feature buildLevelData emits is a Polygon. Declared rather
          // than inferred so a level with nothing drawn yet (country today, and
          // all three for a brand-new org) stays a valid EMPTY polygon layer:
          // GeoJSONLayer infers `null` from an empty FeatureCollection, and
          // `isTable` (loaded && geometryType == null) makes the layer view
          // refuse to create with `featurelayerview:table-not-supported` - which
          // `layer.load()` below cannot catch, since a table loads just fine.
          // This also makes the SDK read ONLY Polygon features, so it has to
          // change alongside the MultiPolygon note in boundarySource.ts if the
          // backend starts returning multi-part geometry.
          geometryType: "polygon",
          outFields: outFieldsFor(config),
          // REQUIRED. A popup would swallow map clicks, breaking the
          // reverse-geocode in create mode and the staff hit-test in detail mode.
          popupEnabled: false,
          legendEnabled: false,
          visible: visibilityRef.current?.[config.level] ?? false,
          definitionExpression: buildDefinitionExpression(config, selectionNow),
          renderer: createBoundaryRenderer(config, isDarkThemeRef.current),
          labelingInfo: [createBoundaryLabelClass(config, languageRef.current, isDarkThemeRef.current)],
          // From the ref, not a literal true: the effect below may already have
          // run and found no layers to suppress, so a layer built afterwards has
          // to start in whatever state that effect would have put it in.
          labelsVisible: !suppressLabelsRef.current
        });

        layer.load().catch((error: unknown) => {
          console.error(`Failed to load the ${config.level} boundary layer`, error);
          setIsError(true);
        });

        return layer;
      });

      map.addMany(created);
      // Bottom of the stack, finest level highest within the group, so the case
      // marker and the staff layer always stay clickable above them. Done after
      // addMany because reorder needs the layer to already be in the map.
      BOUNDARY_LEVELS.forEach((config, index) => map.reorder(created[index], config.drawIndex));
      layersRef.current = created;
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
      layersRef.current = [];
    };
  }, [isReady, isEnabled, mapRef]);

  // Applied selection -> which areas are drawn.
  //
  // Still a pure client-side filter under both sources, because both deliver
  // their whole dataset in one payload - one city of static geometry, or one
  // organization's area tree. Only a source scoped to the country-wide,
  // every-sub-district dataset would have to put the selection into the layer's
  // `url` and `layer.refresh()` instead; see the note in boundarySource.ts.
  useEffect(() => {
    if (!isReady || !selection) {
      return;
    }
    layersRef.current.forEach((layer, index) => {
      layer.definitionExpression = buildDefinitionExpression(BOUNDARY_LEVELS[index], selection);
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
    layersRef.current.forEach((layer, index) => {
      layer.visible = visibility[BOUNDARY_LEVELS[index].level];
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
    layersRef.current.forEach((layer, index) => {
      const config = BOUNDARY_LEVELS[index];
      layer.renderer = createBoundaryRenderer(config, isDarkTheme);
      layer.labelingInfo = [createBoundaryLabelClass(config, language, isDarkTheme)];
    });
  }, [isReady, language, isDarkTheme]);

  return { isError };
}
