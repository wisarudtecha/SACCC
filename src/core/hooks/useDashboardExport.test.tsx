// useDashboardExport tests — the repo's first DOM-environment test.
//
// The global Vitest environment is "node" (vite.config.ts); this file opts
// into jsdom via the docblock below so the hook can render with React 19's
// `act` + `react-dom/client` (both already dependencies — no
// @testing-library needed for a single-hook harness).
//
// `ToastGlobal`'s `useToastContext` is mocked with a spy: the unit under
// test is the hook's *contract* with the toast layer (right type, key,
// duration, isI18N flag), not toast rendering — that's already-exercised
// app code whose import chain (i18n catalogs, SuperApp context) would drag
// half the app into this test.
//
// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useDashboardExport } from "./useDashboardExport";

const toastSpy = vi.hoisted(() => ({ addToast: vi.fn() }));
const htmlToImageSpy = vi.hoisted(() => ({ toPng: vi.fn() }));

vi.mock("@/core/components/crud/ToastGlobal", () => ({
  useToastContext: () => ({
    addToast: toastSpy.addToast,
    removeToast: vi.fn(),
    isCaseLoading: false,
  }),
}));

vi.mock("html-to-image", () => ({
  toPng: htmlToImageSpy.toPng,
}));

// React 19: act() requires this global to suppress the "not wrapped in act"
// warning when state updates originate outside React's event handlers.
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

interface HarnessOptions {
  filename: string;
  failureMessageKey?: string;
}

interface HarnessResult {
  current: ReturnType<typeof useDashboardExport>;
  captureDiv: HTMLDivElement;
  toolbarDiv: HTMLDivElement;
}

let root: Root | null = null;
let container: HTMLDivElement | null = null;

/**
 * Renders a component that wires the hook's refs to two divs, mirroring how
 * real dashboards attach `captureRef` / `hideDuringCaptureRef`. Returns a
 * mutable ref to the hook result plus the two divs for style assertions.
 */
function renderExportHarness(options: HarnessOptions): HarnessResult {
  const result = {} as HarnessResult;

  function Harness() {
    const hook = useDashboardExport(options);
    result.current = hook;
    return (
      <>
        <div ref={hook.captureRef}>captured content</div>
        <div ref={hook.hideDuringCaptureRef}>toolbar</div>
      </>
    );
  }

  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => {
    root!.render(<Harness />);
  });

  result.captureDiv = container.querySelector("div > div:nth-child(1)") as HTMLDivElement;
  result.toolbarDiv = container.querySelector("div > div:nth-child(2)") as HTMLDivElement;
  return result;
}

async function runExport(
  harness: HarnessResult,
  type: "pdf" | "image"
): Promise<void> {
  await act(async () => {
    const pending = harness.current.exportDashboard(type);
    // Advance past the hook's pre-capture settle delay (350 ms).
    await vi.advanceTimersByTimeAsync(500);
    await pending;
  });
}

beforeEach(() => {
  vi.useFakeTimers();
  toastSpy.addToast.mockClear();
  htmlToImageSpy.toPng.mockReset();
  // The success path downloads via an <a download> click; jsdom logs "Not
  // implemented: navigation" for real anchor clicks. The anchor mechanics
  // aren't under test — stub the click to keep output clean.
  vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
  act(() => {
    root?.unmount();
  });
  container?.remove();
  root = null;
  container = null;
  vi.useRealTimers();
});

describe("useDashboardExport — failure toast", () => {
  it("fires an error toast with the custom failureMessageKey when capture fails", async () => {
    htmlToImageSpy.toPng.mockRejectedValue(new Error("cors-blocked map tiles"));
    const harness = renderExportHarness({
      filename: "dispatch-dashboard",
      failureMessageKey: "dashboard.dispatch.export_failed",
    });

    await runExport(harness, "image");

    expect(toastSpy.addToast).toHaveBeenCalledTimes(1);
    expect(toastSpy.addToast).toHaveBeenCalledWith(
      "error",
      "dashboard.dispatch.export_failed",
      6000,
      true
    );
  });

  it("falls back to the generic common.export_failed key when none is provided", async () => {
    htmlToImageSpy.toPng.mockRejectedValue(new Error("capture failed"));
    const harness = renderExportHarness({ filename: "service-dashboard" });

    await runExport(harness, "image");

    expect(toastSpy.addToast).toHaveBeenCalledWith(
      "error",
      "common.export_failed",
      6000,
      true
    );
  });

  it("restores the toolbar and resets isExporting even when the export fails", async () => {
    htmlToImageSpy.toPng.mockRejectedValue(new Error("boom"));
    const harness = renderExportHarness({ filename: "x" });

    expect(harness.current.isExporting).toBe(false);
    const exportPromise = harness.current.exportDashboard("image");
    // Toolbar hides synchronously at the start of the export.
    expect(harness.toolbarDiv.style.visibility).toBe("hidden");

    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
      await exportPromise;
    });

    expect(harness.toolbarDiv.style.visibility).toBe("visible");
    expect(harness.current.isExporting).toBe(false);
    expect(toastSpy.addToast).toHaveBeenCalledTimes(1);
  });
});

describe("useDashboardExport — success path", () => {
  it("fires no toast on a successful PNG export", async () => {
    htmlToImageSpy.toPng.mockResolvedValue("data:image/png;base64,fixture");
    const harness = renderExportHarness({ filename: "ok-dashboard" });

    await runExport(harness, "image");

    expect(toastSpy.addToast).not.toHaveBeenCalled();
    expect(harness.toolbarDiv.style.visibility).toBe("visible");
    expect(harness.current.isExporting).toBe(false);
  });
});
