// Regression tests for the org settings document hooks.
//
// `useOrgMapSettings` / `useOrgAssignmentRules` are now projections over
// `useOrgConfigProperties`, because the backend stores both sections in ONE config
// property (`org.config.properties`). Two classes of bug are pinned here:
//
// 1. THE LOADING CONTRACT. The hook once shipped `isLoading: !isMock && !!orgId` - a
//    constant `true` once signed in - and the section never left its skeleton. A
//    constant there is invisible to the type checker, so it is asserted directly:
//    `isLoading` must mirror the query's own flag.
// 2. THE WRITE CONTRACT. A section-level save must write the WHOLE document, and it
//    must not reset a field this client has no control for
//    (`advancedOptions.serviceSubType`). Both are silent when wrong: the save
//    "succeeds" and the stored value is quietly replaced with a default.
//
// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ApiResponse } from "@/core/types";
import type { ConfigPropertyRow } from "@/core/types/organization";
import { ORG_CONFIG_PROPERTIES_KEY } from "@/cms/utils/orgConfigProperties";
import { useOrgConfigProperties, type UseOrgConfigPropertiesResult } from "./useOrgConfigProperties";
import { useOrgMapSettings, type UseOrgMapSettingsResult } from "./useOrgMapSettings";

const state = vi.hoisted(() => ({
  orgId: "org-1" as string,
  isMock: false,
  queryLoading: false,
  isError: false,
  error: undefined as unknown,
  data: undefined as unknown,
  lastSkip: undefined as boolean | undefined,
  lastMutationArg: undefined as unknown,
  mutationRejects: false,
  mutationResponse: undefined as unknown,
}));

vi.mock("@/cms/utils/constants", () => ({
  DEV_CONFIG: {
    get MOCK_API() {
      return state.isMock;
    },
  },
}));

vi.mock("@/core/hooks/useAuth", () => ({
  useAuth: () => ({ state: { user: { orgId: state.orgId } } }),
}));

vi.mock("@/core/store/api/configPropertyApi", () => ({
  useGetConfigPropertyByKeyQuery: (
    _arg: { propKey: string; orgId: string },
    options?: { skip?: boolean }
  ) => {
    state.lastSkip = options?.skip;
    return {
      currentData: state.data,
      isLoading: state.queryLoading,
      isFetching: false,
      isError: state.isError,
      error: state.error,
      refetch: () => undefined,
    };
  },
  useSetConfigPropertyByKeyMutation: () => [
    (arg: unknown) => {
      state.lastMutationArg = arg;
      return {
        unwrap: async () => {
          if (state.mutationRejects) {
            throw new Error("rejected");
          }
          return state.mutationResponse;
        },
      };
    },
    { isLoading: false },
  ],
}));

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let captured: UseOrgMapSettingsResult | null = null;
let capturedDoc: UseOrgConfigPropertiesResult | null = null;
let container: HTMLDivElement;
let root: Root;

function FacadeProbe({ enabled }: { enabled?: boolean }): null {
  captured = useOrgMapSettings({ enabled });
  return null;
}

function DocumentProbe(): null {
  capturedDoc = useOrgConfigProperties();
  return null;
}

const mount = () => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
};

const renderFacade = async (enabled?: boolean) => {
  await act(async () => {
    root.render(<FacadeProbe enabled={enabled} />);
  });
  if (!captured) {
    throw new Error("the probe component did not run");
  }
  return captured;
};

const renderDocument = async () => {
  await act(async () => {
    root.render(<DocumentProbe />);
  });
  if (!capturedDoc) {
    throw new Error("the probe component did not run");
  }
  return capturedDoc;
};

/** A stored row: the map half carries a non-default provider, the assignment half a
 *  `serviceSubType` the client has no control for. */
const storedRow: ConfigPropertyRow = {
  propKey: ORG_CONFIG_PROPERTIES_KEY,
  propVal: {
    mapSettings: { general: { mapProvider: "longdo" } },
    assignmentRules: { advancedOptions: { serviceSubType: "emergency" } },
  },
};
const storedResponse: ApiResponse<ConfigPropertyRow> = {
  status: "0",
  msg: "ok",
  data: storedRow,
};

afterEach(async () => {
  await act(async () => {
    root.unmount();
  });
  container.remove();
  captured = null;
  capturedDoc = null;
  state.orgId = "org-1";
  state.isMock = false;
  state.queryLoading = false;
  state.isError = false;
  state.error = undefined;
  state.data = undefined;
  state.lastSkip = undefined;
  state.lastMutationArg = undefined;
  state.mutationRejects = false;
  state.mutationResponse = storedResponse;
});

describe("useOrgMapSettings", () => {
  it("reports loading only while the query is actually in flight", async () => {
    mount();

    state.queryLoading = true;
    expect((await renderFacade()).isLoading).toBe(true);

    // The request settles (a 404 / GraphQL error settles as well) - the form must
    // become reachable. This is the assertion the hardcoded constant failed.
    state.queryLoading = false;
    expect((await renderFacade()).isLoading).toBe(false);
  });

  it("falls back to schema defaults when there is no stored record yet", async () => {
    mount();

    const result = await renderFacade();
    expect(result.loaded.orgId).toBe("org-1");
    expect(result.loaded.general.mapProvider).toBeNull();
    expect(result.isMock).toBe(false);
    expect(result.loadState).toBe("empty");
  });

  it("uses the stored record once the endpoint returns one", async () => {
    mount();

    state.data = storedResponse;
    const result = await renderFacade();
    expect(result.loaded.general.mapProvider).toBe("longdo");
    expect(result.loadState).toBe("ready");
  });

  it("never loads in mock mode, and reads the session stub instead", async () => {
    mount();

    state.isMock = true;
    state.queryLoading = true; // would be skipped in practice; must not leak out
    const result = await renderFacade();

    expect(result.isLoading).toBe(false);
    expect(result.loaded.orgId).toBe("org-1");
  });
});

