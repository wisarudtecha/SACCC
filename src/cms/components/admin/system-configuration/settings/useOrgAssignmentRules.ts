// The one surface the Assignment Rules form uses to read and persist org
// assignment-rule config.
//
// Mirrors useOrgMapSettings: behind this facade sits either the real endpoints
// (GET / PATCH /organizations/{orgId}/assignment-rules) or the session-scoped
// stub, selected by VITE_MOCK_API. The RTK hooks are always called so hook order
// stays stable; the query is `skip`ped in mock mode or when there is no orgId.
//
// FAILURE IS ISOLATED HERE. The routes do not exist server-side yet; a 404 / a
// GraphQL error / a bad shape on load all surface as "no saved record" and the
// form falls back to schema defaults (buildDefaultOrgAssignmentRuleSettings) -
// never an error state. A failed save resolves as `{ ok: false }` so the caller
// can keep the admin's edits and show the persistent "not saved to server"
// banner; it never throws.
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/core/hooks/useAuth";
import {
  useGetOrgAssignmentRulesQuery,
  useUpdateOrgAssignmentRulesMutation,
} from "@/core/store/api/organizationApi";
import {
  isOrgAssignmentRuleSettings,
  type OrgAssignmentRuleSettings,
  type OrgAssignmentRulesUpdateData,
} from "@/core/types/organization";
import { DEV_CONFIG } from "@/cms/utils/constants";
import { buildDefaultOrgAssignmentRuleSettings } from "@/cms/utils/orgAssignmentRules";
import {
  patchOrgAssignmentRulesStub,
  readOrgAssignmentRulesStub,
} from "./orgAssignmentRulesStub";

export interface OrgAssignmentRulesSaveResult {
  ok: boolean;
  record?: OrgAssignmentRuleSettings;
}

export interface UseOrgAssignmentRulesResult {
  /** Always a fully-populated record: the stored/mock value, or schema defaults. */
  loaded: OrgAssignmentRuleSettings;
  /** First fetch of the real endpoint only. Mock mode never loads. */
  isLoading: boolean;
  isMock: boolean;
  isSaving: boolean;
  /** One atomic PATCH of the whole section. Resolves `{ ok: false }` on any failure. */
  save: (
    data: OrgAssignmentRulesUpdateData
  ) => Promise<OrgAssignmentRulesSaveResult>;
}

export function useOrgAssignmentRules(): UseOrgAssignmentRulesResult {
  const { state } = useAuth();
  const orgId = state.user?.orgId ?? "";
  const isMock = DEV_CONFIG.MOCK_API;

  const { data, isLoading } = useGetOrgAssignmentRulesQuery(orgId, {
    skip: !orgId || isMock,
  });
  const [updateOrgAssignmentRules, { isLoading: isSaving }] =
    useUpdateOrgAssignmentRulesMutation();

  // Mock mode reads the session stub; a mock save replaces this so the form re-seeds.
  const [mockRecord, setMockRecord] = useState<OrgAssignmentRuleSettings | null>(
    null
  );
  useEffect(() => {
    if (isMock && orgId) {
      setMockRecord(readOrgAssignmentRulesStub(orgId));
    }
  }, [isMock, orgId]);

  const realLoaded = useMemo<OrgAssignmentRuleSettings>(
    () =>
      isOrgAssignmentRuleSettings(data?.data)
        ? (data.data as OrgAssignmentRuleSettings)
        : buildDefaultOrgAssignmentRuleSettings(orgId),
    [data, orgId]
  );

  // Memoised so the identity is stable between renders - the form re-seeds off
  // this, so a fresh object every render would loop.
  const loaded = useMemo<OrgAssignmentRuleSettings>(
    () =>
      isMock
        ? mockRecord ?? buildDefaultOrgAssignmentRuleSettings(orgId)
        : realLoaded,
    [isMock, mockRecord, orgId, realLoaded]
  );

  const save = useCallback<UseOrgAssignmentRulesResult["save"]>(
    async (patch) => {
      if (isMock) {
        const record = patchOrgAssignmentRulesStub(orgId, patch);
        setMockRecord(record);
        return { ok: true, record };
      }
      try {
        const res = await updateOrgAssignmentRules({ orgId, data: patch }).unwrap();
        return {
          ok: true,
          record: isOrgAssignmentRuleSettings(res?.data)
            ? (res.data as OrgAssignmentRuleSettings)
            : undefined,
        };
      } catch {
        return { ok: false };
      }
    },
    [isMock, orgId, updateOrgAssignmentRules]
  );

  return {
    loaded,
    isLoading: !isMock && !!orgId && isLoading,
    isMock,
    isSaving,
    save,
  };
}
