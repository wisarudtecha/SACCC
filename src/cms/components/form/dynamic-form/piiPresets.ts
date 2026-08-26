// src/cms/components/form/dynamic-form/piiPresets.ts
/**
 * The form builder's "Contains personal data" controls offer named presets rather than a raw
 * strategy/keep picker - an admin choosing "Last 4 digits" shouldn't also have to understand
 * what `keep` means.
 *
 * Two choices make up a marker: *how* the value is redacted (the strategy preset) and *which
 * class of personal data* it belongs to, which is what decides the permission a viewer needs.
 * The class matters beyond display - it is also what strips the field from an update payload -
 * so it is admin-selectable rather than assumed.
 *
 * Kept separate from `piiFields.ts` on purpose: that module is pure and dependency-free by
 * design (`core` -> `cms` is the tangle to avoid), and these presets are a `cms`-side
 * concern - which strategies make sense to *offer* for which field types, not how masking
 * itself works.
 */
import {
  PII_CUSTOMER_GENERAL_PERMISSION,
  PII_CUSTOMER_SENSITIVE_PERMISSION,
} from "@/core/security/piiFields";
import type { PiiRule } from "@/core/security/piiFields";

export type PiiPresetKey = "lastN" | "email" | "yearOnly" | "full";

/** Strategy half of a marker. The permission half comes from the class, below. */
const PII_STRATEGY_PRESETS: Record<PiiPresetKey, Omit<PiiRule, "permission">> = {
  lastN: { strategy: "lastN", keep: 4 },
  email: { strategy: "email" },
  yearOnly: { strategy: "yearOnly" },
  full: { strategy: "full" },
};

/**
 * The classes a dynamic field can be filed under.
 *
 * Only the two customer classes are offered. `pii.case.phoneNo` names one specific case column
 * rather than a class a form field could belong to, and `pii.user.*` covers user/admin records,
 * which dynamic forms do not describe.
 */
export type PiiClassKey = "customerGeneral" | "customerSensitive";

export const PII_CLASS_KEYS: readonly PiiClassKey[] = ["customerGeneral", "customerSensitive"];

const PII_CLASS_PERMISSIONS: Record<PiiClassKey, string> = {
  customerGeneral: PII_CUSTOMER_GENERAL_PERMISSION,
  customerSensitive: PII_CUSTOMER_SENSITIVE_PERMISSION,
};

/**
 * The safer half of the split to land on when an admin ticks the box without choosing.
 *
 * "General" is the *narrower* grant of the two in practice: roles that can see sensitive data
 * are also given the general permission, so defaulting here hides the field from the fewest
 * people who legitimately need it while still classifying it.
 */
export const DEFAULT_PII_CLASS: PiiClassKey = "customerGeneral";

/** Assembles the stored marker from the admin's two choices. */
export const buildPiiRule = (preset: PiiPresetKey, piiClass: PiiClassKey): PiiRule => ({
  ...PII_STRATEGY_PRESETS[preset],
  permission: PII_CLASS_PERMISSIONS[piiClass],
});

/**
 * Field types that may carry a `pii` marker.
 *
 * Exactly the types `renderFormField.tsx` renders through `{...commonProps}` with a plain
 * scalar `value=`, and the types `FormViewValue.tsx` already groups into one shared display
 * branch. `select`/`radio`/`option` are a *selection*, not partially-revealable text;
 * `InputGroup`/`dynamicField` are recursive containers; `image`-family types render
 * `<img src>` and need their own placeholder treatment; `phoneNumber` has no `disabled` wiring
 * today independent of this feature. All five are deliberately excluded - see the plan/doc
 * comment on `IndividualFormField.pii` before extending this list.
 */
export const PII_ELIGIBLE_FIELD_TYPES: readonly string[] = [
  "textInput",
  "emailInput",
  "passwordInput",
  "Integer",
  "textAreaInput",
  "dateInput",
  "dateLocal",
];

export const isPiiEligibleFieldType = (fieldType: string): boolean =>
  PII_ELIGIBLE_FIELD_TYPES.includes(fieldType);

/**
 * Which presets make sense for a given field type - offering "Year only" on a plain text
 * field wouldn't break anything (it fails closed to a full mask), but it invites confusion
 * for no benefit. "Fully hidden" is always offered as the universal fallback.
 */
export const presetsForFieldType = (fieldType: string): PiiPresetKey[] => {
  switch (fieldType) {
    case "emailInput":
      return ["email", "full"];
    case "dateInput":
    case "dateLocal":
      return ["yearOnly", "full"];
    case "textInput":
    case "passwordInput":
    case "Integer":
    case "textAreaInput":
      return ["lastN", "full"];
    default:
      return ["full"];
  }
};

/** Reverse lookup: which preset key (if any) a stored rule matches, for the dropdown's value. */
export const presetKeyForRule = (rule: PiiRule | undefined): PiiPresetKey | "" => {
  if (!rule) {
    return "";
  }
  const match = (Object.entries(PII_STRATEGY_PRESETS) as [PiiPresetKey, Omit<PiiRule, "permission">][])
    .find(([, presetRule]) => presetRule.strategy === rule.strategy);
  return match ? match[0] : "";
};

/**
 * Reverse lookup for the class dropdown.
 *
 * Falls back to the default rather than to `""`, so a marker saved before classes existed (or
 * one carrying a permission this build doesn't know) still selects something coherent instead
 * of rendering an empty dropdown the admin has to notice and fix.
 */
export const classKeyForRule = (rule: PiiRule | undefined): PiiClassKey =>
  PII_CLASS_KEYS.find(key => PII_CLASS_PERMISSIONS[key] === rule?.permission) ?? DEFAULT_PII_CLASS;
