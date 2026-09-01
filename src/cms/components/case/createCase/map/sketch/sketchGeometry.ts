// Conversions between the stored GeoJSON rings and an ArcGIS Polygon.
//
// The two are NOT the same thing, in two ways that both bite silently:
//
//   1. Spatial reference. The MapView runs in Web Mercator, so a polygon that
//      came out of a sketch carries metres, not degrees. Point.longitude /
//      Point.latitude quietly convert for a single point (which is why
//      ArcgisAddressMap's reverse geocode can read them straight off a click),
//      but Polygon.rings does no such thing - read them raw and you store
//      coordinates in the millions.
//   2. Closure and precision. parsePolygonRings requires a closed ring of at
//      least MIN_RING_POINTS points, and a raw vertex carries far more decimal
//      places than any boundary is surveyed to. See roundRing / closeRing.
//
// WINDING ORDER is deliberately left alone. ArcGIS emits clockwise exterior
// rings; RFC 7946 asks for counter-clockwise. Every ring already in the system
// flows straight into a GeoJSONLayer, which renders either happily, so nothing
// has ever forced the question and reordering could break a consumer we cannot
// see (PostGIS on the BFF, most plausibly). If it turns out to matter, reversing
// the exterior ring belongs in polygonToRings below and nowhere else - the same
// containment toCoordinatesPayload gives its own unverified assumption.
import Polygon from "@arcgis/core/geometry/Polygon.js";
import SpatialReference from "@arcgis/core/geometry/SpatialReference.js";
import * as webMercatorUtils from "@arcgis/core/geometry/support/webMercatorUtils.js";
import type { PolygonCoordinates } from "@/cms/types/area";
import { MIN_RING_POINTS, closeRing, roundRing } from "@/cms/utils/areaGeometry";

/**
 * Stored rings -> a polygon the map can draw.
 *
 * Built in WGS84 rather than projected here: a GraphicsLayer reprojects
 * geographic geometry into the view's spatial reference on its own, and doing
 * it ourselves would mean the round trip lost precision twice.
 *
 * Returns null for "nothing to draw", which callers use to clear the layer.
 */
export function ringsToPolygon(rings: PolygonCoordinates): Polygon | null {
  if (!rings || rings.length === 0) {
    return null;
  }
  return new Polygon({
    rings: rings.map(ring => ring.map(point => [point[0], point[1]])),
    spatialReference: SpatialReference.WGS84
  });
}

/**
 * A drawn polygon -> stored rings.
 *
 * Rings too short to be a polygon are dropped rather than repaired: they only
 * occur when a gesture is abandoned early, and inventing a point to make one
 * valid would store geometry the user never drew.
 */
export function polygonToRings(polygon: Polygon | null | undefined): PolygonCoordinates {
  if (!polygon) {
    return [];
  }

  const geographic = polygon.spatialReference?.isWGS84
    ? polygon
    : (webMercatorUtils.webMercatorToGeographic(polygon) as Polygon | null);
  if (!geographic?.rings) {
    return [];
  }

  return geographic.rings
    // Round before closing, not after: rounding the two ends of an already
    // closed ring can move them apart and leave it open again.
    .map(ring => closeRing(roundRing(ring)))
    .filter(ring => ring.length >= MIN_RING_POINTS);
}
