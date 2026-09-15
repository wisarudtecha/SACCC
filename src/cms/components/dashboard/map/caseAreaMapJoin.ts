// src/cms/components/dashboard/map/caseAreaMapJoin.ts
//
// Joins parsed case-summary-by-area rows to district polygon geometry, by
// `distId === feature.code` - the org boundary source builds `CODE` from
// `district.distId` directly (confirmed in boundarySource.ts), so this is a
// direct, correct join rather than a lookup through any crosswalk.
import type { CaseAreaRow } from "@/core/components/custom-dashboard/sources/types";
import type { CaseAreaGeometryFeature } from "@/cms/components/dashboard/map/caseAreaGeometry";
import { bucketForValue, type CaseAreaBuckets } from "@/cms/components/dashboard/map/caseAreaChoroplethColors";
import type { Geometry } from "geojson";

export interface CaseAreaMapFeature {
  code: string;
  nameEn: string;
  nameTh: string;
  geometry: Geometry;
  row: CaseAreaRow;
  value: number;
  bucket: number;
}

export interface CaseAreaMapJoinResult {
  joined: CaseAreaMapFeature[];
  /** Rows with no matching district geometry - no polygon has been drawn for them yet. */
  unmatchedRows: CaseAreaRow[];
}

/** Default metric: total case count for the row (new + inprogress + complete). */
export const rowTotalOf = (row: CaseAreaRow): number =>
  row.total.complete + row.total.inprogress + row.total.new;

export function joinCaseAreaRows(
  features: CaseAreaGeometryFeature[],
  rows: CaseAreaRow[],
  buckets: CaseAreaBuckets,
  metric: (row: CaseAreaRow) => number = rowTotalOf
): CaseAreaMapJoinResult {
  const featureByCode = new Map(features.map(feature => [feature.code, feature]));
  const joined: CaseAreaMapFeature[] = [];
  const unmatchedRows: CaseAreaRow[] = [];

  rows.forEach(row => {
    const feature = row.distId ? featureByCode.get(row.distId) : undefined;
    if (!feature) {
      unmatchedRows.push(row);
      return;
    }
    const value = metric(row);
    joined.push({
      code: feature.code,
      nameEn: feature.nameEn,
      nameTh: feature.nameTh,
      geometry: feature.geometry,
      row,
      value,
      bucket: bucketForValue(value, buckets),
    });
  });

  return { joined, unmatchedRows };
}
