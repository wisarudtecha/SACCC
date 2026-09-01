// Reverse geocoding on the ArcGIS World Geocoding Service.
//
// Lifted out of ArcgisAddressMap's click handler unchanged when a second
// provider arrived - same service, same URL, same single-line result.
import * as locator from "@arcgis/core/rest/locator.js";
import Point from "@arcgis/core/geometry/Point.js";
import { API_CONFIG } from "@/core/config/api";
import type { MapLatLon } from "../mapTypes";
import type { GeocodeService } from "./geocodeService";

export const arcgisGeocodeService: GeocodeService = {
  async reverseGeocode({ latitude, longitude }: MapLatLon): Promise<string> {
    // `language` is accepted and deliberately not forwarded: the service takes a
    // `langCode`, but this map has always answered in the key's default language
    // and changing that is a product decision, not a side effect of adding a
    // second provider.
    const candidate = await locator.locationToAddress(API_CONFIG.ARCGIS_GEOCODE_URL, {
      location: new Point({ latitude, longitude })
    });
    return candidate?.address ?? "";
  }
};
