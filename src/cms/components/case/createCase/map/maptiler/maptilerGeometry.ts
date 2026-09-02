// Small coordinate helpers for the MapTiler map.
//
// Far smaller than longdoGeometry.ts, because MapLibre gives back most of what
// that file had to compute by hand: `map.project` / `map.unproject` for screen
// <-> location, and click events that already carry `lngLat`. What remains is
// the ArcGIS-scale -> MapLibre-zoom conversion, needed so the boundary level
// table can keep expressing its label thresholds as ArcGIS scale denominators
// while MapLibre thinks in zoom.
//
// No maplibre-gl import - this is plain arithmetic and stays cheap to load.

/**
 * Scale denominator at zoom 0 for a 96dpi screen, the same constant
 * longdoGeometry.ts uses. Converting between the two lets BOUNDARY_LEVELS keep
 * one set of `labelMinScale` numbers across all three providers.
 */
const SCALE_AT_ZOOM_0 = 559_082_264;

/**
 * A MapLibre zoom at or above which a level should show its labels, derived
 * from the level table's ArcGIS `labelMinScale`.
 *
 * `labelMinScale` of 0 means "always label", which maps to a floor of 0.
 */
export function zoomForScale(scale: number): number {
  if (!Number.isFinite(scale) || scale <= 0) {
    return 0;
  }
  return Math.log2(SCALE_AT_ZOOM_0 / scale);
}

/** GeoJSON ring ([lng, lat] pairs) with any non-finite point dropped. */
export function sanitizeRing(
  ring: readonly (readonly number[])[]
): [number, number][] {
  return ring.reduce<[number, number][]>((points, point) => {
    const [lng, lat] = point;
    if (Number.isFinite(lng) && Number.isFinite(lat)) {
      points.push([lng, lat]);
    }
    return points;
  }, []);
}
