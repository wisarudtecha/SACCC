// One-time ArcGIS Maps SDK bootstrap.
//
// `@arcgis/core` needs two things configured before any map/widget renders:
//   1. an API key for the basemap + World Geocoding Service, and
//   2. an `assetsPath` telling the SDK where to load its runtime assets
//      (icons, fonts, workers) from.
//
// Vite does not serve the package's `assets/` folder automatically, so we point
// `assetsPath` at the versioned CDN. ARCGIS_VERSION must track the installed
// `@arcgis/core` major.minor (see package.json) so the CDN assets match the
// bundled JS.
import esriConfig from "@arcgis/core/config.js";
import { API_CONFIG } from "@/core/config/api";

export const ARCGIS_VERSION = "5.1";

let initialized = false;

export function initArcgis(): void {
  if (initialized) {
    return;
  }
  esriConfig.assetsPath = `https://js.arcgis.com/${ARCGIS_VERSION}/@arcgis/core/assets`;
  if (API_CONFIG.ARCGIS_API_KEY) {
    esriConfig.apiKey = API_CONFIG.ARCGIS_API_KEY;
  }
  initialized = true;
}
