// Tests for the runtime map configuration store.
//
// What they protect: the provider is chosen from the org's settings once per
// session, a provider this environment cannot draw falls back to the deployment
// default instead of rendering a blank map, and a settled session never swaps
// provider underneath a live MapView (that remount throws away pan/zoom and any
// uncommitted sketch).
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { API_CONFIG, type MapProviderId } from "@/core/config/api";
import {
  applyMapRuntimeConfig,
  getMapRuntimeConfig,
  registerMountedMap,
  resetMapRuntimeConfig,
  setMapRuntimeConfig,
  settleMapRuntimeConfigWithDefaults,
  subscribeMapRuntimeConfig,
} from "./mapRuntimeConfig";

/** Mutable in tests on purpose: this is how a deployment's env reaches the store. */
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

beforeEach(() => {
  // Pin the deployment default and the key availability so the expectations do
  // not depend on whatever .env the suite happens to run against.
  mutableConfig.MAP_PROVIDER = "arcgis";
  mutableConfig.LONGDO_API_KEY = "test-longdo-key";
  mutableConfig.MAPTILER_API_KEY = "";
  resetMapRuntimeConfig();
});

afterEach(() => {
  mutableConfig.MAP_PROVIDER = ORIGINAL.provider;
  mutableConfig.LONGDO_API_KEY = ORIGINAL.longdoKey;
  mutableConfig.MAPTILER_API_KEY = ORIGINAL.maptilerKey;
  resetMapRuntimeConfig();
  vi.restoreAllMocks();
});

describe("before the session is settled", () => {
  it("reports the deployment default and stays unsettled, so maps wait", () => {
    const config = getMapRuntimeConfig();
    expect(config.settled).toBe(false);
    expect(config.provider).toBe("arcgis");
    expect(config.deploymentDefaultProvider).toBe("arcgis");
    expect(config.orgId).toBeNull();
  });
});

describe("resolving an org's configuration", () => {
  it("honours the org's provider when it is usable", () => {
    setMapRuntimeConfig({
      orgId: ORG,
      requestedProvider: "longdo",
      basemapId: "satellite",
      allowMapStyleChange: false,
    });

    const config = getMapRuntimeConfig();
    expect(config.settled).toBe(true);
    expect(config.provider).toBe("longdo");
    expect(config.requestedProvider).toBe("longdo");
    expect(config.fallbackReason).toBeNull();
    expect(config.basemapId).toBe("satellite");
    expect(config.allowMapStyleChange).toBe(false);
  });

  it("treats 'no choice made' as inherit, not as a fallback", () => {
    setMapRuntimeConfig({
      orgId: ORG,
      requestedProvider: null,
      basemapId: null,
      allowMapStyleChange: true,
    });

    const config = getMapRuntimeConfig();
    expect(config.provider).toBe("arcgis");
    expect(config.fallbackReason).toBe("not-configured");
  });

  it("falls back when the org's provider has no usable credential", () => {
    setMapRuntimeConfig({
      orgId: ORG,
      requestedProvider: "maptiler", // no MAPTILER_API_KEY in this environment
      basemapId: null,
      allowMapStyleChange: true,
    });

    const config = getMapRuntimeConfig();
    expect(config.provider).toBe("arcgis");
    expect(config.requestedProvider).toBe("maptiler");
    expect(config.fallbackReason).toBe("unsupported");
  });

  it("falls back when the stored value is not a provider this client knows", () => {
    // The document is server data: a string outside the union can reach here even
    // though the type says otherwise.
    setMapRuntimeConfig({
      orgId: ORG,
      requestedProvider: "here-maps",
      basemapId: null,
      allowMapStyleChange: true,
    });

    const config = getMapRuntimeConfig();
    expect(config.provider).toBe("arcgis");
    expect(config.fallbackReason).toBe("unsupported");
  });

  it("keeps ArcGIS available without a key, because its basemaps degrade", () => {
    mutableConfig.MAP_PROVIDER = "longdo";
    mutableConfig.LONGDO_API_KEY = "";
    resetMapRuntimeConfig();

    setMapRuntimeConfig({
      orgId: ORG,
      requestedProvider: "arcgis",
      basemapId: null,
      allowMapStyleChange: true,
    });

    expect(getMapRuntimeConfig().provider).toBe("arcgis");
    expect(getMapRuntimeConfig().fallbackReason).toBeNull();
  });
});