describe("useOrgMapSettings - enabled option", () => {
  it("skips the fetch when the caller is not showing yet, and still returns a usable record", async () => {
    mount();

    // The assignment picker mounts closed on every case page; asking for map settings
    // there would be a request nobody triggered - and for a GIS-less tenant the only one.
    const result = await renderFacade(false);

    expect(state.lastSkip).toBe(true);
    expect(result.isLoading).toBe(false);
    expect(result.loaded.orgId).toBe("org-1");
  });

  it("fetches by default, so every existing caller is unchanged", async () => {
    mount();

    await renderFacade();

    expect(state.lastSkip).toBe(false);
  });
});

describe("useOrgConfigProperties", () => {
  it("reads the document by its config-property key", async () => {
    mount();

    await renderDocument();

    expect(state.lastSkip).toBe(false);
  });

  it("treats a missing key as 'nothing stored yet', so the form starts from defaults", async () => {
    mount();

    // An unsaved key answers `status: "-1"`, which the hybrid base query turns into a
    // real RTK error - it must NOT read as a broken backend.
    state.isError = true;
    state.error = { data: { status: "-1", msg: "config property not found" } };

    const result = await renderDocument();
    expect(result.loadState).toBe("empty");
    expect(result.loaded.mapSettings.general.mapProvider).toBeNull();
  });

  it("reports a real failure as an error and carries the server wording", async () => {
    mount();

    state.isError = true;
    state.error = { status: 500, error: "gateway exploded" };

    const result = await renderDocument();
    expect(result.loadState).toBe("error");
    expect(result.loadError).toBe("gateway exploded");
  });

  it("treats a conclusive success with no record as 'nothing stored yet'", async () => {
    mount();

    state.data = { status: "0", msg: "ok", data: null };

    const result = await renderDocument();
    expect(result.loadState).toBe("empty");
  });

  it("does not present an unauthorised read as an empty document", async () => {
    mount();

    // The real staging answer for a request without a usable token, over HTTP 200.
    // `readEnvelopeStatus("401")` is INCONCLUSIVE, so this RESOLVES rather than
    // erroring - without reading the envelope the page would show defaults and an
    // enabled Save, i.e. an expired session would look like a brand-new tenant.
    state.data = {
      status: "401",
      msg: "Unauthorized",
      desc: "Missing Authorization header",
      data: null,
    };

    const result = await renderDocument();
    expect(result.loadState).toBe("error");
    expect(result.loadError).toBe("Missing Authorization header");
  });

  it("saves the whole document, preserving a field this client cannot set", async () => {
    mount();

    state.data = storedResponse;
    const result = await renderFacade();

    let saveResult: { ok: boolean } = { ok: false };
    await act(async () => {
      // Exactly what MapSettingsSection does today: patch one section only.
      saveResult = await result.save({ layers: { showSearch: false } });
    });

    expect(saveResult.ok).toBe(true);
    const sent = state.lastMutationArg as { propKey: string; propVal: Record<string, unknown> };
    expect(sent.propKey).toBe(ORG_CONFIG_PROPERTIES_KEY);

    const mapSettings = sent.propVal.mapSettings as Record<string, unknown>;
    const assignmentRules = sent.propVal.assignmentRules as Record<string, unknown>;
    // The edit landed...
    expect((mapSettings.layers as Record<string, unknown>).showSearch).toBe(false);
    // ...the other section travelled with it (one document per row)...
    expect(assignmentRules.advancedOptions).toMatchObject({ serviceSubType: "emergency" });
    // ...and the client-side bookkeeping keys were not written to the server.
    expect(mapSettings.orgId).toBeUndefined();
  });

  it("accepts a document-shaped payload as well as a row", async () => {
    mount();

    // `ApiResponse.data` is the JSON scalar: the handler may return the stored
    // document instead of the row wrapping it. Both must decode; treating only the
    // row as valid would read as "nothing stored" and overwrite a real document.
    state.data = {
      status: "0",
      msg: "ok",
      data: { mapSettings: { general: { mapProvider: "longdo" } } },
    };

    const result = await renderFacade();
    expect(result.loadState).toBe("ready");
    expect(result.loaded.general.mapProvider).toBe("longdo");
  });

  it("resolves ok:false instead of throwing when the write is rejected", async () => {
    mount();

    state.data = storedResponse;
    state.mutationRejects = true;
    const result = await renderFacade();

    let saveResult: { ok: boolean } = { ok: true };
    await act(async () => {
      saveResult = await result.save({ layers: { showSearch: false } });
    });

    expect(saveResult.ok).toBe(false);
  });

  it("does not clear the dirty baseline while the post-save refetch is in flight", async () => {
    mount();

    // After a save, RTK re-fetches and `currentData` is briefly undefined. Re-seeding
    // the form from schema defaults there would discard the admin's edits.
    state.data = storedResponse;
    const first = await renderFacade();
    expect(first.loaded.general.mapProvider).toBe("longdo");

    state.data = undefined;
    const second = await renderFacade();
    expect(second.loaded.general.mapProvider).toBe("longdo");
    expect(second.loaded).toEqual(first.loaded);
  });
});
