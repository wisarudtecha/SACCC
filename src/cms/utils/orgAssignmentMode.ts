// src/cms/utils/orgAssignmentMode.ts
/**
 * The `assignmentMode[]` half of the org settings document: decode, normalize, edit
 * and validate.
 *
 * Shape (contract 2026-11-19): an array of `{ type, mode, caseSubTypes[] }` where
 * `type` names one of two STAGES - `pic` (deciding who the responsible person is)
 * and `assignment` (assigning the case itself) - and `mode` is `"auto" | "manual"`.
 * It replaced the org-wide `assignmentRules.mode`, so "not set" is expressed by the
 * ABSENCE of an entry rather than by a third token (decision U2).
 *
 * Two storage rules shaped this module:
 *
 *   1. The adapter's `deepMerge` REPLACES arrays wholesale, so an edit has to rebuild
 *      the whole array - including entries this client cannot represent - or a Save
 *      would delete them. `readUnknownEntries` is the other half of that contract.
 *   2. One sub-type must never appear twice for the same stage. The last occurrence
 *      wins on read, and every write goes through `setAssignmentModeForSubType`, so
 *      the array this module returns is always already normalized.
 *
 * Pure module: no React, no SDK. The table component and the adapter both read here.
 */
import {
  ASSIGNMENT_MODE_TARGETS,
  ASSIGNMENT_MODE_TOKENS,
  type AssignmentModeEntry,
  type AssignmentModeTarget,
  type AssignmentModeToken,
  type RoutingModes,
} from "@/core/types/organization";
import { hasRoutingCriterion } from "./orgAssignmentRules";

/** Local to this module on purpose: importing it from the adapter would create a cycle. */
const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export const isAssignmentModeTarget = (value: unknown): value is AssignmentModeTarget =>
  typeof value === "string" && (ASSIGNMENT_MODE_TARGETS as readonly string[]).includes(value);

export const isAssignmentModeToken = (value: unknown): value is AssignmentModeToken =>
  typeof value === "string" && (ASSIGNMENT_MODE_TOKENS as readonly string[]).includes(value);

/** Read an entry's sub-type ids, dropping anything that is not a non-empty string. */
function readSubTypeIds(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter(
    (item): item is string => typeof item === "string" && item.length > 0
  );
}

/**
 * Decode the stored array into the model the UI edits: at most one entry per
 * (stage, mode) pair, no duplicate sub-type within a stage, stable order.
 *
 * A missing array, a non-array, or entries with an unknown `type`/`mode` are skipped
 * here - they stay in the raw document and survive a Save via
 * `readUnknownAssignmentModeEntries`.
 */
export function decodeOrgAssignmentMode(raw: unknown): AssignmentModeEntry[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  const groups = new Map<
    string,
    { type: AssignmentModeTarget; mode: AssignmentModeToken; caseSubTypes: string[] }
  >();
  // `${type}|${subType}` -> the mode it currently belongs to, so a duplicate can be
  // taken away from its earlier group instead of appearing in both.
  const assigned = new Map<string, AssignmentModeToken>();

  for (const item of raw) {
    if (!isRecord(item)) {
      continue;
    }
    const { type, mode } = item;
    if (!isAssignmentModeTarget(type) || !isAssignmentModeToken(mode)) {
      continue;
    }
    for (const subType of readSubTypeIds(item.caseSubTypes)) {
      const previousMode = assigned.get(`${type}|${subType}`);
      if (previousMode !== undefined) {
        const previousGroup = groups.get(`${type}|${previousMode}`);
        if (previousGroup) {
          previousGroup.caseSubTypes = previousGroup.caseSubTypes.filter(
            (id) => id !== subType
          );
        }
      }
      assigned.set(`${type}|${subType}`, mode);

      const groupKey = `${type}|${mode}`;
      const group = groups.get(groupKey) ?? { type, mode, caseSubTypes: [] };
      if (!group.caseSubTypes.includes(subType)) {
        group.caseSubTypes.push(subType);
      }
      groups.set(groupKey, group);
    }
  }

  // Stable order (stage order, then mode order) so the array does not churn between
  // saves and produce a diff the backend has to reconcile for no reason.
  const entries: AssignmentModeEntry[] = [];
  for (const type of ASSIGNMENT_MODE_TARGETS) {
    for (const mode of ASSIGNMENT_MODE_TOKENS) {
      const group = groups.get(`${type}|${mode}`);
      if (group && group.caseSubTypes.length > 0) {
        entries.push({ type, mode, caseSubTypes: group.caseSubTypes });
      }
    }
  }
  return entries;
}

