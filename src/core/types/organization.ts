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
 * Carries one field: the fallback radius for the no-match incident circle on the
 * case map. Superseded by the nested `OrgMapIncidentSettings.radiusMeters` (see
 * `useOrgIncidentMapConfig`), which is now the only runtime reader - this flat
 * shape is kept only for the old rollout window. It is a FE contract ahead of
 * the backend - `GET /organizations/{orgId}` and the `incidentRadiusMeters`
 * column do not exist server-side yet, so the field is optional and readers fall
 * back to DEFAULT_INCIDENT_RADIUS_METERS.
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

/**
 * Organization-level map configuration (the "Map Settings" section of the
 * Organization/System Settings page).
 *
 * FE contract ahead of the backend: `GET`/`PATCH /organizations/{orgId}/map-settings`
 * do not exist server-side yet. Until they ship, `useOrgMapSettings` isolates the
 * failure - a 404 / GraphQL error / bad shape all fall back to
 * `buildDefaultOrgMapSettings` (schema defaults), and Save surfaces a persistent
 * "not saved to server" banner without discarding the admin's edits. With
 * `VITE_MOCK_API="true"` a session-scoped stub backs both calls so the page is
 * fully demoable.
 *
 * GraphQL environments (`VITE_USE_GRAPHQL="true"`, which is every `.env*` here)
 * additionally need a `GQL_ORG_MAP_SETTINGS` entry keyed by the exact REST url,
 * registered in `src/core/store/api/graphql/organizationQueries.ts` and spread
 * into `GQL_MAP` (`src/core/utils/gqlMapper.ts`), since there is no REST fallback
 * once GraphQL is on. Adding it now makes the backend cut-over a no-op FE change.
 */
export type AutoManualMode = "auto" | "manual";

export interface AutoManualSetting {
  mode: AutoManualMode;
  /** Required (non-null) when mode = "auto"; should be null when mode = "manual". */
  autoIntervalSeconds: number | null;
}

export interface OrgMapGeneralSettings {
  /** Org-level override of VITE_MAP_PROVIDER. null = inherit the deployment default. */
  mapProvider: "arcgis" | "longdo" | "maptiler" | null;
  /** Initial BasemapOptionId (mapTypes.ts / basemaps.ts). null = provider default. */
  defaultBasemapId: string | null;
  /** "Change Map Style" - shows/hides the basemap switcher (AddressMapProps.showBasemapSwitcher). */
  allowMapStyleChange: boolean;
}

export interface OrgMapLayerSettings {
  /** "Show Place" - named place / POI markers. Rendered disabled in v1 (see UI section). */
  showPlace: boolean;
  /** "Show Boundaries + Polygon" - AddressMapProps.boundaries. */
  showBoundaries: boolean;
  /** "Search for locations" - AddressMapProps.showSearch. */
  showSearch: boolean;
  /** "Show Address + Coordinates" - AddressMapProps.showLocationInfo. */
  showAddressCoordinates: boolean;
  /** "Place incident location pin on the map" - enables map-click/drag pin placement. */
  allowPlaceIncidentPin: boolean;
}

export interface OrgMapIncidentSettings {
  /** Fallback circle radius, metres. Must be > 0. Supersedes the flat OrgSettings.incidentRadiusMeters. */
  radiusMeters: number;
  /** "Show Radius" - whether the fallback circle renders on the no-match path. */
  showRadius: boolean;
  /** Auto-select + lock the Service Center field on a single polygon match (capabilities.autoLockedArea). */
  autoLockServiceCenterOnMatch: boolean;
}

export interface OrgMapStaffSettings {
  /** "Show Staff" - AddressMapProps.showStaff. */
  showStaff: boolean;
  /** Breadcrumb trail toggle - AddressMapProps.showTrail. */
  showTrail: boolean;
  /** "Staff Routing Auto/Manual". */
  routing: AutoManualSetting;
  /** "Staff ETA/TTL Auto/Manual" - map staff panel AND, when applyToAssignmentPicker, singleAssignOfficer.tsx. */
  etaTtl: AutoManualSetting & { applyToAssignmentPicker: boolean };
  /** "Staff Tracking Auto/Manual" - live position/telemetry refresh. */
  tracking: AutoManualSetting;
}

export interface OrgMapAssignmentSettings {
  /** Per-officer active-case-count badge in singleAssignOfficer.tsx. */
  showWorkload: boolean;
  /** Per-officer currently-assigned-cases count + expand-to-list. */
  showAssignedCases: boolean;
  /** "Recommend" ranking toggle. */
  enableRecommendRanking: boolean;
}

