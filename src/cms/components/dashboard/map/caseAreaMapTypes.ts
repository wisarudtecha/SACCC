// src/cms/components/dashboard/map/caseAreaMapTypes.ts
import type { Language } from "@/core/config/i18n";
import type { CaseAreaMapFeature } from "@/cms/components/dashboard/map/caseAreaMapJoin";
import type { CaseAreaBuckets } from "@/cms/components/dashboard/map/caseAreaChoroplethColors";

/** Shared prop contract every per-provider choropleth map implements. */
export interface CaseAreaChoroplethProviderMapProps {
  features: CaseAreaMapFeature[];
  buckets: CaseAreaBuckets;
  isDarkTheme: boolean;
  language: Language;
  /** Pixel height of the map container. Defaults to CASE_AREA_MAP_DEFAULT_HEIGHT. */
  height?: number;
}

export const CASE_AREA_MAP_DEFAULT_CENTER: [number, number] = [100.5018, 13.7563]; // Bangkok
export const CASE_AREA_MAP_DEFAULT_ZOOM = 10;
/** Correct for the standalone Case Summary by Area page; widget-tile callers pass a smaller value. */
export const CASE_AREA_MAP_DEFAULT_HEIGHT = 520;
