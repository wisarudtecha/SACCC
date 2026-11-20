// @vitest-environment jsdom
// Regression test for the read-before-settle defect in the org-scoped basemap key.
//
// The stored preference is keyed by org AND provider. Reading it before
// `mapRuntimeConfig` settles produces the wrong key, so the map silently opens
// with the default basemap - and the user only notices as "my choice was
// forgotten" on a cold deep-link, which no other test covers.
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { API_CONFIG, type MapProviderId } from "@/core/config/api";
import { useBasemapPreference } from "./useBasemapPreference";
import {
  getMapRuntimeConfig,
  resetMapRuntimeConfig,
  setMapRuntimeConfig,
} from "./mapRuntimeConfig";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const mutableConfig = API_CONFIG as unknown as {
  MAP_PROVIDER: MapProviderId;
  LONGDO_API_KEY: string;
};

const ORIGINAL = {
  provider: mutableConfig.MAP_PROVIDER,
  longdoKey: mutableConfig.LONGDO_API_KEY,
};

let root: ReturnType<typeof createRoot> | null = null;
let container: HTMLDivElement;

/** Probe: renders the hook's value as text and exposes the setter on the element. */
function Probe(): React.ReactElement {
  const { basemapId, selectBasemap } = useBasemapPreference();
  (Probe as unknown as { select?: typeof selectBasemap }).select = selectBasemap;
  return <span>{basemapId}</span>;
}

function render(): void {
  container = document.createElement("div");
  root = createRoot(container);
  act(() => {
    root?.render(<Probe />);
  });
}

function value(): string {
  return container.textContent ?? "";
}

function settle(orgId: string, requestedProvider: string | null): void {
  act(() => {
    setMapRuntimeConfig({
      orgId,
      requestedProvider,
      basemapId: null,
      allowMapStyleChange: true,
    });
  });
}

beforeEach(() => {
  window.localStorage.clear();
  mutableConfig.MAP_PROVIDER = "arcgis";
  mutableConfig.LONGDO_API_KEY = "test-longdo-key";
  resetMapRuntimeConfig();
});

afterEach(() => {
  act(() => {
    root?.unmount();
  });
  root = null;
  window.localStorage.clear();
  mutableConfig.MAP_PROVIDER = ORIGINAL.provider;
  mutableConfig.LONGDO_API_KEY = ORIGINAL.longdoKey;
  resetMapRuntimeConfig();
});

describe("useBasemapPreference", () => {
  it("uses the default while the configuration has not settled", () => {
    window.localStorage.setItem("cms.map.basemap.org-a.longdo", "satellite");
    render();

    expect(getMapRuntimeConfig().settled).toBe(false);
    expect(value()).toBe("street");
  });

  it("picks up the stored choice once the configuration settles", () => {
    window.localStorage.setItem("cms.map.basemap.org-a.longdo", "satellite");
    render();
    settle("org-a", "longdo");

    expect(value()).toBe("satellite");
  });

  it("reads the current org's key, not another org's", () => {
    window.localStorage.setItem("cms.map.basemap.org-a.longdo", "satellite");
    render();
    settle("org-b", "longdo");

    expect(value()).toBe("street");
  });

  it("records and persists a choice made on the map", () => {
    render();
    settle("org-a", "longdo");

    act(() => {
      (Probe as unknown as { select?: (id: "satellite") => void }).select?.("satellite");
    });

    expect(value()).toBe("satellite");
    expect(window.localStorage.getItem("cms.map.basemap.org-a.longdo")).toBe("satellite");
  });
});
