// The one surface the Organization Settings page uses to read and persist the
// `org.config.properties` document.
//
// WHY ONE HOOK FOR TWO SECTIONS: the backend stores Map Settings and Assignment
// Rules as a single JSON document under one key, so a write replaces the whole
// value. Reading them through two independent hooks would mean two cache entries
// over one document and a read-modify-write race between the two Save buttons.
//
// LOAD FAILURE IS NOT SILENT. An unsaved key and a broken request both arrive as a
// real RTK error (`GetConfigPropertyByKey` answers `status: "-1"` for a missing
// key, and the hybrid base query rejects a conclusive failure envelope), so the
// hook reports `loadState` and `loadError` and lets the UI decide what to say. The
// form still gets a fully-populated record in every state, so it never has to
// branch, but `loadError` must not be swallowed: over a backend that is actually
// down, silently showing defaults invites an admin to "fix" settings that are
// really just unreadable.
//
// MOCK MODE stays inside this hook: with `VITE_MOCK_API="true"` there is no
// request at all, and the two session-scoped section stubs are composed into one
// document so Save appears to persist for the rest of the session.
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/core/hooks/useAuth";
import {
  useGetConfigPropertyByKeyQuery,
  useSetConfigPropertyByKeyMutation,
} from "@/core/store/api/configPropertyApi";
import type { OrgConfigPropertiesDoc } from "@/core/types/organization";
import { isConfigPropertyRow } from "@/core/types/organization";
import {
  readEntityVerdict,
  readEnvelopeMessage,
  readEnvelopeStatus,
  readMutationError,
} from "@/core/utils/apiResponseStatus";
import { DEV_CONFIG } from "@/cms/utils/constants";
import {
  ORG_CONFIG_PROPERTIES_KEY,
  buildDefaultOrgConfigProperties,
  decodeOrgConfigProperties,
  decodePropVal,
  encodeOrgConfigProperties,
  isPlainObject,
} from "@/cms/utils/orgConfigProperties";
import {
  patchOrgMapSettingsStub,
  readOrgMapSettingsStub,
} from "./orgMapSettingsStub";
import {
  patchOrgAssignmentRulesStub,
  readOrgAssignmentRulesStub,
} from "./orgAssignmentRulesStub";

/**
 * `empty` = the key has never been saved (the normal first-run state, defaults are
 * what the admin starts from). `error` = the request failed for a reason other than
 * a missing key, or failed with wording we do not recognise - the safe side, since
 * a false `empty` hides a broken backend behind plausible defaults.
 */
export type OrgConfigLoadState = "loading" | "ready" | "empty" | "error";

export interface OrgConfigSaveResult {
  ok: boolean;
  /** The server's own wording when it rejected the write, for the banner. */
  message?: string;
  /** The document as the server echoed it back, when it returned one. */
  doc?: OrgConfigPropertiesDoc;
}

/** Who/when the row was last written, straight off the config-properties row. */
export interface OrgConfigSavedMeta {
  updatedAt?: string;
  updatedBy?: string | null;
}

export interface UseOrgConfigPropertiesResult {
  /** Always fully populated: the stored document, or schema defaults. */
  loaded: OrgConfigPropertiesDoc;
  /** The decoded document as read - the merge base for the next write. */
  rawDocument: Record<string, unknown>;
  /** Provenance of the stored row. Empty until a row has been saved at least once. */
  savedMeta: OrgConfigSavedMeta;
  loadState: OrgConfigLoadState;
  /** Server wording (or transport error text). Empty when there is nothing to say. */
  loadError: string;
  /** First fetch only; a refetch does not flip this back. */
  isLoading: boolean;
  isFetching: boolean;
  isMock: boolean;
  isSaving: boolean;
  /** Persist the WHOLE document (upsert on first save). Resolves `{ ok: false }`, never throws. */
  save: (doc: OrgConfigPropertiesDoc) => Promise<OrgConfigSaveResult>;
  reload: () => void;
}

/**
 * Missing-key wording seen from the BFF. Deliberately short and only used to pick
 * between two labels - both states still render defaults and allow a save.
 */
const NOT_STORED_PATTERN = /not\s*found|no\s*(?:record|data)|does\s*not\s*exist|ไม่พบ/i;

