// Trims Longdo's built-in on-map controls down to the ones the app does not
// already replace.
//
// Two of the SDK's default controls are both redundant and actively in the way:
//
//   - the map-style / layer selector (top-right) - the app ships its own
//     BasemapSwitcher, and the extra Longdo styles are deliberately not offered
//     (see longdoBasemaps.ts). Left in place, the app's toolbar row sits over
//     the native dropdown when it opens.
//
//   - the fullscreen button (top-right) - native fullscreen promotes only the
//     tile container to the browser fullscreen element, and every app overlay
//     (search box, toolbar row, coordinate card) is a SIBLING of that container,
//     so all of them vanish. The app's "expand" modal is the supported path and
//     keeps every control.
//
// Everything else the SDK draws - the zoom + geolocation cluster top-left, the
// scale bar, the zoom/depth readout in the bottom strip - is kept.
import type { LongdoMap } from "./longdoApi";

/** Native `map.Ui` controls the app supersedes and hides on every map instance. */
const REDUNDANT_UI_CONTROLS = ["LayerSelector", "Fullscreen"] as const;

/**
 * Hide the native controls listed in `REDUNDANT_UI_CONTROLS`. Call once, right
 * after the map is constructed - the actual hiding is deferred to the map's
 * `ready` event (see below).
 *
 * Longdo Map v3 is async-init: `new longdo.Map()` returns before `map.Ui` and
 * its control DOM are wired, and `visible(false)` called before then silently
 * no-ops. So the work runs inside the `ready` handler - the same point the
 * official longdo-map SDK wrappers first expose the map.
 *
 * Defensive by design: the `map.Ui` member names come from the Longdo SDK, not
 * from anything this repo exercises in a test, so a control the active UI preset
 * does not include is skipped rather than thrown.
 */
export function hideRedundantLongdoUi(map: LongdoMap): void {
  map.Event.bind("ready", () => {
    for (const name of REDUNDANT_UI_CONTROLS) {
      try {
        map.Ui?.[name]?.visible(false);
      } catch {
        // This UI preset does not include the control - nothing to hide.
      }
    }
  });
}
