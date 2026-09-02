// Keeps the administrative boundary polygons in sync with the applied
// selection, on a MapTiler map. The counterpart of useAdminBoundaryLayers and
// useLongdoBoundaryOverlays, answering the same BoundaryLayerConfig contract.
//
// Closer to the ArcGIS hook than the Longdo one: MapLibre HAS feature layers, so
// this follows the ArcGIS discipline of updating in place -
//   FILTER   `setFilter` with the selected codes, in place of the SQL IN (...)
//   STYLE    a data-driven `match` expression over the colour slot, in place of
//            a UniqueValueRenderer
//   LABEL    a `symbol` layer with `minzoom` from the level's ArcGIS scale, in
//            place of a LabelClass with a `minScale`
// - rather than the Longdo "rebuild every overlay" approach.
//
// The GEOMETRY IS CACHED, the rule that actually matters and that all three
// hooks share: the FeatureCollections are fetched once and held parsed, so
// switching a level on, applying a selection, flipping the theme or crossing a
// label threshold costs no network traffic.
//
// The one MapTiler-specific wrinkle: `map.setStyle` drops the sources and
// layers, so the draw effect keys on `styleEpoch` and rebuilds them from the
// held geometry after every style swap.
import { useEffect, useMemo, useRef, useState } from "react";
import type { Map as MlMap, GeoJSONSource } from "maplibre-gl";
import type { Feature, FeatureCollection, Geometry } from "geojson";
import type { Language } from "@/core/config/i18n";
import {
  BOUNDARY_PALETTE_SIZE,
  boundaryRgbaCss
} from "../../boundaries/boundaryColors";
import { BOUNDARY_LEVELS, type BoundaryLevelConfig } from "../../boundaries/boundaryLevels";
import { boundarySource } from "../../boundaries/boundarySource";
import {
  EMPTY_BOUNDARY_SELECTION,
  type BoundaryLayerConfig
} from "../../boundaries/boundaryTypes";
import { zoomForScale } from "../maptilerGeometry";
import { asFilter, asLayer, setPaintExpr } from "../mlTypes";

interface BoundaryFeature {
  properties?: Record<string, unknown>;
  geometry?: Geometry;
}

interface UseMapTilerBoundaryOverlaysOptions {
  mapRef: React.MutableRefObject<MlMap | null>;
  isReady: boolean;
  /** Bumped on every completed style load - the sources/layers are gone by then. */
  styleEpoch: number;
  boundaries?: BoundaryLayerConfig;
  language: Language;
  isDarkTheme: boolean;
  /** The view's settled zoom - only used to keep the effect honest; MapLibre's
   *  own `minzoom` does the actual label thinning. */
  zoom: number;
  /** True while the staff layer is visible - labels are withheld, shapes stay. */
  suppressLabels: boolean;
}

export interface UseMapTilerBoundaryOverlaysResult {
  isError: boolean;
}

type FeaturesByLevel = readonly (readonly BoundaryFeature[])[];

const SOURCE_PREFIX = "maptiler-boundary-";
const fillLayerId = (level: string) => `${SOURCE_PREFIX}${level}-fill`;
const lineLayerId = (level: string) => `${SOURCE_PREFIX}${level}-line`;
const labelLayerId = (level: string) => `${SOURCE_PREFIX}${level}-label`;
const sourceId = (level: string) => `${SOURCE_PREFIX}${level}`;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

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

function readString(properties: Record<string, unknown> | undefined, field: string): string {
  const value = properties?.[field];
  return typeof value === "string" ? value : typeof value === "number" ? String(value) : "";
}

