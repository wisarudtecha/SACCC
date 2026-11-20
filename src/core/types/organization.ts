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
 * Organization-level map configuration - the `mapSettings` sub-document of the
 * `org.config.properties` config property (the "Map Settings" section of the
 * Organization/System Settings page).
 *
 * STORAGE: one JSON document per organisation lives in `public.config_properties`
 * under `propKey = "org.config.properties"`, holding `{ mapSettings,
 * assignmentRules }`. It is read/written through the BFF's `ConfigProperty`
 * operations (`GetConfigPropertyByKey` / `SetConfigPropertyByKey` - see
 * `src/core/store/api/configPropertyApi.ts` and
 * `src/core/store/api/graphql/configPropertyQueries.ts`).
 *
 * `orgId` is NOT part of the stored document (it is a column on the row, and the
 * BFF scopes every call by the caller's token). The client fills it in so the
 * section components and the existing `useOrgMapSettings` consumers keep one
 * record shape - it is stripped again before a write
 * (`encodeOrgConfigProperties`).
 *
 * Until the key exists, `GetConfigPropertyByKey` answers `status: "-1"` with
 * `data: null`, which the hybrid base query turns into a real RTK error. That is
 * "nothing saved yet", not "broken", so the reader falls back to
 * `buildDefaultOrgMapSettings` and Save (an upsert) creates the record.
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

/**
 * Shape guard for one `mapSettings` section.
 *
 * `orgId` is deliberately NOT required: the stored document does not carry it
 * (it is a column on the config-properties row), so requiring it here made every
 * real payload fail the guard and silently fall back to schema defaults.
 * `Array.isArray` is excluded because `normalizeToApiResponse` coerces a missing
 * payload to `[]`, which is an object to `typeof`.
 */
export function isOrgMapSettings(value: unknown): value is OrgMapSettings {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  const c = value as Record<string, unknown>;
  return (
    typeof c.general === "object" &&
    c.general !== null &&
    typeof c.layers === "object" &&
    c.layers !== null &&
    typeof c.incident === "object" &&
    c.incident !== null &&
    typeof c.staff === "object" &&
    c.staff !== null &&
    typeof c.assignment === "object" &&
    c.assignment !== null
  );
}

/**
 * Organization-level assignment rules - the `assignmentRules` sub-document of
 * the `org.config.properties` config property (the "Assignment Rules" section of
 * the Organization/System Settings page).
 *
 * Configuration only: an admin selects routing criteria and chooses a
 * workload-allocation method. No routing/assignment engine consumes these values
 * yet.
 *
 * Stored in the same JSON document as the map settings - see the storage note on
 * `OrgMapSettings`. `orgId` is filled in by the client, not stored.
 */

/**
 * RETIRED 2026-11-19 - kept as a record, deliberately not used by any field.
 *
 * The org-wide Automatic/Manual switch was removed from the stored contract
 * (`assignmentRules.mode`). Auto/manual is now decided PER CASE SUB-TYPE by
 * `assignmentMode[]` - see docs/ORG-SETTINGS-Assignment-Mode-Survey.md. Do not
 * re-introduce a field of this type without that review: two places deciding "who
 * assigns" is the ambiguity the contract change removed.
 */
export type AssignmentMode = "automatic" | "manual";

export type AllocationMethod = "round_robin" | "load_balance";

/**
 * Routing criteria.
 *
 * The stored contract changed on 2026-11-19: `locationBased`, `department`,
 * `caseType` and `caseTypeSubTypes` were removed, and `unitProperty` was added
 * (docs/ORG-SETTINGS-Assignment-Mode-Survey.md §1). The retired keys are
 * deliberately NOT kept here - a typed field the contract no longer has gets
 * written back on every Save, which is the drift this change exists to stop.
 * If they return, restore them from that document instead of guessing the shape.
 */
export interface RoutingModes {
  skillBased: boolean;
  availability: boolean;
  /** "Area Based" criterion. */
  areaBased: boolean;
  /**
   * "Unit Property" criterion - matches an officer by the properties configured on
   * the unit (`GET /mdm/units/properties/{unitId}`). The payload carries a plain
   * boolean (decision U7): which property/value to match on is the backend's
   * business, so no value list belongs in this type.
   */
  unitProperty: boolean;
  /** When true, selected criteria are combined with AND; otherwise OR. */
  combineWithAnd: boolean;
}

/** Allocation methods in display order (also the type-guard whitelist). */
export const ALLOCATION_METHODS: readonly AllocationMethod[] = [
  "round_robin",
  "load_balance",
];

/** Service sub-types for advanced assignment options. */
export type ServiceSubType = "general" | "emergency" | "maintenance" | "inspection";

/**
 * The values above in display order, so a control can iterate them instead of
 * hard-coding the list (the stored document already carries `serviceSubType`; it
 * had no editor until Phase 2).
 */
export const SERVICE_SUB_TYPES: readonly ServiceSubType[] = [
  "general",
  "emergency",
  "maintenance",
  "inspection",
];

/**
 * Advanced options. Org-level by decision U8 - they stay here even though
 * auto/manual itself moved to `assignmentMode[]`; `serviceSubType` is what scopes
 * a set of options to one service category.
 */
export interface AdvancedAssignmentOptions {
  serviceSubType: ServiceSubType;
  autoRequireAllSkills: boolean;
  autoRespectShiftSchedule: boolean;
  manualSuggestByWorkload: boolean;
  manualAllowOverride: boolean;
}

/** PATCH body - fields optional so the FE can send a partial update; server merges onto the stored record. */
export interface OrgAssignmentRulesUpdateData {
  routingModes?: Partial<RoutingModes>;
  allocationMethod?: AllocationMethod;
  advancedOptions?: Partial<AdvancedAssignmentOptions>;
}

/** GET / PATCH response data - always fully populated (server fills unset fields with defaults). */
export interface OrgAssignmentRuleSettings {
  orgId: string;
  /** Active routing criteria. Which criteria apply is no longer gated by an org mode. */
  routingModes: RoutingModes;
  /** The active workload-distribution method. */
  allocationMethod: AllocationMethod;
  /** Advanced options (org-level - decision U8). */
  advancedOptions: AdvancedAssignmentOptions;
  updatedAt?: string;
  updatedBy?: string | null;
}

/**
 * Shape guard for one `assignmentRules` section, matching the 2026-11-19 contract:
 * no `mode`, and the four criteria that were retired are not required.
 *
 * `orgId` is not required (the stored document does not carry it - see the same
 * note on `isOrgMapSettings`), and `areaBased` / `unitProperty` are tolerated as
 * absent because a record saved before they existed is still a valid shape; the
 * decoder fills their defaults.
 */
export function isOrgAssignmentRuleSettings(
  value: unknown
): value is OrgAssignmentRuleSettings {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  const c = value as Record<string, unknown>;
  const allocation = c.allocationMethod as AllocationMethod;
  const routingModes = c.routingModes as Record<string, unknown> | undefined;
  const optionalBoolean = (candidate: unknown) =>
    candidate === undefined || typeof candidate === "boolean";
  return (
    ALLOCATION_METHODS.includes(allocation) &&
    typeof routingModes === "object" &&
    routingModes !== null &&
    typeof routingModes.skillBased === "boolean" &&
    typeof routingModes.availability === "boolean" &&
    typeof routingModes.combineWithAnd === "boolean" &&
    optionalBoolean(routingModes.areaBased) &&
    optionalBoolean(routingModes.unitProperty)
  );
}

/**
 * One row of `public.config_properties` as the BFF returns it.
 *
 * `propVal` is stored as TEXT server-side and comes back either decoded (when the
 * text is JSON) or as a plain string (when it is not) - see `ConfigPropVal` in
 * `src/core/mocks/config_property.go`. It is typed `unknown` on purpose: reading it
 * as `object` would let a legacy string-valued row type-check and then throw.
 * Always go through `decodePropVal` (`src/cms/utils/orgConfigProperties.ts`).
 *
 * `id` is `number | string` because the REST resource reports an int64 while
 * GraphQL models it as `ID`; nothing here reads it yet, it is only used for
 * create/update/delete by id.
 */
export interface ConfigPropertyRow {
  id?: number | string;
  orgId?: string;
  propKey: string;
  propVal?: unknown;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string | null;
  updatedBy?: string | null;
}

/** Shape guard - `Array.isArray` is excluded because `[]` is an object to `typeof`. */
export function isConfigPropertyRow(value: unknown): value is ConfigPropertyRow {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  return typeof (value as { propKey?: unknown }).propKey === "string";
}

/**
 * The two stages an assignment mode can be set for (decision U1).
 *
 * `pic` = the step that decides who the responsible person (PIC) is.
 * `assignment` = the step that assigns the case itself.
 * They are separate stages, not two views of the same value.
 */
export type AssignmentModeTarget = "pic" | "assignment";

/**
 * The token used in the STORED document - note the spelling differs from the
 * retired org-wide `AssignmentMode` (`"automatic"`); reusing that type here would
 * fail validation on a real payload.
 */
export type AssignmentModeToken = "auto" | "manual";

/**
 * One entry of the document-level `assignmentMode` array: a set of case sub-types
 * (`sTypeId`) that share a mode, for one stage.
 *
 * A sub-type with no entry for a stage means "not set" - there is no org-wide
 * default to inherit any more (decision U2: this array replaced
 * `assignmentRules.mode`), so the UI must be able to express absence.
 */
export interface AssignmentModeEntry {
  type: AssignmentModeTarget;
  mode: AssignmentModeToken;
  /** `CaseTypeSubType.sTypeId` values. */
  caseSubTypes: string[];
}

/** Display/validation order for the tokens and targets (also the whitelists). */
export const ASSIGNMENT_MODE_TOKENS: readonly AssignmentModeToken[] = ["auto", "manual"];

export const ASSIGNMENT_MODE_TARGETS: readonly AssignmentModeTarget[] = [
  "pic",
  "assignment",
];

/**
 * The whole organization settings document, as stored under one config property.
 *
 * Read and written as ONE value (`GetConfigPropertyByKey` / `SetConfigPropertyByKey`),
 * because that is how the backend stores it - the sections are not separate records.
 * `orgId` is carried here so a decoded document can be matched to the session that
 * read it; it is never written to the server (see `encodeOrgConfigProperties`).
 */
export interface OrgConfigPropertiesDoc {
  orgId: string;
  mapSettings: OrgMapSettings;
  assignmentRules: OrgAssignmentRuleSettings;
  /**
   * Assignment mode per case sub-type (added to the contract 2026-11-19). Replaces
   * the retired org-wide `assignmentRules.mode`.
   */
  assignmentMode: AssignmentModeEntry[];
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
  // Superseded by @/core/types/entitlement (TenantEntitlements) — kept for
  // org-profile compatibility; do not build new entitlement logic on this stub.
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
