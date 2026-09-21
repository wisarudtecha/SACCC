// Spherical Web Mercator (EPSG:3857), in metres.
//
// Pure and free of any map SDK. ArcGIS has `webMercatorUtils` and MapLibre does
// its own projection, but Longdo exposes no projection helper, and its framing
// has to be worked out by hand (see useLongdoFocusRequest). Kept in a neutral
// module rather than inside a provider folder so it never drags a vendor's types
// into another provider's chunk.

/** Radius of the sphere Web Mercator is defined on, in metres. */
export const EARTH_RADIUS_M = 6378137;

/** Half of the world's width in metres - the largest |x| a valid point has. */
export const MAX_MERCATOR_EXTENT_M = Math.PI * EARTH_RADIUS_M;

/** Beyond this the projection runs off to infinity, so latitude is clamped to it. */
const MAX_LATITUDE = 85.051129;

const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
const toDegrees = (radians: number) => (radians * 180) / Math.PI;

export interface MercatorPoint {
  x: number;
  y: number;
}

export interface LngLat {
  longitude: number;
  latitude: number;
}

export function lngLatToMeters({ longitude, latitude }: LngLat): MercatorPoint {
  const clamped = Math.max(-MAX_LATITUDE, Math.min(MAX_LATITUDE, latitude));
  return {
    x: EARTH_RADIUS_M * toRadians(longitude),
    y: EARTH_RADIUS_M * Math.log(Math.tan(Math.PI / 4 + toRadians(clamped) / 2))
  };
}

export function metersToLngLat({ x, y }: MercatorPoint): LngLat {
  return {
    longitude: toDegrees(x / EARTH_RADIUS_M),
    latitude: toDegrees(2 * Math.atan(Math.exp(y / EARTH_RADIUS_M)) - Math.PI / 2)
  };
}
