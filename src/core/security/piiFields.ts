// src/core/security/piiFields.ts
/**
 * Which customer fields count as personally identifying, and how each one is masked.
 *
 * This module is deliberately **dependency-free**: string paths in, masked strings out. It
 * holds no React, no permission lookup and no knowledge of the customer types — those live
 * in `cms`, and `CLAUDE.md` treats `core` -> `cms` imports as an existing tangle to work
 * around rather than extend. Keeping it pure also makes every rule here directly testable.
 *
 * It is a **display-layer** control, and a secondary one: the BFF is the real security boundary
 * and now returns records with PII already redacted for callers who lack the permission. The
 * masking here is what runs when `PII_MASKING_ENABLED` (`./piiConfig.ts`) is on, and is switched
 * off where the backend has taken over so the two do not stack.
 *
 * Two things in this module are *not* display-layer and stay live either way, because they
 * protect the write path rather than the screen: the `permission` on each rule, which decides
 * whether a field is editable at all, and `omitUnviewableCustomerPii`, which keeps a redacted
 * value out of an update payload.
 *
 * Scope is customer data only. User/admin PII (`src/core/types/user.ts`) is deliberately
 * out of scope.
 */

/**
 * `lastN`     keep the final `keep` characters, mask the rest      -> `•••••••••0123`
 * `email`     keep one leading character and the domain            -> `m••••••@example.com`
 * `yearOnly`  keep the year, mask day and month                    -> `••/••/1990`
 * `truncate`  keep the first `keep` characters, mask the rest      -> `Somch••••`
 * `full`      reveal nothing                                       -> `••••`
 */
export type MaskStrategy = "lastN" | "email" | "yearOnly" | "truncate" | "full";

export interface PiiRule {
  strategy: MaskStrategy;
  /** Characters left in the clear. Meaningful for `lastN` and `truncate` only. */
  keep?: number;
  /** The permission that reveals this field. */
  permission: string;
}

/**
 * The permissions the backend grants, one per class of personal data.
 *
 * These replace the single `pii.view` this module used to carry. A rule left pointing at a
 * permission no role can be granted would mask its field permanently, so the old constant was
 * repointed rather than kept alongside these.
 *
 * `PermissionManager.hasPermission` is an exact match over a flattened list, so the extra path
 * segments cost nothing; `groupPermissionsByModule` still buckets all five under `pii`.
 */
export const PII_CASE_PHONE_PERMISSION = "pii.case.phoneNo";
export const PII_CUSTOMER_GENERAL_PERMISSION = "pii.customer.general.personal";
export const PII_CUSTOMER_SENSITIVE_PERMISSION = "pii.customer.sensitive.personal";

/**
 * Declared for completeness of the backend's taxonomy. Nothing reads them yet — user/admin PII
 * (`src/core/types/user.ts`) has no masking anywhere in the app, and wiring it is separate work.
 */
export const PII_USER_GENERAL_PERMISSION = "pii.user.general.personal";
export const PII_USER_SENSITIVE_PERMISSION = "pii.user.sensitive.personal";

const MASK_CHAR = "•";

/**
 * What every fail-closed path returns, and the whole of the `full` strategy.
 *
 * Fixed width on purpose: a length-matched mask would leak how long the hidden value is, and
 * for a `photo` URL it would render as an absurd wall of dots. Format preservation is
 * reserved for the strategies where it earns its keep — `lastN`, `email` and `yearOnly` —
 * because that is where a jumping column width is actually visible.
 */
const FULL_MASK = MASK_CHAR.repeat(4);

/**
 * The redaction marker, for callers that need to show "hidden" somewhere other than in place
 * of a value — the placeholder on a locked form input, for instance.
 */
export const PII_FULL_MASK = FULL_MASK;

/**
 * The address parts precise enough to identify a household.
 *
 * `country`, `province`, `district`, `subDistrict` and `postalCode` are deliberately absent:
 * area and zone routing views read them, and they are not identifying on their own.
 */
export const PRECISE_ADDRESS_PARTS = [
  "no",
  "road",
  "street",
  "building",
  "floor",
  "room",
  "lat",
  "lon",
] as const;

const addressRules = (prefix: string): Record<string, PiiRule> =>
  Object.fromEntries(
    PRECISE_ADDRESS_PARTS.map(part => [
      `${prefix}.${part}`,
      { strategy: "full", permission: PII_CUSTOMER_SENSITIVE_PERMISSION } as PiiRule,
    ])
  );

/**
 * Keyed by dotted path so nested address fields resolve without a separate lookup shape.
 *
 * The general/sensitive split matches what the backend masks on. It has to: the same rule
 * decides both what is hidden and what is stripped from an update payload, so a field the
 * frontend classes as `general` while the backend masks it as `sensitive` would be sent back
 * with the redaction in it.
 *
 * Note `mobileNo` — the customer's phone field. `phoneNo` belongs to Case/dispatch and is still
 * not listed: it is case-owned data, and while `PII_CASE_PHONE_PERMISSION` now exists for it,
 * no case surface reads it yet.
 */
