// src/cms/utils/escalationRules.ts
/**
 * Schema defaults for the organization Escalation Rules section.
 *
 * SDK-free, pure helpers (same rule as orgAssignmentRules.ts): the empty state,
 * the mock stub seed, and the form all read from one place. Every default is a
 * single constant on purpose - changing one is a one-line edit.
 *
 * FE contract ahead of the backend: `GET`/`PATCH /organizations/{orgId}/escalation-rules`
 * do not exist yet. `DEFAULT_ESCALATION_RULES` is what the form shows until the
 * backend returns a stored record. See `OrgEscalationRuleSettings` in
 * `src/cms/types/escalation.ts`.
 */
import type {
  EscalationRule,
  OrgEscalationRuleSettings,
  OrgEscalationRulesUpdateData,
} from "@/cms/types/escalation";

/** CAD decision 4: warn before breach, default 80% of the SLA window. */
export const DEFAULT_WARNING_THRESHOLD_PCT = 80;

/** CAD decision 3: role-based recipients; Supervisor owns escalations (architecture doc §Roles). */
export const DEFAULT_ESCALATION_TARGET_ROLE = "Supervisor";

/** Allowed warning threshold range (percent of SLA window). */
export const WARNING_THRESHOLD_PCT_MIN = 1;
export const WARNING_THRESHOLD_PCT_MAX = 99;

/**
 * Schema-default rules, used both by the empty state (backend 404 on GET) and
 * by the mock stub's initial seed. MVP seeds one rule per well-known SLA
 * policy bucket; all disabled so escalation is opt-in per policy.
 */
export const DEFAULT_ESCALATION_RULES: readonly EscalationRule[] = [
  {
    policyId: "sla-response",
    policyName: "Response SLA",
    enabled: false,
    warningThresholdPct: DEFAULT_WARNING_THRESHOLD_PCT,
    targetRole: DEFAULT_ESCALATION_TARGET_ROLE,
  },
  {
    policyId: "sla-resolution",
    policyName: "Resolution SLA",
    enabled: false,
    warningThresholdPct: DEFAULT_WARNING_THRESHOLD_PCT,
    targetRole: DEFAULT_ESCALATION_TARGET_ROLE,
  },
];

/** A fully-populated default record for one org. */
export function buildDefaultOrgEscalationRuleSettings(
  orgId: string
): OrgEscalationRuleSettings {
  return {
    orgId,
    rules: DEFAULT_ESCALATION_RULES.map((rule) => ({ ...rule })),
  };
}

/**
 * Merges a partial PATCH body onto a full record. Used by the mock stub and by
 * the section's post-save baseline reconciliation. Rules are replaced as a
 * whole (the form always submits the complete edited list), not deep-merged.
 */
export function mergeOrgEscalationRuleSettings(
  current: OrgEscalationRuleSettings,
  data: OrgEscalationRulesUpdateData
): OrgEscalationRuleSettings {
  return {
    ...current,
    ...(data.rules ? { rules: data.rules.map((rule) => ({ ...rule })) } : {}),
  };
}

/**
 * Clamps a threshold input into the valid range. The form validates before
 * Save; this is the stub-side safety net so a bad PATCH cannot persist junk.
 */
export function clampWarningThresholdPct(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_WARNING_THRESHOLD_PCT;
  }
  return Math.min(WARNING_THRESHOLD_PCT_MAX, Math.max(WARNING_THRESHOLD_PCT_MIN, Math.round(value)));
}
