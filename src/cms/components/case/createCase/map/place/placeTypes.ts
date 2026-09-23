// View-model for the Place layer markers drawn on the case map.
//
// A Place is an org-curated facility - a specific Police Station, Hospital or
// Fire Station - managed through an admin screen (see PlaceManagement). The map
// only ever DRAWS these and reports a click on one: selecting a Place marker is
// informational, it writes nothing to the case (stakeholder decision Q1).
//
// Kept free of any map SDK import, matching mapTypes.ts / staffTypes.ts: these
// types are referenced by the case form and the case detail view, neither of
// which should pull a mapping SDK into its chunk.

// The category vocabulary is owned by the entity types, not the map layer - the
// admin/API layer needs the same union. Imported and re-exported here so map-side
// importers keep a single, stable path.
import { PLACE_CATEGORIES } from "@/cms/types/place";
import type { Place, PlaceCategory } from "@/cms/types/place";
import { isMappableCoordinate } from "../staff/staffTypes";

export { PLACE_CATEGORIES };
export type { PlaceCategory };

/**
 * One admin-curated facility, normalised for the map.
 *
 * `latitude` / `longitude` are already parsed to finite numbers and validated as
 * mappable by the normaliser that builds this (see toPlaceMarkers, added with the
 * Place data fetch): a component that receives a PlaceMarker can draw it without
 * re-checking the coordinate, exactly as the staff layer treats StaffMarker.
 */
export interface PlaceMarker {
  id: string;
  name: string;
  category: PlaceCategory;
  latitude: number;
  longitude: number;
}

/**
 * What a click on the Place layer resolved to.
 *
 * A discriminated union rather than a bare id because Places that overlap on
 * screen are drawn as one group (see placeClusters.ts), and a click on that
 * group has to be distinguishable from a click on one facility - it opens a
 * picker rather than the info popup. Mirrors StaffSelection.
 */
export type PlaceSelection =
  | { type: "place"; id: string }
  | { type: "group"; placeIds: readonly string[] };

/** A finite number, or null. `Place` coordinates arrive from the API as strings. */
function toFiniteNumber(value: unknown): number | null {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

/**
 * `Place[]` from the admin API -> `PlaceMarker[]` the map can draw.
 *
 * The single place that decides what counts as a mappable Place, mirroring
 * `toStaffMarkers`: parse the string coordinates, drop anything that is not a
 * usable point (exact 0/0, out of range), and resolve the bilingual name to the
 * active language once so every consumer agrees on the label.
 */
export function toPlaceMarkers(
  places: readonly Place[] | undefined,
  language: string
): PlaceMarker[] {
  if (!places?.length) {
    return [];
  }
  return places.reduce<PlaceMarker[]>((markers, place) => {
    const latitude = toFiniteNumber(place.latitude);
    const longitude = toFiniteNumber(place.longitude);
    if (latitude === null || longitude === null || !isMappableCoordinate(latitude, longitude)) {
      return markers;
    }
    const name = language === "th" ? place.th || place.en : place.en || place.th;
    return [
      ...markers,
      { id: place.id, name: name || place.id, category: place.category, latitude, longitude }
    ];
  }, []);
}