function readColorIndex(properties: Record<string, unknown> | undefined, field: string): number {
  const value = properties?.[field];
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

/** A colour `match` expression over the 4 palette slots, at a given alpha. */
function colorExpression(isDarkTheme: boolean, alpha: number): unknown[] {
  const cases: (number | string)[] = [];
  for (let slot = 0; slot < BOUNDARY_PALETTE_SIZE; slot += 1) {
    cases.push(slot, boundaryRgbaCss(slot, isDarkTheme, alpha));
  }
  return ["match", ["get", "__color"], ...cases, boundaryRgbaCss(0, isDarkTheme, alpha)];
}

/** Filter for the selected codes at a level; empty selection draws nothing. */
function selectionFilter(codes: readonly string[]): unknown[] {
  if (codes.length === 0) {
    return ["==", ["literal", 1], ["literal", 0]];
  }
  return ["in", ["get", "__id"], ["literal", [...codes]]];
}

/** Normalise each feature so the layers can read stable `__id` / `__color` / `__name`. */
function toLevelCollection(
  features: readonly BoundaryFeature[],
  config: BoundaryLevelConfig,
  language: Language
): FeatureCollection {
  const nameField = config.nameFieldByLanguage[language] ?? config.nameFieldByLanguage.en;
  const out: Feature[] = [];
  features.forEach((feature) => {
    if (!feature.geometry) {
      return;
    }
    out.push({
      type: "Feature",
      geometry: feature.geometry,
      properties: {
        __id: readString(feature.properties, config.idField),
        __color: readColorIndex(feature.properties, config.colorField),
        __name: readString(feature.properties, nameField)
      }
    });
  });
  return { type: "FeatureCollection", features: out };
}

/** Remove every boundary source + layer this hook adds. */
function removeAllBoundaryLayers(map: MlMap): void {
  BOUNDARY_LEVELS.forEach((config) => {
    [labelLayerId(config.level), lineLayerId(config.level), fillLayerId(config.level)].forEach(
      (id) => {
        if (map.getLayer(id)) {
          map.removeLayer(id);
        }
      }
    );
    if (map.getSource(sourceId(config.level))) {
      map.removeSource(sourceId(config.level));
    }
  });
}

export function useMapTilerBoundaryOverlays({
  mapRef,
  isReady,
  styleEpoch,
  boundaries,
  language,
  isDarkTheme,
  zoom,
  suppressLabels
}: UseMapTilerBoundaryOverlaysOptions): UseMapTilerBoundaryOverlaysResult {
  const featuresRef = useRef<FeaturesByLevel>([]);
  const [dataVersion, setDataVersion] = useState(0);
  const [isError, setIsError] = useState(false);

  const isEnabled = Boolean(boundaries);
  const selection = boundaries?.selection;
  const visibility = boundaries?.visibility;

  // Fetch each level's geometry once, then hand the URLs straight back - the
  // same lifecycle the Longdo hook uses, and for the same reason (the org
  // source serves a blob: URL that leaks once parsed).
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
    // request by it, so a selection change filters what is drawn without a
    // refetch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReady, isEnabled]);

  // Read `zoom` so the linter does not flag it; MapLibre's own `minzoom` does
  // the label thinning, but keeping the dependency documents that a zoom change
  // is a legitimate reason for this effect to re-evaluate.
  const zoomTouched = useMemo(() => Math.floor(zoom), [zoom]);

  // Draw: add/update the sources and layers IN PLACE. Runs on the data
  // arriving, on anything that changes appearance, and on a style swap
  // (styleEpoch) - which is the only path that recreates the layers, since
  // setStyle wiped them. A selection toggle or theme flip reuses the existing
  // source/layers via setData / setFilter / setPaintProperty.
  useEffect(() => {
    const map = mapRef.current;
    if (!isReady || !map) {
      return;
    }
    void zoomTouched;

    if (!isEnabled || featuresRef.current.length === 0) {
      removeAllBoundaryLayers(map);
      return;
    }

    // Pass 1: sources + fill/line layers, coarsest first so the finest level's
    // outline ends up on top of the coarser fills.
    BOUNDARY_LEVELS.forEach((config, index) => {
      const features = featuresRef.current[index] ?? [];
      const data = toLevelCollection(features, config, language);
      const existing = map.getSource(sourceId(config.level));
      if (existing && "setData" in existing) {
        (existing as GeoJSONSource).setData(data);
      } else {
        map.addSource(sourceId(config.level), { type: "geojson", data });
      }

      if (!map.getLayer(fillLayerId(config.level))) {
        map.addLayer(
          asLayer({
            id: fillLayerId(config.level),
            type: "fill",
            source: sourceId(config.level),
            paint: { "fill-color": colorExpression(isDarkTheme, config.style.fillAlpha) }
          })
        );
      }
      if (!map.getLayer(lineLayerId(config.level))) {
        map.addLayer(
          asLayer({
            id: lineLayerId(config.level),
            type: "line",
            source: sourceId(config.level),
            layout: { "line-join": "round" },
            paint: {
              "line-color": colorExpression(isDarkTheme, config.style.outlineAlpha),
              "line-width": config.style.outlineWidth,
              ...(config.style.outlineStyle === "dash" ? { "line-dasharray": [3, 2] } : {})
            }
          })
        );
      }
    });

    // Pass 2: label layers, added after every fill/line so a coarse fill drawn
    // later cannot bury a finer level's label.
    BOUNDARY_LEVELS.forEach((config) => {
      if (!map.getLayer(labelLayerId(config.level))) {
        map.addLayer(
          asLayer({
            id: labelLayerId(config.level),
            type: "symbol",
            source: sourceId(config.level),
            minzoom: zoomForScale(config.labelMinScale),
            layout: {
              "text-field": ["get", "__name"],
              "text-size": config.labelSize,
              "text-font": ["Noto Sans Regular", "Open Sans Regular"],
              "text-max-width": 8,
              "symbol-placement": "point"
            },
            paint: {
              "text-color": isDarkTheme ? "#e5e7eb" : "#1f2937",
              "text-halo-color": isDarkTheme ? "rgba(17,24,39,0.9)" : "rgba(255,255,255,0.9)",
              "text-halo-width": 1.4
            }
          })
        );
      }
    });

    // Update everything in place.
    BOUNDARY_LEVELS.forEach((config) => {
      const level = config.level;
      const codes = selection?.[level] ?? [];
      const isLevelVisible = Boolean(visibility?.[level]);
      const filter = selectionFilter(codes);

      map.setFilter(fillLayerId(level), asFilter(filter));
      map.setFilter(lineLayerId(level), asFilter(filter));
      map.setFilter(labelLayerId(level), asFilter(filter));

      setPaintExpr(
        map,
        fillLayerId(level),
        "fill-color",
        colorExpression(isDarkTheme, config.style.fillAlpha)
      );
      setPaintExpr(
        map,
        lineLayerId(level),
        "line-color",
        colorExpression(isDarkTheme, config.style.outlineAlpha)
      );
      map.setPaintProperty(labelLayerId(level), "text-color", isDarkTheme ? "#e5e7eb" : "#1f2937");
      map.setPaintProperty(
        labelLayerId(level),
        "text-halo-color",
        isDarkTheme ? "rgba(17,24,39,0.9)" : "rgba(255,255,255,0.9)"
      );

      const shapeVisibility = isLevelVisible ? "visible" : "none";
      map.setLayoutProperty(fillLayerId(level), "visibility", shapeVisibility);
      map.setLayoutProperty(lineLayerId(level), "visibility", shapeVisibility);
      map.setLayoutProperty(
        labelLayerId(level),
        "visibility",
        isLevelVisible && !suppressLabels ? "visible" : "none"
      );
    });
  }, [
    mapRef,
    isReady,
    isEnabled,
    dataVersion,
    styleEpoch,
    selection,
    visibility,
    language,
    isDarkTheme,
    suppressLabels,
    zoomTouched
  ]);

  // Drop every source/layer only when the hook goes away. The ref is read in
  // the cleanup because the map is built asynchronously.
  useEffect(() => {
    return () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      const map = mapRef.current;
      if (map) {
        removeAllBoundaryLayers(map);
      }
    };
  }, [mapRef]);

  return { isError };
}