/** PATCH body - every section optional so the FE can send a partial update; server merges onto the stored record. */
export interface OrgMapSettingsUpdateData {
  general?: Partial<OrgMapGeneralSettings>;
  layers?: Partial<OrgMapLayerSettings>;
  incident?: Partial<OrgMapIncidentSettings>;
  staff?: Partial<{
    showStaff: boolean;
    showTrail: boolean;
    routing: Partial<AutoManualSetting>;
    etaTtl: Partial<OrgMapStaffSettings["etaTtl"]>;
    tracking: Partial<AutoManualSetting>;
  }>;
  assignment?: Partial<OrgMapAssignmentSettings>;
  /** @deprecated use incident.radiusMeters. Kept only for the old flat-shape rollout window. */
  incidentRadiusMeters?: number | null;
}

/** GET / PATCH response `data` - always fully populated (server fills unset fields with defaults). */
export interface OrgMapSettings {
  orgId: string;
  general: OrgMapGeneralSettings;
  layers: OrgMapLayerSettings;
  incident: OrgMapIncidentSettings;
  staff: OrgMapStaffSettings;
  assignment: OrgMapAssignmentSettings;
  updatedAt?: string;
  updatedBy?: string | null;
}

export function isOrgMapSettings(value: unknown): value is OrgMapSettings {
  if (typeof value !== "object" || value === null) return false;
  const c = value as Record<string, unknown>;
  return (
    typeof c.orgId === "string" &&
    typeof c.general === "object" &&
    typeof c.layers === "object" &&
    typeof c.incident === "object" &&
    typeof c.staff === "object" &&
    typeof c.assignment === "object"
  );
}

/**
 * Organization-level assignment rules (the "Assignment Rules" section of the
 * Organization/System Settings page).
 *
 * Configuration only: an admin picks one routing method and one workload-
 * allocation method. No routing/assignment engine consumes these values yet -
 * selecting one changes nothing about how a real case is assigned. "manual" is
 * the default and preserves today's dispatcher-driven behaviour.
 *
 * FE contract ahead of the backend: `GET`/`PATCH /organizations/{orgId}/assignment-rules`
 * do not exist server-side yet. Until they ship, `useOrgAssignmentRules` isolates
 * the failure - a 404 / GraphQL error / bad shape all fall back to
 * `buildDefaultOrgAssignmentRuleSettings` (schema defaults), and Save surfaces a
 * persistent "not saved to server" banner without discarding the admin's edits.
 * With `VITE_MOCK_API="true"` a session-scoped stub backs both calls so the page
 * is fully demoable.
 *
 * GraphQL environments (`VITE_USE_GRAPHQL="true"`, which is every `.env*` here)
 * additionally need the matching entry keyed by the exact REST url, registered in
 * `src/core/store/api/graphql/organizationQueries.ts` (spread into `GQL_MAP` via
 * `...GQL_ORGANIZATION`), since there is no REST fallback once GraphQL is on.
 * Adding it now makes the backend cut-over a no-op FE change.
 */
export type RoutingMethod =
  | "manual"
  | "skill_based"
  | "location_based"
  | "department"
  | "availability"
  | "case_type";

export type AllocationMethod = "round_robin" | "load_balance";

/** Routing methods in display order (also the type-guard whitelist). */
export const ROUTING_METHODS: readonly RoutingMethod[] = [
  "manual",
  "skill_based",
  "location_based",
  "department",
  "availability",
  "case_type",
];

/** Allocation methods in display order (also the type-guard whitelist). */
export const ALLOCATION_METHODS: readonly AllocationMethod[] = [
  "round_robin",
  "load_balance",
];

/** PATCH body - both fields optional so the FE can send a partial update; server merges onto the stored record. */
export interface OrgAssignmentRulesUpdateData {
  routingMethod?: RoutingMethod;
  allocationMethod?: AllocationMethod;
}

/** GET / PATCH response `data` - always fully populated (server fills unset fields with defaults). */
export interface OrgAssignmentRuleSettings {
  orgId: string;
  /** The active routing method. "manual" = no automatic routing (default). */
  routingMethod: RoutingMethod;
  /** The active workload-distribution method. */
  allocationMethod: AllocationMethod;
  updatedAt?: string;
  updatedBy?: string | null;
}

export function isOrgAssignmentRuleSettings(
  value: unknown
): value is OrgAssignmentRuleSettings {
  if (typeof value !== "object" || value === null) return false;
  const c = value as Record<string, unknown>;
  return (
    typeof c.orgId === "string" &&
    ROUTING_METHODS.includes(c.routingMethod as RoutingMethod) &&
    ALLOCATION_METHODS.includes(c.allocationMethod as AllocationMethod)
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
