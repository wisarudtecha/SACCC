// src/cms/utils/orgAssignmentRules.ts
/**
 * Schema defaults and the client-side check for the Assignment Rules section.
 *
 * SDK-free, pure helpers: the empty state, the mock stub seed, and the form all
 * read from one place. Every default is a single constant on purpose - changing
 * one is a one-line edit.
 *
 * STORAGE: the `assignmentRules` sub-document of `org.config.properties` (see
 * `OrgAssignmentRuleSettings` in `src/core/types/organization.ts`).
 *
 * The contract changed on 2026-11-19: the org-wide `mode`, `locationBased`,
 * `department`, `caseType` and `caseTypeSubTypes` were removed, and `unitProperty`
 * was added. Auto/manual is now per case sub-type (`assignmentMode[]`), which is a
 * document-level array and NOT part of this sub-document - see
 * `docs/ORG-SETTINGS-Assignment-Mode-Survey.md`.
 */
import type {
  OrgAssignmentRuleSettings,
  OrgAssignmentRulesUpdateData,
  RoutingModes,
} from "@/core/types/organization";

export const DEFAULT_ROUTING_MODES: RoutingModes = {
  skillBased: false,
  availability: false,
  areaBased: false,
  unitProperty: false,
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
 * Schema-default Assignment Rules: what the form shows before anything is stored,
 * and the mock stub's seed. Round robin is the simpler of the two allocation
 * methods.
 *
 * No `mode` here on purpose - the contract has none. Which side assigns (auto or
 * manual) is decided per case sub-type by `assignmentMode[]`.
 */
export const DEFAULT_ORG_ASSIGNMENT_RULES: Omit<
  OrgAssignmentRuleSettings,
  "orgId"
> = {
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

/**
 * The criteria that count as "a routing criterion".
 *
 * Deliberately excludes `combineWithAnd`, which is a modifier for two-or-more
 * criteria rather than one itself. It used to exclude `caseTypeSubTypes` too, but
 * that value list no longer exists in the contract. Keeping the list in one place
 * means the checkbox group and any future validation cannot drift apart.
 */
const ROUTING_CRITERIA_KEYS = [
  "skillBased",
  "availability",
  "areaBased",
  "unitProperty",
] as const satisfies readonly (keyof RoutingModes)[];

/**
 * Whether at least one routing criterion is selected.
 *
 * NO CALLER YET, deliberately staged. The rule that used it - "an assignment staged
 * as automatic with no criterion defines no way to route" - anchored on
 * `assignmentRules.mode`, which the 2026-11-19 contract removed. Its equivalent now
 * belongs to `assignmentMode[]` (an entry with `mode: "auto"`), which is block 2 of
 * `docs/ORG-SETTINGS-Assignment-Mode-Survey.md`. Keeping the helper and its tests
 * means that rule can return without re-deriving the criterion list - and the list
 * is the thing that must not drift from the checkbox group.
 */
export function hasRoutingCriterion(routingModes: RoutingModes): boolean {
  return ROUTING_CRITERIA_KEYS.some((key) => routingModes[key] === true);
}
