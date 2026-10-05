// useDashboardLayoutActions tests — the toast contract of the layout CRUD
// glue hook: success/error toasts on every mutation, server messages winning
// over i18n fallback keys, and the busy guard that stops double-fires.
//
// `addToast` is an injected dependency here (the page passes it in), so no
// ToastGlobal mock is needed — a plain spy captures the contract. The only
// app import mocked is `useTranslation` (key passthrough), keeping the hook's
// real logic under test.
//
// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useDashboardLayoutActions } from "./useDashboardLayoutActions";
import type {
  LayoutActionResult,
  UseDashboardLayoutsResult,
} from "./persistence/useDashboardLayouts";
import type { DashboardLayout } from "@/core/types/dashboardLayout";

vi.mock("@/core/hooks/useTranslation", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const fullLayout: DashboardLayout = {
  id: "layout-1",
  type: "dashboard",
  name: "Ops Overview",
  isShared: false,
  isDefault: false,
  orgId: "org-1",
  createdBy: "user-1",
  lastModified: "2026-10-05T00:00:00.000Z",
  widgets: [],
};

type PersistenceOverrides = Partial<{
  createLayout: UseDashboardLayoutsResult["createLayout"];
  updateLayout: UseDashboardLayoutsResult["updateLayout"];
  removeLayout: UseDashboardLayoutsResult["removeLayout"];
  refetch: UseDashboardLayoutsResult["refetch"];
}>;

function buildPersistence(overrides: PersistenceOverrides = {}): UseDashboardLayoutsResult {
  return {
    layouts: [],
    isLoading: false,
    isFetching: false,
    isError: false,
    isEmpty: true,
    isMutating: false,
    refetch: overrides.refetch ?? vi.fn(async () => []),
    createLayout:
      overrides.createLayout ??
      vi.fn(async (): Promise<LayoutActionResult> => ({ ok: true, message: "" })),
    updateLayout:
      overrides.updateLayout ??
      vi.fn(async (): Promise<LayoutActionResult> => ({ ok: true, message: "" })),
    removeLayout:
      overrides.removeLayout ??
      vi.fn(async (): Promise<LayoutActionResult> => ({ ok: true, message: "" })),
  };
}

interface TestHarness {
  actions: ReturnType<typeof useDashboardLayoutActions>;
  addToast: ReturnType<typeof vi.fn>;
  adopt: ReturnType<typeof vi.fn>;
  clearSelection: ReturnType<typeof vi.fn>;
}

let root: Root | null = null;
let container: HTMLDivElement | null = null;

function renderActions(
  persistence: UseDashboardLayoutsResult,
  draft: DashboardLayout | undefined = fullLayout
): TestHarness {
  const addToast = vi.fn(() => "toast-id");
  const adopt = vi.fn();
  const syncMetadata = vi.fn();
  const selectLayout = vi.fn();
  const clearSelection = vi.fn();
  const refetchDetail = vi.fn(async () => fullLayout);
  const harness = {} as TestHarness;

  function Harness() {
    const actions = useDashboardLayoutActions({
      persistence,
      draft,
      baseline: fullLayout,
      adopt,
      syncMetadata,
      refetchDetail,
      selectLayout,
      clearSelection,
      addToast,
    });
    harness.actions = actions;
    return null;
  }

  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => {
    root!.render(<Harness />);
  });
  harness.addToast = addToast;
  harness.adopt = adopt;
  harness.clearSelection = clearSelection;
  return harness;
}

afterEach(() => {
  act(() => {
    root?.unmount();
  });
  container?.remove();
  root = null;
  container = null;
});

describe("useDashboardLayoutActions — toast contract", () => {
  it("toasts success with the i18n fallback key when the server sends no message", async () => {
    const persistence = buildPersistence({
      updateLayout: vi.fn(async () => ({ ok: true, layout: fullLayout, message: "" })),
    });
    const harness = renderActions(persistence);

    await act(async () => {
      await harness.actions.saveDraft();
    });

    expect(harness.addToast).toHaveBeenCalledTimes(1);
    expect(harness.addToast).toHaveBeenCalledWith(
      "success",
      "crud.common.form.action.update.success"
    );
  });

  it("prefers the server-provided message over the fallback key", async () => {
    const persistence = buildPersistence({
      updateLayout: vi.fn(async () => ({ ok: true, layout: fullLayout, message: "Saved by server" })),
    });
    const harness = renderActions(persistence);

    await act(async () => {
      await harness.actions.saveDraft();
    });

    expect(harness.addToast).toHaveBeenCalledWith("success", "Saved by server");
  });

  it("toasts error with the server message and leaves the draft un-adopted", async () => {
    const refetch = vi.fn(async () => []);
    const persistence = buildPersistence({
      updateLayout: vi.fn(async () => ({ ok: false, message: "optimistic lock conflict" })),
      refetch,
    });
    const harness = renderActions(persistence);

    await act(async () => {
      await harness.actions.saveDraft();
    });

    expect(harness.addToast).toHaveBeenCalledTimes(1);
    expect(harness.addToast).toHaveBeenCalledWith("error", "optimistic lock conflict");
    expect(harness.adopt).not.toHaveBeenCalled();
    expect(refetch).not.toHaveBeenCalled();
    expect(harness.actions.isBusy).toBe(false);
  });

  it("falls back to the error i18n key when the failure carries no message", async () => {
    const persistence = buildPersistence({
      removeLayout: vi.fn(async () => ({ ok: false, message: "" })),
    });
    const harness = renderActions(persistence);

    await act(async () => {
      await harness.actions.deleteLayout("layout-1");
    });

    expect(harness.addToast).toHaveBeenCalledWith(
      "error",
      "crud.common.form.action.delete.error"
    );
    expect(harness.clearSelection).not.toHaveBeenCalled();
  });

  it("adopts the saved layout after a successful update save", async () => {
    const persistence = buildPersistence({
      updateLayout: vi.fn(async () => ({ ok: true, layout: fullLayout, message: "" })),
    });
    const harness = renderActions(persistence);

    await act(async () => {
      await harness.actions.saveDraft();
    });

    expect(harness.adopt).toHaveBeenCalledWith(fullLayout);
  });

  it("clears the selection when the currently-open layout is deleted", async () => {
    const refetch = vi.fn(async () => []);
    const persistence = buildPersistence({
      removeLayout: vi.fn(async () => ({ ok: true, message: "" })),
      refetch,
    });
    // draft.id === "layout-1" — the layout being deleted.
    const harness = renderActions(persistence);

    await act(async () => {
      await harness.actions.deleteLayout("layout-1");
    });

    expect(harness.clearSelection).toHaveBeenCalledTimes(1);
    expect(refetch).toHaveBeenCalledTimes(1);
  });
});

describe("useDashboardLayoutActions — busy guard", () => {
  it("ignores a second action fired while the first is still in flight", async () => {
    let resolveRemove: (result: LayoutActionResult) => void = () => undefined;
    const removeLayout = vi.fn(
      () =>
        new Promise<LayoutActionResult>((resolve) => {
          resolveRemove = resolve;
        })
    );
    const persistence = buildPersistence({ removeLayout });
    const harness = renderActions(persistence);

    // First delete starts and stalls on the unresolved promise; act flushes
    // the isBusy=true render so the next closure sees it.
    await act(async () => {
      void harness.actions.deleteLayout("layout-1");
    });
    expect(harness.actions.isBusy).toBe(true);

    await act(async () => {
      await harness.actions.deleteLayout("layout-1");
    });
    expect(removeLayout).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolveRemove({ ok: true, message: "" });
    });
    expect(harness.actions.isBusy).toBe(false);
  });
});
