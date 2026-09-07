// Deterministic stand-in for the not-yet-built org assignment-rules endpoints.
//
// Used ONLY when VITE_MOCK_API="true" (see `useOrgAssignmentRules`). It exists so
// the Organization/System Settings -> Assignment Rules page can be built and
// demoed end-to-end before the backend (`GET`/`PATCH
// /organizations/{orgId}/assignment-rules`, contract in
// `src/core/types/organization.ts`) is available. It is NOT wired to any live
// data and MUST NOT be imported by production code paths.
//
// Like orgMapSettingsStub.ts, this keeps a session-scoped in-memory store keyed
// by orgId, so a Save inside mock mode persists for the rest of the session -
// Save appears to succeed and reopening the section shows the saved values.
import type {
  OrgAssignmentRuleSettings,
  OrgAssignmentRulesUpdateData,
} from "@/core/types/organization";
import {
  buildDefaultOrgAssignmentRuleSettings,
  mergeOrgAssignmentRuleSettings,
} from "@/cms/utils/orgAssignmentRules";

const store = new Map<string, OrgAssignmentRuleSettings>();

/** Mirrors GET: the stored record for this org, seeded from schema defaults on first read. */
export function readOrgAssignmentRulesStub(orgId: string): OrgAssignmentRuleSettings {
  const existing = store.get(orgId);
  if (existing) {
    return existing;
  }
  const seeded = buildDefaultOrgAssignmentRuleSettings(orgId);
  store.set(orgId, seeded);
  return seeded;
}

/** Mirrors PATCH: merge the partial body onto the stored record and persist it for the session. */
export function patchOrgAssignmentRulesStub(
  orgId: string,
  data: OrgAssignmentRulesUpdateData
): OrgAssignmentRuleSettings {
  const current = readOrgAssignmentRulesStub(orgId);
  const merged: OrgAssignmentRuleSettings = {
    ...mergeOrgAssignmentRuleSettings(current, data),
    updatedAt: new Date().toISOString(),
    updatedBy: "mock-session",
  };
  store.set(orgId, merged);
  return merged;
}
