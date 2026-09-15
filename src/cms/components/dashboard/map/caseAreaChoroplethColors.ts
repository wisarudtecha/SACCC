// src/cms/components/dashboard/map/caseAreaChoroplethColors.ts
//
// A sequential, value-driven palette for the Case Summary by Area choropleth.
//
// Deliberately NOT boundaryColors.ts's BOUNDARY_HUES: that palette is
// adjacency-safe and CATEGORICAL (colour identifies an area, not a value -
// see its own header comment), built for a picker where bordering polygons
// must never share a colour. A choropleth needs the opposite property -
// monotonically increasing perceived intensity as the value increases - so
// this is a separate, purpose-built 5-class sequential scale.
type Rgb = readonly [number, number, number];

interface ChoroplethShade {
  light: Rgb;
  dark: Rgb;
}

/** Light amber -> dark red, low to high. */
const CHOROPLETH_SHADES: readonly ChoroplethShade[] = [
  { light: [254, 240, 138], dark: [113, 63, 18] },
  { light: [253, 186, 116], dark: [154, 52, 18] },
  { light: [248, 113, 113], dark: [185, 28, 28] },
  { light: [220, 38, 38], dark: [220, 38, 38] },
  { light: [127, 29, 29], dark: [248, 113, 113] },
];

export const CHOROPLETH_BUCKET_COUNT = CHOROPLETH_SHADES.length;

/** Sorted quantile break points, one below each non-first bucket. */
export interface CaseAreaBuckets {
  thresholds: number[];
}

/**
 * Quantile bucket breaks over `values`.
 *
 * A simple sorted-quantile split rather than full Jenks natural-breaks: case
 * volume by district is expected to be skewed (a handful of dense central
 * districts, a long tail of quiet ones), so quantiles read better than equal
 * intervals, without pulling in a stats dependency for true natural breaks.
 */
export function computeCaseAreaBuckets(values: number[]): CaseAreaBuckets {
  const sorted = [...values].sort((a, b) => a - b);
  if (sorted.length === 0) {
    return { thresholds: [] };
  }

  const thresholds: number[] = [];
  for (let bucket = 1; bucket < CHOROPLETH_BUCKET_COUNT; bucket += 1) {
    const index = Math.floor((sorted.length * bucket) / CHOROPLETH_BUCKET_COUNT);
    thresholds.push(sorted[Math.min(index, sorted.length - 1)]);
  }
  return { thresholds };
}

export function bucketForValue(value: number, buckets: CaseAreaBuckets): number {
  let bucket = 0;
  for (const threshold of buckets.thresholds) {
    if (value >= threshold) {
      bucket += 1;
    }
  }
  return Math.min(bucket, CHOROPLETH_BUCKET_COUNT - 1);
}

function shadeFor(bucket: number, isDarkTheme: boolean): Rgb {
  const shade = CHOROPLETH_SHADES[Math.max(0, Math.min(bucket, CHOROPLETH_BUCKET_COUNT - 1))];
  return isDarkTheme ? shade.dark : shade.light;
}

/** ArcGIS-style colour array. */
export function choroplethRgba(bucket: number, isDarkTheme: boolean, alpha: number): [number, number, number, number] {
  const [r, g, b] = shadeFor(bucket, isDarkTheme);
  return [r, g, b, alpha];
}

/** CSS colour string, for MapLibre/Longdo. */
export function choroplethRgbaCss(bucket: number, isDarkTheme: boolean, alpha: number): string {
  const [r, g, b] = shadeFor(bucket, isDarkTheme);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
