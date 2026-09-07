// The one surface the Map Settings form uses to read and persist org map config.
//
// Mirrors useOrgIncidentRadiusMeters / useUnitWorkloads: behind this facade sits
// either the real endpoints (GET / PATCH /organizations/{orgId}/map-settings) or
// the session-scoped stub, selected by VITE_MOCK_API. The RTK hooks are always
// called so hook order stays stable; the query is `skip`ped in mock mode or when
// there is no orgId.
//
// FAILURE IS ISOLATED HERE. The routes do not exist server-side yet; a 404 / a
// GraphQL error / a bad shape on load all surface as "no saved record" and the
// form falls back to schema defaults (buildDefaultOrgMapSettings) - never an
// error state. A failed save resolves as `{ ok: false }` so the caller can keep
// the admin's edits and show the persistent "not saved to server" banner; it
// never throws.
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/core/hooks/useAuth";
import {
  useGetOrgMapSettingsQuery,
  useUpdateOrgMapSettingsMutation,
} from "@/core/store/api/organizationApi";
import {
  isOrgMapSettings,
  type OrgMapSettings,
  type OrgMapSettingsUpdateData,
} from "@/core/types/organization";
import { DEV_CONFIG } from "@/cms/utils/constants";
import { buildDefaultOrgMapSettings } from "@/cms/utils/orgMapSettings";
import {
  patchOrgMapSettingsStub,
  readOrgMapSettingsStub,
} from "./orgMapSettingsStub";

export interface OrgMapSettingsSaveResult {
  ok: boolean;
  record?: OrgMapSettings;
}

export interface UseOrgMapSettingsResult {
  /** Always a fully-populated record: the stored/mock value, or schema defaults. */
  loaded: OrgMapSettings;
  /** First fetch of the real endpoint only. Mock mode never loads. */
  isLoading: boolean;
  isMock: boolean;
  isSaving: boolean;
  /** One atomic PATCH of the whole section. Resolves `{ ok: false }` on any failure. */
  save: (data: OrgMapSettingsUpdateData) => Promise<OrgMapSettingsSaveResult>;
}

export function useOrgMapSettings(): UseOrgMapSettingsResult {
  const { state } = useAuth();
  const orgId = state.user?.orgId ?? "";
  const isMock = DEV_CONFIG.MOCK_API;

  const { data, isLoading } = useGetOrgMapSettingsQuery(orgId, {
    skip: !orgId || isMock,
  });
  const [updateOrgMapSettings, { isLoading: isSaving }] =
    useUpdateOrgMapSettingsMutation();

  // Mock mode reads the session stub; a mock save replaces this so the form re-seeds.
  const [mockRecord, setMockRecord] = useState<OrgMapSettings | null>(null);
  useEffect(() => {
    if (isMock && orgId) {
      setMockRecord(readOrgMapSettingsStub(orgId));
    }
  }, [isMock, orgId]);

  const realLoaded = useMemo<OrgMapSettings>(
    () =>
      isOrgMapSettings(data?.data)
        ? (data.data as OrgMapSettings)
        : buildDefaultOrgMapSettings(orgId),
    [data, orgId]
  );

  // Memoised so the identity is stable between renders - the form re-seeds off
  // this, so a fresh object every render would loop.
  const loaded = useMemo<OrgMapSettings>(
    () =>
      isMock ? mockRecord ?? buildDefaultOrgMapSettings(orgId) : realLoaded,
    [isMock, mockRecord, orgId, realLoaded]
  );

  const save = useCallback<UseOrgMapSettingsResult["save"]>(
    async (patch) => {
      if (isMock) {
        const record = patchOrgMapSettingsStub(orgId, patch);
        setMockRecord(record);
        return { ok: true, record };
      }
      try {
        const res = await updateOrgMapSettings({ orgId, data: patch }).unwrap();
        return {
          ok: true,
          record: isOrgMapSettings(res?.data)
            ? (res.data as OrgMapSettings)
            : undefined,
        };
      } catch {
        return { ok: false };
      }
    },
    [isMock, orgId, updateOrgMapSettings]
  );

  return {
    loaded,
    isLoading: !isMock && !!orgId && isLoading,
    isMock,
    isSaving,
    save,
  };
}
