// Regression tests for the Organization Settings page shell.
//
// These supersede `map/MapSettingsSection.test.tsx`: the loading gate and the Save
// button moved from the section into this shell when the page was collapsed onto ONE
// form (the backend stores map + assignment as a single JSON document, so a save
// replaces the whole value). Three contracts are pinned here:
//
//   1. THE PLACEHOLDER IS TRANSIENT AND FIRST-LOAD ONLY. It once was a hardcoded
//      `isLoading: true`, leaving the page on its skeleton forever; and a later
//      refetch (every save invalidates the tag) must not unmount the form, because
//      unmounting discards the admin's edits, the validation errors and the open
//      disclosures.
//   2. ONE SAVE, ONE DOCUMENT. Clicking Save must hand BOTH sections to the hook -
//      a section-only body would erase the other half on the server.
//   3. A DOCUMENT THAT COULD NOT BE READ IS NOT SAVEABLE. `loaded` falls back to
//      schema defaults on a failed read, so an enabled Save would overwrite the
//      stored settings with defaults.
//
// @vitest-environment jsdom
import { act, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { OrgConfigPropertiesDoc } from "@/core/types/organization";
import { API_CONFIG } from "@/core/config/api";
import {
  getMapRuntimeConfig,
  resetMapRuntimeConfig,
} from "@/cms/components/case/createCase/map/mapRuntimeConfig";
import OrganizationSettingsManagement from "./OrganizationSettingsManagement";

const state = vi.hoisted(() => ({
  loadState: "loading" as "loading" | "ready" | "empty" | "error",
  loadError: "",
  savedDoc: null as unknown,
  /** The document the mocked hook returns - tests may edit it before rendering. */
  loaded: null as unknown,
}));

vi.mock("@/core/hooks/useTranslation", () => ({
  useTranslation: () => ({ t: (key: string) => key, language: "en" }),
}));

vi.mock("@/core/hooks/useToast", () => ({
  useToast: () => ({ toasts: [], addToast: () => "toast-1", removeToast: () => {} }),
}));

// Entitlements live in a context provider this test does not mount; the gate's own
// behaviour is covered elsewhere, so it is reduced to a passthrough here.
vi.mock("@/core/components/entitlements/EntitlementGate", () => ({
  EntitlementGate: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

// The Layers section quotes how many Places one page holds (D9/D17), which is an
// RTK Query read and therefore needs a store this test does not mount. Its
// behaviour is covered where the Places data is actually consumed; here it only has
// to answer.
vi.mock("@/cms/store/api/placesApi", () => ({
  useGetPlacesQuery: () => ({ data: { data: [] }, isLoading: false, isError: false }),
}));

// Same reasoning for the Assignment half: `SmartRoutingSettings` reads the case
// types that feed its sub-type list. It is `skip`ped unless the Case Type criterion
// is ticked, but RTK's `useQuery` still needs a store - and the Phase D cases below
// render that section, which the map-only cases never did.
vi.mock("@/cms/store/api/serviceApi", () => ({
  useGetCaseTypesSubTypesQuery: () => ({ data: { data: [] } }),
}));

vi.mock("./useOrgConfigProperties", async () => {
  const { buildDefaultOrgConfigProperties } = await import("@/cms/utils/orgConfigProperties");
  // Built ONCE: the shell re-seeds its form from `loaded`, so a fresh object per
  // render would loop forever through the `[loaded]` effect.
  const loaded = buildDefaultOrgConfigProperties("org-1");
  state.loaded = loaded;
  return {
    useOrgConfigProperties: () => ({
      loaded,
      rawDocument: {},
      savedMeta: {},
      loadState: state.loadState,
      loadError: state.loadError,
      isLoading: state.loadState === "loading",
      isFetching: false,
      isMock: false,
      isSaving: false,
      save: async (doc: OrgConfigPropertiesDoc) => {
        state.savedDoc = doc;
        return { ok: true };
      },
      reload: () => {},
    }),
  };
});

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const SAVE_LABEL = "settings.actions.save";

let container: HTMLDivElement;
let root: Root;

const render = async () => {
  await act(async () => {
    root.render(<OrganizationSettingsManagement />);
  });
};

const mount = () => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
};

const isPlaceholderShowing = () => container.querySelector(".animate-pulse") !== null;
const hasForm = () => (container.textContent ?? "").includes(SAVE_LABEL);

const findButton = (label: string): HTMLButtonElement | null =>
  Array.from(container.querySelectorAll("button")).find(
    (button) => (button.textContent ?? "").trim() === label
  ) ?? null;

afterEach(async () => {
  await act(async () => {
    root.unmount();
  });
  container.remove();
  state.loadState = "loading";
  state.loadError = "";
  state.savedDoc = null;
  // The document is shared across cases in this file: put the assignment half back.
  const doc = state.loaded as OrgConfigPropertiesDoc | null;
  if (doc) {
    doc.assignmentRules.routingModes.skillBased = false;
    doc.assignmentMode = [];
    doc.mapSettings.general.mapProvider = null;
  }
  resetMapRuntimeConfig();
});

describe("OrganizationSettingsManagement loading gate", () => {
  it("shows the placeholder only while the first load is in flight", async () => {
    mount();

    await render();
    expect(isPlaceholderShowing()).toBe(true);
    expect(hasForm()).toBe(false);

    // The request settles (a missing key settles as well - that is the point).
    state.loadState = "ready";
    await render();

    expect(isPlaceholderShowing()).toBe(false);
    expect(hasForm()).toBe(true);
  });

  it("keeps the form mounted while a later refetch is in flight", async () => {
    mount();

    state.loadState = "ready";
    await render();
    expect(hasForm()).toBe(true);

    // Every save invalidates the "OrgSettings" tag, so this is the real post-save
    // state: the form must survive it.
    state.loadState = "loading";
    await render();

    expect(isPlaceholderShowing()).toBe(false);
    expect(hasForm()).toBe(true);
  });
});

describe("OrganizationSettingsManagement save contract", () => {
  it("saves both sections as one document", async () => {
    mount();

    state.loadState = "ready";
    await render();

    const saveButton = findButton(SAVE_LABEL);
    expect(saveButton).not.toBeNull();

    await act(async () => {
      saveButton?.click();
    });

    const saved = state.savedDoc as OrgConfigPropertiesDoc | null;
    expect(saved).not.toBeNull();
    // The whole point of the single form: a save carries the other half too.
    expect(saved?.mapSettings).toBeDefined();
    expect(saved?.assignmentRules).toBeDefined();
    expect(saved?.assignmentRules.routingModes.areaBased).toBe(false);
  });

  it("disables Save when the stored document could not be read", async () => {
    mount();

    state.loadState = "error";
    state.loadError = "gateway exploded";
    await render();

    const saveButton = findButton(SAVE_LABEL);
    expect(saveButton).not.toBeNull();
    expect(saveButton?.disabled).toBe(true);
    // The reason has to be visible, not implied by a greyed-out button.
    expect(container.textContent).toContain("settings.shell.load_error.title");
    expect(container.textContent).toContain("gateway exploded");
  });

  it("tells the admin when nothing has been stored yet", async () => {
    mount();

    state.loadState = "empty";
    await render();

    expect(container.textContent).toContain("settings.shell.not_saved_yet.title");
    expect(findButton(SAVE_LABEL)?.disabled).toBe(false);
  });
});

describe("OrganizationSettingsManagement staff modes (Phase C2)", () => {
  it("shows Staff Routing's Automatic option as unavailable, with the reason", async () => {
    mount();

    state.loadState = "ready";
    await render();

    // Three Auto/Manual selects, in MODE_LABEL_KEYS order: routing, etaTtl, tracking.
    const autoOptions = Array.from(
      container.querySelectorAll<HTMLOptionElement>('option[value="auto"]')
    );
    expect(autoOptions).toHaveLength(3);
    // D2/D8: routing has no engine, so Automatic is unpickable - but the field
    // stays visible and a saved `auto` value still displays.
    expect(autoOptions[0].disabled).toBe(true);
    expect(autoOptions[1].disabled).toBe(false);
    expect(autoOptions[2].disabled).toBe(false);
    expect(container.textContent).toContain(
      "settings.map.field.staff_routing.auto_unavailable"
    );
  });
});

describe("OrganizationSettingsManagement assignment section (2026-11-19 contract)", () => {
  it("saves with no routing criterion selected - the org-wide mode rule is gone", async () => {
    // The old rule ("Automatic with no criterion is an error") anchored on
    // `assignmentRules.mode`, which the 2026-11-19 contract removed. Blocking Save
    // here now would make a fresh organisation unable to save at all; the equivalent
    // check belongs to `assignmentMode[]`, which is not part of this sub-document.
    mount();
    const doc = state.loaded as OrgConfigPropertiesDoc;
    doc.assignmentRules.routingModes.skillBased = false;

    state.loadState = "ready";
    await render();

    await act(async () => {
      findButton(SAVE_LABEL)?.click();
    });

    expect(state.savedDoc).not.toBeNull();
  });

  it("still states that the routing engine is not live", async () => {
    // Decision D18 survives the contract change: the copy promises automatic routing
    // and nothing consumes these values yet, so the note moved with it from the
    // removed mode switch to the criteria card.
    mount();

    state.loadState = "ready";
    await render();

    await act(async () => {
      findButton("settings.section.assignment_rules")?.click();
    });

    expect(container.textContent).toContain(
      "settings.assignment.field.mode.engine_unavailable"
    );
  });

  it("blocks Save when a sub-type is staged auto with no routing criterion", async () => {
    // The rule that replaced the retired `assignmentRules.mode` check: "auto" with no
    // criterion claims the system will route and defines no way to.
    mount();
    const doc = state.loaded as OrgConfigPropertiesDoc;
    doc.assignmentMode = [{ type: "pic", mode: "auto", caseSubTypes: ["s-type-1"] }];
    doc.assignmentRules.routingModes.skillBased = false;

    state.loadState = "ready";
    await render();

    await act(async () => {
      findButton(SAVE_LABEL)?.click();
    });

    expect(state.savedDoc).toBeNull();
    // Brought to the front, with the reason visible.
    expect(container.textContent).toContain("settings.assignment.mode_table.title");
    expect(container.textContent).toContain(
      "settings.assignment.validation.no_criteria_selected"
    );
  });

  it("saves once a criterion exists for the auto staging", async () => {
    mount();
    const doc = state.loaded as OrgConfigPropertiesDoc;
    doc.assignmentMode = [{ type: "assignment", mode: "auto", caseSubTypes: ["s-type-1"] }];
    doc.assignmentRules.routingModes.unitProperty = true;

    state.loadState = "ready";
    await render();

    await act(async () => {
      findButton(SAVE_LABEL)?.click();
    });

    expect(state.savedDoc).not.toBeNull();
    expect((state.savedDoc as OrgConfigPropertiesDoc).assignmentMode).toEqual([
      { type: "assignment", mode: "auto", caseSubTypes: ["s-type-1"] },
    ]);
  });
});

describe("OrganizationSettingsManagement applies the saved provider (no reload)", () => {
  it("puts the provider the admin just saved into force for this session", async () => {
    // The real env has no Longdo key in tests, which would make the store fall back
    // and the assertion meaningless.
    (API_CONFIG as unknown as { LONGDO_API_KEY: string }).LONGDO_API_KEY = "test-key";
    mount();
    const doc = state.loaded as OrgConfigPropertiesDoc;
    doc.mapSettings.general.mapProvider = "longdo";

    state.loadState = "ready";
    await render();

    expect(getMapRuntimeConfig().provider).toBe("arcgis");

    await act(async () => {
      findButton(SAVE_LABEL)?.click();
    });

    // Most settings refresh themselves through the invalidated RTK tag; the provider
    // lives in a resolve-once store, so the shell has to apply it explicitly.
    // Otherwise the admin would have to reload the page to see what they chose.
    expect(getMapRuntimeConfig().provider).toBe("longdo");
    expect(getMapRuntimeConfig().requestedProvider).toBe("longdo");
  });
});
