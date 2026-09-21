// Line symbol for the straight staff -> incident connector lines.
//
// Deliberately quieter than the solved route (routeSymbols.ts): thinner, dashed
// and a neutral slate rather than brand blue, so it reads as "where everyone is
// relative to the incident" and a real route drawn on top of it still stands out.
//
// Takes `isDarkTheme` as an explicit parameter, like createRouteSymbol, and never
// reads it from context.
type Rgba = [number, number, number, number];

const CONNECTOR_LIGHT_RGB: [number, number, number] = [71, 85, 105]; // slate-600
const CONNECTOR_DARK_RGB: [number, number, number] = [203, 213, 225]; // slate-300

const CONNECTOR_LINE_ALPHA = 0.85;
const CONNECTOR_LINE_WIDTH = 2;

export function createConnectorSymbol(isDarkTheme: boolean) {
  const [r, g, b] = isDarkTheme ? CONNECTOR_DARK_RGB : CONNECTOR_LIGHT_RGB;
  const color: Rgba = [r, g, b, CONNECTOR_LINE_ALPHA];
  return {
    type: "simple-line" as const,
    style: "dash" as const,
    color,
    width: CONNECTOR_LINE_WIDTH,
    cap: "butt" as const,
    join: "round" as const
  };
}

/**
 * The same values, as a second provider needs them - MapLibre `paint` properties
 * take CSS colour strings and plain widths, not an Esri symbol object. Shared for
 * the same reason ROUTE_TOKENS is: two copies of "what a connector looks like"
 * would drift.
 */
export const CONNECTOR_TOKENS = {
  lightRgb: CONNECTOR_LIGHT_RGB,
  darkRgb: CONNECTOR_DARK_RGB,
  alpha: CONNECTOR_LINE_ALPHA,
  width: CONNECTOR_LINE_WIDTH
} as const;
