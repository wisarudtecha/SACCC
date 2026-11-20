// The user's basemap choice, read only once the session's map configuration has
// settled.
//
// WHY THIS IS A HOOK AND NOT TWO CALLS IN THE COMPONENT: the stored preference is
// keyed by ORG and PROVIDER (decision A4, see basemaps.ts), so reading it before
// `mapRuntimeConfig` has settled builds the key from the wrong org (null) and the
// wrong provider (the deployment default). That is not a cosmetic race - it
// silently returns the default basemap, so a cold deep-link into a case form
// "forgets" the choice the user saved, while a later interaction saves it
// correctly and hides the bug.
//
// The read is deferred, then repeated exactly once on the transition, so a
// basemap the user already picked in this session is never overwritten.
import { useCallback, useEffect, useState } from "react";
import {
  DEFAULT_BASEMAP_ID,
  readBasemapPreference,
  writeBasemapPreference,
  type BasemapOptionId,
} from "./basemaps";
import { useMapRuntimeConfig } from "./useMapRuntimeConfig";

export interface UseBasemapPreferenceResult {
  basemapId: BasemapOptionId;
  /** Record and persist a choice the user made on the map. */
  selectBasemap: (id: BasemapOptionId) => void;
}

export function useBasemapPreference(): UseBasemapPreferenceResult {
  const { settled } = useMapRuntimeConfig();
  const [basemapId, setBasemapId] = useState<BasemapOptionId>(() =>
    settled ? readBasemapPreference() : DEFAULT_BASEMAP_ID
  );

  useEffect(() => {
    if (!settled) {
      return;
    }
    const stored = readBasemapPreference();
    // Updater form with an identity check: re-running this effect must not
    // overwrite a choice made in the meantime, and must not re-render for nothing.
    setBasemapId((previous) => (previous === stored ? previous : stored));
  }, [settled]);

  const selectBasemap = useCallback((id: BasemapOptionId) => {
    setBasemapId(id);
    writeBasemapPreference(id);
  }, []);

  return { basemapId, selectBasemap };
}
