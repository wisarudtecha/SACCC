// Regression tests for the Map Settings loading gate.
//
// The bug these tests pin down: `useOrgMapSettings` used to return a hardcoded
// `isLoading: true` (its query had been commented out and the real expression
// went with it), so the section rendered its skeleton placeholder forever and
// the form was never mounted. Two separate contracts are asserted here:
//
//   1. the placeholder is transient - once `isLoading` settles, the form renders;
//   2. the placeholder is for the FIRST load only - a later refetch (every Save
//      invalidates the "Organization" tag) must not unmount the form, because
//      unmounting discards `advancedOpen`, `errors` and the admin's edits.
//
// The hook is mocked so the test can drive `isLoading` directly; every rendered
// child is real, so a broken import or a crash in a subsection still fails here.
//
// @vitest-environment jsdom
import { act, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MapSettingsSection } from "./MapSettingsSection";

const hookState = vi.hoisted(() => ({ loading: true }));

vi.mock("@/core/hooks/useTranslation", () => ({
  useTranslation: () => ({ t: (key: string) => key, language: "en" }),
}));

vi.mock("@/core/hooks/useToast", () => ({
  useToast: () => ({ toasts: [], addToast: () => "toast-1", removeToast: () => {} }),
}));

// Entitlements live in a context provider this test does not mount; the gate's
// own behaviour is covered elsewhere, so it is reduced to a passthrough here.
vi.mock("@/core/components/entitlements/EntitlementGate", () => ({
  EntitlementGate: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

vi.mock("../useOrgMapSettings", async () => {
  const { buildDefaultOrgMapSettings } = await import("@/cms/utils/orgMapSettings");
  const loaded = buildDefaultOrgMapSettings("org-1");
  return {
    useOrgMapSettings: () => ({
      loaded,
      isLoading: hookState.loading,
      isMock: false,
      isSaving: false,
      save: async () => ({ ok: true, record: loaded }),
    }),
  };
});

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const SAVE_LABEL = "settings.actions.save";

let container: HTMLDivElement;
let root: Root;

const render = async () => {
  await act(async () => {
    root.render(<MapSettingsSection />);
  });
};

const isPlaceholderShowing = () => container.querySelector(".animate-pulse") !== null;
const hasForm = () => (container.textContent ?? "").includes(SAVE_LABEL);

afterEach(async () => {
  await act(async () => {
    root.unmount();
  });
  container.remove();
  hookState.loading = true;
});

describe("MapSettingsSection loading gate", () => {
  it("shows the placeholder only while the first load is in flight", async () => {
    hookState.loading = true;
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);

    await render();
    expect(isPlaceholderShowing()).toBe(true);
    expect(hasForm()).toBe(false);

    // The query settles (a 404 / GraphQL error settles too - that is the point).
    hookState.loading = false;
    await render();

    expect(isPlaceholderShowing()).toBe(false);
    expect(hasForm()).toBe(true);
  });

  it("keeps the form mounted while a refetch is in flight", async () => {
    hookState.loading = true;
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);

    await render();
    hookState.loading = false;
    await render();
    expect(hasForm()).toBe(true);

    // Every Save invalidates the "Organization" tag, so this is the real
    // post-save state: the form must survive it.
    hookState.loading = true;
    await render();

    expect(isPlaceholderShowing()).toBe(false);
    expect(hasForm()).toBe(true);
  });
});
