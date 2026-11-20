// @vitest-environment jsdom
// `useDocumentVisible` is what stops the staff roster's safety-net poll while the
// tab is in the background (Phase C3). It is small, but two of its properties are
// load-bearing:
//
//   - it must actually flip when the tab is hidden, or every open case pays one
//     request per poll interval for a map nobody is looking at;
//   - it must NOT re-render for a `visibilitychange` that changed nothing, or the
//     poll restarts on every such event (and the anti-regression lesson about
//     "setState in an effect" applies).
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { useDocumentVisible } from "./useDocumentVisible";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let hidden = false;
let renders = 0;

const originalHidden = Object.getOwnPropertyDescriptor(Document.prototype, "hidden");

function Probe(): React.ReactElement {
  const isVisible = useDocumentVisible();
  renders += 1;
  return <span data-visible={String(isVisible)} />;
}

let root: ReturnType<typeof createRoot> | null = null;
let container: HTMLDivElement;

function render(): void {
  container = document.createElement("div");
  root = createRoot(container);
  act(() => {
    root?.render(<Probe />);
  });
}

function visibility(): string | undefined {
  return (container.firstElementChild as HTMLElement | null)?.dataset.visible;
}

function fireVisibilityChange(): void {
  act(() => {
    document.dispatchEvent(new Event("visibilitychange"));
  });
}

beforeEach(() => {
  hidden = false;
  renders = 0;
  Object.defineProperty(document, "hidden", {
    configurable: true,
    get: () => hidden,
  });
});

afterEach(() => {
  act(() => {
    root?.unmount();
  });
  root = null;
  // Put jsdom's own implementation back so the next file is unaffected.
  if (originalHidden) {
    Object.defineProperty(Document.prototype, "hidden", originalHidden);
  } else {
    delete (document as { hidden?: unknown }).hidden;
  }
});

describe("useDocumentVisible", () => {
  it("reports visible while the tab is in the foreground", () => {
    render();

    expect(visibility()).toBe("true");
  });

  it("reports hidden as soon as the tab goes to the background", () => {
    render();

    hidden = true;
    fireVisibilityChange();

    expect(visibility()).toBe("false");
  });

  it("comes back when the tab is focused again", () => {
    render();
    hidden = true;
    fireVisibilityChange();
    hidden = false;

    fireVisibilityChange();

    expect(visibility()).toBe("true");
  });

  it("does not re-render for a visibilitychange that changed nothing", () => {
    render();
    const before = renders;

    fireVisibilityChange();

    expect(renders).toBe(before);
  });
});
