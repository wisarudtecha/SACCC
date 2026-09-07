// src/cms/utils/orgAssignmentRules.ts
/**
 * Schema defaults for the organization Assignment Rules section.
 *
 * SDK-free, pure helpers (same rule as orgMapSettings.ts): the empty state, the
 * mock stub seed, and the form all read from one place. Every default is a single
 * constant on purpose - changing one is a one-line edit.
 *
 * FE contract ahead of the backend: `GET`/`PATCH /organizations/{orgId}/assignment-rules`
 * do not exist yet. `DEFAULT_ORG_ASSIGNMENT_RULES` is what the form shows until
 * the backend returns a stored record. See `OrgAssignmentRuleSettings` in
 * `src/core/types/organization.ts` and `useOrgAssignmentRules`.
 *
 * There is no `validate*` helper: both fields are enum selects whose value is
 * always a valid member, so there is nothing to check before Save.
 */
import type {
  OrgAssignmentRuleSettings,
  OrgAssignmentRulesUpdateData,
} from "@/core/types/organization";

/**
 * Schema-default Assignment Rules, used both by the empty state (backend 404 on
 * GET) and by the mock stub's initial seed. "manual" routing preserves today's
 * dispatcher-driven behaviour; round robin is the simpler of the two allocation
 * methods.
 */
export const DEFAULT_ORG_ASSIGNMENT_RULES: Omit<OrgAssignmentRuleSettings, "orgId"> = {
  routingMethod: "manual",
  allocationMethod: "round_robin",
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
    ...(data.routingMethod ? { routingMethod: data.routingMethod } : {}),
    ...(data.allocationMethod ? { allocationMethod: data.allocationMethod } : {}),
  };
}
