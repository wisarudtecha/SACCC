// src/cms/components/dashboard/map/heatmap/longdo/dispatchHeatmapMarkerStyle.ts
//
// Longdo has no native heatmap primitive (unlike ArcGIS's HeatmapRenderer or
// MapLibre's `heatmap` layer type - see longdoApi.ts, which exposes only
// Marker/Polygon/Polyline overlays). This approximates density the way maps
// did before native heatmap layers existed: many overlapping, semi-transparent
// radial-gradient blobs, so density reads through alpha accumulation where
// markers overlap. Uses the same `{ icon: { html } }` marker mechanism as the
// case-creation map's staff symbols.
import type { LongdoMarkerOptions } from "@/cms/components/case/createCase/map/longdo/longdoApi";

const BASE_SIZE_PX = 28;
const SIZE_PER_WEIGHT_PX = 10;

export function dispatchHeatmapMarkerOptions(weight: number, isDarkTheme: boolean): LongdoMarkerOptions {
  const size = BASE_SIZE_PX + weight * SIZE_PER_WEIGHT_PX;
  const color = isDarkTheme ? "255,120,90" : "255,60,40";
  const html =
    `<div style="width:${size}px;height:${size}px;border-radius:9999px;` +
    `background:radial-gradient(circle, rgba(${color},0.55) 0%, rgba(${color},0.25) 55%, rgba(${color},0) 80%);` +
    `pointer-events:none;"></div>`;

  return {
    icon: { html, offset: { x: size / 2, y: size / 2 } },
    clickable: false,
    draggable: false,
  };
}
