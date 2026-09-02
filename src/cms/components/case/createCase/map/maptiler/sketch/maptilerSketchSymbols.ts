// Symbols for the boundary being drawn, on a MapTiler map.
//
// Same amber as the ArcGIS and Longdo sketch symbols, from SKETCH_TOKENS - the
// polygon has to read as "in progress" against whatever is underneath it, and
// that meaning must not change with the provider.
//
// The VERTEX HANDLES are drawn here (MapLibre, like Longdo, has no create tool
// that renders them), and that is a small gain: the FIRST vertex can be drawn
// larger and hollow to say "click me to close the ring", the one affordance a
// click-to-draw polygon needs.
import { SKETCH_TOKENS as TOKENS } from "../../sketch/sketchSymbols";

type Rgb = readonly [number, number, number];

function rgba(rgb: Rgb, alpha: number): string {
  return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})`;
}

function sketchRgb(isDarkTheme: boolean): Rgb {
  return isDarkTheme ? TOKENS.darkRgb : TOKENS.lightRgb;
}

/** Fill paint for the polygon (committed or in progress). */
export function sketchFillPaint(isDarkTheme: boolean): Record<string, unknown> {
  return { "fill-color": rgba(sketchRgb(isDarkTheme), TOKENS.fillAlpha) };
}

/** Outline paint for the polygon; dashed while a ring is still being drawn. */
export function sketchLinePaint(isDarkTheme: boolean, dashed: boolean): Record<string, unknown> {
  return {
    "line-color": rgba(sketchRgb(isDarkTheme), TOKENS.outlineAlpha),
    "line-width": TOKENS.outlineWidth,
    ...(dashed ? { "line-dasharray": [2, 2] } : {})
  };
}

const VERTEX_DIAMETER = 10;
const FIRST_VERTEX_DIAMETER = 14;

/**
 * A vertex handle element.
 *
 * The first vertex is larger and hollow: clicking it closes the ring, the only
 * way to finish a polygon with the pointer alone. Every other vertex is a plain
 * filled dot.
 */
export function createSketchVertexElement(isDarkTheme: boolean, isFirst: boolean): HTMLDivElement {
  const rgb = sketchRgb(isDarkTheme);
  const size = isFirst ? FIRST_VERTEX_DIAMETER : VERTEX_DIAMETER;
  const centre = size / 2;
  const fill = isFirst ? "rgba(255, 255, 255, 0.95)" : rgba(rgb, TOKENS.outlineAlpha);

  const element = document.createElement("div");
  element.style.width = `${size}px`;
  element.style.height = `${size}px`;
  element.style.lineHeight = "0";
  element.style.cursor = "pointer";
  element.innerHTML =
    `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" ` +
    `xmlns="http://www.w3.org/2000/svg" style="display:block">` +
    `<circle cx="${centre}" cy="${centre}" r="${centre - 1.5}" fill="${fill}" ` +
    `stroke="${rgba(rgb, TOKENS.outlineAlpha)}" stroke-width="${isFirst ? 2.5 : 1.5}" />` +
    `</svg>`;
  return element;
}
