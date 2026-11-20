// Deterministic stand-in for the org settings document's assignment half.
//
// Used ONLY when VITE_MOCK_API="true" (see useOrgConfigProperties, which composes
// this stub and orgMapSettingsStub into one document). It exists so the
// Organization/System Settings -> Assignment Rules section can be demoed without a
// backend. It is NOT wired to any live data and MUST NOT be imported by production
// code paths.
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
export function readOrgAssignmentRulesStub(
  orgId: string
): OrgAssignmentRuleSettings {
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
