// src/core/types/organization.ts
import type { BaseEntity } from "@/core/types";

/**
 * The row an organization write just touched, to be revealed in the hierarchy.
 *
 * An edit already knows the row id - that is what the hierarchy hands the form.
 * A create does not, because the id is assigned server-side, so it names the
 * record by its English name and is matched once the reloaded lists arrive.
 */
export interface OrganizationFocusTarget {
  level: "department" | "command" | "station";
  id?: string;
  en?: string;
}

export interface Department extends BaseEntity {
  orgId: string;
  deptId: string;
  en: string;
  th: string;
  active: boolean;
}

export interface DepartmentCreateData {
  active: boolean;
  en: string;
  th: string;
}

export interface DepartmentUpdateData {
  active: boolean;
  en: string;
  th: string;
}

export interface Command extends BaseEntity {
  orgId: string;
  deptId: string;
  commId: string;
  en: string;
  th: string;
  active: boolean;
}

export interface CommandCreateData {
  active: boolean;
  deptId: string;
  en: string;
  th: string;
}

export interface CommandUpdateData {
  active: boolean;
  deptId: string;
  en: string;
  th: string;
}

export interface Station extends BaseEntity {
  orgId: string;
  deptId: string;
  commId: string;
  stnId: string;
  en: string;
  th: string;
  active: boolean;
}

export interface StationCreateData {
  active: boolean;
  commId: string;
  deptId: string;
  en: string;
  th: string;
}

export interface StationUpdateData {
  active: boolean;
  commId: string;
  deptId: string;
  en: string;
  th: string;
}

export interface Organization {
  id: string;
  orgId: string;
  deptId: string;
  commId: string;
  stnId: string;
  stationEn: string;
  stationTh: string;
  stationActive: boolean;
  commandEn: string;
  commandTh: string;
  commandActive: boolean;
  deptEn: string;
  deptTh: string;
  deptActive: boolean;
}

/**
 * Org-scoped case settings, read from the org record.
 *
 * Currently carries one field: the fallback radius for the no-match incident
 * circle on the case map (see useOrgIncidentRadiusMeters). It is a FE contract
 * ahead of the backend - `GET /organizations/{orgId}` and the
 * `incidentRadiusMeters` column do not exist server-side yet, so the field is
 * optional and every reader falls back to DEFAULT_INCIDENT_RADIUS_METERS.
 *
 * GraphQL environments (VITE_USE_GRAPHQL="true") additionally need a
 * GQL_ORG_SETTINGS entry keyed by the exact REST url registered in
 * src/core/utils/gqlMapper.ts, since there is no REST fallback once GraphQL is on.
 */
export interface OrgSettings {
  orgId: string;
  /** Fallback radius in metres. Absent until the backend adds the column. */
  incidentRadiusMeters?: number | null;
}

export function isOrgSettings(value: unknown): value is OrgSettings {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as { orgId?: unknown }).orgId === "string"
  );
}

export interface OrganizationManagementProps {
  departments?: Department[];
  commands?: Command[];
  stations?: Station[];
  organizations?: Organization[];
  className?: string;
  filteredOrganizations?: Organization[];
  searchQuery?: string;
  setSearchQuery?: React.Dispatch<React.SetStateAction<string>>;
}

export interface OrganizationQueryParams {
  start?: number | 0;
  length?: number | 10;
}

export interface BranchLocation {
  id: string;
  name: { en: string; th: string };
  address: string;
  city: string;
  province: string;
  coordinates?: { lat: number; lon: number };
  active: boolean;
}

export interface ContactInfo {
  name: string;
  email: string;
  phone: string;
  role: string;
}

export interface IntegrationConfig {
  id: string;
  service: string;
  enabled: boolean;
  configuration: Record<string, unknown>;
  lastSync?: Date;
}

export interface WorkingHours {
  monday: { start: string; end: string; active: boolean };
  tuesday: { start: string; end: string; active: boolean };
  wednesday: { start: string; end: string; active: boolean };
  thursday: { start: string; end: string; active: boolean };
  friday: { start: string; end: string; active: boolean };
  saturday: { start: string; end: string; active: boolean };
  sunday: { start: string; end: string; active: boolean };
}

export interface PolicyDocument {
  id: string;
  title: { en: string; th: string };
  version: string;
  effectiveDate: Date;
  content: string;
  mandatory: boolean;
}

export interface ComplianceRequirement {
  id: string;
  standard: string;
  level: "required" | "recommended" | "optional";
  status: "compliant" | "non-compliant" | "pending";
  lastAudit?: Date;
  nextAudit?: Date;
}

export interface RetentionPolicy {
  cases: number; // months
  users: number; // months
  logs: number; // months
  attachments: number; // months
}

export interface AuditConfiguration {
  enabled: boolean;
  logLevel: "basic" | "detailed" | "comprehensive";
  retentionDays: number;
  alertThresholds: Record<string, number>;
}

export interface ServiceLimits {
  maxUsers: number;
  maxCasesPerMonth: number;
  maxStorageGB: number;
  maxAPICallsPerDay: number;
}

export interface BillingInfo {
  plan: string;
  status: "active" | "past_due" | "cancelled";
  nextBillingDate: Date;
  amount: number;
  currency: string;
}

export interface OrganizationProfile {
  id: string;
  orgId: string;
  organizationDetails: {
    legalName: string;
    displayName: { en: string; th: string };
    businessType: string;
    industry: string;
    size: "small" | "medium" | "large" | "enterprise";
    establishedYear: number;
    taxId: string;
    registrationNumber: string;
  };
  location: {
    headquarters: {
      address: string;
      city: string;
      province: string;
      postalCode: string;
      country: string;
      coordinates?: { lat: number; lon: number };
    };
    branches: BranchLocation[];
    timezone: string;
    locale: string;
  };
  contact: {
    primaryEmail: string;
    primaryPhone: string;
    website?: string;
    socialMedia: Record<string, string>;
    emergencyContact: ContactInfo;
  };
  configuration: {
    branding: {
      theme: "mioc" | "metthier" | "custom";
      logo?: string;
      colors: {
        primary: string;
        secondary: string;
        accent: string;
      };
      customCSS?: string;
    };
    features: {
      [key: string]: boolean;
    };
    integrations: IntegrationConfig[];
    customizations: {
      defaultLanguage: "en" | "th";
      dateFormat: string;
      timeFormat: "12h" | "24h";
      currency: string;
      workingHours: WorkingHours;
    };
  };
  governance: {
    policies: PolicyDocument[];
    compliance: ComplianceRequirement[];
    dataRetention: RetentionPolicy;
    auditSettings: AuditConfiguration;
  };
  subscription: {
    plan: "basic" | "professional" | "enterprise";
    features: string[];
    limits: ServiceLimits;
    billing: BillingInfo;
  };
  metrics: {
    totalUsers: number;
    totalCases: number;
    activeUnits: number;
    lastActivity: Date;
    systemHealth: "healthy" | "warning" | "critical";
  };
  active: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
}
