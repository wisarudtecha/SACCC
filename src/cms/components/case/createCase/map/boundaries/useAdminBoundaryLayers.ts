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
  selectionRef.current = selection;
  visibilityRef.current = visibility;
  languageRef.current = language;
  isDarkThemeRef.current = isDarkTheme;

  // Build the layers once. Deliberately does NOT depend on selection/language/
  // theme - those are applied by the effects below, onto the same layer objects.
  useEffect(() => {
    const map = mapRef.current;
    if (!isReady || !map || !isEnabled) {
      return;
    }
    setIsError(false);

    // `isEnabled` guarantees these are set, but the refs are typed optional and
    // TypeScript cannot narrow through a ref - fall back rather than assert.
    const initialSelection = selectionRef.current ?? EMPTY_BOUNDARY_SELECTION;

    const created = BOUNDARY_LEVELS.map((config) => {
      const layer = new GeoJSONLayer({
        id: `boundary-${config.level}`,
        url: boundarySource.getLayerUrl(config.level, initialSelection),
        objectIdField: "OBJECTID",
        outFields: outFieldsFor(config),
        // REQUIRED. A popup would swallow map clicks, breaking the
        // reverse-geocode in create mode and the staff hit-test in detail mode.
        popupEnabled: false,
        legendEnabled: false,
        visible: visibilityRef.current?.[config.level] ?? false,
        definitionExpression: buildDefinitionExpression(config, initialSelection),
        renderer: createBoundaryRenderer(config, isDarkThemeRef.current),
        labelingInfo: [createBoundaryLabelClass(config, languageRef.current, isDarkThemeRef.current)],
        labelsVisible: true
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

    return () => {
      created.forEach((layer) => {
        map.remove(layer);
        layer.destroy();
      });
      layersRef.current = [];
    };
  }, [isReady, isEnabled, mapRef]);

  // Applied selection -> which areas are drawn.
  //
  // When the country-wide BFF replaces the static files, this is the one place
  // that changes: the selection will also have to go into the layer's `url`
  // (then `layer.refresh()`), because the server, not the browser, will be doing
  // the filtering. definitionExpression stays as a final client-side tidy-up.
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
