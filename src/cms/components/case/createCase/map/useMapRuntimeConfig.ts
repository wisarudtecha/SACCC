// React binding for the runtime map configuration.
//
// Kept apart from `mapRuntimeConfig.ts` so that module stays importable from
// non-React code (`basemaps.ts`, `routeService.ts`) without dragging React in.
//
// `useSyncExternalStore` rather than a copy into component state: the provider
// must be read during render (it decides WHICH component renders) and every
// subscriber has to see the same settled value at the same time.
import { useSyncExternalStore } from "react";
import {
  getMapRuntimeConfig,
  subscribeMapRuntimeConfig,
  type MapRuntimeConfig,
} from "./mapRuntimeConfig";

export function useMapRuntimeConfig(): MapRuntimeConfig {
  return useSyncExternalStore(
    subscribeMapRuntimeConfig,
    getMapRuntimeConfig,
    getMapRuntimeConfig
  );
}
