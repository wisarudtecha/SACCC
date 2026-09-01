// Symbols for the boundary being drawn, on a Longdo map.
//
// Same amber as the ArcGIS sketch symbol, from SKETCH_TOKENS - the polygon has
// to read as "in progress" against whatever is underneath it, and that meaning
// must not change with the provider.
//
// The VERTEX HANDLES are new here. ArcGIS draws them itself: SketchViewModel
// owns the drawing gesture and renders a dot per vertex with no symbol hook.
// Longdo has no create tool, so this file draws them - and that turns out to be
// a small gain, because the FIRST vertex can be drawn differently to say
// "click me to close the ring", which is the one affordance a click-to-draw
// polygon needs and the Esri one never advertises.
import { SKETCH_TOKENS as TOKENS } from "../../sketch/sketchSymbols";
import type { LongdoGeometryOptions, LongdoMarkerOptions } from "../longdoApi";

type Rgb = readonly [number, number, number];

function rgba(rgb: Rgb, alpha: number): string {
  return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})`;
}

function sketchRgb(isDarkTheme: boolean): Rgb {
  return isDarkTheme ? TOKENS.darkRgb : TOKENS.lightRgb;
}

/**
 * Fill + outline for the polygon, committed or in progress.
 *
 * `clickable` is left ON - unlike every other overlay this app draws. In edit
 * mode the polygon IS the thing being grabbed, and in draw mode a click that
 * lands on the shape still belongs to the sketch, which reads it back through
 * the map's own click handler either way.
 */
export function createSketchPolygonOptions(
  isDarkTheme: boolean,
  isEditable: boolean
): LongdoGeometryOptions {
  const rgb = sketchRgb(isDarkTheme);
  return {
    lineColor: rgba(rgb, TOKENS.outlineAlpha),
    fillColor: rgba(rgb, TOKENS.fillAlpha),
    lineWidth: TOKENS.outlineWidth,
    editable: isEditable,
    draggable: false
  };
}

/** The dashed rubber band shown while a ring is still being drawn. */
export function createSketchPreviewOptions(
  isDarkTheme: boolean,
  dashArray: readonly number[]
): LongdoGeometryOptions {
  const rgb = sketchRgb(isDarkTheme);
  return {
    lineColor: rgba(rgb, TOKENS.outlineAlpha),
    lineWidth: TOKENS.outlineWidth,
    lineStyle: dashArray,
    clickable: false,
    pointer: false
  };
}

const VERTEX_DIAMETER = 10;
const FIRST_VERTEX_DIAMETER = 14;

/**
 * A vertex handle.
 *
 * The first vertex is larger and hollow: clicking it closes the ring, and that
 * is the only way to finish a polygon with the pointer alone. Every other
 * vertex is a plain filled dot - a position marker, not a target.
 */
export function createSketchVertexOptions(
  isDarkTheme: boolean,
  isFirst: boolean
): LongdoMarkerOptions {
  const rgb = sketchRgb(isDarkTheme);
  const size = isFirst ? FIRST_VERTEX_DIAMETER : VERTEX_DIAMETER;
  const centre = size / 2;
  const fill = isFirst ? "rgba(255, 255, 255, 0.95)" : rgba(rgb, TOKENS.outlineAlpha);

  return {
    icon: {
      html:
        `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" ` +
        `xmlns="http://www.w3.org/2000/svg" style="cursor:pointer">` +
        `<circle cx="${centre}" cy="${centre}" r="${centre - 1.5}" fill="${fill}" ` +
        `stroke="${rgba(rgb, TOKENS.outlineAlpha)}" stroke-width="${isFirst ? 2.5 : 1.5}" />` +
        `</svg>`,
      offset: { x: centre, y: centre }
    }
  };
}
