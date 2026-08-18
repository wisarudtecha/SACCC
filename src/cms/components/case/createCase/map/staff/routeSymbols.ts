// Line symbol for the officer -> case route polyline.
//
// Takes `isDarkTheme` as an explicit parameter, the way createBasemap /
// createFallbackBasemap in basemaps.ts do - never reads it from context itself,
// so it stays usable from anywhere the caller already knows the theme.
type Rgba = [number, number, number, number];

// Matches ArcgisAddressMap's own case-marker blue (brand blue) on light; a
// lighter tint on the night basemap so the line still reads against dark tiles.
const ROUTE_LIGHT_RGB: [number, number, number] = [37, 99, 235]; // blue-600
const ROUTE_DARK_RGB: [number, number, number] = [96, 165, 250]; // blue-400

const ROUTE_LINE_ALPHA = 0.9;
const ROUTE_LINE_WIDTH = 4;

export function createRouteSymbol(isDarkTheme: boolean) {
  const [r, g, b] = isDarkTheme ? ROUTE_DARK_RGB : ROUTE_LIGHT_RGB;
  const color: Rgba = [r, g, b, ROUTE_LINE_ALPHA];
  return {
    type: "simple-line" as const,
    style: "solid" as const,
    color,
    width: ROUTE_LINE_WIDTH,
    cap: "round" as const,
    join: "round" as const
  };
}
