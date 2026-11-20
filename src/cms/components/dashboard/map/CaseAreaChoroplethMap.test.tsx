// The GIS gate at the choropleth map's provider switch.
//
// Why this test exists at all: the map fetches district boundary geometry from object
// storage in a mount effect, so "the caller forgot to hide the map" used to mean an
// unentitled tenant pulled polygons (and the map SDK chunk) anyway. Both assertions here
// are about work that must NOT happen: no geometry fetch, and no card content.
//
// The entitled path is deliberately not rendered here - it would boot ArcGIS/MapLibre in
// jsdom. The gate's own "entitled -> children" behaviour is covered by
// `EntitlementGate.test.tsx`.
//
// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const upsellState = vi.hoisted(() => ({ enabled: true }));
const { fetchFeaturesSpy } = vi.hoisted(() => ({ fetchFeaturesSpy: vi.fn() }));

vi.mock("@/core/config/featureFlags", () => ({
  get ENTITLEMENT_UPSELL_ENABLED() {
    return upsellState.enabled;
  },
  CASE_IOT_ENABLED: true,
}));

vi.mock("@/core/hooks/useEntitlements", () => ({
  useEntitlements: () => ({
    // No GIS add-on for this tenant.
    hasFeature: () => false,
    isLocked: () => true,
    isLoading: false,
    status: "ready",
  }),
}));

vi.mock("@/core/hooks/useTranslation", () => ({
  useTranslation: () => ({ t: (key: string) => key, language: "en" }),
}));

vi.mock("@/core/context/ThemeContext", () => ({
  useTheme: () => ({ theme: "light" }),
}));

vi.mock("@/cms/components/dashboard/map/caseAreaGeometry", () => ({
  fetchCaseAreaDistrictFeatures: () => {
    fetchFeaturesSpy();
    return Promise.resolve([]);
  },
}));

import { CaseAreaChoroplethMap } from "./CaseAreaChoroplethMap";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const LOCK_SUBTITLE = "entitlement.locked.subtitle";

let container: HTMLDivElement;
let root: Root;

const mount = async () => {
  await act(async () => {
    root.render(<CaseAreaChoroplethMap rows={[]} height={200} />);
  });
  // Let any effect that DID run settle before asserting it didn't.
  await act(async () => {
    await Promise.resolve();
  });
};

beforeEach(() => {
  upsellState.enabled = true;
  fetchFeaturesSpy.mockReset();
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(async () => {
  await act(async () => {
    root.unmount();
  });
  container.remove();
  document.body.innerHTML = "";
});

describe("CaseAreaChoroplethMap — GIS entitlement", () => {
  it("fetches no boundary geometry and announces the lock when the add-on is missing", async () => {
    await mount();

    expect(fetchFeaturesSpy).not.toHaveBeenCalled();
    expect(document.body.textContent ?? "").toContain(LOCK_SUBTITLE);
  });

  it("renders nothing at all when the upsell flag is off", async () => {
    upsellState.enabled = false;
    await mount();

    expect(fetchFeaturesSpy).not.toHaveBeenCalled();
    expect(document.body.textContent ?? "").not.toContain(LOCK_SUBTITLE);
    expect(container.textContent ?? "").toBe("");
  });
});
