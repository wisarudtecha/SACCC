// Deterministic stand-in for the not-yet-built org map-settings endpoints.
//
// Used ONLY when VITE_MOCK_API="true" (see `useOrgMapSettings`). It exists so the
// Organization/System Settings -> Map Settings page can be built and demoed
// end-to-end before the backend (`GET`/`PATCH /organizations/{orgId}/map-settings`,
// contract in `src/core/types/organization.ts`) is available. It is NOT wired to
// any live data and MUST NOT be imported by production code paths.
//
// Unlike unitWorkloadStub.ts (a pure function), this keeps a session-scoped
// in-memory store keyed by orgId, so a Save inside mock mode persists for the
// rest of the session - Save appears to succeed and reopening the section shows
// the saved values.
import type {
  OrgMapSettings,
  OrgMapSettingsUpdateData,
} from "@/core/types/organization";
import {
  buildDefaultOrgMapSettings,
  mergeOrgMapSettings,
} from "@/cms/utils/orgMapSettings";

const store = new Map<string, OrgMapSettings>();

/** Mirrors GET: the stored record for this org, seeded from schema defaults on first read. */
export function readOrgMapSettingsStub(orgId: string): OrgMapSettings {
  const existing = store.get(orgId);
  if (existing) {
    return existing;
  }
  const seeded = buildDefaultOrgMapSettings(orgId);
  store.set(orgId, seeded);
  return seeded;
}

/** Mirrors PATCH: deep-merge the partial body onto the stored record and persist it for the session. */
export function patchOrgMapSettingsStub(
  orgId: string,
  data: OrgMapSettingsUpdateData
): OrgMapSettings {
  const current = readOrgMapSettingsStub(orgId);
  const merged: OrgMapSettings = {
    ...mergeOrgMapSettings(current, data),
    updatedAt: new Date().toISOString(),
    updatedBy: "mock-session",
  };
  store.set(orgId, merged);
  return merged;
}
