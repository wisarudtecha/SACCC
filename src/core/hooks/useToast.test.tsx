// useToast tests — the toast state engine behind every toast surface
// (ToastGlobal mounts it; useDashboardExport and the layout actions trigger
// through it). Pure state + timers, no app context needed.
//
// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useToast, type UseToastResult } from "./useToast";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root | null = null;
let container: HTMLDivElement | null = null;

function renderToastHook(): UseToastResult {
  const result = {} as UseToastResult;

  function Harness() {
    Object.assign(result, useToast());
    return null;
  }

  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => {
    root!.render(<Harness />);
  });
  return result;
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  act(() => {
    root?.unmount();
  });
  container?.remove();
  root = null;
  container = null;
  vi.useRealTimers();
});

describe("useToast — adding toasts", () => {
  it("adds a toast and returns its id", () => {
    const hook = renderToastHook();

    let id = "";
    act(() => {
      id = hook.addToast("success", "Saved");
    });

    expect(hook.toasts).toHaveLength(1);
    expect(hook.toasts[0]).toMatchObject({ id, type: "success", message: "Saved" });
    expect(typeof id).toBe("string");
  });

  it("keeps multiple toasts stacked", () => {
    const hook = renderToastHook();

    act(() => {
      hook.addToast("success", "one");
      hook.addToast("error", "two");
    });

    expect(hook.toasts.map((toast) => toast.message)).toEqual(["one", "two"]);
  });

  it("marks i18n toasts with the isI18N flag", () => {
    const hook = renderToastHook();

    act(() => {
      hook.addToast("error", "common.export_failed", 6000, true);
    });

    expect(hook.toasts[0].isI18N).toBe(true);
  });
});

describe("useToast — auto-dismissal", () => {
  it("removes a toast once its duration elapses (default 4000ms)", () => {
    const hook = renderToastHook();

    act(() => {
      hook.addToast("info", "temporary");
    });
    expect(hook.toasts).toHaveLength(1);

    act(() => {
      vi.advanceTimersByTime(3999);
    });
    expect(hook.toasts).toHaveLength(1);

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(hook.toasts).toHaveLength(0);
  });

  it("keeps a duration-0 toast on screen (sticky, manual dismiss only)", () => {
    const hook = renderToastHook();

    act(() => {
      hook.addToast("loading", "case.display.toast.loading_case", 0, true);
    });

    act(() => {
      vi.advanceTimersByTime(60_000);
    });
    expect(hook.toasts).toHaveLength(1);
  });
});

describe("useToast — manual removal", () => {
  it("removes only the targeted toast by id", () => {
    const hook = renderToastHook();

    let keepId = "";
    let dropId = "";
    act(() => {
      keepId = hook.addToast("success", "keep");
    });
    act(() => {
      vi.advanceTimersByTime(5);
    });
    act(() => {
      dropId = hook.addToast("error", "drop");
    });

    act(() => {
      hook.removeToast(dropId);
    });

    expect(hook.toasts).toHaveLength(1);
    expect(hook.toasts[0].id).toBe(keepId);
  });

  it("clearToasts empties the stack", () => {
    const hook = renderToastHook();

    act(() => {
      hook.addToast("success", "one");
      hook.addToast("error", "two");
      hook.addToast("info", "three");
    });

    act(() => {
      hook.clearToasts();
    });

    expect(hook.toasts).toHaveLength(0);
  });
});
