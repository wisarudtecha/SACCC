// /src/types/area.ts
export interface AreaCoverage {
  areaId: string;
  unitId: string;
  unitName: string;
  primaryResponder: boolean;
  backupLevel: number;
  averageResponseTime: number;
  effectivenessScore: number;
  capacity: {
    current: number;
    maximum: number;
    reserved: number;
  };
}

export interface ResponseArea {
  id: string;
  orgId: string;
  areaCode: string;
  areaName: { en: string; th: string };
  geometry: {
    type: "Polygon" | "Circle" | "Custom";
    coordinates: number[][];
    radius?: number;
    bounds: {
      north: number;
      south: number;
      east: number;
      west: number;
    };
  };
  priority: number;
  population: number;
  riskLevel: "low" | "medium" | "high" | "critical";
  responseTimeTarget: number; // minutes
  active: boolean;
  metadata: {
    urbanDensity: number;
    accessibilityScore: number;
    trafficComplexity: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ResponseMetrics {
  areaId?: string;
  totalCases?: number;
  averageResponseTime?: number | string;
  slaCompliance?: number | string;
  activeIncidents?: number;
  availableUnits?: number;
  demandTrend?: "up" | "down" | "stable";
}

export interface AreaResponse {
  subdistrict_id: number;
  district_id: number;
  province_id: number;
  subdistrict_thai: string;
  subdistrict_english: string;
  district_thai: string;
  district_english: string;
  province_thai: string;
  province_english: string;
  zip_code: number;
  label: string;
}


export interface Province {
  id: number;
  code: number;
  name_in_thai: string;
  name_in_english: string;
}



export interface District extends Province {
  province_id: number;
}


export interface Subdistrict extends Province {
  district_id: number;
  zip_code: number;
}

// ===================================================================
// Shared geography / provenance primitives
// ===================================================================
// Used by both the org-level area records below and the area-template
// records in @/cms/types/areaTemplate.

/**
 * Polygon rings, GeoJSON-ordered: [ ring ][ point ][ lng, lat ].
 * Distinct from ResponseArea.geometry.coordinates above (number[][]), which
 * models a single unclosed ring for the legacy mock area designer.
 */
export type PolygonCoordinates = number[][][];

/** Row provenance returned by the newer area / area-template read endpoints. */
export interface AreaAuditFields {
  createdAt?: string | null;
  updatedAt?: string | null;
  createdBy?: string | null;
  updatedBy?: string | null;
}

// ===================================================================
// Country / Province / District hierarchy CRUD (Area Management)
// ===================================================================
// Named Country*/AreaProvince*/AreaDistrict* (not bare Province*/District*)
// to avoid colliding with the unrelated Province/District/Subdistrict
// address-lookup types above, which model a different API.

export interface CountryCreateData {
  active: boolean;
  countryId: string;
  en: string;
  nameSpace: string;
  th: string;
}

export interface CountryUpdateData extends CountryCreateData {
  id: number;
}

export interface AreaProvinceCreateData {
  active: boolean;
  countryId: string;
  en: string;
  nameSpace: string;
  provId: string;
  th: string;
}

export interface AreaProvinceUpdateData extends AreaProvinceCreateData {
  id: number;
}

export interface AreaDistrictCreateData {
  active: boolean;
  countryId: string;
  distId: string;
  en: string;
  nameSpace: string;
  provId: string;
  th: string;
}

export interface AreaDistrictUpdateData extends AreaDistrictCreateData {
  id: number;
}

// ===================================================================
// Country / Province / District list records
// ===================================================================
// Returned by the dedicated /area/countries, /area/provinces, /area/districts
// list endpoints (distinct from the merged /area/country_province_districts
// rows in store/api/area.ts's `Area`, and from the address-lookup
// Province/District above) - each carries its own real numeric `id`.

// The geometry/provenance fields below are read-only: the org-level write
// inputs (AreaCountryInput / AreaProvinceInput / AreaDistrictInput) carry no
// coordinates, so an org area only gains geometry by being created from, or
// synced with, an area template - see @/cms/types/areaTemplate.

export interface Country extends AreaAuditFields {
  id: number;
  countryId: string;
  en: string;
  th: string;
  active: boolean;
  nameSpace?: string;
  coordinates?: PolygonCoordinates | null;
  yearOfData?: number | null;
  shapeArea?: number | null;
  shapeLength?: number | null;
}

export interface AreaProvince extends AreaAuditFields {
  id: number;
  provId: string;
  countryId: string;
  en: string;
  th: string;
  active: boolean;
  nameSpace?: string;
  coordinates?: PolygonCoordinates | null;
}

export interface AreaDistrict extends AreaAuditFields {
  id: number;
  distId: string;
  provId: string;
  countryId: string;
  en: string;
  th: string;
  active: boolean;
  nameSpace?: string;
  postcode?: string | null;
  coordinates?: PolygonCoordinates | null;
}

// AreaManagementProps used to live here, describing the three flat arrays the
// area page passed down. The page now fetches nested trees instead, and the
// component owns its own prop type - see
// components/admin/system-configuration/area/AreaManagement.tsx.


// ===================================================================
// Nested area tree (cached, join-free)
// ===================================================================
// Returned by GetOrgCountryTree (GET /area/countries/{id}/tree) and, with the
// same node shape, by GetTemplateCountryTree. Deliberately not reusing the
// list-record types above: the cached tree payload omits nameSpace, the
// parent-id columns and the audit fields, and nests children instead.

export interface AreaTreeDistrictNode {
  id: number;
  distId: string;
  en: string;
  th: string;
  active: boolean;
  postcode?: string | null;
  coordinates?: PolygonCoordinates | null;
}

export interface AreaTreeProvinceNode {
  id: number;
  provId: string;
  en: string;
  th: string;
  active: boolean;
  coordinates?: PolygonCoordinates | null;
  districts: AreaTreeDistrictNode[];
}

export interface AreaCountryTree {
  id: number;
  countryId: string;
  en: string;
  th: string;
  active: boolean;
  coordinates?: PolygonCoordinates | null;
  yearOfData?: number | null;
  shapeArea?: number | null;
  shapeLength?: number | null;
  provinces: AreaTreeProvinceNode[];
}

/**
 * GetOrgCountryTree (GET /api/v1/area/countries/{id}/tree).
 *
 * Identical to AreaCountryTree - confirmed against the --response-body in
 * src/cms/mocks/areaCURL.sh. An org tree carries no version and no status;
 * those are template-lineage fields and appear only on TemplateCountryTree.
 * The alias exists so call sites read as what they fetch.
 */
export type OrgCountryTree = AreaCountryTree;
