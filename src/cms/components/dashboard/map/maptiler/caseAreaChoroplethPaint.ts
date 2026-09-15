// src/cms/components/dashboard/map/maptiler/caseAreaChoroplethPaint.ts
//
// Mirrors useMapTilerBoundaryOverlays.ts's colorExpression, keyed on a
// case-count bucket instead of the adjacency-based __color slot.
import { CHOROPLETH_BUCKET_COUNT, choroplethRgbaCss } from "@/cms/components/dashboard/map/caseAreaChoroplethColors";

export function caseAreaFillColorExpression(isDarkTheme: boolean, alpha: number): unknown[] {
  const cases: (number | string)[] = [];
  for (let bucket = 0; bucket < CHOROPLETH_BUCKET_COUNT; bucket += 1) {
    cases.push(bucket, choroplethRgbaCss(bucket, isDarkTheme, alpha));
  }
  return ["match", ["get", "__bucket"], ...cases, choroplethRgbaCss(0, isDarkTheme, alpha)];
}
