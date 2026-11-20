// Resolution of the org-level DEFAULTS for the map controls (Phase B of
// docs/ORG-SETTINGS-Runtime-Wiring-Plan.md).
//
// Each control used to hardcode its starting value ("search is on for an
// editable map", "the boundary picker starts with everything visible", "fetch
// up to 1000 Places"). The org document now decides those, and the decision is
// "the org value, unless this surface has a reason of its own" - which is a
// three-input question that is easy to get backwards and impossible to read at a
// call site. Answered here, once per control, so it can be tested.
//
// PURE: no React, no map SDK. Safe to import from any map module.
import type { MapSearchMode } from "./mapTypes";

/**
 * How many Places one layer fetch asks for.
 *
 * Lives here rather than in `usePlaceLayer` so the Map Settings screen can quote
 * the same ceiling in its "showing N of M" notice - and so the notice cannot
 * drift from the request it describes.
 */
export const PLACE_FETCH_LIMIT = 1000;

export interface BoundaryStartAllHiddenInput {
  /** This surface wants the boundary picker to start with nothing selected. */
  manualOnly: boolean;
  /** Org setting: "Show Boundaries + Polygon". */
  showBoundaries: boolean;
}

/**
 * Whether the boundary picker starts with every level cleared.
 *
 * Two independent reasons, and either one is enough: the surface asked for it
 * (the assignment / edit screens), or the org has the layer switched off.
 */
export function resolveBoundaryStartAllHidden({
  manualOnly,
  showBoundaries,
}: BoundaryStartAllHiddenInput): boolean {
  return manualOnly || !showBoundaries;
}

export interface SearchModeInput {
  /** An explicit per-surface mode always wins - it is a code decision, not a setting. */
  searchMode?: MapSearchMode;
  readOnly: boolean;
  /** Org setting: "Search for locations". */
  showSearch: boolean;
}

/**
 * How the address search box behaves.
 *
 * "never" when the map is read-only (nothing to search FOR) or the org turned
 * search off; otherwise "always" - the inline map shows it and the expanded map
 * shows it too. There is deliberately no org value that yields "expanded only":
 * that mode exists for surfaces with no room inline, which is a layout fact the
 * caller already knows and passes explicitly.
 */
export function resolveSearchMode({
  searchMode,
  readOnly,
  showSearch,
}: SearchModeInput): MapSearchMode {
  if (searchMode) {
    return searchMode;
  }
  if (readOnly || !showSearch) {
    return "never";
  }
  return "always";
}

/**
 * Whether the Place layer is showing less than the org actually has.
 *
 * A full page is the only evidence available: the request asks for exactly
 * `PLACE_FETCH_LIMIT` and the response carries no total, so "exactly the cap"
 * must be treated as "possibly truncated". Saying nothing (the old behaviour)
 * makes an org whose data was cut look like an org whose data is complete.
 */
export function isPlaceLayerTruncated(markerCount: number): boolean {
  return markerCount >= PLACE_FETCH_LIMIT;
}
