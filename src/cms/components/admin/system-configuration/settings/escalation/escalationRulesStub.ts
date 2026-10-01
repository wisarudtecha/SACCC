// Deterministic stand-in for the not-yet-built org escalation-rules endpoints.
//
// Used ONLY when VITE_MOCK_API="true" (see `useEscalationRules`). It exists so
// the Organization/System Settings -> Escalation Rules page can be built and
// demoed end-to-end before the backend (`GET`/`PATCH
// /organizations/{orgId}/escalation-rules`, contract in
// `src/cms/types/escalation.ts`) is available. It is NOT wired to any live
// data and MUST NOT be imported by production code paths.
//
// Like orgAssignmentRulesStub.ts, this keeps a session-scoped in-memory store
// keyed by orgId, so a Save inside mock mode persists for the rest of the
// session - Save appears to succeed and reopening the section shows the saved
// values.
import type {
  OrgEscalationRuleSettings,
  OrgEscalationRulesUpdateData,
} from "@/cms/types/escalation";
import {
  buildDefaultOrgEscalationRuleSettings,
  clampWarningThresholdPct,
  mergeOrgEscalationRuleSettings,
} from "@/cms/utils/escalationRules";

const store = new Map<string, OrgEscalationRuleSettings>();

/** Mirrors GET: the stored record for this org, seeded from schema defaults on first read. */
export function readOrgEscalationRulesStub(orgId: string): OrgEscalationRuleSettings {
  const existing = store.get(orgId);
  if (existing) {
    return existing;
  }
  const seeded = buildDefaultOrgEscalationRuleSettings(orgId);
  store.set(orgId, seeded);
  return seeded;
}

/** Mirrors PATCH: merge the partial body onto the stored record and persist it for the session. */
export function patchOrgEscalationRulesStub(
  orgId: string,
  data: OrgEscalationRulesUpdateData
): OrgEscalationRuleSettings {
  const current = readOrgEscalationRulesStub(orgId);
  const sanitized: OrgEscalationRulesUpdateData = data.rules
    ? {
        rules: data.rules.map((rule) => ({
          ...rule,
          warningThresholdPct: clampWarningThresholdPct(rule.warningThresholdPct),
        })),
      }
    : {};
  const merged: OrgEscalationRuleSettings = {
    ...mergeOrgEscalationRuleSettings(current, sanitized),
    updatedAt: new Date().toISOString(),
    updatedBy: "mock-session",
  };
  store.set(orgId, merged);
  return merged;
}
