// src/cms/components/dashboard/map/heatmap/caseHeatmapPoints.ts
//
// Pure transform: case records -> weighted lat/lon points for the incident-density
// heatmap. Kept separate from any map provider so it is unit-testable without a
// DOM/WebGL/ArcGIS runtime, matching this repo's existing pure-logic test pattern
// (see pointInPolygon.test.ts, incidentRadius.test.ts).
import type { Case } from "@/cms/store/api/caseApi";

export interface HeatmapPoint {
  caseId: string;
  lat: number;
  lon: number;
  /**
   * Case.priority (lower is more urgent in this codebase's convention is not assumed
   * here - only that it is a small integer scale) clamped into a 1-3 weight, so one
   * outlier priority value can't make the whole gradient collapse to a single point.
   */
  weight: number;
}

const MIN_WEIGHT = 1;
const MAX_WEIGHT = 3;

const clampWeight = (priority: number): number =>
  Math.min(MAX_WEIGHT, Math.max(MIN_WEIGHT, priority));

/**
 * Drops cases with missing/non-numeric coordinates, or sitting exactly at (0, 0)
 * (the common bad-geocode sentinel) - a case should disappear from the heatmap
 * rather than render as a false hotspot off the coast of West Africa.
 */
export const toHeatmapPoints = (cases: Case[]): HeatmapPoint[] =>
  cases.reduce<HeatmapPoint[]>((points, caseRecord) => {
    const lat = Number(caseRecord.caseLat);
    const lon = Number(caseRecord.caseLon);
    if (!Number.isFinite(lat) || !Number.isFinite(lon) || (lat === 0 && lon === 0)) {
      return points;
    }
    points.push({
      caseId: caseRecord.caseId,
      lat,
      lon,
      weight: clampWeight(caseRecord.priority),
    });
    return points;
  }, []);
