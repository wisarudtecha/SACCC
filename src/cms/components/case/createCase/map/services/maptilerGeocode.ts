// Reverse geocoding and place search on the MapTiler Geocoding API.
//
// The MapTiler counterpart of arcgisGeocode.ts / longdoGeocode.ts. One REST API
// covers both directions - forward search for the app-built search box (MapTiler
// has no first-party search widget, same as Longdo) and reverse geocode for the
// map click. Both answered directly from the browser with the key in the query
// string, so no proxy is involved.
//
// Only REVERSE geocoding implements the shared GeocodeService interface;
// `searchPlaces` is separate, for the same reason it is on the Longdo side - see
// the note in geocodeService.ts.
import type { Language } from "@/core/config/i18n";
import { API_CONFIG } from "@/core/config/api";
import type { MapLatLon } from "../mapTypes";
import type { GeocodeService, PlaceCandidate } from "./geocodeService";

export type { PlaceCandidate };

const GEOCODE_HOST = "https://api.maptiler.com/geocoding";

/** How many candidates the search box offers - matches the Longdo limit. */
const SEARCH_LIMIT = 8;

/** Bias every lookup to Thailand: every case in this product is domestic. */
const COUNTRY = "th";

/**
 * A GeoJSON feature as the MapTiler geocoder emits it. Only the fields this
 * module reads are declared; `place_name_xx` keys appear when `language` is
 * passed and hold the localised full address.
 */
interface MapTilerFeature {
  text?: string;
  place_name?: string;
  center?: [number, number];
  geometry?: { coordinates?: [number, number] };
  [localisedPlaceName: string]: unknown;
}

/**
 * App language -> MapTiler geocoder language code. Chinese asks for `zh`; an
 * unknown language omits the parameter and takes the API's default.
 */
function toGeocodeLanguage(language: Language | undefined): string | undefined {
  if (language === "en") {
    return "en";
  }
  if (language === "cn") {
    return "zh";
  }
  if (language === "th") {
    return "th";
  }
  return undefined;
}

/** Trailing country segment stripped from a formatted line, for a compact readout. */
const COUNTRY_SUFFIXES = ["Thailand", "ประเทศไทย", "泰国"];

/**
 * A parsed JSON body, or null when the response is not usable.
 *
 * Shape is checked, never truthiness: an object is required and an array is
 * rejected outright, per the rule the area/tree reads learned (see the
 * anti-regression skill).
 */
async function readJsonObject(url: string): Promise<Record<string, unknown> | null> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`MapTiler geocoding request failed with ${response.status}`);
  }
  const parsed: unknown = await response.json();
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return null;
  }
  return parsed as Record<string, unknown>;
}

function readFeatures(body: Record<string, unknown> | null): MapTilerFeature[] {
  const features = body?.features;
  return Array.isArray(features) ? (features as MapTilerFeature[]) : [];
}

/** The best formatted line for a feature, localised when the API supplied one. */
function formatLine(feature: MapTilerFeature, language: Language | undefined): string {
  const localeKey = `place_name_${toGeocodeLanguage(language) ?? ""}`;
  const localised = typeof feature[localeKey] === "string" ? (feature[localeKey] as string) : "";
  const full = (localised || feature.place_name || "").trim();
  if (!full) {
    return "";
  }
  const parts = full.split(",").map((part) => part.trim()).filter(Boolean);
  if (parts.length >= 3 && COUNTRY_SUFFIXES.includes(parts[parts.length - 1])) {
    parts.pop();
  }
  return parts.join(" ");
}

function readCoordinates(feature: MapTilerFeature): [number, number] | null {
  const point = feature.center ?? feature.geometry?.coordinates;
  if (
    !Array.isArray(point) ||
    typeof point[0] !== "number" ||
    typeof point[1] !== "number" ||
    !Number.isFinite(point[0]) ||
    !Number.isFinite(point[1])
  ) {
    return null;
  }
  return [point[0], point[1]];
}

function buildUrl(path: string, language: Language | undefined, extra: Record<string, string>): string {
  const params = new URLSearchParams({
    key: API_CONFIG.MAPTILER_API_KEY,
    country: COUNTRY,
    ...extra
  });
  const languageCode = toGeocodeLanguage(language);
  if (languageCode) {
    params.set("language", languageCode);
  }
  return `${GEOCODE_HOST}/${path}.json?${params.toString()}`;
}

export const maptilerGeocodeService: GeocodeService = {
  async reverseGeocode({ latitude, longitude }: MapLatLon, language?: Language): Promise<string> {
    const url = buildUrl(`${longitude},${latitude}`, language, {});
    const body = await readJsonObject(url);
    const [first] = readFeatures(body);
    return first ? formatLine(first, language) : "";
  }
};

/**
 * Places matching a term, for the app-built search box.
 *
 * Separate from GeocodeService on purpose - see the note in geocodeService.ts.
 * Entries without usable coordinates are dropped: a candidate that cannot move
 * the map is a dead row in the list.
 */
export async function searchPlaces(
  term: string,
  language?: Language
): Promise<PlaceCandidate[]> {
  const keyword = term.trim();
  if (!keyword) {
    return [];
  }

  const url = buildUrl(encodeURIComponent(keyword), language, { limit: String(SEARCH_LIMIT) });
  const body = await readJsonObject(url);

  return readFeatures(body).reduce<PlaceCandidate[]>((candidates, feature) => {
    const coordinates = readCoordinates(feature);
    const name = (feature.text || "").trim();
    if (!coordinates || !name) {
      return candidates;
    }
    return [
      ...candidates,
      {
        name,
        address: formatLine(feature, language),
        latitude: coordinates[1],
        longitude: coordinates[0]
      }
    ];
  }, []);
}
