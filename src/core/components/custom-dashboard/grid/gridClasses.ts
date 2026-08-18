// src/core/components/custom-dashboard/grid/gridClasses.ts
/**
 * Tailwind scans source statically, so an interpolated class like `xl:col-span-${n}`
 * is never emitted. Spans must be looked up from literal strings — the same reason the
 * dynamic-form builder keeps its own static span map.
 */
export const GRID_COLUMNS = 4;

export const MIN_COL_SPAN = 1;
export const MAX_COL_SPAN = 4;
export const MIN_ROW_SPAN = 1;
export const MAX_ROW_SPAN = 2;

const COL_SPAN_CLASSES: Record<number, string> = {
  1: "xl:col-span-1",
  2: "xl:col-span-2",
  3: "xl:col-span-3",
  4: "xl:col-span-4",
};

const ROW_SPAN_CLASSES: Record<number, string> = {
  1: "xl:row-span-1",
  2: "xl:row-span-2",
};

/** Widget bodies get a concrete height so ApexCharts (height="100%") can measure. */
const ROW_HEIGHT_CLASSES: Record<number, string> = {
  1: "min-h-[220px]",
  2: "min-h-[460px]",
};

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

export const colSpanClass = (colSpan: number): string =>
  COL_SPAN_CLASSES[clamp(colSpan, MIN_COL_SPAN, MAX_COL_SPAN)];

export const rowSpanClass = (rowSpan: number): string =>
  ROW_SPAN_CLASSES[clamp(rowSpan, MIN_ROW_SPAN, MAX_ROW_SPAN)];

export const rowHeightClass = (rowSpan: number): string =>
  ROW_HEIGHT_CLASSES[clamp(rowSpan, MIN_ROW_SPAN, MAX_ROW_SPAN)];
