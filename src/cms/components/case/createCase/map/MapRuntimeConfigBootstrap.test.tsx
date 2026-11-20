// @vitest-environment jsdom
// The bootstrap is the only writer of the runtime map configuration, and its
// failure mode is silent: if any path returns without settling, every map renders
// its placeholder and nothing tells you why (the same shape as a hardcoded
// `isLoading`). So each exit is asserted here, not just the happy one.
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { API_CONFIG, type MapProviderId } from "@/core/config/api";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const mocks = vi.hoisted(() => ({
  auth: { user: { orgId: "org-a" } as { orgId?: string } | null },
  org: {
    loadState: "ready" as "loading" | "ready" | "empty" | "error",
    loaded: {
      general: {
        mapProvider: null as string | null,
        defaultBasemapId: null as string | null,
        allowMapStyleChange: true,
      },
    },
  },
}));

vi.mock("@/core/hooks/useAuth", () => ({
  useAuth: () => ({ state: mocks.auth }),
}));

vi.mock(
  "@/cms/components/admin/system-configuration/settings/useOrgMapSettings",
  () => ({
    useOrgMapSettings: () => ({ loaded: mocks.org.loaded, loadState: mocks.org.loadState }),
  })
);

import { MapRuntimeConfigBootstrap } from "./MapRuntimeConfigBootstrap";
import { getMapRuntimeConfig, resetMapRuntimeConfig } from "./mapRuntimeConfig";

const mutableConfig = API_CONFIG as unknown as {
  MAP_PROVIDER: MapProviderId;
  LONGDO_API_KEY: string;
};

const ORIGINAL = {
  provider: mutableConfig.MAP_PROVIDER,
  longdoKey: mutableConfig.LONGDO_API_KEY,
};

let root: ReturnType<typeof createRoot> | null = null;

function render(): void {
  const container = document.createElement("div");
  root = createRoot(container);
  act(() => {
    root?.render(<MapRuntimeConfigBootstrap />);
  });
}

beforeEach(() => {
  mutableConfig.MAP_PROVIDER = "arcgis";
  mutableConfig.LONGDO_API_KEY = "test-longdo-key";
  mocks.auth.user = { orgId: "org-a" };
  mocks.org.loadState = "ready";
  mocks.org.loaded.general = {
    mapProvider: null,
    defaultBasemapId: null,
    allowMapStyleChange: true,
  };
  resetMapRuntimeConfig();
});

afterEach(() => {
  act(() => {
    root?.unmount();
  });
  root = null;
  mutableConfig.MAP_PROVIDER = ORIGINAL.provider;
  mutableConfig.LONGDO_API_KEY = ORIGINAL.longdoKey;
  resetMapRuntimeConfig();
});

describe("MapRuntimeConfigBootstrap", () => {
  it("settles on the org's provider once the document is readable", () => {
    mocks.org.loaded.general.mapProvider = "longdo";
    render();

    const config = getMapRuntimeConfig();
    expect(config.settled).toBe(true);
    expect(config.provider).toBe("longdo");
    expect(config.orgId).toBe("org-a");
    expect(config.fallbackReason).toBeNull();
  });

  it("passes the basemap and style knobs through for the later phases", () => {
    mocks.org.loaded.general.defaultBasemapId = "satellite";
    mocks.org.loaded.general.allowMapStyleChange = false;
    render();

    const config = getMapRuntimeConfig();
    expect(config.basemapId).toBe("satellite");
    expect(config.allowMapStyleChange).toBe(false);
  });

  it("waits - does not settle - while the document is still loading", () => {
    mocks.org.loadState = "loading";
    mocks.org.loaded.general.mapProvider = "longdo";
    render();

    expect(getMapRuntimeConfig().settled).toBe(false);
  });

  it("settles with the deployment default when nobody is signed in", () => {
    mocks.auth.user = null;
    render();

    const config = getMapRuntimeConfig();
    expect(config.settled).toBe(true);
    expect(config.orgId).toBeNull();
    expect(config.provider).toBe("arcgis");
  });

  it("settles on an unreadable document, so the map still appears", () => {
    // A failed read hands the bootstrap the schema defaults, i.e. "inherit" -
    // that pairing is what a real error produces (useOrgMapSettings falls back to
    // buildDefaultOrgMapSettings). The point under test is that it settles at all.
    mocks.org.loadState = "error";
    mocks.org.loaded.general.mapProvider = null;
    render();

    const config = getMapRuntimeConfig();
    expect(config.settled).toBe(true);
    expect(config.provider).toBe("arcgis");
    expect(config.fallbackReason).toBe("not-configured");
  });
});
