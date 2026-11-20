// src/cms/utils/orgConfigProperties.ts
/**
 * The wire <-> form adapter for the organization settings document.
 *
 * The backend keeps the whole page in ONE config property (`org.config.properties`,
 * `propVal` = a JSON object holding `mapSettings` + `assignmentRules`) - see
 * `src/core/mocks/organizationSettings.sh` for the payload and
 * `src/core/mocks/config_property.go` for how `propVal` is encoded on the wire.
 *
 * Two rules carry the weight here:
 *
 * 1. DECODE NEVER TRUSTS THE DOCUMENT'S SHAPE. Values are coerced onto the schema
 *    defaults field by field, so a missing key, a legacy row, or a corrupted value
 *    can never put a string into a boolean control (a controlled input bound to the
 *    wrong type is how a settings form silently stops responding).
 * 2. ENCODE MERGES ONTO THE RAW DOCUMENT, IT DOES NOT REBUILD IT. A rebuild from
 *    the typed model drops every field this client does not know about - including
 *    `advancedOptions.serviceSubType` (no UI control yet) and anything the backend
 *    adds later. The stored document is the contract, not our TypeScript shape.
 *
 * Pure module on purpose (no SDK, no React): the hooks, the mock stubs and the
 * tests all read from here.
 */
import type {
  OrgAssignmentRuleSettings,
  OrgAssignmentRulesUpdateData,
  OrgConfigPropertiesDoc,
  OrgMapSettings,
  OrgMapSettingsUpdateData,
} from "@/core/types/organization";
import {
  buildDefaultOrgAssignmentRuleSettings,
  mergeOrgAssignmentRuleSettings,
} from "@/cms/utils/orgAssignmentRules";
import {
  decodeOrgAssignmentMode,
  encodeOrgAssignmentMode,
  readUnknownAssignmentModeEntries,
} from "@/cms/utils/orgAssignmentMode";
import {
  buildDefaultOrgMapSettings,
  mergeOrgMapSettings,
} from "@/cms/utils/orgMapSettings";

/** The one config-properties key the Organization Settings page lives under. */
export const ORG_CONFIG_PROPERTIES_KEY = "org.config.properties";

export const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/**
 * Normalize a `propVal` into a plain object.
 *
 * `ConfigPropVal.MarshalJSON` returns the decoded JSON only when the stored text
 * starts with `{` or `[`; anything else is returned as a JSON *string*. So a row
 * written by another client (or by hand) can legitimately arrive as text, and
 * `JSON.parse` has to be attemptable rather than assumed.
 */
export function decodePropVal(propVal: unknown): Record<string, unknown> {
  if (isPlainObject(propVal)) {
    return propVal;
  }
  if (typeof propVal === "string") {
    try {
      const parsed: unknown = JSON.parse(propVal);
      return isPlainObject(parsed) ? parsed : {};
    } catch {
      return {};
    }
  }
  return {};
}

/**
 * Deep copy of a defaults value. Every default is returned through this, never by
 * reference: `DEFAULT_ROUTING_MODES.caseTypeSubTypes` (and friends) are module-level
 * objects, so handing one out would let the first form's edit leak into every later
 * record - including the mock stub's seed.
 */
function cloneDefault<T>(value: T): T {
  if (Array.isArray(value)) {
    return [...value] as T;
  }
  if (isPlainObject(value)) {
    const result: Record<string, unknown> = {};
    for (const [key, nested] of Object.entries(value)) {
      result[key] = cloneDefault(nested);
    }
    return result as T;
  }
  return value;
}

/**
 * Copy `stored` onto `defaults`, keeping a default wherever the stored value's
 * kind does not match. Always returns fresh objects/arrays - a shared default
 * reference would let one form's edit leak into the next record.
 */
function coerceOntoDefaults<T>(defaults: T, stored: unknown): T {
  if (Array.isArray(defaults)) {
    return (
      Array.isArray(stored)
        ? stored.filter((item): item is string => typeof item === "string")
        : [...defaults]
    ) as T;
  }

  if (isPlainObject(defaults)) {
    if (!isPlainObject(stored)) {
      return cloneDefault(defaults);
    }
    const result: Record<string, unknown> = {};
    for (const [key, defaultValue] of Object.entries(defaults)) {
      result[key] = coerceOntoDefaults(defaultValue, stored[key]);
    }
    return result as T;
  }

  // A `null` default means "any scalar, or absent" - e.g.
  // AutoManualSetting.autoIntervalSeconds is a number when mode = "auto" and null
  // otherwise, so accepting only strings here would drop a real interval.
  if (defaults === null) {
    if (stored === undefined) return null as T;
    if (stored === null || typeof stored !== "object") return stored as T;
    return null as T;
  }

  switch (typeof defaults) {
    case "boolean":
      return (typeof stored === "boolean" ? stored : defaults) as T;
    case "number":
      return (typeof stored === "number" && Number.isFinite(stored) ? stored : defaults) as T;
    case "string":
      return (typeof stored === "string" ? stored : defaults) as T;
    default:
      return defaults;
  }
}

