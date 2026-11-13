// src/core/components/entitlements/EntitlementGate.test.tsx
//
// Covers the deployment-wide switch `VITE_SHOW_ENTITLEMENT_UPSELL`:
//
//   "true"  (default) a locked feature is ANNOUNCED - the inline upsell block, or
//                     the full-page lock state for a route-level gate.
//   "false"           a locked feature is HIDDEN - the inline gate renders nothing
//                     and a route-level gate redirects to the cms home, because a
//                     blank page with no way forward is not a hidden notice, it is
//                     a broken screen.
//
// The gate is imported dynamically after `vi.stubEnv` + `vi.resetModules()` so the
// test exercises the REAL flag module (env -> flag -> gate) instead of mocking the
// flag itself; a mocked flag would pass even if the wiring were wrong.
//
// `useEntitlements` is mocked so the test can drive `isLoading` / `isLocked`
// directly. The locked components are real, so a crash inside the upsell UI still
// fails here.
//
// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

const entState = vi.hoisted(() => ({ loading: false, locked: true }));

vi.mock("@/core/hooks/useEntitlements", () => ({
  useEntitlements: () => ({
    isLoading: entState.loading,
    isLocked: () => entState.locked,
  }),
}));

vi.mock("@/core/hooks/useTranslation", () => ({
  useTranslation: () => ({ t: (key: string) => key, language: "en" }),
}));

// React 19 only writes into a jsdom container inside `act` when this is set.
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const UPSALE_CTA = "entitlement.locked.cta";
const LOCK_PAGE_TITLE = "entitlement.locked.title";
const PROTECTED = "PROTECTED CONTENT";
const CMS_HOME = "CMS HOME";

let container: HTMLDivElement;
let root: Root;

/**
 * Mounts the gate on a `/kms` route with a `/cms` home route next to it, so the
 * full-page redirect can be observed. The flag is stubbed BEFORE the module is
 * imported, because `import.meta.env` is read once at module scope.
 */
const mountGate = async (
  flagValue: string,
  options: { fullPage?: boolean } = {},
) => {
  vi.stubEnv("VITE_SHOW_ENTITLEMENT_UPSELL", flagValue);
  vi.resetModules();
  const { EntitlementGate } = await import("./EntitlementGate");

  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);

  await act(async () => {
    root.render(
      <MemoryRouter initialEntries={["/kms"]}>
        <Routes>
          <Route
            path="/kms"
            element={
              <EntitlementGate feature="entitlement.kb" fullPage={options.fullPage}>
                <div>{PROTECTED}</div>
              </EntitlementGate>
            }
          />
          <Route path="/cms" element={<div>{CMS_HOME}</div>} />
        </Routes>
      </MemoryRouter>,
    );
  });
};

const text = () => container.textContent ?? "";

afterEach(async () => {
  await act(async () => {
    root.unmount();
  });
  container.remove();
  vi.unstubAllEnvs();
  vi.resetModules();
  entState.loading = false;
  entState.locked = true;
});

describe("EntitlementGate — VITE_SHOW_ENTITLEMENT_UPSELL", () => {
  it("announces a locked feature when the flag is on", async () => {
    await mountGate("true");

    expect(text()).toContain(UPSALE_CTA);
    expect(text()).not.toContain(PROTECTED);
  });

  it("renders nothing for a locked feature when the flag is off", async () => {
    await mountGate("false");

    expect(text()).toBe("");
    expect(text()).not.toContain(UPSALE_CTA);
    expect(text()).not.toContain(PROTECTED);
  });

  it("shows the full-page lock state for a route gate when the flag is on", async () => {
    await mountGate("true", { fullPage: true });

    expect(text()).toContain(LOCK_PAGE_TITLE);
    expect(text()).not.toContain(PROTECTED);
  });

  it("redirects a route gate to the cms home when the flag is off", async () => {
    await mountGate("false", { fullPage: true });

    // Not a blank page: the user has somewhere real to be.
    expect(text()).toContain(CMS_HOME);
    expect(text()).not.toContain(LOCK_PAGE_TITLE);
    expect(text()).not.toContain(PROTECTED);
  });

  it("still renders an entitled feature when the flag is off", async () => {
    // The switch hides NOTICES, not features the tenant actually bought.
    entState.locked = false;
    await mountGate("false");

    expect(text()).toContain(PROTECTED);
  });

  it("renders nothing while entitlements are loading, in both flag states", async () => {
    entState.loading = true;
    await mountGate("true");
    expect(text()).toBe("");

    await act(async () => {
      root.unmount();
    });
    container.remove();

    entState.loading = true;
    await mountGate("false");
    expect(text()).toBe("");
  });
});
