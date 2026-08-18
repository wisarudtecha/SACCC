// Shared class strings for the map's custom toolbar controls.
//
// Separate from MapControlGroup.tsx so that file exports a component and
// nothing else - mixing components and constants in one module breaks React
// Fast Refresh, which the repo's ESLint config flags.
//
// These exist because four different controls (basemap switcher, staff
// controls, boundary toggles, place button) sit in the same toolbar row and
// have to look like one set.

/** Shell around a cluster of controls. */
export const MAP_CONTROL_SHELL_CLASS =
  "flex items-stretch overflow-hidden rounded-md bg-white/90 shadow-sm dark:bg-gray-800/90";

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
