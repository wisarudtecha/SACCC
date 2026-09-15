// src/cms/components/dashboard/registerCaseSummaryByAreaHeatmapWidget.ts
//
// Registers the Case Summary by Area choropleth as a Custom Dashboard widget.
// It's a `cms` module (the map pulls in `cms`'s boundary/ArcGIS/MapLibre/
// Longdo code), so it's registered from here into `core`'s registry rather
// than `core` importing `cms` widget code directly - the same pattern
// registerDispatchWidgets.ts already uses. See the `SelfFetchingWidgetDefinition`
// doc comment in `@/core/components/custom-dashboard/widgets/types.ts` for why.
//
// Imported once, for this side effect only, from `src/cms/App.tsx`.
import { Thermometer } from "lucide-react";
import { registerWidgetDefinition } from "@/core/components/custom-dashboard/widgets/registry";
import { SOURCE_IDS } from "@/core/components/custom-dashboard/sources/registry";
import { compactCaseSummaryByArea } from "@/core/components/custom-dashboard/widgets/compactAdapters";
import { CaseSummaryByAreaHeatmapWidget } from "@/cms/components/dashboard/CaseSummaryByAreaHeatmapWidget";

export const CASE_SUMMARY_BY_AREA_HEATMAP_WIDGET_KEY = "case-summary-by-area-heatmap";

registerWidgetDefinition({
  key: CASE_SUMMARY_BY_AREA_HEATMAP_WIDGET_KEY,
  kind: "sourced",
  group: "case",
  sourceId: SOURCE_IDS.caseSummaryByArea,
  labelKey: "dashboard.custom.widgets.case_summary_by_area_heatmap.label",
  descriptionKey: "dashboard.custom.widgets.case_summary_by_area_heatmap.description",
  icon: Thermometer,
  Component: CaseSummaryByAreaHeatmapWidget,
  defaultPosition: { colSpan: 2, rowSpan: 2 },
  defaultConfig: { showHeader: true },
  configurable: ["title", "showHeader", "colSpan", "rowSpan", "displayMode"],
  compactAdapter: compactCaseSummaryByArea,
});
