// Reverse geocoding and place search on Longdo's JSON APIs.
//
// Plain HTTP, not the SDK: `map.Search` is bound to a map instance and reports
// through map events, which is the wrong shape for both callers here - a click
// handler that wants one address, and a search box that wants a list. Both
// endpoints answered directly from the browser in the spike (HTTP 200, CORS
// headers present), so no proxy is involved.
//
// The two live on different hosts, which is the vendor's arrangement, not a
// typo: addresses come from api.longdo.com and search from search.longdo.com.
import type { Language } from "@/core/config/i18n";
import { API_CONFIG } from "@/core/config/api";
import type { MapLatLon } from "../mapTypes";
import type { GeocodeService } from "./geocodeService";

const ADDRESS_URL = "https://api.longdo.com/map/services/address";
const SEARCH_URL = "https://search.longdo.com/mapsearch/json/search";

/** How many candidates the search box offers. */
const SEARCH_LIMIT = 8;

/**
 * Longdo answers with address COMPONENTS, never a formatted line - unlike the
 * ArcGIS geocoder, which returns one. Composing it here keeps that difference
 * out of the map component, which only ever wants a string.
 */
interface LongdoAddressResponse {
  road?: string;
  subdistrict?: string;
  district?: string;
  province?: string;
  postcode?: string;
  country?: string;
}

interface LongdoSearchEntry {
  name?: string;
  address?: string;
  lat?: number;
  lon?: number;
}

interface LongdoSearchResponse {
  data?: LongdoSearchEntry[];
}

export interface PlaceCandidate {
  /** What the search box lists. */
  name: string;
  /** Longer description, shown under the name when the API supplies one. */
  address: string;
  latitude: number;
  longitude: number;
}

/**
 * App language -> Longdo locale.
 *
 * Chinese is not offered by the API, so `cn` asks for English rather than
 * sending an unsupported code: an English address is readable, a rejected
 * request is not.
 */
function toLongdoLocale(language: Language | undefined): string {
  return language === "en" || language === "cn" ? "en" : "th";
}

/**
 * A parsed JSON body, or null when the response is not usable.
 *
 * Shape is never inferred from truthiness here: an object is required, and an
 * array is rejected outright, per the rule the area/tree reads learned the hard
 * way (see the anti-regression skill).
 */
async function readJsonObject(url: string): Promise<Record<string, unknown> | null> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Longdo request failed with ${response.status}`);
  }
  const parsed: unknown = await response.json();
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return null;
  }
  return parsed as Record<string, unknown>;
}

function toTrimmedString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

/**
 * Components -> one line, most specific first, which is how a Thai address is
 * read aloud and how the ArcGIS geocoder already formats its own.
 *
 * `country` is deliberately dropped: every case in this product is domestic, and
 * a trailing "ประเทศไทย" on every address is noise in a 320px readout.
 */
function formatAddress(address: LongdoAddressResponse): string {
  return [
    address.road,
    address.subdistrict,
    address.district,
    address.province,
    address.postcode
  ]
    .map(toTrimmedString)
    .filter((part) => part.length > 0)
    .join(" ");
}

export const longdoGeocodeService: GeocodeService = {
  async reverseGeocode({ latitude, longitude }: MapLatLon, language?: Language): Promise<string> {
    const url =
      `${ADDRESS_URL}?lon=${longitude}&lat=${latitude}` +
      `&locale=${toLongdoLocale(language)}&key=${encodeURIComponent(API_CONFIG.LONGDO_API_KEY)}`;

    const parsed = await readJsonObject(url);
    if (!parsed) {
      return "";
    }
    return formatAddress(parsed as LongdoAddressResponse);
  }
};

/**
 * Places matching a term, for the app-built search box.
 *
 * Separate from GeocodeService on purpose - see the note in geocodeService.ts:
 * only Longdo needs this, because only Longdo lacks a search widget.
 *
 * Entries without usable coordinates are dropped rather than shown: a candidate
 * that cannot move the map is a dead row in the list.
 */
export async function searchPlaces(
  term: string,
  language?: Language
): Promise<PlaceCandidate[]> {
  const keyword = term.trim();
  if (!keyword) {
    return [];
  }

  const url =
    `${SEARCH_URL}?keyword=${encodeURIComponent(keyword)}&limit=${SEARCH_LIMIT}` +
    `&locale=${toLongdoLocale(language)}&key=${encodeURIComponent(API_CONFIG.LONGDO_API_KEY)}`;

  const parsed = await readJsonObject(url);
  const entries = (parsed as LongdoSearchResponse | null)?.data;
  if (!Array.isArray(entries)) {
    return [];
  }

  return entries.reduce<PlaceCandidate[]>((candidates, entry) => {
    const name = toTrimmedString(entry?.name);
    const latitude = entry?.lat;
    const longitude = entry?.lon;
    if (!name || !Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return candidates;
    }
    return [
      ...candidates,
      {
        name,
        address: toTrimmedString(entry?.address),
        latitude: latitude as number,
        longitude: longitude as number
      }
    ];
  }, []);
}
