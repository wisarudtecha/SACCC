// Types for the Place entity: an org-curated facility (Police Station / Hospital /
// Fire Station) with a coordinate, managed through an admin screen and drawn as a
// map layer on Case Creation / Assignment.
//
// Canonical home for `PlaceCategory` - both the admin/API layer (placesApi.ts) and
// the map view-model (createCase/map/place/placeTypes.ts) import it from here so
// the category vocabulary never forks.

/**
 * The v1 category set (stakeholder decision 2). A controlled vocabulary, not free
 * text: this is data the org fully owns through the admin screen, unlike
 * `Device.deviceType`. "etc." categories are a later phase.
 */
export type PlaceCategory = "police_station" | "hospital" | "fire_station";

export const PLACE_CATEGORIES: readonly PlaceCategory[] = [
  "police_station",
  "hospital",
  "fire_station"
] as const;

/**
 * One admin-curated facility. Mirrors the flat `Property` shape
 * (`src/cms/types/unit.ts`): a business key + org + bilingual name + `active` +
 * audit fields, with `category` and a coordinate added.
 *
 * `latitude` / `longitude` are strings, matching `Device`
 * (`src/cms/types/deviceIoT.tsx`) and the BFF's convention for coordinates. The
 * map layer's normaliser parses and validates them before drawing, the same way
 * `toStaffMarkers` treats `Unit.locLat`.
 */
export interface Place {
  id: string;
  placeId: string;
  orgId: string;
  en: string;
  th: string;
  category: PlaceCategory;
  latitude: string;
  longitude: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
}

export interface PlaceCreateData {
  en: string;
  th: string;
  category: PlaceCategory;
  latitude: string;
  longitude: string;
  active: boolean;
}

export interface PlaceUpdateData {
  en: string;
  th: string;
  category: PlaceCategory;
  latitude: string;
  longitude: string;
  active: boolean;
}

export interface PlaceQueryParams {
  start?: number | 0;
  length?: number | 10;
}

export interface PlaceManagementProps {
  places?: Place[];
  isLoading?: boolean;
  isError?: boolean;
  /** Re-run the list query (RTK Query `refetch`) - used by the container's retry. */
  onRefresh?: () => void;
}

export interface PlaceMetrics {
  totalPlaces: number | string;
  activePlaces: number | string;
  inactivePlaces: number | string;
}