export const CUSTOMER_PII_FIELDS: Record<string, PiiRule> = {
  // General — contact details the customer hands out to be reached on.
  mobileNo: { strategy: "lastN", keep: 4, permission: PII_CUSTOMER_GENERAL_PERMISSION },
  landline: { strategy: "lastN", keep: 4, permission: PII_CUSTOMER_GENERAL_PERMISSION },
  email: { strategy: "email", permission: PII_CUSTOMER_GENERAL_PERMISSION },

  // Sensitive — identity documents, date of birth, a face, and any address precise enough to
  // locate a household.
  citizenId: { strategy: "lastN", keep: 4, permission: PII_CUSTOMER_SENSITIVE_PERMISSION },
  dob: { strategy: "yearOnly", permission: PII_CUSTOMER_SENSITIVE_PERMISSION },
  photo: { strategy: "full", permission: PII_CUSTOMER_SENSITIVE_PERMISSION },
  ...addressRules("address"),
  ...addressRules("currentAddress"),
};

/** An absent value is left alone — masking one would falsely imply data exists. */
const isEmptyValue = (value: string | null | undefined): boolean =>
  value === null || value === undefined || value === "";

const maskLastN = (value: string, keep: number): string => {
  // `<=` not `<`: at equal length the "mask" would be the whole value in the clear.
  if (keep <= 0 || value.length <= keep) {
    return FULL_MASK;
  }
  return MASK_CHAR.repeat(value.length - keep) + value.slice(value.length - keep);
};

const maskTruncate = (value: string, keep: number): string => {
  if (keep <= 0 || value.length <= keep) {
    return FULL_MASK;
  }
  return value.slice(0, keep) + FULL_MASK;
};

const maskEmail = (value: string): string => {
  const atIndex = value.indexOf("@");

  // No `@`, or the address starts with one, means this is not an email address we can
  // partially reveal without guessing. Reveal nothing.
  if (atIndex <= 0) {
    return FULL_MASK;
  }

  const localPart = value.slice(0, atIndex);
  const domainPart = value.slice(atIndex);

  // A single-character local part is fully disclosed by "keep the first character", so it
  // gets masked outright: `a@example.com` -> `•@example.com`.
  const revealed = localPart.length > 1 ? 1 : 0;

  return localPart.slice(0, revealed) + MASK_CHAR.repeat(localPart.length - revealed) + domainPart;
};

const ISO_DATE_PREFIX = /^\s*(\d{4})-\d{2}-\d{2}/;
const MIN_YEAR = 1000;
const MAX_YEAR = 9999;

const maskYearOnly = (value: string): string => {
  const isoMatch = ISO_DATE_PREFIX.exec(value);
  // `Date.parse` is the fallback, never the first move: it coerces plenty of junk into a
  // real date, which would leak a year that was never in the input.
  const year = isoMatch ? Number(isoMatch[1]) : new Date(Date.parse(value)).getFullYear();

  if (!Number.isFinite(year) || year < MIN_YEAR || year > MAX_YEAR) {
    return FULL_MASK;
  }

  return `${MASK_CHAR.repeat(2)}/${MASK_CHAR.repeat(2)}/${year}`;
};

/**
 * Applies `rule` to `value`.
 *
 * Fails closed throughout: anything that cannot be partially masked with confidence — a
 * value too short to hide, an unparseable date, a strategy this module does not recognise —
 * returns a full mask rather than falling back to the original value.
 *
 * `null`, `undefined` and `""` are returned untouched, so callers can keep rendering their
 * own "-" placeholder for missing data.
 */
export const applyMask = (
  value: string | null | undefined,
  rule: PiiRule
): string | null | undefined => {
  if (isEmptyValue(value)) {
    return value;
  }

  const text = value as string;

  switch (rule.strategy) {
    case "lastN":
      return maskLastN(text, rule.keep ?? 0);
    case "truncate":
      return maskTruncate(text, rule.keep ?? 0);
    case "email":
      return maskEmail(text);
    case "yearOnly":
      return maskYearOnly(text);
    case "full":
      return FULL_MASK;
    default:
      // An unrecognised strategy is a bug, not a reason to show the raw value.
      return FULL_MASK;
  }
};

/** The rule for a dotted customer field path, or `undefined` if the field is not PII. */
export const getCustomerPiiRule = (path: string): PiiRule | undefined => CUSTOMER_PII_FIELDS[path];

export const isCustomerPiiField = (path: string): boolean => getCustomerPiiRule(path) !== undefined;

/**
 * Masks `value` if `path` is a classified customer field, otherwise returns it unchanged.
 *
 * This does **not** check permissions — callers decide whether to mask at all. See
 * `useMaskedValue` for the permission-aware wrapper.
 */
export const maskCustomerField = (
  path: string,
  value: string | null | undefined
): string | null | undefined => {
  const rule = getCustomerPiiRule(path);
  return rule ? applyMask(value, rule) : value;
};

