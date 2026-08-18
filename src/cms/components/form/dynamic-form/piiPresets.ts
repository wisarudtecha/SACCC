// src/cms/components/form/dynamic-form/piiPresets.ts
/**
 * The form builder's "Contains personal data" control offers a small set of named presets
 * rather than a raw strategy/keep picker - an admin choosing "Last 4 digits" shouldn't also
 * have to understand what `keep` means.
 *
 * Kept separate from `piiFields.ts` on purpose: that module is pure and dependency-free by
 * design (`core` -> `cms` is the tangle to avoid), and these presets are a `cms`-side
 * concern - which strategies make sense to *offer* for which field types, not how masking
 * itself works.
 */
import { PII_VIEW_PERMISSION } from "@/core/security/piiFields";
import type { PiiRule } from "@/core/security/piiFields";

export type PiiPresetKey = "lastN" | "email" | "yearOnly" | "full";

export const PII_STRATEGY_PRESETS: Record<PiiPresetKey, PiiRule> = {
  lastN: { strategy: "lastN", keep: 4, permission: PII_VIEW_PERMISSION },
  email: { strategy: "email", permission: PII_VIEW_PERMISSION },
  yearOnly: { strategy: "yearOnly", permission: PII_VIEW_PERMISSION },
  full: { strategy: "full", permission: PII_VIEW_PERMISSION },
};

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
  const match = (Object.entries(PII_STRATEGY_PRESETS) as [PiiPresetKey, PiiRule][])
    .find(([, presetRule]) => presetRule.strategy === rule.strategy);
  return match ? match[0] : "";
};