/** Decode the `mapSettings` half, filling anything missing from schema defaults. */
export function decodeOrgMapSettings(raw: unknown, orgId: string): OrgMapSettings {
  const defaults = buildDefaultOrgMapSettings(orgId);
  const source = isPlainObject(raw) ? raw : {};
  return { ...coerceOntoDefaults(defaults, source), orgId };
}

/** Decode the `assignmentRules` half, filling anything missing from schema defaults. */
export function decodeOrgAssignmentRules(
  raw: unknown,
  orgId: string
): OrgAssignmentRuleSettings {
  const defaults = buildDefaultOrgAssignmentRuleSettings(orgId);
  const source = isPlainObject(raw) ? raw : {};
  return { ...coerceOntoDefaults(defaults, source), orgId };
}

/** Decode a whole stored document. Never throws; an empty document yields defaults. */
export function decodeOrgConfigProperties(
  propVal: unknown,
  orgId: string
): OrgConfigPropertiesDoc {
  const document = decodePropVal(propVal);
  return {
    orgId,
    mapSettings: decodeOrgMapSettings(document.mapSettings, orgId),
    assignmentRules: decodeOrgAssignmentRules(document.assignmentRules, orgId),
    // Document-level array (added 2026-11-19). Entries this client cannot represent
    // are skipped here and preserved on write - see orgAssignmentMode.ts.
    assignmentMode: decodeOrgAssignmentMode(document.assignmentMode),
  };
}

/** An unsaved document for this org - what the form shows before anything is stored. */
export function buildDefaultOrgConfigProperties(orgId: string): OrgConfigPropertiesDoc {
  return {
    orgId,
    mapSettings: buildDefaultOrgMapSettings(orgId),
    assignmentRules: buildDefaultOrgAssignmentRuleSettings(orgId),
    // Empty = nothing configured. "Not set" is the absence of an entry, not a token.
    assignmentMode: [],
  };
}

/**
 * Keys the client adds for its own bookkeeping and which must never be written
 * into `propVal` (the backend keeps them as columns on the row).
 */
const DOC_META_KEYS: readonly string[] = ["orgId", "updatedAt", "updatedBy"];

function stripDocMeta(record: object): Record<string, unknown> {
  const clone: Record<string, unknown> = { ...record };
  for (const key of DOC_META_KEYS) {
    delete clone[key];
  }
  return clone;
}

/**
 * Merge `patch` over `base`, descending into nested objects so a key the patch
 * does not mention survives at every depth. Arrays and scalars replace outright.
 */
function deepMerge(base: unknown, patch: unknown): unknown {
  if (!isPlainObject(base) || !isPlainObject(patch)) {
    return patch;
  }
  const result: Record<string, unknown> = { ...base };
  for (const [key, value] of Object.entries(patch)) {
    result[key] = key in result ? deepMerge(result[key], value) : value;
  }
  return result;
}

/**
 * Produce the `propVal` to send for a whole document.
 *
 * `rawDoc` is the document as it was READ (not the decoded model). Merging onto it
 * is what keeps `serviceSubType`, future sections and any key this client does not
 * model from being erased by a Save it had nothing to do with.
 *
 * `assignmentMode` is the ONE key that cannot go through `deepMerge`: that helper
 * replaces arrays wholesale, so the array is rebuilt here - the normalized entries
 * the UI owns, followed by any entry whose stage/mode this client does not
 * understand (which must survive the Save untouched).
 */
export function encodeOrgConfigProperties(
  rawDoc: unknown,
  doc: OrgConfigPropertiesDoc
): Record<string, unknown> {
  const base = decodePropVal(rawDoc);
  const baseMap = isPlainObject(base.mapSettings) ? base.mapSettings : {};
  const baseRules = isPlainObject(base.assignmentRules) ? base.assignmentRules : {};

  const assignments = [
    ...encodeOrgAssignmentMode(doc.assignmentMode),
    ...readUnknownAssignmentModeEntries(base.assignmentMode),
  ];

  const encoded: Record<string, unknown> = {
    ...base,
    mapSettings: deepMerge(baseMap, stripDocMeta(doc.mapSettings)) as Record<string, unknown>,
    assignmentRules: deepMerge(
      baseRules,
      stripDocMeta(doc.assignmentRules)
    ) as Record<string, unknown>,
  };

  // Do not introduce the key into a document that never had it, and never leave an
  // empty array behind: absence is the "not set" state.
  if ("assignmentMode" in base || assignments.length > 0) {
    encoded.assignmentMode = assignments;
  }

  return encoded;
}

/** Apply a partial map-settings edit to the document (used by the per-section Save of Phase 1). */
export function withMapSettingsPatch(
  doc: OrgConfigPropertiesDoc,
  patch: OrgMapSettingsUpdateData
): OrgConfigPropertiesDoc {
  return { ...doc, mapSettings: mergeOrgMapSettings(doc.mapSettings, patch) };
}

/** Apply a partial assignment-rules edit to the document. */
export function withAssignmentRulesPatch(
  doc: OrgConfigPropertiesDoc,
  patch: OrgAssignmentRulesUpdateData
): OrgConfigPropertiesDoc {
  return {
    ...doc,
    assignmentRules: mergeOrgAssignmentRuleSettings(doc.assignmentRules, patch),
  };
}
