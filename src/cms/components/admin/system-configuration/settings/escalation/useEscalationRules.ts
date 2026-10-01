// The one surface the Escalation Rules form uses to read and persist org
// escalation-rule config.
//
// Mirrors useOrgAssignmentRules: behind this facade sits either the real
// endpoints (GET / PATCH /organizations/{orgId}/escalation-rules) or the
// session-scoped stub, selected by VITE_MOCK_API. The RTK hooks are always
// called so hook order stays stable; the query is `skip`ped in mock mode or
// when there is no orgId.
//
// FAILURE IS ISOLATED HERE. The routes do not exist server-side yet; a 404 /
// a GraphQL error / a bad shape on load all surface as "no saved record" and
// the form falls back to schema defaults (buildDefaultOrgEscalationRuleSettings)
// — never an error state. A failed save resolves as `{ ok: false }` so the
// caller can keep the admin's edits and show the persistent "not saved to
// server" banner; it never throws.
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/core/hooks/useAuth";
import {
  useGetOrgEscalationRulesQuery,
  useUpdateOrgEscalationRulesMutation,
} from "@/cms/store/api/escalationApi";
import {
  isOrgEscalationRuleSettings,
  type OrgEscalationRuleSettings,
  type OrgEscalationRulesUpdateData,
} from "@/cms/types/escalation";
import { DEV_CONFIG } from "@/cms/utils/constants";
import { buildDefaultOrgEscalationRuleSettings } from "@/cms/utils/escalationRules";
import {
  patchOrgEscalationRulesStub,
  readOrgEscalationRulesStub,
} from "./escalationRulesStub";

export interface OrgEscalationRulesSaveResult {
  ok: boolean;
  record?: OrgEscalationRuleSettings;
}

export interface UseEscalationRulesResult {
  /** Always a fully-populated record: the stored/mock value, or schema defaults. */
  loaded: OrgEscalationRuleSettings;
  /** First fetch of the real endpoint only. Mock mode never loads. */
  isLoading: boolean;
  isMock: boolean;
  isSaving: boolean;
  /** One atomic PATCH of the whole section. Resolves `{ ok: false }` on any failure. */
  save: (data: OrgEscalationRulesUpdateData) => Promise<OrgEscalationRulesSaveResult>;
}

export function useEscalationRules(): UseEscalationRulesResult {
  const { state } = useAuth();
  const orgId = state.user?.orgId ?? "";
  const isMock = DEV_CONFIG.MOCK_API;

  const { data, isLoading } = useGetOrgEscalationRulesQuery(orgId, {
    skip: !orgId || isMock,
  });
  const [updateOrgEscalationRules, { isLoading: isSaving }] =
    useUpdateOrgEscalationRulesMutation();

  // Mock mode reads the session stub; a mock save replaces this so the form re-seeds.
  const [mockRecord, setMockRecord] = useState<OrgEscalationRuleSettings | null>(null);
  useEffect(() => {
    if (isMock && orgId) {
      setMockRecord(readOrgEscalationRulesStub(orgId));
    }
  }, [isMock, orgId]);

  const realLoaded = useMemo<OrgEscalationRuleSettings>(
    () =>
      isOrgEscalationRuleSettings(data?.data)
        ? (data.data as OrgEscalationRuleSettings)
        : buildDefaultOrgEscalationRuleSettings(orgId),
    [data, orgId]
  );

  // Memoised so the identity is stable between renders — the form re-seeds off
  // this, so a fresh object every render would loop.
  const loaded = useMemo<OrgEscalationRuleSettings>(
    () => (isMock ? mockRecord ?? buildDefaultOrgEscalationRuleSettings(orgId) : realLoaded),
    [isMock, mockRecord, orgId, realLoaded]
  );

  const save = useCallback<UseEscalationRulesResult["save"]>(
    async (patch) => {
      if (isMock) {
        const record = patchOrgEscalationRulesStub(orgId, patch);
        setMockRecord(record);
        return { ok: true, record };
      }
      try {
        const res = await updateOrgEscalationRules({ orgId, data: patch }).unwrap();
        return {
          ok: true,
          record: isOrgEscalationRuleSettings(res?.data)
            ? (res.data as OrgEscalationRuleSettings)
            : undefined,
        };
      } catch {
        return { ok: false };
      }
    },
    [isMock, orgId, updateOrgEscalationRules]
  );

  return {
    loaded,
    isLoading: !isMock && !!orgId && isLoading,
    isMock,
    isSaving,
    save,
  };
}