describe("once per session", () => {
  it("ignores a changed configuration for the same org", () => {
    setMapRuntimeConfig({
      orgId: ORG,
      requestedProvider: "longdo",
      basemapId: null,
      allowMapStyleChange: true,
    });
    setMapRuntimeConfig({
      orgId: ORG,
      requestedProvider: "maptiler",
      basemapId: "satellite",
      allowMapStyleChange: false,
    });

    const config = getMapRuntimeConfig();
    expect(config.provider).toBe("longdo");
    expect(config.basemapId).toBeNull();
    expect(config.allowMapStyleChange).toBe(true);
  });

  it("replaces the configuration for a different org, so tenants never mix", () => {
    setMapRuntimeConfig({
      orgId: "org-a",
      requestedProvider: "longdo",
      basemapId: "satellite",
      allowMapStyleChange: false,
    });
    setMapRuntimeConfig({
      orgId: "org-b",
      requestedProvider: null,
      basemapId: null,
      allowMapStyleChange: true,
    });

    const config = getMapRuntimeConfig();
    expect(config.orgId).toBe("org-b");
    expect(config.provider).toBe("arcgis");
    expect(config.basemapId).toBeNull();
    expect(config.allowMapStyleChange).toBe(true);
  });

  it("settles with defaults when nobody is signed in", () => {
    settleMapRuntimeConfigWithDefaults();

    const config = getMapRuntimeConfig();
    expect(config.settled).toBe(true);
    expect(config.orgId).toBeNull();
    expect(config.provider).toBe("arcgis");
    expect(config.fallbackReason).toBeNull();
  });

  it("notifies subscribers on a real change and stays silent on a repeat", () => {
    const listener = vi.fn();
    const unsubscribe = subscribeMapRuntimeConfig(listener);

    const input = {
      orgId: ORG,
      requestedProvider: "longdo",
      basemapId: null,
      allowMapStyleChange: true,
    };
    setMapRuntimeConfig(input);
    expect(listener).toHaveBeenCalledTimes(1);

    // Identical input: the settings document refetching is not a second writer.
    setMapRuntimeConfig({ ...input });
    expect(listener).toHaveBeenCalledTimes(1);

    // Changed input for the same org: ignored, and therefore silent.
    setMapRuntimeConfig({ ...input, requestedProvider: "maptiler" });
    expect(listener).toHaveBeenCalledTimes(1);

    unsubscribe();
    setMapRuntimeConfig({
      orgId: "org-b",
      requestedProvider: null,
      basemapId: null,
      allowMapStyleChange: true,
    });
    expect(listener).toHaveBeenCalledTimes(1);
  });
});

describe("applyMapRuntimeConfig (settings save)", () => {
  const longdoInput = {
    orgId: ORG,
    requestedProvider: "longdo",
    basemapId: "satellite" as string | null,
    allowMapStyleChange: false,
  };

  it("replaces the configuration for the same org - the one exception to once-per-session", () => {
    setMapRuntimeConfig({
      orgId: ORG,
      requestedProvider: null,
      basemapId: null,
      allowMapStyleChange: true,
    });
    // setMapRuntimeConfig would refuse this; apply is what the settings save calls.
    expect(applyMapRuntimeConfig(longdoInput)).toBe("applied");

    const config = getMapRuntimeConfig();
    expect(config.provider).toBe("longdo");
    expect(config.basemapId).toBe("satellite");
    expect(config.allowMapStyleChange).toBe(false);
  });

  it("notifies subscribers so an already-rendered surface re-reads the values", () => {
    const listener = vi.fn();
    const unsubscribe = subscribeMapRuntimeConfig(listener);
    setMapRuntimeConfig({
      orgId: ORG,
      requestedProvider: null,
      basemapId: null,
      allowMapStyleChange: true,
    });
    listener.mockClear();

    applyMapRuntimeConfig(longdoInput);

    expect(listener).toHaveBeenCalledTimes(1);
    unsubscribe();
  });

  it("is a silent no-op when the values are already in force", () => {
    setMapRuntimeConfig({
      orgId: ORG,
      requestedProvider: "longdo",
      basemapId: "satellite",
      allowMapStyleChange: false,
    });
    const listener = vi.fn();
    const unsubscribe = subscribeMapRuntimeConfig(listener);

    expect(applyMapRuntimeConfig(longdoInput)).toBe("unchanged");
    expect(listener).not.toHaveBeenCalled();
    unsubscribe();
  });

  it("defers while a map is mounted, keeping the current provider for this session", () => {
    setMapRuntimeConfig({
      orgId: ORG,
      requestedProvider: null,
      basemapId: null,
      allowMapStyleChange: true,
    });
    const unregister = registerMountedMap();

    // Swapping the provider under a live MapView would remount it and destroy
    // pan/zoom plus any uncommitted sketch or pin - the whole reason this store
    // resolves once.
    expect(applyMapRuntimeConfig(longdoInput)).toBe("deferred");
    expect(getMapRuntimeConfig().provider).toBe("arcgis");
    expect(getMapRuntimeConfig().requestedProvider).toBeNull();

    unregister();
  });

  it("applies once the last map unmounts", () => {
    setMapRuntimeConfig({
      orgId: ORG,
      requestedProvider: null,
      basemapId: null,
      allowMapStyleChange: true,
    });
    const unregisterFirst = registerMountedMap();
    const unregisterSecond = registerMountedMap();

    unregisterFirst();
    expect(applyMapRuntimeConfig(longdoInput)).toBe("deferred");

    unregisterSecond();
    expect(applyMapRuntimeConfig(longdoInput)).toBe("applied");
    expect(getMapRuntimeConfig().provider).toBe("longdo");
  });
});
