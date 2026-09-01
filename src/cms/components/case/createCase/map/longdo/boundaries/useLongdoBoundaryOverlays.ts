// Keeps the administrative boundary polygons in sync with the applied
// selection, on a Longdo map. The counterpart of useAdminBoundaryLayers, and it
// answers the same contract - but the mechanics differ in one structural way
// worth understanding before editing.
//
// ArcGIS gets a GeoJSONLayer per level: it downloads the file itself, filters
// with `definitionExpression`, styles with a renderer and labels with its own
// engine, and every change is one property assignment on a live layer. Longdo
// has no feature layer - only overlays - so the same three jobs land here:
//
//   FILTER   a Set of selected codes tested against the id attribute, in place
//            of the SQL `IN (...)` expression.
//   STYLE    one colour per feature from the shared palette, in place of a
//            UniqueValueRenderer over COLOR_IDX.
//   LABEL    the polygon's own `label`, shown or withheld per level by zoom, in
//            place of a LabelClass with a `minScale`.
//
// Because overlay options are fixed at construction, a change rebuilds the
// overlays rather than assigning a property. That is cheap and stays cheap
// because the GEOMETRY IS CACHED: the FeatureCollections are fetched once and
// held parsed, so switching a level on, applying a selection, flipping the
// theme or crossing a label threshold costs no network traffic at all - which
// is the rule the ArcGIS hook states in its own header and the one that
// actually matters.
//
// LABELS DO NOT USE `visibleRange`. Whether the SDK's zoom range hides an
// overlay or only its label is ambiguous, and the answer is load-bearing here -
// hiding the shape would be plainly wrong. Since the rebuild path exists
// anyway, the threshold is applied by including or omitting `label`, which
// makes the behaviour ours and unambiguous.
import { useEffect, useMemo, useRef, useState } from "react";
import type { Language } from "@/core/config/i18n";
import { boundaryRgbaCss } from "../../boundaries/boundaryColors";
import { BOUNDARY_LEVELS, type BoundaryLevelConfig } from "../../boundaries/boundaryLevels";
import { boundarySource } from "../../boundaries/boundarySource";
import {
  EMPTY_BOUNDARY_SELECTION,
  type BoundaryLayerConfig
} from "../../boundaries/boundaryTypes";
import type { LongdoGlobal, LongdoMap, LongdoOverlay } from "../longdoApi";
import { toLongdoLocations, zoomForScale } from "../longdoGeometry";

/** A feature as either boundary source emits it. Attributes vary by level table. */
interface BoundaryFeature {
  properties?: Record<string, unknown>;
  geometry?: {
    type?: string;
    coordinates?: unknown;
  };
}

interface UseLongdoBoundaryOverlaysOptions {
  longdoRef: React.MutableRefObject<LongdoGlobal | null>;
  mapRef: React.MutableRefObject<LongdoMap | null>;
  /** True once the map exists; refs are only safe to touch after this. */
  isReady: boolean;
  /** Undefined on maps that do not show boundaries at all. */
  boundaries?: BoundaryLayerConfig;
  language: Language;
  isDarkTheme: boolean;
  /**
   * The view's settled zoom, for the label thresholds. Owned by the map
   * component: it already listens for the view settling, and a second listener
   * here would need an unbind this SDK does not clearly support.
   */
  zoom: number;
  /** True while the staff layer is visible - labels are withheld, shapes stay. */
  suppressLabels: boolean;
}

export interface UseLongdoBoundaryOverlaysResult {
  /** True if any level failed to load, for the controls' status line. */
  isError: boolean;
}

/** Parsed geometry per level, in the order of BOUNDARY_LEVELS. */
type FeaturesByLevel = readonly (readonly BoundaryFeature[])[];

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

/**
 * The features in a level's FeatureCollection.
 *
 * Shape is checked, never truthiness: an empty or malformed body must read as
 * "no features", not as a collection - the same rule the area reads learned
 * (see the anti-regression skill).
 */
