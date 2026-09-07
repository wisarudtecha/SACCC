// src/cms/utils/orgMapSettings.ts
/**
 * Schema defaults and client-side validation for the organization Map Settings
 * section.
 *
 * SDK-free, pure helpers (same rule as incidentRadius.ts): the empty state, the
 * mock stub seed, and the form all read from one place. Every default is a single
 * constant on purpose - changing one is a one-line edit.
 *
 * FE contract ahead of the backend: `GET`/`PATCH /organizations/{orgId}/map-settings`
 * do not exist yet. `DEFAULT_ORG_MAP_SETTINGS` is what the form shows until the
 * backend returns a stored record. See `OrgMapSettings` in
 * `src/core/types/organization.ts` and `useOrgMapSettings`.
 */
import type {
  OrgMapSettings,
  OrgMapSettingsUpdateData,
} from "@/core/types/organization";
import { DEFAULT_INCIDENT_RADIUS_METERS } from "@/cms/utils/incidentRadius";

/**
 * The minimum polling interval (seconds) accepted for any staff Auto mode. Kept
 * as one constant so the validator and any help text stay in sync.
 */
export const AUTO_INTERVAL_MIN_SECONDS = 15;

/**
 * Schema-default Map Settings, used both by the empty state (backend 404 on GET)
 * and by the mock stub's initial seed. `incident.radiusMeters` reuses
 * DEFAULT_INCIDENT_RADIUS_METERS so it never drifts from the flat-shape fallback.
 */
export const DEFAULT_ORG_MAP_SETTINGS: Omit<OrgMapSettings, "orgId"> = {
  general: {
    mapProvider: null,
    defaultBasemapId: null,
    allowMapStyleChange: true,
  },
  layers: {
    showPlace: true,
    showBoundaries: true,
    showSearch: true,
    showAddressCoordinates: true,
    allowPlaceIncidentPin: true,
  },
  incident: {
    radiusMeters: DEFAULT_INCIDENT_RADIUS_METERS,
    showRadius: true,
    autoLockServiceCenterOnMatch: true,
  },
  staff: {
    showStaff: true,
    showTrail: true,
    routing: { mode: "manual", autoIntervalSeconds: null },
    etaTtl: { mode: "manual", autoIntervalSeconds: null, applyToAssignmentPicker: true },
    tracking: { mode: "manual", autoIntervalSeconds: null },
  },
  assignment: {
    showWorkload: true,
    showAssignedCases: true,
    enableRecommendRanking: true,
  },
};

/** A fully-populated default record for one org (deep clone - never share nested refs). */
export function buildDefaultOrgMapSettings(orgId: string): OrgMapSettings {
  const base = DEFAULT_ORG_MAP_SETTINGS;
  return {
    orgId,
    general: { ...base.general },
    layers: { ...base.layers },
    incident: { ...base.incident },
    staff: {
      showStaff: base.staff.showStaff,
      showTrail: base.staff.showTrail,
      routing: { ...base.staff.routing },
      etaTtl: { ...base.staff.etaTtl },
      tracking: { ...base.staff.tracking },
    },
    assignment: { ...base.assignment },
  };
}

const VALID_MAP_PROVIDERS = ["arcgis", "longdo", "maptiler"] as const;

function isValidInterval(value: number | null): boolean {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= AUTO_INTERVAL_MIN_SECONDS
  );
}

/**
 * Client-side validation, mirroring the confirmed schema rules exactly. Returns
 * an errors object keyed by dotted field path; an empty object means "valid".
 * The three staff-interval checks run on the form model, so they still block Save
 * while the "Advanced" disclosure is collapsed.
 */
export function validateOrgMapSettings(form: OrgMapSettings): Record<string, string> {
  const errors: Record<string, string> = {};

  const radius = form.incident.radiusMeters;
  if (!(typeof radius === "number" && Number.isFinite(radius) && radius > 0)) {
    errors["incident.radiusMeters"] = "settings.map.validation.radius_positive";
  }

  (["routing", "etaTtl", "tracking"] as const).forEach((key) => {
    const setting = form.staff[key];
    if (setting.mode === "auto" && !isValidInterval(setting.autoIntervalSeconds)) {
      errors[`staff.${key}.autoIntervalSeconds`] = "settings.map.validation.interval_min";
    }
  });

  const provider = form.general.mapProvider;
  if (provider !== null && !VALID_MAP_PROVIDERS.includes(provider)) {
    errors["general.mapProvider"] = "settings.map.validation.provider_invalid";
  }

  return errors;
}

/**
 * Deep-merges a partial PATCH body onto a full record (section by section, incl.
 * the nested staff auto/manual settings). Used by the mock stub and by the
 * section's post-save baseline reconciliation. Ignores the deprecated flat
 * `incidentRadiusMeters`.
 */
export function mergeOrgMapSettings(
  current: OrgMapSettings,
  data: OrgMapSettingsUpdateData
): OrgMapSettings {
  return {
    ...current,
    general: { ...current.general, ...data.general },
    layers: { ...current.layers, ...data.layers },
    incident: { ...current.incident, ...data.incident },
    staff: {
      ...current.staff,
      ...(data.staff
        ? {
            showStaff: data.staff.showStaff ?? current.staff.showStaff,
            showTrail: data.staff.showTrail ?? current.staff.showTrail,
            routing: { ...current.staff.routing, ...data.staff.routing },
            etaTtl: { ...current.staff.etaTtl, ...data.staff.etaTtl },
            tracking: { ...current.staff.tracking, ...data.staff.tracking },
          }
        : {}),
    },
    assignment: { ...current.assignment, ...data.assignment },
  };
}
