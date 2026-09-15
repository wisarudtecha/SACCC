// src/cms/components/dashboard/map/longdo/caseAreaChoroplethStyle.ts
//
// Mirrors useLongdoBoundaryOverlays.ts's per-overlay styling, keyed on a
// case-count bucket instead of the adjacency-based colour slot.
import { choroplethRgbaCss } from "@/cms/components/dashboard/map/caseAreaChoroplethColors";
import type { LongdoGeometryOptions } from "@/cms/components/case/createCase/map/longdo/longdoApi";

const FILL_ALPHA = 0.6;
const OUTLINE_ALPHA = 0.9;

export function caseAreaPolygonStyle(
  bucket: number,
  isDarkTheme: boolean,
  label: string
): LongdoGeometryOptions {
  return {
    lineWidth: 1,
    lineColor: choroplethRgbaCss(bucket, isDarkTheme, OUTLINE_ALPHA),
    fillColor: choroplethRgbaCss(bucket, isDarkTheme, FILL_ALPHA),
    label,
    clickable: false,
    pointer: false,
  };
}
