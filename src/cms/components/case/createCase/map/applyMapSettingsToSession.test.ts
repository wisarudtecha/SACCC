// Tests for the "apply a just-saved settings document to this session" seam.
//
// Two things must hold, and both are invisible without a test:
//   1. after a successful save the new provider/basemap/style values are in force
//      for the maps opened next (no page reload);
//   2. the routing service's cached provider chunk is dropped whenever the
//      provider really changed - otherwise the map draws Longdo while "Calculate"
//      keeps calling ArcGIS, which looks like broken routing rather than stale
//      config.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { API_CONFIG, type MapProviderId } from "@/core/config/api";
import type { OrgMapSettings } from "@/core/types/organization";
import { buildDefaultOrgMapSettings } from "@/cms/utils/orgMapSettings";

const routeReset = vi.hoisted(() => ({ resetRouteService: vi.fn() }));

vi.mock("./services/routeService", () => ({
  resetRouteService: routeReset.resetRouteService,
}));

import { applyMapSettingsToSession } from "./applyMapSettingsToSession";
import {
  getMapRuntimeConfig,
  registerMountedMap,
  resetMapRuntimeConfig,
  setMapRuntimeConfig,
} from "./mapRuntimeConfig";

const mutableConfig = API_CONFIG as unknown as {
  MAP_PROVIDER: MapProviderId;
  LONGDO_API_KEY: string;
  MAPTILER_API_KEY: string;
};

const ORIGINAL = {
  provider: mutableConfig.MAP_PROVIDER,
  longdoKey: mutableConfig.LONGDO_API_KEY,
  maptilerKey: mutableConfig.MAPTILER_API_KEY,
};

const ORG = "org-a";

function settingsWith(general: Partial<OrgMapSettings["general"]>): OrgMapSettings {
  const base = buildDefaultOrgMapSettings(ORG);
  return { ...base, general: { ...base.general, ...general } };
}

/** Put the store where a loaded app would be: settled with "inherit everything". */
function settleAsInherit(): void {
  setMapRuntimeConfig({
    orgId: ORG,
    requestedProvider: null,
    basemapId: null,
    allowMapStyleChange: true,
  });
}

beforeEach(() => {
  mutableConfig.MAP_PROVIDER = "arcgis";
  mutableConfig.LONGDO_API_KEY = "test-longdo-key";
  mutableConfig.MAPTILER_API_KEY = "";
  routeReset.resetRouteService.mockClear();
  resetMapRuntimeConfig();
});

afterEach(() => {
  mutableConfig.MAP_PROVIDER = ORIGINAL.provider;
  mutableConfig.LONGDO_API_KEY = ORIGINAL.longdoKey;
  mutableConfig.MAPTILER_API_KEY = ORIGINAL.maptilerKey;
  resetMapRuntimeConfig();
  vi.restoreAllMocks();
});

describe("applyMapSettingsToSession", () => {
  it("puts the saved provider, basemap and style switch into force", () => {
    settleAsInherit();

    const result = applyMapSettingsToSession(
      settingsWith({
        mapProvider: "longdo",
        defaultBasemapId: "satellite",
        allowMapStyleChange: false,
      }),
      ORG
    );

    expect(result).toBe("applied");
    const config = getMapRuntimeConfig();
    expect(config.provider).toBe("longdo");
    expect(config.basemapId).toBe("satellite");
    expect(config.allowMapStyleChange).toBe(false);
  });

  it("drops the routing service's cached provider chunk after a real change", () => {
    settleAsInherit();

    applyMapSettingsToSession(settingsWith({ mapProvider: "longdo" }), ORG);

    // Without this the map would draw Longdo and Calculate would still call ArcGIS.
    expect(routeReset.resetRouteService).toHaveBeenCalledTimes(1);
  });

  it("does not touch the routing cache when nothing changed", () => {
    settleAsInherit();
    applyMapSettingsToSession(settingsWith({ mapProvider: "longdo" }), ORG);
    routeReset.resetRouteService.mockClear();

    const again = applyMapSettingsToSession(settingsWith({ mapProvider: "longdo" }), ORG);

    expect(again).toBe("unchanged");
    expect(routeReset.resetRouteService).not.toHaveBeenCalled();
  });

  it("keeps the session's provider and cache when a map is mounted", () => {
    settleAsInherit();
    const unregister = registerMountedMap();

    const result = applyMapSettingsToSession(settingsWith({ mapProvider: "longdo" }), ORG);

    expect(result).toBe("deferred");
    expect(getMapRuntimeConfig().provider).toBe("arcgis");
    expect(routeReset.resetRouteService).not.toHaveBeenCalled();

    unregister();
  });

  it("falls back to the deployment default for a provider this build cannot draw", () => {
    settleAsInherit();

    // Longdo without a key: the store reports the fallback instead of drawing blank.
    mutableConfig.LONGDO_API_KEY = "";
    const result = applyMapSettingsToSession(settingsWith({ mapProvider: "longdo" }), ORG);

    expect(result).toBe("applied");
    expect(getMapRuntimeConfig().provider).toBe("arcgis");
    expect(getMapRuntimeConfig().fallbackReason).toBe("unsupported");
    // The provider did not actually change, but the requested value did - the cache
    // reset is harmless either way and keeps the rule simple: applied => reset.
    expect(routeReset.resetRouteService).toHaveBeenCalledTimes(1);
  });
});
