// One-time Longdo Map SDK bootstrap.
//
// The analogue of arcgisSetup.ts, but the mechanism is different in a way that
// matters: @arcgis/core is a bundled dependency, while Longdo ships as a script
// tag that defines a `window.longdo` global and takes its API key in the URL.
// So this module loads that script exactly once per document and hands every
// caller the same promise.
//
// The promise - not a boolean flag - is the whole point. Two maps can mount at
// the same time (the inline map and the one in the expand modal), React Strict
// Mode mounts each of them twice in development, and every one of those needs
// the SDK before it can build anything. A flag would let the second caller
// proceed while the script was still in flight.
import { API_CONFIG } from "@/core/config/api";
import type { LongdoGlobal } from "./longdoApi";

const SCRIPT_ID = "longdo-map-sdk";
const SDK_URL = "https://api.longdo.com/map3/";

let loadPromise: Promise<LongdoGlobal> | null = null;

/**
 * Resolve the Longdo global, loading the SDK if it is not already present.
 *
 * A failed load is NOT cached: the promise is cleared on rejection so the next
 * mount tries again. A transient network failure while opening a case form
 * should not leave every map in the session permanently broken.
 */
export function loadLongdo(): Promise<LongdoGlobal> {
  if (loadPromise) {
    return loadPromise;
  }

  loadPromise = new Promise<LongdoGlobal>((resolve, reject) => {
    if (window.longdo) {
      resolve(window.longdo);
      return;
    }

    const apiKey = API_CONFIG.LONGDO_API_KEY;
    if (!apiKey) {
      reject(new Error("VITE_LONGDO_API_KEY is not set - the Longdo map cannot load"));
      return;
    }

    // The key travels in the script URL: that is the SDK's only way of taking
    // it, and it is a browser-side key scoped by referrer, not a secret this
    // code could keep anyway.
    const script =
      (document.getElementById(SCRIPT_ID) as HTMLScriptElement | null) ??
      document.createElement("script");

    script.id = SCRIPT_ID;
    script.async = true;
    script.onload = () => {
      if (window.longdo) {
        resolve(window.longdo);
      } else {
        reject(new Error("The Longdo SDK loaded but did not define window.longdo"));
      }
    };
    script.onerror = () => reject(new Error("Failed to load the Longdo Map SDK"));

    if (!script.src) {
      script.src = `${SDK_URL}?key=${encodeURIComponent(apiKey)}`;
    }
    if (!script.parentNode) {
      document.head.appendChild(script);
    }
  });

  loadPromise.catch(() => {
    loadPromise = null;
  });

  return loadPromise;
}
