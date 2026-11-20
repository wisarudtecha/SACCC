// @vitest-environment jsdom
// Pins decision D12: an org that shows Places must start with the categories open.
//
// Without it the layer is "on" and draws nothing - every marker is filtered out by
// a category list that starts all-unchecked - which looks exactly like a broken
// layer and leaves the admin with no way to tell why.
//
// Also pins the override semantics: the org value is the STARTING POINT, so the
// user's toggle still works and still wins.
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PLACE_CATEGORIES } from "@/cms/types/place";

const mocks = vi.hoisted(() => ({
  org: { showPlace: false },
}));

vi.mock("@/core/hooks/useTranslation", () => ({
  useTranslation: () => ({
    language: "en",
    t: (key: string) => key,
  }),
}));

vi.mock("@/cms/components/admin/system-configuration/settings/useOrgMapSettings", () => ({
  useOrgMapSettings: () => ({
    loaded: { layers: { showPlace: mocks.org.showPlace } },
  }),
}));

vi.mock("@/cms/store/api/placesApi", () => ({
  useGetPlacesQuery: () => ({ data: { data: [] }, isLoading: false, isError: false }),
}));

import { usePlaceLayer } from "./usePlaceLayer";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: ReturnType<typeof createRoot> | null = null;
let container: HTMLDivElement;

function Probe(): React.ReactElement {
  const { showPlace, categoryVisibility, toggleShowPlace, notice } = usePlaceLayer();
  const visibleCategories = Object.values(categoryVisibility).filter(Boolean).length;
  return (
    <div data-show={String(showPlace)} data-categories={String(visibleCategories)}>
      <button type="button" onClick={toggleShowPlace}>
        toggle
      </button>
      <span data-notice>{notice ?? ""}</span>
    </div>
  );
}

function render(): HTMLElement {
  container = document.createElement("div");
  root = createRoot(container);
  act(() => {
    root?.render(<Probe />);
  });
  return container.firstElementChild as HTMLElement;
}

function noticeOf(probe: HTMLElement): string {
  return probe.querySelector("[data-notice]")?.textContent ?? "";
}

beforeEach(() => {
  mocks.org.showPlace = false;
});

afterEach(() => {
  act(() => {
    root?.unmount();
  });
  root = null;
});

describe("usePlaceLayer org defaults", () => {
  it("starts hidden with every category unchecked when the org hides Places", () => {
    const probe = render();

    expect(probe.dataset.show).toBe("false");
    expect(probe.dataset.categories).toBe("0");
    expect(noticeOf(probe)).toBe("");
  });

  it("starts shown with every category open when the org shows Places (D12)", () => {
    mocks.org.showPlace = true;
    const probe = render();

    expect(probe.dataset.show).toBe("true");
    expect(probe.dataset.categories).toBe(String(PLACE_CATEGORIES.length));
  });

  it("reports an empty dataset rather than silence when the layer is on", () => {
    mocks.org.showPlace = true;

    expect(noticeOf(render())).toBe("case.display.map_place_empty");
  });

  it("lets the user turn the layer off, and the org default does not force it back", () => {
    mocks.org.showPlace = true;
    const probe = render();

    const button = probe.querySelector("button");
    act(() => {
      button?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(probe.dataset.show).toBe("false");
  });
});