async function fetchFeatures(url: string): Promise<readonly BoundaryFeature[]> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Boundary geometry request failed with ${response.status}`);
  }
  const parsed: unknown = await response.json();
  if (!isRecord(parsed)) {
    return [];
  }
  const features = parsed.features;
  return Array.isArray(features) ? (features as BoundaryFeature[]) : [];
}

/** The outer ring of a GeoJSON Polygon, or null when there is nothing to draw. */
function readOuterRing(feature: BoundaryFeature): readonly (readonly number[])[] | null {
  const coordinates = feature.geometry?.coordinates;
  if (!Array.isArray(coordinates) || coordinates.length === 0) {
    return null;
  }
  const outer = coordinates[0];
  if (!Array.isArray(outer) || outer.length < 3) {
    return null;
  }
  return outer as readonly (readonly number[])[];
}

function readString(properties: Record<string, unknown> | undefined, field: string): string {
  const value = properties?.[field];
  return typeof value === "string" ? value : typeof value === "number" ? String(value) : "";
}

function readColorIndex(properties: Record<string, unknown> | undefined, field: string): number {
  const value = properties?.[field];
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

/**
 * Zoom at or above which a level shows its labels.
 *
 * Derived from the level table's ArcGIS scale so the two providers thin labels
 * out at the same point and the table keeps one set of numbers. `labelMinScale`
 * of 0 means "always", which converts to a floor of 0.
 */
function labelMinZoom(config: BoundaryLevelConfig): number {
  return zoomForScale(config.labelMinScale);
}

export function useLongdoBoundaryOverlays({
  longdoRef,
  mapRef,
  isReady,
  boundaries,
  language,
  isDarkTheme,
  zoom,
  suppressLabels
}: UseLongdoBoundaryOverlaysOptions): UseLongdoBoundaryOverlaysResult {
  const overlaysRef = useRef<LongdoOverlay[]>([]);
  const featuresRef = useRef<FeaturesByLevel>([]);
  const [dataVersion, setDataVersion] = useState(0);
  const [isError, setIsError] = useState(false);

  const isEnabled = Boolean(boundaries);
  const selection = boundaries?.selection;
  const visibility = boundaries?.visibility;

  /**
   * Which levels are labelled at this zoom, as one string.
   *
   * The rebuild depends on THIS rather than on `zoom` itself, so a pan or a
   * fractional zoom change rebuilds nothing - only actually crossing a level's
   * threshold does.
   */
  const labelSignature = useMemo(
    () =>
      BOUNDARY_LEVELS.map((config) => (zoom >= labelMinZoom(config) ? "1" : "0")).join(""),
    [zoom]
  );

  // Fetch each level's geometry once, then hand the URLs straight back.
  //
  // Released as soon as the body is parsed rather than at teardown: the org
  // source serves a blob: URL holding a whole FeatureCollection, and once the
  // features are in memory the blob is pure leak - there is no layer left
  // holding a reference to it, unlike on the ArcGIS side.
  useEffect(() => {
    if (!isReady || !isEnabled) {
      return;
    }
    setIsError(false);

    let isCancelled = false;

    const load = async () => {
      const results = await Promise.all(
        BOUNDARY_LEVELS.map(async (config) => {
          const url = await boundarySource.getLayerUrl(
            config.level,
            selection ?? EMPTY_BOUNDARY_SELECTION
          );
          try {
            return await fetchFeatures(url);
          } finally {
            boundarySource.releaseLayerUrl(url);
          }
        })
      );

      if (isCancelled) {
        return;
      }
      featuresRef.current = results;
      setDataVersion((version) => version + 1);
    };

    load().catch((error: unknown) => {
      if (isCancelled) {
        return;
      }
      console.error("Failed to load the administrative boundary geometry", error);
      setIsError(true);
    });

    return () => {
      isCancelled = true;
    };
    // Deliberately does NOT depend on `selection`: neither source scopes its
    // request by it (see boundarySource.ts), so a selection change filters
    // what is drawn without refetching anything.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReady, isEnabled]);

  // Draw. Runs on the data arriving and on anything that changes what the
  // polygons should look like; never touches the network.
  useEffect(() => {
    const longdo = longdoRef.current;
    const map = mapRef.current;
    if (!isReady || !longdo || !map) {
      return;
    }

    // Rebuild from scratch. Overlay options are fixed at construction, so there
    // is no in-place equivalent - and with the geometry cached this is a pure
    // main-thread operation.
    overlaysRef.current.forEach((overlay) => map.Overlays.remove(overlay));
    overlaysRef.current = [];

    if (!isEnabled || featuresRef.current.length === 0) {
      return;
    }

    const created: LongdoOverlay[] = [];

    // Coarsest level first: overlays draw in insertion order, so the finest
    // level ends up on top - the same stacking BOUNDARY_LEVELS.drawIndex gives
    // the ArcGIS layers, where a fine outline must never be buried under a
    // coarse fill.
    BOUNDARY_LEVELS.forEach((config, index) => {
      if (!visibility?.[config.level]) {
        return;
      }

      const codes = new Set(selection?.[config.level] ?? []);
      if (codes.size === 0) {
        // Empty selection draws nothing, matching the "1=0" rule the ArcGIS
        // expression uses: clearing a level in the picker must not read as
        // "no filter, show everything".
        return;
      }

      // Read from the signature, not from `zoom` directly: that is what keeps
      // this effect out of the dependency on a continuously changing number.
      const isLabelled = !suppressLabels && labelSignature[index] === "1";
      const nameField =
        config.nameFieldByLanguage[language] ?? config.nameFieldByLanguage.en;
      const style = config.style;
      const features = featuresRef.current[index] ?? [];

      features.forEach((feature) => {
        const code = readString(feature.properties, config.idField);
        if (!codes.has(code)) {
          return;
        }
        const ring = readOuterRing(feature);
        if (!ring) {
          return;
        }

        const colorIndex = readColorIndex(feature.properties, config.colorField);
        const overlay = new longdo.Polygon(toLongdoLocations(ring), {
          lineWidth: style.outlineWidth,
          lineColor: boundaryRgbaCss(colorIndex, isDarkTheme, style.outlineAlpha),
          fillColor: boundaryRgbaCss(colorIndex, isDarkTheme, style.fillAlpha),
          lineStyle:
            style.outlineStyle === "dash" ? longdo.LineStyle.Dashed : longdo.LineStyle.Solid,
          ...(isLabelled ? { label: readString(feature.properties, nameField) } : {}),
          // Neither stops the overlay consuming the click - the SDK routes it to
          // `overlayClick` regardless, which LongdoAddressMap converts back into
          // a map click. They are set for the cursor, and to state the intent.
          clickable: false,
          pointer: false
        });

        map.Overlays.add(overlay);
        created.push(overlay);
      });
    });

    overlaysRef.current = created;
  }, [
    longdoRef,
    mapRef,
    isReady,
    isEnabled,
    dataVersion,
    selection,
    visibility,
    language,
    isDarkTheme,
    suppressLabels,
    labelSignature
  ]);

  // Drop every overlay when this hook goes away. Explicit rather than left to
  // the map component's own teardown: overlays created here are removed here,
  // and a cleanup that depends on a sibling effect running afterwards is the
  // kind of coupling that breaks silently when either side moves.
  //
  // The ref is read IN the cleanup on purpose. The map is built asynchronously
  // (the SDK has to load first), so this effect runs while `mapRef.current` is
  // still null - capturing it here would capture nothing. By teardown it is the
  // live map, and this hook's cleanup runs before the map component's, which
  // destroys it.
  useEffect(() => {
    return () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      const map = mapRef.current;
      overlaysRef.current.forEach((overlay) => map?.Overlays.remove(overlay));
      overlaysRef.current = [];
    };
  }, [mapRef]);

  return { isError };
}
