// /src/types/unit.ts
import type { Area} from "@/cms/store/api/area";
import type { BaseEntity } from "@/core/types";
import type { Department, Command, Station } from "@/core/types/organization";
import type { UserProfile } from "@/core/types/user";

export interface EnhancedUnit extends BaseEntity {
  orgId: string;
  unitId: string;
  unitName: string;
  unitSourceId: string;
  unitTypeId: string;
  priority: number;
  compId: string;
  deptId: string;
  commId: string;
  stnId: string;
  plateNo: string;
  provinceCode: string;
  active: boolean;
  username: string;
  isLogin: boolean;
  isFreeze: boolean;
  isOutArea: boolean;
  locLat: number;
  locLon: number;
  locAlt: number;
  locBearing: number;
  locSpeed: number;
  locProvider: string;
  locGpsTime: string;
  locSatellites: number;
  locAccuracy: number;
  locLastUpdateTime: string;
  breakDuration: number;
  healthChk: string;
  healthChkTime: string;
  sttId: string;
  // Enhanced fields for advanced management
  unitStructure?: {
    parentUnitId?: string;
    subUnits: string[];
    organizationLevel: number;
    unitType: "department" | "team" | "squad" | "individual";
    reportingStructure: string[];
  };
  operational?: {
    capacity: {
      maxPersonnel: number;
      currentPersonnel: number;
      availablePersonnel: number;
      utilizationRate: number;
    };
    availability: {
      status: "available" | "busy" | "maintenance" | "offline";
      schedule: string;
      nextAvailable: string;
    };
    equipment: {
      vehicles: string[];
      specializedEquipment: string[];
      maintenanceStatus: "good" | "needs_attention" | "critical";
    };
    specializations: string[];
    responseArea: string[];
  };
  performance?: {
    responseMetrics: {
      averageResponseTime: number;
      slaCompliance: number;
      casesHandled: number;
      successRate: number;
    };
    workloadDistribution: {
      currentCases: number;
      averageCaseLoad: number;
      peakCapacity: number;
    };
    efficiency: {
      productivityScore: number;
      resourceUtilization: number;
      costEfficiency: number;
    };
  };
}

export interface Unit extends BaseEntity {
  orgId: string;
  unitId: string;
  unitName: string;
  unitSourceId: string;
  unitTypeId: string;
  priority: number;
  compId: string;
  deptId: string;
  commId: string;
  stnId: string;
  plateNo: string;
  provinceCode: string;
  active: boolean;
  username: string;
  isLogin: boolean;
  isFreeze: boolean;
  isOutArea: boolean;
  locLat: number;
  locLon: number;
  locAlt: number;
  locBearing: number;
  locSpeed: number;
  locProvider: string;
  locGpsTime: string;
  locSatellites: number;
  locAccuracy: number;
  locLastUpdateTime: string;
  breakDuration: number;
  healthChk: string;
  healthChkTime: string;
  sttId: string;
}

export interface UnitFormData {
  active: boolean;
  breakDuration?: number;
  commId: string;
  compId: string;
  deptId: string;
  healthChk?: string;
  healthChkTime?: string;
  isFreeze?: boolean;
  isLogin?: boolean;
  isOutArea?: boolean;
  locAccuracy?: number;
  locAlt?: number;
  locBearing?: number;
  locGpsTime?: string;
  locLastUpdateTime?: string;
  locLat?: number;
  locLon?: number;
  locProvider?: string;
  locSatellites?: number;
  locSpeed?: number;
  orgId?: string;
  plateNo?: string;
  priority: number;
  provinceCode?: string;
  stnId: string;
  sttId?: string;
  unitId: string;
  unitName: string;
  unitSourceId: string;
  unitTypeId: string;
  username: string;
}

export interface UnitFormProps {
  areas?: Area[];
  commands?: Command[];
  companies?: Company[];
  departments?: Department[];
  id?: number;
  initialData?: Partial<UnitFormData>;
  isLoading?: boolean;
  mode?: "create" | "update";
  sources: Source[];
  stations: Station[];
  unitTypes: UnitType[];
  users: UserProfile[];
  onCancel?: () => void;
  onSubmit: (data: UnitFormData, id?: number) => Promise<void>;
}

export interface UnitMetrics {
  activeUnits: number | string;
  avgResponse: number | string;
  slaCompliance: number | string;
  totalCases: number | string;
}

export interface UnitQueryParams {
  start?: number | 0;
  length?: number | 10;
}

// export type UnitUpdateData = Omit<Unit, keyof BaseEntity>;
export type UnitUpdateData = Omit<UnitFormData, keyof BaseEntity>;

export type ViewMode = "overview" | "hierarchy" | "performance" | "matrix";
export type DisplayMode = "cards" | "table";

export interface UnitStatus extends BaseEntity {
  sttId: string;
  sttName: string;
}

export interface UnitStatusQueryParams {
  start?: number | 0;
  length?: number | 10;
}

export interface UnitType extends BaseEntity {
  unitTypeId: string;
  orgId: string;
  en: string;
  th: string;
  active: boolean;
}

export interface UnitTypeQueryParams {
  start?: number | 0;
  length?: number | 10;
}

export interface CompanyAddress {
  building: string;
  country: string;
  district: string;
  floor: string;
  postalCode: string;
  province: string;
  road: string;
  street: string;
  subDistrict: string;
}

export interface Company extends BaseEntity {
  name: string;
  legalName: string;
  domain: string;
  email: string;
  phoneNumber: string;
  address: CompanyAddress;
  logoUrl: string;
  websiteUrl: string;
  description: string;
}

export interface CompanyQueryParams {
  start?: number | 0;
  length?: number | 10;
}

export interface Property {
  id: string;
  propId: string;
  orgId: string;
  en: string;
  th: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
}

export interface PropertyQueryParams {
  start?: number | 0;
  length?: number | 10;
}

// Params for GET /mdm/units/properties/{unitId} - `id` is the unitId business code
// (e.g. "UNIT-001"), matching the GraphQL GetMdmUnitPropById input field name.
export interface UnitPropertyQueryParams {
  id: string;
  start?: number | 0;
  length?: number | 100;
}

export interface PropertyCreateData {
  active: boolean;
  en: string;
  th: string;
}

export interface PropertyUpdateData {
  active: boolean;
  en: string;
  th: string;
}

export interface PropertyManagementProps {
  properties?: Property[];
}

export interface PropertyMetrics {
  totalProperties: number | string;
  activeProperties: number | string;
  inactiveProperties: number | string;
}

export interface Source extends BaseEntity {
  unitSourceId: string;
  orgId: string;
  en: string;
  th: string;
  active: boolean;
}

export interface SourceQueryParams {
  start?: number | 0;
  length?: number | 10;
}
