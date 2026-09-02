// Draws the selected officer's breadcrumb trail on a MapTiler map.
//
// The counterpart of useBreadcrumbGraphicsLayer / useLongdoBreadcrumbOverlay,
// and it keeps their one distinctive rule: THE TRAIL NEVER TOUCHES THE CAMERA.
// It grows a point at a time while the operator works, and a map that re-framed
// itself every few seconds would be unusable.
//
// Deliberately not route-like: dashed, thinner and dimmer than the solved
// route, in the neutral slate the map uses for context rather than instruction.
//
// A source + layer, so it re-adds itself on `styleEpoch`. A SIGNATURE guards
// the redraw - a trail only grows at the end, so its length plus its newest
// point is enough to tell "one more fix arrived" from "nothing changed", and
// the polling hook hands back a new array every refresh whether or not it did.
import { useEffect, useRef } from "react";
import type { Map as MlMap, GeoJSONSource } from "maplibre-gl";
import type { FeatureCollection } from "geojson";
import { BREADCRUMB_TOKENS } from "../../staff/breadcrumbSymbols";
import { MIN_TRAIL_POINTS, type TrailPoint } from "../../staff/useStaffTrails";
import { asLayer } from "../mlTypes";

const SOURCE_ID = "maptiler-breadcrumb";
const LAYER_ID = "maptiler-breadcrumb-line";

interface UseMapTilerBreadcrumbOverlayOptions {
  mapRef: React.MutableRefObject<MlMap | null>;
  isReady: boolean;
  styleEpoch: number;
  points: readonly TrailPoint[] | null;
  visible: boolean;
  isDarkTheme: boolean;
}

function lineColor(isDarkTheme: boolean): string {
  const rgb = isDarkTheme ? BREADCRUMB_TOKENS.darkRgb : BREADCRUMB_TOKENS.lightRgb;
  return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${BREADCRUMB_TOKENS.alpha})`;
}

function trailSignature(points: readonly TrailPoint[] | null): string {
  if (!points?.length) {
    return "";
  }
  const last = points[points.length - 1];
  return `${points.length}:${last.latitude},${last.longitude}`;
}

export function useMapTilerBreadcrumbOverlay({
  mapRef,
  isReady,
  styleEpoch,
  points,
  visible,
  isDarkTheme
}: UseMapTilerBreadcrumbOverlayOptions): void {
  const renderedRef = useRef<string>("");

  useEffect(() => {
    const map = mapRef.current;
    if (!isReady || !map) {
      return;
    }

    const hasTrail = Boolean(visible && points && points.length >= MIN_TRAIL_POINTS);
    const signature = hasTrail
      ? `${trailSignature(points)}:${isDarkTheme ? "d" : "l"}`
      : "";

    if (signature === renderedRef.current && (signature === "" || map.getSource(SOURCE_ID))) {
      return;
    }
    renderedRef.current = signature;

    if (!hasTrail || !points) {
      if (map.getLayer(LAYER_ID)) {
        map.removeLayer(LAYER_ID);
      }
      if (map.getSource(SOURCE_ID)) {
        map.removeSource(SOURCE_ID);
      }
      return;
    }

    const data: FeatureCollection = {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: {},
          geometry: {
            type: "LineString",
            coordinates: points.map((point) => [point.longitude, point.latitude])
          }
        }
      ]
    };

    const existing = map.getSource(SOURCE_ID);
    if (existing && "setData" in existing) {
      (existing as GeoJSONSource).setData(data);
      map.setPaintProperty(LAYER_ID, "line-color", lineColor(isDarkTheme));
    } else {
      map.addSource(SOURCE_ID, { type: "geojson", data });
      map.addLayer(
        asLayer({
          id: LAYER_ID,
          type: "line",
          source: SOURCE_ID,
          layout: { "line-cap": "round", "line-join": "round" },
          paint: {
            "line-color": lineColor(isDarkTheme),
            "line-width": BREADCRUMB_TOKENS.width,
            "line-dasharray": [2, 2]
          }
        })
      );
    }
  }, [mapRef, isReady, styleEpoch, points, visible, isDarkTheme]);

  useEffect(() => {
    return () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      const map = mapRef.current;
      if (map?.getLayer(LAYER_ID)) {
        map.removeLayer(LAYER_ID);
      }
      if (map?.getSource(SOURCE_ID)) {
        map.removeSource(SOURCE_ID);
      }
      renderedRef.current = "";
    };
  }, [mapRef]);
}
