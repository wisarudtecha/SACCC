// Settles the runtime map configuration once per session (Phase A2 of
// docs/ORG-SETTINGS-Runtime-Wiring-Plan.md).
//
// Renders nothing. Mounted inside `<AuthContext.Provider>` in AuthProvider, next
// to `<EntitlementsBootstrap />`, because it consumes `useAuth()` - a hook may
// not read the context its own component provides (that mistake already crashed
// the app once: see the AuthProvider lesson in .agents/skills/anti-regression).
//
// EVERY PATH MUST SETTLE. `mapRuntimeConfig.settled` gates whether a map draws or
// shows a placeholder, so a path that returns early without settling is a map
// that never appears - the same failure shape as a hardcoded `isLoading`. The
// three exits below are: no session (settle with the deployment default), still
// loading (wait), and anything else (settle from the document, defaults included).
import { useEffect } from "react";
import { useAuth } from "@/core/hooks/useAuth";
import { useOrgMapSettings } from "@/cms/components/admin/system-configuration/settings/useOrgMapSettings";
import {
  setMapRuntimeConfig,
  settleMapRuntimeConfigWithDefaults,
} from "./mapRuntimeConfig";

export function MapRuntimeConfigBootstrap(): null {
  const { state } = useAuth();
  const orgId = state.user?.orgId ?? "";
  // One read of the settings document for the whole app session; RTK Query
  // dedupes it with the runtime consumers that read the same key.
  const { loaded, loadState } = useOrgMapSettings();
  const { mapProvider, defaultBasemapId, allowMapStyleChange } = loaded.general;

  useEffect(() => {
    if (!orgId) {
      settleMapRuntimeConfigWithDefaults();
      return;
    }
    // The document decides the provider, so wait until it has been read. Its
    // failure modes settle too (`empty` = never saved, `error` = unreadable);
    // both resolve to the schema defaults, which is the documented fallback.
    if (loadState === "loading") {
      return;
    }
    setMapRuntimeConfig({
      orgId,
      requestedProvider: mapProvider,
      basemapId: defaultBasemapId,
      allowMapStyleChange,
    });
  }, [orgId, loadState, mapProvider, defaultBasemapId, allowMapStyleChange]);

  return null;
}

export default MapRuntimeConfigBootstrap;
