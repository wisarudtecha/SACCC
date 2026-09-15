// src/cms/components/dashboard/map/heatmap/dispatchHeatmapTypes.ts
import type { Language } from "@/core/config/i18n";
import type { HeatmapPoint } from "@/cms/components/dashboard/map/heatmap/caseHeatmapPoints";

/** Shared prop contract every per-provider dispatch heatmap implements. */
export interface DispatchHeatmapProviderMapProps {
  points: HeatmapPoint[];
  isDarkTheme: boolean;
  language: Language;
}

export const DISPATCH_HEATMAP_DEFAULT_CENTER: [number, number] = [100.5018, 13.7563]; // Bangkok
export const DISPATCH_HEATMAP_DEFAULT_ZOOM = 10;
