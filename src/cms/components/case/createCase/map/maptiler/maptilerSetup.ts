// One-time MapLibre GL JS / MapTiler bootstrap.
//
// The analogue of arcgisSetup.ts and longdoSetup.ts, but simpler than both:
// `maplibre-gl` is a bundled dependency (like @arcgis/core, unlike Longdo's
// script tag), and MapLibre needs no global configuration - the MapTiler key
// travels in the style URL, exactly as the Longdo key travels in its SDK URL.
//
// So this module pulls in the stylesheet once, PINS THE TILE WORKER URL, and
// hands out the style-URL builder. The `maplibre-gl` JS itself is imported by
// the map component and the overlay hooks, all of which sit behind AddressMap's
// React.lazy - so an environment on ArcGIS or Longdo never downloads it.
//
// THE WORKER PIN is load-bearing. maplibre-gl renders every vector tile in a
// Web Worker whose URL it resolves internally as
// `new URL("./maplibre-gl-worker.mjs", import.meta.url)` - split across two
// helper functions, so Vite's worker scanner never sees it and never serves or
// emits the file. Result: the worker 404s / hangs, no tiles decode, and the map
// shows only its background colour. `?worker&url` makes Vite bundle the worker
// entry (following its own maplibre-gl-shared.mjs import) and emit it as an
// asset in both dev and build; `setWorkerUrl` overrides maplibre-gl's broken
// guess with that stable URL.
//
// The worker import is DYNAMIC, and deliberately so: a static `?worker&url`
// import is emitted by Vite's worker plugin even when this module is tree-shaken
// out of an ArcGIS / Longdo build, leaving a ~480KB orphan chunk in every such
// build. Dynamic import keeps the worker bundle inside the MapTiler async chunk.
import "maplibre-gl/dist/maplibre-gl.css";
import { setWorkerUrl } from "maplibre-gl";
import { API_CONFIG } from "@/core/config/api";

const STYLE_HOST = "https://api.maptiler.com/maps";

let workerPinned: Promise<void> | null = null;

/**
 * Pin maplibre-gl's tile-worker URL. Idempotent - resolves the same promise on
 * every call. MUST be awaited before constructing a `maplibregl.Map`, so the
 * worker is in place before the first tile is requested (see MapTilerAddressMap).
 */
export function ensureMapTilerWorker(): Promise<void> {
  if (!workerPinned) {
    workerPinned = import("maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url").then(
      (module) => {
        setWorkerUrl((module as { default: string }).default);
      }
    );
  }
  return workerPinned;
}

/**
 * A MapTiler style URL for the given style id, with the key appended and an
 * optional label language.
 *
 * Language rides in the style URL (`&language=`) rather than a runtime
 * `map.setLanguage` call, which maplibre-gl 6 does not expose - a language
 * change is therefore a style swap, handled by the same path as a basemap or
 * theme change.
 *
 * Throws when the key is unset rather than returning a keyless URL: MapTiler
 * answers a keyless style request with 403 and MapLibre renders an empty grey
 * canvas with no error, which is a worse failure than a thrown one the map
 * component can surface through `onError`.
 */
export function mapTilerStyleUrl(styleId: string, language?: string): string {
  const key = API_CONFIG.MAPTILER_API_KEY;
  if (!key) {
    throw new Error("VITE_MAPTILER_API_KEY is not set - the MapTiler map cannot load");
  }
  const params = new URLSearchParams({ key });
  if (language) {
    params.set("language", language);
  }
  return `${STYLE_HOST}/${styleId}/style.json?${params.toString()}`;
}