export function useOrgConfigProperties(
  options: {
    /**
     * Whether the document may be fetched yet. Defaults to true. Pass `false` from a
     * surface that is only *sometimes* shown (the assignment picker mounts closed on
     * every case page) so a tenant is not charged a request for a modal nobody opened.
     */
    enabled?: boolean;
    /** Refetch when the surface mounts - used by the admin page to reduce staleness. */
    refetchOnMount?: boolean;
  } = {}
): UseOrgConfigPropertiesResult {
  const enabled = options.enabled ?? true;
  const refetchOnMount = options.refetchOnMount ?? false;
  const { state } = useAuth();
  const orgId = state.user?.orgId ?? "";
  const isMock = DEV_CONFIG.MOCK_API;

  const { currentData, isLoading, isFetching, isError, error, refetch } =
    useGetConfigPropertyByKeyQuery(
      { propKey: ORG_CONFIG_PROPERTIES_KEY, orgId },
      { skip: !enabled || !orgId || isMock, refetchOnMountOrArgChange: refetchOnMount }
    );

  const [setConfigPropertyByKey, { isLoading: isSaving }] =
    useSetConfigPropertyByKeyMutation();

  // Mock mode: compose the two session stubs into one document and keep the
  // result in state so a mock Save re-renders every section from it.
  const [mockDoc, setMockDoc] = useState<OrgConfigPropertiesDoc | null>(null);
  useEffect(() => {
    if (!isMock || !orgId) {
      return;
    }
    setMockDoc({
      orgId,
      mapSettings: readOrgMapSettingsStub(orgId),
      assignmentRules: readOrgAssignmentRulesStub(orgId),
      // No session stub for the per-sub-type assignment mode: mock mode starts with
      // nothing configured, which is exactly what "not set" looks like for real.
      assignmentMode: [],
    });
  }, [isMock, orgId]);

  /**
   * `currentData` (not `data`): it is scoped to THIS hook's argument, so switching
   * tenant can never render the previous tenant's document. It goes `undefined`
   * during the refetch that follows a save, which is why the last decoded document
   * is retained below instead of re-seeding the form from defaults.
   *
   * BOTH PAYLOAD SHAPES ARE ACCEPTED. `ApiResponse.data` is the JSON scalar, so the
   * BFF may answer with the row (`{ propKey, propVal, ... }`) or with the stored
   * document itself. Only handling the row would make a document-shaped answer read
   * as "nothing stored" forever - indistinguishable from a tenant with no settings,
   * and it would silently overwrite the real document on the first Save.
   */
  const decoded = useMemo<OrgConfigPropertiesDoc | null>(() => {
    const payload = currentData?.data;
    if (isConfigPropertyRow(payload)) {
      return decodeOrgConfigProperties(payload.propVal, orgId);
    }
    if (isPlainObject(payload) && ("mapSettings" in payload || "assignmentRules" in payload)) {
      return decodeOrgConfigProperties(payload, orgId);
    }
    return null;
  }, [currentData, orgId]);

  const [retained, setRetained] = useState<OrgConfigPropertiesDoc | null>(null);
  useEffect(() => {
    if (decoded) {
      setRetained(decoded);
    }
  }, [decoded]);

  const defaultDoc = useMemo(() => buildDefaultOrgConfigProperties(orgId), [orgId]);

  // Identity must be stable: the sections re-seed their form off `loaded`, so a
  // fresh object every render would loop.
  const loaded = useMemo<OrgConfigPropertiesDoc>(() => {
    if (isMock) {
      return mockDoc ?? defaultDoc;
    }
    if (decoded) {
      return decoded;
    }
    // Only reuse a retained document when it belongs to the same org.
    return retained && retained.orgId === orgId ? retained : defaultDoc;
  }, [isMock, mockDoc, decoded, retained, orgId, defaultDoc]);

  // Same two shapes as `decoded`; this is the merge base a write is layered onto,
  // so it must carry every key the client does not model.
  const rawDocument = useMemo(() => {
    const payload = currentData?.data;
    if (isConfigPropertyRow(payload)) {
      return decodePropVal(payload.propVal);
    }
    if (isPlainObject(payload)) {
      return payload;
    }
    return {};
  }, [currentData]);

  const savedMeta = useMemo<OrgConfigSavedMeta>(() => {
    const payload = currentData?.data;
    if (isConfigPropertyRow(payload)) {
      return { updatedAt: payload.updatedAt, updatedBy: payload.updatedBy };
    }
    return {};
  }, [currentData]);

  /**
   * The BFF reports a business failure inside HTTP 200 with a numeric-ish status
   * token. `readEnvelopeStatus` classifies "401"/"403"/"500" as INCONCLUSIVE (not
   * "failure"), so `hybridBaseQuery` lets those responses RESOLVE with `data: null`
   * and `isError` stays false. Verified against staging on 2026-11-18:
   *
   *   { status: "401", msg: "Unauthorized", desc: "Missing Authorization header" }
   *
   * So the envelope has to be read here. Otherwise an expired session looks exactly
   * like a tenant that has never saved anything: defaults on screen, Save enabled,
   * and the next Save trying to overwrite whatever is actually stored.
   */
  const envelopeStatus = readEnvelopeStatus(currentData?.status);
  const envelopeMessage = readEnvelopeMessage(currentData);
  const resolvedWithoutPayload = !isError && currentData !== undefined && decoded === null;

  const loadError = isError ? readMutationError(error) : envelopeMessage;

  const loadState = useMemo<OrgConfigLoadState>(() => {
    if (isMock) {
      return mockDoc ? "ready" : "loading";
    }
    if (decoded) {
      return "ready";
    }
    // Only reuse a retained document when it belongs to the same org AND nothing has
    // since told us the read is unusable - this is the post-save refetch window.
    if (retained && retained.orgId === orgId && !isError && !resolvedWithoutPayload) {
      return "ready";
    }
    if (isLoading && enabled && !!orgId) {
      return "loading";
    }
    if (isError) {
      return NOT_STORED_PATTERN.test(loadError) ? "empty" : "error";
    }
    if (resolvedWithoutPayload) {
      // A conclusive success with no record is the normal "never saved" answer; any
      // other token (401/403/500/unrecognised) is a failure and must not be dressed
      // up as an empty document.
      if (envelopeStatus === "success") {
        return "empty";
      }
      return NOT_STORED_PATTERN.test(loadError) ? "empty" : "error";
    }
    return "empty";
  }, [
    isMock,
    mockDoc,
    decoded,
    retained,
    orgId,
    isError,
    isLoading,
    enabled,
    loadError,
    resolvedWithoutPayload,
    envelopeStatus,
  ]);

  const save = useCallback<UseOrgConfigPropertiesResult["save"]>(
    async (doc) => {
      const nextDoc: OrgConfigPropertiesDoc = { ...doc, orgId };

      if (isMock) {
        const record: OrgConfigPropertiesDoc = {
          orgId,
          mapSettings: patchOrgMapSettingsStub(orgId, nextDoc.mapSettings),
          assignmentRules: patchOrgAssignmentRulesStub(orgId, nextDoc.assignmentRules),
          // Carried from the form so a mock Save keeps what the table set.
          assignmentMode: nextDoc.assignmentMode,
        };
        setMockDoc(record);
        return { ok: true, doc: record };
      }

      try {
        const propVal = encodeOrgConfigProperties(rawDocument, nextDoc);
        const response = await setConfigPropertyByKey({
          propKey: ORG_CONFIG_PROPERTIES_KEY,
          propVal,
        }).unwrap();

        // Only report success on positive evidence: an inconclusive `status` (the
        // number -1 the normalizer substitutes when the field is absent) is not a
        // success, and clearing the dirty flag on it would destroy the admin's work.
        const verdict = readEntityVerdict(response, isConfigPropertyRow);
        if (!verdict.ok) {
          return { ok: false, message: verdict.message };
        }
        return {
          ok: true,
          doc: verdict.entity
            ? decodeOrgConfigProperties(verdict.entity.propVal, orgId)
            : undefined,
        };
      } catch (error) {
        return { ok: false, message: readMutationError(error) };
      }
    },
    [isMock, orgId, rawDocument, setConfigPropertyByKey]
  );

  const reload = useCallback(() => {
    void refetch();
  }, [refetch]);

  return {
    loaded,
    rawDocument,
    savedMeta,
    loadState,
    loadError,
    // Never a literal: a constant `true` is indistinguishable from a real in-flight
    // request and leaves the section on its skeleton forever.
    isLoading: enabled && !isMock && !!orgId && isLoading,
    isFetching,
    isMock,
    isSaving,
    save,
    reload,
  };
}