/**
 * Masks the identifying parts of an address, leaving the coarse ones readable.
 *
 * Addresses are displayed as a single merged string (`mergeAddress` in
 * `src/cms/store/api/custommerApi.ts`), so there is no per-field seam to mask at render
 * time. Masking the object *before* it is merged is what produces
 * `••••, ••••, Khlong Toei, Bangkok, 10110` while leaving `mergeAddress` itself untouched.
 *
 * Returns a new object — the input is never mutated.
 *
 * `shouldMaskPart` lets the caller apply the viewer's permissions per part; it defaults to
 * masking every precise part, which is the behaviour every existing call site had. All eight
 * parts are sensitive today, so the predicate is uniform in practice — it exists so a later
 * reclassification of one part does not need a new function.
 *
 * Generic over the address shape so the result stays assignable to whatever type the caller
 * had, without this module importing it. `T extends object` rather than
 * `T extends Record<string, unknown>` because an `interface` with optional properties has no
 * index signature and would not satisfy the latter.
 */
export const maskAddressParts = <T extends object>(
  address: T,
  shouldMaskPart: (part: string) => boolean = () => true
): T => {
  const masked: Record<string, unknown> = { ...(address as Record<string, unknown>) };

  for (const part of PRECISE_ADDRESS_PARTS) {
    if (!shouldMaskPart(part)) {
      continue;
    }

    const value = masked[part];
    // Absent parts stay absent: writing a mask over a missing house number would imply the
    // record holds one.
    if (typeof value === "string" && value !== "") {
      masked[part] = FULL_MASK;
    }
  }

  return masked as T;
};

/**
 * The extension point for admin-built dynamic form fields, which have no PII classification
 * today (`IndividualFormField` carries `formRule` for validation and nothing for
 * sensitivity).
 *
 * Typed structurally rather than importing `IndividualFormField`, which would break this
 * module's zero-import rule and point `core` at `cms`.
 */
export interface PiiMarkedField {
  pii?: MaskStrategy | PiiRule;
}

/**
 * Resolves a dynamic field's PII rule, or `undefined` when it carries no marker.
 *
 * **Default-ALLOW by design.** An unmarked dynamic field renders normally — the alternative
 * would mask every free-text field an admin has ever created. This is the hook for marking
 * them explicitly later; it is not a classifier.
 */
export const getDynamicFieldPiiRule = (
  field: PiiMarkedField | null | undefined
): PiiRule | undefined => {
  const marker = field?.pii;

  if (!marker) {
    return undefined;
  }

  return typeof marker === "string"
    ? { strategy: marker, permission: PII_CUSTOMER_GENERAL_PERMISSION }
    : marker;
};

/**
 * Drops every classified customer field the viewer may not see from an update payload.
 *
 * This is the write-path counterpart to masking, and the reason masking's own switch must not
 * govern it. Once the backend redacts what it sends, an edit form loads `••••1234` into its
 * state, and `CustomerCreate`'s `handleSubmit` builds its PATCH body from that state rather than
 * from the DOM — so hiding the input is not protection. Omitting the key is. The customer PATCH
 * ignores absent keys, which makes this the semantically correct move rather than a workaround.
 *
 * `canView` receives the same dotted paths `CUSTOMER_PII_FIELDS` is keyed by, so a caller can
 * pass `usePiiMasker().canViewField` straight in.
 *
 * Returns a new object and shallow-copies any nested address it has to touch. The input, and any
 * sub-object it shares with React state, is never mutated.
 *
 * Constrained to `T extends object`, not `Record<string, unknown>`, for the same reason
 * `maskAddressParts` is: an `interface` such as `AddCustomer` has no index signature and would
 * not satisfy the latter.
 */
export const omitUnviewableCustomerPii = <T extends object>(
  payload: T,
  canView: (path: string) => boolean
): Partial<T> => {
  const result: Record<string, unknown> = { ...(payload as Record<string, unknown>) };
  // Tracks which nested objects have already been copied, so two masked parts of the same
  // address don't clone it twice — and, more importantly, so the second deletion lands on the
  // copy rather than on the caller's original.
  const copiedParents = new Set<string>();

  for (const path of Object.keys(CUSTOMER_PII_FIELDS)) {
    if (canView(path)) {
      continue;
    }

    const separatorIndex = path.indexOf(".");

    if (separatorIndex < 0) {
      delete result[path];
      continue;
    }

    const parentKey = path.slice(0, separatorIndex);
    const childKey = path.slice(separatorIndex + 1);

    if (!copiedParents.has(parentKey)) {
      const parent = result[parentKey];
      // A parent that is absent or not an object has no child to strip. Leave it exactly as it
      // came in rather than inventing an empty object in the payload.
      if (typeof parent !== "object" || parent === null) {
        continue;
      }
      result[parentKey] = { ...(parent as Record<string, unknown>) };
      copiedParents.add(parentKey);
    }

    delete (result[parentKey] as Record<string, unknown>)[childKey];
  }

  return result as Partial<T>;
};
