// src/cms/components/dashboard/map/caseAreaGeometry.ts
//
// Fetches district polygon geometry for the Case Summary by Area choropleth,
// reusing the same `boundarySource` abstraction the case-creation map's
// boundary layers already consume (src/cms/components/case/createCase/map/
// boundaries/boundarySource.ts). Provider-neutral: every map SDK renderer
// consumes this module's output, not `boundarySource` directly.
//
// Deliberately assumes the ORG source's feature shape (`CODE`/`NAME_EN`/
// `NAME_TH` properties, built by `buildOrgLevels` in boundarySource.ts from
// `district.distId`). Callers must not invoke this when
// `API_CONFIG.BOUNDARY_SOURCE === "local"` - the local/government geojson
// uses a different code scheme with no crosswalk to `distId` anywhere in the
// codebase, so a "successful" fetch there would silently join the wrong data.
import { boundarySource } from "@/cms/components/case/createCase/map/boundaries/boundarySource";
import { EMPTY_BOUNDARY_SELECTION } from "@/cms/components/case/createCase/map/boundaries/boundaryTypes";
import type { Geometry } from "geojson";

export interface CaseAreaGeometryFeature {
  /** The org source's district `distId`, per boundarySource.ts's `buildOrgLevels`. */
  code: string;
  nameEn: string;
  nameTh: string;
  geometry: Geometry;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function readString(properties: Record<string, unknown> | undefined, field: string): string {
  const value = properties?.[field];
  return typeof value === "string" ? value : "";
}

/**
 * District polygons for the choropleth, keyed by `distId`.
 *
 * Selection is required by `BoundarySource.getLayerUrl`'s signature but unused
 * by either implementation's fetched payload (see boundarySource.ts's header
 * comment) - every district geometry is always returned, never a subset.
 */
export async function fetchCaseAreaDistrictFeatures(): Promise<CaseAreaGeometryFeature[]> {
  const url = await boundarySource.getLayerUrl("district", EMPTY_BOUNDARY_SELECTION);
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`District geometry request failed with ${response.status}`);
    }
    const parsed: unknown = await response.json();
    if (!isRecord(parsed) || !Array.isArray(parsed.features)) {
      return [];
    }

    return parsed.features.reduce<CaseAreaGeometryFeature[]>((features, rawFeature) => {
      if (!isRecord(rawFeature)) {
        return features;
      }
      const properties = isRecord(rawFeature.properties) ? rawFeature.properties : undefined;
      const geometry = rawFeature.geometry;
      const code = readString(properties, "CODE");
      if (!code || !isRecord(geometry)) {
        return features;
      }
      features.push({
        code,
        nameEn: readString(properties, "NAME_EN"),
        nameTh: readString(properties, "NAME_TH"),
        geometry: geometry as unknown as Geometry,
      });
      return features;
    }, []);
  }
  finally {
    boundarySource.releaseLayerUrl(url);
  }
}
