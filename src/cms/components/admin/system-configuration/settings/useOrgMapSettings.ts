// The one surface the Map Settings form uses to read and persist the map half of
// the organization settings document.
//
// A read-only-facing PROJECTION over `useOrgConfigProperties` - the document is one
// row on the server, so the map settings cannot be read on their own.
//
// The settings PAGE no longer uses this hook: since Phase 2 the page owns the whole
// document and saves it with a single Save (see OrganizationSettingsManagement). What
// remains are the two runtime consumers that only need to READ the map half:
// `singleAssignOfficer.tsx` (assignment picker columns) and
// `useOrgIncidentMapConfig.ts` (the no-match incident radius). Their contract is
// deliberately unchanged from the mockup-era hook so neither had to move.
//
// `save` is kept because it is the section-level read-modify-write primitive and is
// covered by tests, but the page must not use it: two section-level writes over one
// document are exactly the overwrite race the single Save exists to remove.
import { useCallback } from "react";
import type {
  OrgMapSettings,
  OrgMapSettingsUpdateData,
} from "@/core/types/organization";
import { withMapSettingsPatch } from "@/cms/utils/orgConfigProperties";
import {
  useOrgConfigProperties,
  type OrgConfigLoadState,
} from "./useOrgConfigProperties";

export interface OrgMapSettingsSaveResult {
  ok: boolean;
  record?: OrgMapSettings;
}

export interface UseOrgMapSettingsResult {
  /** Always a fully-populated record: the stored value, or schema defaults. */
  loaded: OrgMapSettings;
  /** First fetch of the real document only. Mock mode never loads. */
  isLoading: boolean;
  isMock: boolean;
  isSaving: boolean;
  /**
   * `empty` = nothing stored yet (the normal first run). `error` = the read failed
   * for a reason other than a missing key - surface it, do not present defaults as
   * if they were the saved configuration.
   */
  loadState: OrgConfigLoadState;
  loadError: string;
  /** Persist this section. Resolves `{ ok: false }` on any failure; never throws. */
  save: (data: OrgMapSettingsUpdateData) => Promise<OrgMapSettingsSaveResult>;
}

export function useOrgMapSettings(
  options: {
    /**
     * Whether the record may be fetched yet. Defaults to true - every existing caller
     * wants it on mount. Pass `false` from a surface that is only *sometimes* shown (the
     * assignment picker mounts closed on every case page) so a tenant is not charged a
     * request for a modal nobody opened. While disabled the hook still returns a
     * fully-populated record from schema defaults, so a caller never has to branch.
     */
    enabled?: boolean;
  } = {}
): UseOrgMapSettingsResult {
  const {
    loaded: document,
    isLoading,
    isMock,
    isSaving,
    loadState,
    loadError,
    save: saveDocument,
  } = useOrgConfigProperties({ enabled: options.enabled ?? true });

  const save = useCallback<UseOrgMapSettingsResult["save"]>(
    async (patch) => {
      const result = await saveDocument(withMapSettingsPatch(document, patch));
      return { ok: result.ok, record: result.doc?.mapSettings };
    },
    [document, saveDocument]
  );

  return {
    loaded: document.mapSettings,
    isLoading,
    isMock,
    isSaving,
    loadState,
    loadError,
    save,
  };
}
