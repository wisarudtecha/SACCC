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

export interface Country {
  id: number;
  countryId: string;
  en: string;
  th: string;
  active: boolean;
  nameSpace?: string;
}

export interface AreaProvince {
  id: number;
  provId: string;
  countryId: string;
  en: string;
  th: string;
  active: boolean;
  nameSpace?: string;
}

export interface AreaDistrict {
  id: number;
  distId: string;
  provId: string;
  countryId: string;
  en: string;
  th: string;
  active: boolean;
  nameSpace?: string;
}

export interface AreaManagementProps {
  countries?: Country[];
  provinces?: AreaProvince[];
  districts?: AreaDistrict[];
  className?: string;
}

