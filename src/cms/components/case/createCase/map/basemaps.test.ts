// @vitest-environment jsdom
// The basemap preference key is per org AND per provider (decision A4).
//
// This is the one piece of map state that lives in the browser across tenants,
// so getting the namespace wrong is silent: each tenant simply sees the other's
// last choice. jsdom is required for localStorage.
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { API_CONFIG, type MapProviderId } from "@/core/config/api";
import { resetMapRuntimeConfig, setMapRuntimeConfig } from "./mapRuntimeConfig";
import {
  DEFAULT_BASEMAP_ID,
  basemapOptionsFor,
  getBasemapOptions,
  readBasemapPreference,
  writeBasemapPreference,
} from "./basemaps";

const mutableConfig = API_CONFIG as unknown as {
  MAP_PROVIDER: MapProviderId;
  LONGDO_API_KEY: string;
};

const ORIGINAL = {
  provider: mutableConfig.MAP_PROVIDER,
  longdoKey: mutableConfig.LONGDO_API_KEY,
};

function settleFor(
  orgId: string,
  requestedProvider: string | null,
  basemapId: string | null = null
): void {
  setMapRuntimeConfig({
    orgId,
    requestedProvider,
    basemapId,
    allowMapStyleChange: true,
  });
}

beforeEach(() => {
  window.localStorage.clear();
  mutableConfig.MAP_PROVIDER = "arcgis";
  mutableConfig.LONGDO_API_KEY = "test-longdo-key";
  resetMapRuntimeConfig();
});

afterEach(() => {
  window.localStorage.clear();
  mutableConfig.MAP_PROVIDER = ORIGINAL.provider;
  mutableConfig.LONGDO_API_KEY = ORIGINAL.longdoKey;
  resetMapRuntimeConfig();
});

describe("basemap preference storage", () => {
  it("namespaces the key by org and provider", () => {
    settleFor("org-a", "longdo");
    writeBasemapPreference("satellite");

    expect(window.localStorage.getItem("cms.map.basemap.org-a.longdo")).toBe("satellite");
    expect(readBasemapPreference()).toBe("satellite");
  });

  it("does not hand one org's choice to another on the same browser", () => {
    settleFor("org-a", "longdo");
    writeBasemapPreference("satellite");

    settleFor("org-b", "longdo");
    expect(readBasemapPreference()).toBe(DEFAULT_BASEMAP_ID);
  });

  it("keeps the org-less key for a session with no tenant", () => {
    resetMapRuntimeConfig();
    writeBasemapPreference("satellite");

    expect(window.localStorage.getItem("cms.map.basemap.arcgis")).toBe("satellite");
  });

  it("ignores a stored value the active provider cannot draw", () => {
    settleFor("org-a", null);
    window.localStorage.setItem("cms.map.basemap.org-a.arcgis", "terrain");

    expect(readBasemapPreference()).toBe(DEFAULT_BASEMAP_ID);
  });
});

describe("basemap resolution order (B8)", () => {
  it("uses the org's default basemap when this browser has no choice of its own", () => {
    settleFor("org-a", null, "satellite");

    expect(readBasemapPreference()).toBe("satellite");
  });

  it("lets this browser's own choice win over the org default", () => {
    settleFor("org-a", null, "satellite");
    writeBasemapPreference("street");

    expect(readBasemapPreference()).toBe("street");
  });

  it("falls back to the provider default when the org default is not a real id", () => {
    // The document is server data: an id outside the catalogue must not become a
    // dead choice (BasemapSwitcher would render no active option).
    settleFor("org-a", null, "terrain");

    expect(readBasemapPreference()).toBe(DEFAULT_BASEMAP_ID);
  });
});

describe("basemap catalogue", () => {
  it("is read at call time, not frozen at module load", () => {
    settleFor("org-a", null);
    expect(getBasemapOptions()).toBe(basemapOptionsFor("arcgis"));

    resetMapRuntimeConfig();
    settleFor("org-a", "longdo");
    expect(getBasemapOptions()).toBe(basemapOptionsFor("longdo"));
  });
});
