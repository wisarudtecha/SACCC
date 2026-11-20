// Tests for the org-default resolution of the map controls.
//
// Every case here is a "wrong direction" bug that type-checks: an inverted
// `showBoundaries` hides the layer for every org that wanted it, and an inverted
// truncation check tells an org with 5000 Places that all 1000 were shown.
import { describe, expect, it } from "vitest";
import {
  PLACE_FETCH_LIMIT,
  isPlaceLayerTruncated,
  resolveBoundaryStartAllHidden,
  resolveSearchMode,
} from "./mapControlDefaults";

describe("resolveBoundaryStartAllHidden", () => {
  it("starts visible when the org shows boundaries and the surface wants them", () => {
    expect(
      resolveBoundaryStartAllHidden({ manualOnly: false, showBoundaries: true })
    ).toBe(false);
  });

  it("starts hidden when the org switched boundaries off", () => {
    expect(
      resolveBoundaryStartAllHidden({ manualOnly: false, showBoundaries: false })
    ).toBe(true);
  });

  it("starts hidden when the surface asked for manual selection, whatever the org says", () => {
    expect(
      resolveBoundaryStartAllHidden({ manualOnly: true, showBoundaries: true })
    ).toBe(true);
  });
});

describe("resolveSearchMode", () => {
  it("shows search on an editable map when the org allows it", () => {
    expect(resolveSearchMode({ readOnly: false, showSearch: true })).toBe("always");
  });

  it("hides search when the org switched it off", () => {
    expect(resolveSearchMode({ readOnly: false, showSearch: false })).toBe("never");
  });

  it("hides search on a read-only map even when the org allows it", () => {
    expect(resolveSearchMode({ readOnly: true, showSearch: true })).toBe("never");
  });

  it("lets an explicit per-surface mode win over the org value", () => {
    expect(
      resolveSearchMode({ searchMode: "expanded", readOnly: false, showSearch: false })
    ).toBe("expanded");
  });
});

describe("isPlaceLayerTruncated", () => {
  it("is not truncated below the cap", () => {
    expect(isPlaceLayerTruncated(PLACE_FETCH_LIMIT - 1)).toBe(false);
    expect(isPlaceLayerTruncated(0)).toBe(false);
  });

  it("treats a full page as possibly truncated", () => {
    // A response that fills the page exactly is indistinguishable from a cut one:
    // there is no total in the payload, so the honest answer is "may be".
    expect(isPlaceLayerTruncated(PLACE_FETCH_LIMIT)).toBe(true);
    expect(isPlaceLayerTruncated(PLACE_FETCH_LIMIT + 1)).toBe(true);
  });
});
