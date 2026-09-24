// Shared class strings for the map's custom toolbar controls.
//
// Separate from MapControlGroup.tsx so that file exports a component and
// nothing else - mixing components and constants in one module breaks React
// Fast Refresh, which the repo's ESLint config flags.
//
// These exist because four different controls (basemap switcher, staff
// controls, boundary toggles, place button) sit in the same toolbar row and
// have to look like one set.

/**
 * Hairline edge for every toolbar pill, on top of its `bg-white/90` fill.
 *
 * A semi-transparent white pill with only `shadow-sm` reads fine against
 * ArcGIS's grayer canvas basemap and Longdo's more saturated street imagery,
 * but nearly disappears against MapTiler's pale `streets-v2` light style. A
 * border keeps every control legible regardless of what is under it. One
 * constant so every toolbar control (and any new one) picks it up the same way.
 */
export const MAP_CONTROL_BORDER_CLASS = "border border-gray-200/80 dark:border-gray-700/80";

/** Shell around a cluster of controls. */
export const MAP_CONTROL_SHELL_CLASS =
  `flex items-stretch overflow-hidden rounded-md bg-white/90 shadow-sm dark:bg-gray-800/90 ${MAP_CONTROL_BORDER_CLASS}`;

/** Button metrics, matching StaffMapControls and BasemapSwitcher. */
export const MAP_CONTROL_SEGMENT_CLASS =
  "flex items-center gap-1 px-2 py-1 text-xs transition-colors disabled:cursor-not-allowed disabled:opacity-50";

/**
 * Slide-in/out classes for content revealed on interaction, driven by React
 * state. Used by MapControlGroup, whose trigger is a real (enabled) button and
 * can therefore report its own hover and focus.
 */
export function mapControlRevealClass(isOpen: boolean): string {
  return `flex items-stretch overflow-hidden whitespace-nowrap transition-all duration-200 ease-out ${
    isOpen ? "max-w-[24rem] opacity-100" : "max-w-0 opacity-0"
  }`;
}

/**
 * CSS-only variant of the same reveal, driven by an ancestor marked `group`.
 *
 * Needed wherever the revealing control cannot report its own hover: a DISABLED
 * button receives no pointer events in Chrome, so `onMouseEnter` on it never
 * fires. Putting the trigger on a wrapper and letting CSS do the work sidesteps
 * that entirely. `group-focus-within` keeps the keyboard path working.
 */
export const MAP_CONTROL_REVEAL_ON_GROUP =
  "inline-flex overflow-hidden whitespace-nowrap max-w-0 opacity-0 transition-all duration-200 ease-out " +
  "group-hover:max-w-[12rem] group-hover:opacity-100 group-focus-within:max-w-[12rem] group-focus-within:opacity-100";

/**
 * Reserved strip height at the map's bottom-left, kept clear by
 * CaseStaffMapField's CARD_DOCK_CLASS so it never grows into the space
 * mapBottomLeftRowClass below anchors to. One shared token so the dock and
 * the row can't drift out of sync with each other.
 */
export const MAP_BOTTOM_LEFT_CLEARANCE_CLASS = "bottom-16";

/**
 * Bottom-left row for the Coordinates/Place/Device group. Horizontal, not
 * stacked, so its height is bounded by the TALLEST single card instead of
 * the sum of all three - the actual fix for the Case/Staff dock (see
 * CaseStaffMapField's CARD_DOCK_CLASS, whose bottom edge is reserved via
 * MAP_BOTTOM_LEFT_CLEARANCE_CLASS to stay clear of this row).
 *
 * `flex-wrap-reverse` makes any overflow wrap to a new line ABOVE the first,
 * keeping the bottom-most line pinned at bottom-2/bottom-8 - the same
 * "grows upward" behavior a bottom-anchored stack needs.
 *
 * `items-start`, not `items-end`: `flex-wrap-reverse` swaps the cross-axis
 * start/end per the flexbox spec, so under it `items-start` is what actually
 * renders as bottom-flush (verified - `items-end` here renders every card's
 * TOP flush instead, which is the wrong edge). Don't "fix" this back to
 * `items-end` without re-testing; it looks backwards but isn't.
 */
export function mapBottomLeftRowClass(showLocationInfo: boolean): string {
  return `absolute left-2 z-10 flex flex-row flex-wrap-reverse items-start gap-2 max-w-[calc(100%-1rem)] ${
    showLocationInfo ? "bottom-8" : "bottom-2"
  }`;
}
