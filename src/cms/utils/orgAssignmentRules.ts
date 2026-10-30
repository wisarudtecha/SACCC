// src/cms/utils/orgAssignmentRules.ts
/**
 * Schema defaults for the organization Assignment Rules section.
 *
 * SDK-free, pure helpers: the empty state, the mock stub seed, and the form all
 * read from one place. Every default is a single constant on purpose - changing
 * one is a one-line edit.
 *
 * FE contract ahead of the backend: GET/PATCH /organizations/{orgId}/assignment-rules
 * do not exist yet. DEFAULT_ORG_ASSIGNMENT_RULES is what the form shows until the
 * backend returns a stored record. See OrgAssignmentRuleSettings in
 * src/core/types/organization.ts and useOrgAssignmentRules.
 */
import type {
  OrgAssignmentRuleSettings,
  OrgAssignmentRulesUpdateData,
  RoutingModes,
} from "@/core/types/organization";

export const DEFAULT_ROUTING_MODES: RoutingModes = {
  skillBased: false,
  locationBased: false,
  department: false,
  availability: false,
  caseType: false,
  caseTypeSubTypes: [],
  combineWithAnd: false,
};

export const DEFAULT_ADVANCED_OPTIONS = {
  serviceSubType: "general" as const,
  autoRequireAllSkills: false,
  autoRespectShiftSchedule: false,
  manualSuggestByWorkload: false,
  manualAllowOverride: true,
};

/**
 * Schema-default Assignment Rules, used both by the empty state (backend 404 on
 * GET) and by the mock stub's initial seed. "manual" mode preserves today's
 * dispatcher-driven behaviour; round robin is the simpler of the two allocation
 * methods.
 */
export const DEFAULT_ORG_ASSIGNMENT_RULES: Omit<
  OrgAssignmentRuleSettings,
  "orgId"
> = {
  mode: "manual",
  routingModes: DEFAULT_ROUTING_MODES,
  allocationMethod: "round_robin",
  advancedOptions: DEFAULT_ADVANCED_OPTIONS,
};

/** A fully-populated default record for one org. */
export function buildDefaultOrgAssignmentRuleSettings(
  orgId: string
): OrgAssignmentRuleSettings {
  return {
    orgId,
    ...DEFAULT_ORG_ASSIGNMENT_RULES,
  };
}

/**
 * Merges a partial PATCH body onto a full record. Used by the mock stub and by
 * the section's post-save baseline reconciliation.
 */
export function mergeOrgAssignmentRuleSettings(
  current: OrgAssignmentRuleSettings,
  data: OrgAssignmentRulesUpdateData
): OrgAssignmentRuleSettings {
  return {
    ...current,
    ...(data.mode ? { mode: data.mode } : {}),
    ...(data.routingModes
      ? {
          routingModes: {
            ...current.routingModes,
            ...data.routingModes,
          },
        }
      : {}),
    ...(data.allocationMethod
      ? { allocationMethod: data.allocationMethod }
      : {}),
    ...(data.advancedOptions
      ? {
          advancedOptions: {
            ...current.advancedOptions,
            ...data.advancedOptions,
          },
        }
      : {}),
  };
}
