// Viewport-box maths for the Device layer's debounced refetch.
//
// Pulled out of useDeviceLayer.ts so the debounce/dedup rules can be unit-tested
// without rendering the hook. SDK-free.
import type { DeviceBoundsRequest } from "@/cms/types/deviceIoT";
import type { MapBounds } from "../mapTypes";

// Wait this long after the last view-settle before committing a new viewport, so
// a drag that crosses several tiles refetches once, not once per frame.
export const DEVICE_BOUNDS_DEBOUNCE_MS = 400;

// Round the reported extent to ~11 m before comparing / querying: sub-pixel
// jitter from `stationary` flapping must not look like a new viewport.
export const BOUNDS_PRECISION = 4;

/** Snap a reported extent to `BOUNDS_PRECISION` decimal places. */
export function roundBounds(bounds: MapBounds): DeviceBoundsRequest {
  const round = (value: number): number => Number(value.toFixed(BOUNDS_PRECISION));
  return {
    minLat: round(bounds.minLat),
    minLon: round(bounds.minLon),
    maxLat: round(bounds.maxLat),
    maxLon: round(bounds.maxLon)
  };
}

/** True only when both boxes are present and every edge is exactly equal. */
export function sameBounds(
  a: DeviceBoundsRequest | null,
  b: DeviceBoundsRequest | null
): boolean {
  return (
    a !== null &&
    b !== null &&
    a.minLat === b.minLat &&
    a.minLon === b.minLon &&
    a.maxLat === b.maxLat &&
    a.maxLon === b.maxLon
  );
}

/** Stable string key for a box (drives the mock-refetch effect dependency). */
export function boundsKey(bounds: DeviceBoundsRequest | null): string {
  return bounds
    ? `${bounds.minLat}:${bounds.minLon}:${bounds.maxLat}:${bounds.maxLon}`
    : "";
}

/**
 * Format a viewport box as the `minLng,minLat,maxLng,maxLat` string the
 * backend's `bbox` param expects (same convention as Place's `bbox`, see
 * `docs/specification/API_Specification_Place_Device.md`). There is no
 * separate "devices in bounds" operation on the backend - bbox-filtered
 * fetching goes through the ordinary device list query (`GetDeviceLists`).
 */
export function boundsToBbox(bounds: DeviceBoundsRequest): string {
  return `${bounds.minLon},${bounds.minLat},${bounds.maxLon},${bounds.maxLat}`;
}
