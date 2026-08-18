// Line symbol for the officer's breadcrumb trail.
//
// Takes `isDarkTheme` as an explicit parameter, exactly as createRouteSymbol and
// basemaps.ts do - never reads it from context itself.
//
// Deliberately NOT route-like. The solved officer -> case route is already a
// solid 4px blue polyline on this same map, and the two mean opposite things:
// the route is where the officer is GOING, the trail is where they have BEEN.
// Two similar lines saying opposite things is worse than one line, so this is
// dashed, thinner, and dimmer, in the neutral slate the map uses for things that
// are context rather than instruction.
type Rgba = [number, number, number, number];

const TRAIL_LIGHT_RGB: [number, number, number] = [71, 85, 105];    // slate-600
const TRAIL_DARK_RGB: [number, number, number] = [148, 163, 184];   // slate-400

const TRAIL_LINE_ALPHA = 0.75;
const TRAIL_LINE_WIDTH = 2;

export function createBreadcrumbSymbol(isDarkTheme: boolean) {
  const [r, g, b] = isDarkTheme ? TRAIL_DARK_RGB : TRAIL_LIGHT_RGB;
  const color: Rgba = [r, g, b, TRAIL_LINE_ALPHA];
  return {
    type: "simple-line" as const,
    style: "short-dash" as const,
    color,
    width: TRAIL_LINE_WIDTH,
    cap: "round" as const,
    join: "round" as const
  };
}
