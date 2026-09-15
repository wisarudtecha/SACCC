// src/cms/components/dashboard/map/arcgis/caseAreaChoroplethRenderer.ts
//
// Mirrors boundarySymbols.ts's createBoundaryRenderer, but keyed on a
// case-count BUCKET instead of the adjacency-based COLOR_IDX - a value-driven
// UniqueValueRenderer over a small, fixed set of bucket indexes, not a
// ClassBreaksRenderer, so this stays the same well-exercised renderer shape
// the boundary layers already use in this codebase.
import SimpleFillSymbol from "@arcgis/core/symbols/SimpleFillSymbol.js";
import SimpleLineSymbol from "@arcgis/core/symbols/SimpleLineSymbol.js";
import UniqueValueRenderer from "@arcgis/core/renderers/UniqueValueRenderer.js";
import { CHOROPLETH_BUCKET_COUNT, choroplethRgba } from "@/cms/components/dashboard/map/caseAreaChoroplethColors";

const FILL_ALPHA = 0.6;
const OUTLINE_ALPHA = 0.9;
const OUTLINE_WIDTH = 1;

export function createCaseAreaChoroplethRenderer(isDarkTheme: boolean): UniqueValueRenderer {
  const symbolFor = (bucket: number) =>
    new SimpleFillSymbol({
      color: choroplethRgba(bucket, isDarkTheme, FILL_ALPHA),
      outline: new SimpleLineSymbol({
        color: choroplethRgba(bucket, isDarkTheme, OUTLINE_ALPHA),
        width: OUTLINE_WIDTH,
        style: "solid",
      }),
    });

  return new UniqueValueRenderer({
    field: "BUCKET",
    uniqueValueInfos: Array.from({ length: CHOROPLETH_BUCKET_COUNT }, (_, bucket) => ({
      value: bucket,
      symbol: symbolFor(bucket),
    })),
    defaultSymbol: symbolFor(0),
  });
}
