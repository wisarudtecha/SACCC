// What "turn a point into an address" means, whoever answers it.
//
// Interface only. The implementations live in sibling files and are imported
// DIRECTLY by the map component that needs one - arcgisGeocode.ts by
// ArcgisAddressMap, longdoGeocode.ts by LongdoAddressMap. There is deliberately
// no central switch here: a module that imported both would put @arcgis/core in
// the bundle of an app configured for Longdo, which is most of what choosing a
// provider is supposed to avoid. Each map component already knows its own
// provider, so the choice costs nothing at the call site.
//
// Only REVERSE geocoding is shared. Forward search is not, because the two
// providers solve it at different layers: the ArcGIS map hands the job to the
// SDK's own Search widget (which owns its UI, its suggestions and its result
// list), while Longdo has no such widget and needs an app-built search box - so
// a `suggest` here would be implemented once and called never.
import type { Language } from "@/core/config/i18n";
import type { MapLatLon } from "../mapTypes";

export interface GeocodeService {
  /**
   * The address at a point, or "" when the service has nothing to say about it.
   *
   * Rejects only on a transport/service failure. "No address here" is a normal
   * answer over open water or unnamed land, and callers surface the coordinates
   * either way - see the click handler in either map component.
   *
   * `language` is a preference, not a guarantee: a provider that cannot answer
   * in it returns whatever it has rather than failing.
   */
  reverseGeocode(point: MapLatLon, language?: Language): Promise<string>;
}

/**
 * One place the app-built search box can offer.
 *
 * Lives here, next to the geocode interface, because more than one provider
 * needs it: any provider without a first-party search widget (Longdo, MapTiler)
 * builds its own search box and its own `searchPlaces` that returns these. The
 * ArcGIS map uses its SDK's Search widget and never constructs one.
 */
export interface PlaceCandidate {
  /** What the search box lists. */
  name: string;
  /** Longer description, shown under the name when the API supplies one. */
  address: string;
  latitude: number;
  longitude: number;
}
