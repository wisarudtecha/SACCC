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

/**
 * The v1 category set (stakeholder decision 2). A controlled vocabulary rather
 * than free text because this is data the org fully owns through the admin
 * screen - unlike `Device.deviceType`, which is free text on an existing feed.
 * "etc." categories are a later phase.
 */
export type PlaceCategory = "police_station" | "hospital" | "fire_station";

export const PLACE_CATEGORIES: readonly PlaceCategory[] = [
  "police_station",
  "hospital",
  "fire_station"
] as const;

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
