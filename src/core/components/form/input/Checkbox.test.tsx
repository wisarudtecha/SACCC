// @vitest-environment jsdom
// The shared Checkbox must stay CONTROLLED.
//
// It once shipped with `// checked={checked}` commented out: the native input was
// uncontrolled (always started `false`), while the tick was drawn from the prop. A stored
// `true` therefore rendered ticked but had `input.checked === false`, and the first click
// reported `true` again - a silent no-op that needed TWO clicks to clear a value. Found in
// the routing-criteria list (docs/ORG-SETTINGS-Assignment-Mode-Survey.md §12.3).
//
// These tests fail on that version, so they are the reason it cannot come back.
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Checkbox from "./Checkbox";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;
let onChange: ReturnType<typeof vi.fn>;

function render(checked: boolean, disabled = false): HTMLInputElement {
  onChange = vi.fn();
  // Inside act(): a render outside it can land after the query below, which would hand
  // back the previous element (and its previous onChange). That mistake made this file
  // report "click calls onChange 0 times" for a component that was already fixed.
  act(() => {
    root.render(<Checkbox checked={checked} onChange={onChange} disabled={disabled} />);
  });
  const input = container.querySelector('input[type="checkbox"]');
  if (!input) {
    throw new Error("Checkbox rendered no input");
  }
  return input as HTMLInputElement;
}

/** Re-render with a new prop, the way a form does after a load / Cancel. */
function setChecked(checked: boolean): void {
  act(() => {
    root.render(<Checkbox checked={checked} onChange={onChange} />);
  });
}

beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => {
    root.unmount();
  });
  container.remove();
});

describe("Checkbox is a controlled input", () => {
  it("mirrors the checked prop in the DOM, not just in the tick", () => {
    const input = render(true);

    // The regression: before the fix this was `false` while the tick was visible.
    expect(input.checked).toBe(true);
  });

  it("turns a stored true off in ONE click", () => {
    const input = render(true);

    act(() => {
      input.click();
    });

    // Exactly one call, and it reports the new value - not a second confirmation.
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(false);
  });

  it("turns an unset value on in one click", () => {
    const input = render(false);

    act(() => {
      input.click();
    });

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it("follows the prop when the form re-seeds it (load / Cancel)", () => {
    const input = render(false);

    setChecked(true);
    expect(input.checked).toBe(true);

    setChecked(false);
    expect(input.checked).toBe(false);
  });

  it("reports nothing while disabled", () => {
    const input = render(false, true);

    input.click();

    expect(onChange).not.toHaveBeenCalled();
  });
});
