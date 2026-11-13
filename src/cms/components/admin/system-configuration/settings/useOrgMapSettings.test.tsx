// Regression tests for `useOrgMapSettings`'s loading contract.
//
// The bug these pin down: the hook shipped `isLoading: !isMock && !!orgId` - a
// constant `true` once the admin is signed in - because the real expression went
// out with the commented-out query. A constant there is invisible to the type
// checker and to the sibling hook (`useOrgAssignmentRules` looks identical at a
// glance), and its only symptom is a section that never leaves its skeleton, so
// it is asserted here directly: `isLoading` must mirror the query's own flag.
//
// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import { buildDefaultOrgMapSettings } from "@/cms/utils/orgMapSettings";
import type { ApiResponse } from "@/core/types";
import type { OrgMapSettings } from "@/core/types/organization";
import { useOrgMapSettings, type UseOrgMapSettingsResult } from "./useOrgMapSettings";

const state = vi.hoisted(() => ({
  orgId: "org-1" as string,
  isMock: false,
  queryLoading: false,
  data: undefined as unknown,
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

vi.mock("@/core/store/api/organizationApi", () => ({
  useGetOrgMapSettingsQuery: () => ({
    data: state.data,
    isLoading: state.queryLoading,
  }),
  useUpdateOrgMapSettingsMutation: () => [vi.fn(), { isLoading: false }],
}));

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let captured: UseOrgMapSettingsResult | null = null;
let container: HTMLDivElement;
let root: Root;

function Probe(): null {
  captured = useOrgMapSettings();
  return null;
}

const render = async () => {
  await act(async () => {
    root.render(<Probe />);
  });
  if (!captured) {
    throw new Error("the probe component did not run");
  }
  return captured;
};

const storedRecord: OrgMapSettings = {
  ...buildDefaultOrgMapSettings("org-1"),
  general: {
    ...buildDefaultOrgMapSettings("org-1").general,
    mapProvider: "longdo",
  },
};
const storedResponse: ApiResponse<OrgMapSettings> = {
  status: "0",
  msg: "ok",
  data: storedRecord,
};

afterEach(async () => {
  await act(async () => {
    root.unmount();
  });
  container.remove();
  captured = null;
  state.orgId = "org-1";
  state.isMock = false;
  state.queryLoading = false;
  state.data = undefined;
});

const mount = () => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
};

describe("useOrgMapSettings", () => {
  it("reports loading only while the query is actually in flight", async () => {
    mount();

    state.queryLoading = true;
    expect((await render()).isLoading).toBe(true);

    // The request settles (a 404 / GraphQL error settles as well) - the form must
    // become reachable. This is the assertion the hardcoded constant failed.
    state.queryLoading = false;
    expect((await render()).isLoading).toBe(false);
  });

  it("falls back to schema defaults when there is no stored record yet", async () => {
    mount();

    const result = await render();
    expect(result.loaded.orgId).toBe("org-1");
    expect(result.loaded.general.mapProvider).toBeNull();
    expect(result.isMock).toBe(false);
  });

  it("uses the stored record once the endpoint returns one", async () => {
    mount();

    state.data = storedResponse;
    const result = await render();
    expect(result.loaded.general.mapProvider).toBe("longdo");
  });

  it("never loads in mock mode, and reads the session stub instead", async () => {
    mount();

    state.isMock = true;
    state.queryLoading = true; // would be skipped in practice; must not leak out
    const result = await render();

    expect(result.isLoading).toBe(false);
    expect(result.loaded.orgId).toBe("org-1");
  });
});