/**
 * Entries this client cannot represent (unknown stage or unknown mode), returned
 * verbatim so `encodeOrgConfigProperties` can append them back. A Save must not
 * delete data it does not understand - same rule as the rest of the document.
 *
 * Deliberately narrow: only OBJECTS with a recognisable shape-but-unknown `type` or
 * `mode` are preserved. A bare `null` or string in the array carries no information,
 * and an entry with a known stage/mode but no sub-types expresses nothing (it is the
 * "not set" state), so both are dropped rather than re-written.
 */
export function readUnknownAssignmentModeEntries(raw: unknown): unknown[] {
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw.filter(
    (item) =>
      isRecord(item) &&
      (!isAssignmentModeTarget(item.type) || !isAssignmentModeToken(item.mode))
  );
}

/** Wire form of the model, re-normalized so a caller cannot write duplicates. */
export function encodeOrgAssignmentMode(
  entries: readonly AssignmentModeEntry[]
): AssignmentModeEntry[] {
  return decodeOrgAssignmentMode(entries);
}

/** The mode set for one sub-type at one stage, or null when it is not configured. */
export function getAssignmentModeForSubType(
  entries: readonly AssignmentModeEntry[],
  type: AssignmentModeTarget,
  subTypeId: string
): AssignmentModeToken | null {
  const entry = entries.find(
    (candidate) => candidate.type === type && candidate.caseSubTypes.includes(subTypeId)
  );
  return entry ? entry.mode : null;
}

/**
 * Set (or clear, with `mode === null`) the mode of one sub-type at one stage.
 *
 * Returns a NEW normalized array: the sub-type is removed from every entry of that
 * stage first, so a sub-type can never end up in two modes at once.
 */
export function setAssignmentModeForSubType(
  entries: readonly AssignmentModeEntry[],
  type: AssignmentModeTarget,
  subTypeId: string,
  mode: AssignmentModeToken | null
): AssignmentModeEntry[] {
  const next: AssignmentModeEntry[] = [];

  for (const entry of entries) {
    if (entry.type !== type) {
      next.push({ ...entry, caseSubTypes: [...entry.caseSubTypes] });
      continue;
    }
    const remaining = entry.caseSubTypes.filter((id) => id !== subTypeId);
    if (remaining.length > 0) {
      next.push({ ...entry, caseSubTypes: remaining });
    }
  }

  if (mode !== null) {
    next.push({ type, mode, caseSubTypes: [subTypeId] });
  }

  return decodeOrgAssignmentMode(next);
}

/**
 * Every sub-type id the array mentions, so the table can render a row for an id the
 * catalogue no longer returns. Hiding such a row would let a stale entry persist
 * with no way to clear it.
 */
export function collectAssignmentModeSubTypeIds(
  entries: readonly AssignmentModeEntry[]
): string[] {
  const ids = new Set<string>();
  for (const entry of entries) {
    for (const id of entry.caseSubTypes) {
      ids.add(id);
    }
  }
  return [...ids];
}

/**
 * The rule that had to move when `assignmentRules.mode` was retired: a sub-type
 * staged as automatic, in an organisation with no routing criterion selected, claims
 * the system will route and defines no way to. Manual-only configurations are fine -
 * that is the shipped default, and blocking them would make a first Save impossible.
 */
export function validateAssignmentMode(
  entries: readonly AssignmentModeEntry[],
  routingModes: RoutingModes
): Record<string, string> {
  const errors: Record<string, string> = {};

  if (entries.some((entry) => entry.mode === "auto") && !hasRoutingCriterion(routingModes)) {
    errors["assignmentMode"] = "settings.assignment.validation.no_criteria_selected";
  }

  return errors;
}
