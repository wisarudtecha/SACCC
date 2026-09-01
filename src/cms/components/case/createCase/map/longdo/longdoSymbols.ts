// Symbols for the Longdo map's own overlays.
//
// Longdo markers take an HTML icon (`icon: { html, offset }`), verified to
// render as a real DOM node, so the symbols here are SVG strings rather than
// the autocast objects the ArcGIS side uses. The COLOURS and sizes are the same
// numbers - a case marker must not change appearance because the environment
// switched provider.
import type { LongdoMarkerOptions } from "./longdoApi";

/** Brand blue, matching MARKER_SYMBOL in ArcgisAddressMap.tsx. */
const MARKER_FILL = "rgb(37, 99, 235)";
const MARKER_STROKE = "rgb(255, 255, 255)";

/** ArcGIS draws the case marker at size 12 with a 2px outline. */
const MARKER_DIAMETER = 16;

/**
 * The case location marker.
 *
 * `offset` centres the icon on its location: Longdo anchors an HTML icon at its
 * top-left corner, so without it every marker would sit down and to the right
 * of the point it marks - which on a 320px map is a visible lie about where the
 * case is.
 */
export function createCaseMarkerOptions(title: string): LongdoMarkerOptions {
  const radius = MARKER_DIAMETER / 2;
  return {
    title,
    icon: {
      html:
        `<svg width="${MARKER_DIAMETER}" height="${MARKER_DIAMETER}" ` +
        `viewBox="0 0 ${MARKER_DIAMETER} ${MARKER_DIAMETER}" xmlns="http://www.w3.org/2000/svg">` +
        `<circle cx="${radius}" cy="${radius}" r="${radius - 2}" ` +
        `fill="${MARKER_FILL}" fill-opacity="0.9" stroke="${MARKER_STROKE}" stroke-width="2" />` +
        `</svg>`,
      offset: { x: radius, y: radius }
    }
  };
}
