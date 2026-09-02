// The case-location marker for the MapTiler map.
//
// A MapLibre `Marker` takes a real DOM element, so - like the Longdo HTML icon,
// and unlike the ArcGIS autocast symbol object - this returns a node. The colour
// and size are the same numbers as MARKER_SYMBOL in ArcgisAddressMap.tsx and
// createCaseMarkerOptions on the Longdo side: a case marker must not change
// appearance because the environment switched provider.
//
// Returned as a `<div>` wrapping an inline SVG rather than a bare SVG so the
// MapLibre marker anchoring (`anchor: "center"`) has a block-level box to work
// with.

/** Brand blue, matching MARKER_SYMBOL in ArcgisAddressMap.tsx. */
const MARKER_FILL = "rgb(37, 99, 235)";
const MARKER_STROKE = "rgb(255, 255, 255)";

/** ArcGIS draws the case marker at size 12 with a 2px outline. */
const MARKER_DIAMETER = 16;

/** The DOM element for the single case-location marker. */
export function createCaseMarkerElement(): HTMLDivElement {
  const element = document.createElement("div");
  const radius = MARKER_DIAMETER / 2;
  element.style.width = `${MARKER_DIAMETER}px`;
  element.style.height = `${MARKER_DIAMETER}px`;
  element.style.pointerEvents = "none";
  element.innerHTML =
    `<svg width="${MARKER_DIAMETER}" height="${MARKER_DIAMETER}" ` +
    `viewBox="0 0 ${MARKER_DIAMETER} ${MARKER_DIAMETER}" xmlns="http://www.w3.org/2000/svg">` +
    `<circle cx="${radius}" cy="${radius}" r="${radius - 2}" ` +
    `fill="${MARKER_FILL}" fill-opacity="0.9" stroke="${MARKER_STROKE}" stroke-width="2" />` +
    `</svg>`;
  return element;
}
