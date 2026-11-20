// src/core/security/piiFields.ts
/**
 * Which customer fields count as personally identifying, and how each one is masked.
 *
 * This module is deliberately **dependency-free**: string paths in, masked strings out. It
 * holds no React, no permission lookup and no knowledge of the customer types — those live
 * in `cms`, and `CLAUDE.md` treats `core` -> `cms` imports as an existing tangle to work
 * around rather than extend. Keeping it pure also makes every rule here directly testable.
 *
 * **The BFF is the masking layer.** It returns records whose PII is already redacted for
 * callers who lack the permission, using `*` as the redaction character - the same character
 * this module produces, on purpose: the backend's write-back safeguard recognises a masked
 * value by that pattern and restores the stored one, so an echoed mask is safe and a mask made
 * of a *different* character would be written over the real record.
 *
 * The client-side masking in this module is therefore a **fallback** for deployments whose
 * backend does not mask yet (`PII_MASKING_ENABLED` in `./piiConfig.ts`, off by default). What
 * stays live in every deployment is everything that is *not* about the screen:
 *
 *   - the `permission` on each rule, which decides whether a field may be edited at all, and
 *   - the `redact*` helpers, which produce the value a **locked** field displays. They are
 *     deliberately not gated by `PII_MASKING_ENABLED`: a field the viewer may not see must
 *     never render its real value, however the BFF came to send one.
 *
 * Scope covers the customer record (`CUSTOMER_PII_FIELDS`) and the case's own phone number
 * (`CASE_PII_FIELDS`). User/admin PII (`src/core/types/user.ts`) is deliberately out of scope.
 */

/**
 * `lastN`     keep the final `keep` characters, mask the rest      -> `******0123`
 * `email`     keep one leading character and the domain            -> `m******@example.com`
 * `yearOnly`  keep the year, mask day and month                    -> `**`/`**`/1990`
 * `truncate`  keep the first `keep` characters, mask the rest      -> `Somch****`
 * `full`      reveal nothing                                       -> `****`
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
 *
 * **Which permission a rule may point at is the backend's decision, not ours.** The mapping
 * below is not the intuitive one, and it is deliberate — it is the backend's published PII
 * contract (the permission matrix of 2026-11-17):
 *
 *   - the **customer record** — every customer column, in every customer endpoint — is one
 *     class, `pii.user.sensitive.personal`. There is no general/sensitive split on the customer
 *     entity itself.
 *   - the **dynamic form fields** an admin marks are the only place the two-way
 *     `pii.customer.general.personal` / `pii.customer.sensitive.personal` split applies
 *     (see `piiPresets.ts` in `cms`, which is where an admin picks the class).
 *   - the **case's own phone number** is `pii.case.phoneNo`.
 *
 * A rule pointed at the wrong one of these fails silently in the worst way: the field is
 * either masked for everybody or editable by everybody, and nothing errors.
 */
export const PII_CASE_PHONE_PERMISSION = "pii.case.phoneNo";
export const PII_CUSTOMER_GENERAL_PERMISSION = "pii.customer.general.personal";
export const PII_CUSTOMER_SENSITIVE_PERMISSION = "pii.customer.sensitive.personal";

/**
 * `pii.user.sensitive.personal` is the customer record's class (see above). The general tier
 * exists in the backend's taxonomy for user/admin records (`src/core/types/user.ts`), which have
 * no masking anywhere in the app yet — wiring it is separate work.
 */
export const PII_USER_GENERAL_PERMISSION = "pii.user.general.personal";
export const PII_USER_SENSITIVE_PERMISSION = "pii.user.sensitive.personal";

/**
 * The redaction character.
 *
 * `*` rather than a bullet, because this is the character the BFF itself masks with: its
 * write-back safeguard recognises a masked value by this pattern, so anything this module
 * produces has to be recognisable as a mask. A prettier character here would turn every echoed
 * redaction into a real value written over the record.
 */
const MASK_CHAR = "*";

/**
 * What every fail-closed path returns, and the whole of the `full` strategy.
 *
 * Fixed width on purpose: a length-matched mask would leak how long the hidden value is, and
 * for a `photo` URL it would render as an absurd wall of asterisks. Format preservation is
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
 * Every part of an address.
 *
 * This used to be the household-identifying half only, excluding `country`, `province`,
 * `district`, `subDistrict` and `postalCode` on the argument that area/zone routing views read
 * them. The backend's contract masks `address.*` as a whole (`parameters: ["address.*"]` on the
 * customer endpoints), and the two have to agree: this same list decides what is stripped from
 * an update payload, so a part the client treats as public while the backend masks it would be
 * sent back with the redaction in it.
 *
 * The consequence is real and accepted: an address is editable only by a viewer who may see the
 * customer record at all, including its province/district selectors.
 */
export const ADDRESS_PARTS = [
  "no",
  "road",
  "street",
  "building",
  "floor",
  "room",
  "lat",
  "lon",
  "subDistrict",
  "district",
  "province",
  "postalCode",
  "country",
] as const;

const addressRules = (prefix: string): Record<string, PiiRule> =>
  Object.fromEntries(
    ADDRESS_PARTS.map(part => [
      `${prefix}.${part}`,
      { strategy: "full", permission: PII_USER_SENSITIVE_PERMISSION } as PiiRule,
    ])
  );

/**
 * Keyed by dotted path so nested address fields resolve without a separate lookup shape.
 *
 * Every entry points at `PII_USER_SENSITIVE_PERMISSION`, because the backend files the whole
 * customer record under one class (see the permission comment above). The rule has to match what
 * the backend masks on: it decides both what is hidden and what is stripped from an update
 * payload, so a field the frontend classes differently from the backend would be sent back with
 * the redaction in it.
 *
 * `phoneNo` belongs to Case/dispatch rather than to the customer, and lives in `CASE_PII_FIELDS`
 * below.
 */
export const CUSTOMER_PII_FIELDS: Record<string, PiiRule> = {
  // Contact details the customer hands out to be reached on.
  mobileNo: { strategy: "lastN", keep: 4, permission: PII_USER_SENSITIVE_PERMISSION },
  landline: { strategy: "lastN", keep: 4, permission: PII_USER_SENSITIVE_PERMISSION },
  email: { strategy: "email", permission: PII_USER_SENSITIVE_PERMISSION },

  // Identity documents, date of birth, a face, and any address precise enough to locate a
  // household.
  citizenId: { strategy: "lastN", keep: 4, permission: PII_USER_SENSITIVE_PERMISSION },
  dob: { strategy: "yearOnly", permission: PII_USER_SENSITIVE_PERMISSION },
  photo: { strategy: "full", permission: PII_USER_SENSITIVE_PERMISSION },

  // Health-related, and the backend files them with the rest of the record rather than in a
  // class of their own. `full` rather than a partial reveal: both are single-token values
  // ("Female", "O"), so keeping any character would disclose the whole answer.
  gender: { strategy: "full", permission: PII_USER_SENSITIVE_PERMISSION },
  blood: { strategy: "full", permission: PII_USER_SENSITIVE_PERMISSION },

  ...addressRules("address"),
  ...addressRules("currentAddress"),
};

/**
 * The case's own phone number, which is case-owned data rather than a column of the customer
 * record — hence its own permission.
 *
 * Keyed by dotted path for symmetry with `CUSTOMER_PII_FIELDS`, so `canViewField`-style lookups
 * and the (single, flat) case payload read the same way.
 */
export const CASE_PII_FIELDS: Record<string, PiiRule> = {
  phoneNo: { strategy: "lastN", keep: 4, permission: PII_CASE_PHONE_PERMISSION },
};

/**
 * The customer-**contact** record's own PII — the `contactPhone` column of
 * `CustomerContact` (`/customer_contacts`).
 *
 * A table of its own rather than an entry in `CUSTOMER_PII_FIELDS`, for two reasons: the entity
 * is not the customer (a customer has many contacts, each with its own number), and
 * `omitUnviewableCustomerPii` walks the customer table by key — adding `contactPhone` there
 * would make it try to strip a field the customer payload never carries.
 *
 * The permission class is the same customer-record one the backend uses for the whole
 * `customer_contacts` group (contract rows 5-7).
 */
export const CONTACT_PII_FIELDS: Record<string, PiiRule> = {
  contactPhone: { strategy: "lastN", keep: 4, permission: PII_USER_SENSITIVE_PERMISSION },
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
  // gets redacted outright: `a@example.com` -> `*@example.com`.
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

/** The rule for a dotted case field path, or `undefined` if the field is not PII. */
export const getCasePiiRule = (path: string): PiiRule | undefined => CASE_PII_FIELDS[path];

export const isCasePiiField = (path: string): boolean => getCasePiiRule(path) !== undefined;

/**
 * Masks `value` if `path` is a classified case field, otherwise returns it unchanged.
 *
 * The case counterpart of `maskCustomerField`; like it, this does **not** check permissions.
 */
export const maskCaseField = (
  path: string,
  value: string | null | undefined
): string | null | undefined => {
  const rule = getCasePiiRule(path);
  return rule ? applyMask(value, rule) : value;
};

/** The rule for a dotted customer-contact path, or `undefined` if the field is not PII. */
export const getContactPiiRule = (path: string): PiiRule | undefined => CONTACT_PII_FIELDS[path];

export const isContactPiiField = (path: string): boolean =>
  getContactPiiRule(path) !== undefined;

/**
 * Masks `value` if `path` is a classified customer-contact field, otherwise returns it unchanged.
 *
 * The customer-contact counterpart of `maskCustomerField`; like it, this does **not** check
 * permissions.
 */
export const maskContactField = (
  path: string,
  value: string | null | undefined
): string | null | undefined => {
  const rule = getContactPiiRule(path);
  return rule ? applyMask(value, rule) : value;
};

/**
 * What a **locked** field displays: the redaction, unless the viewer may see the real value.
 *
 * This is the one masking-adjacent helper that is **not** gated by `PII_MASKING_ENABLED`, and
 * the distinction is the whole point. "Does the client mask?" is a display question about which
 * layer the deployment put in charge. "May this viewer see this value?" is a permission
 * question, and its answer cannot depend on the first: a locked field must never render a real
 * value, however the BFF came to send one — including the case where the backend masks nothing
 * yet and the browser is the last line of defence.
 *
 * Fails closed: an unrecognised strategy inside `applyMask` still redacts.
 */
export const redactValue = (
  value: string | null | undefined,
  rule: PiiRule | undefined,
  canView: boolean
): string | null | undefined => (canView || !rule ? value : applyMask(value, rule));

/** `redactValue` for a customer-contact path. */
export const redactContactField = (
  path: string,
  value: string | null | undefined,
  canViewContactField: (path: string) => boolean
): string | null | undefined =>
  redactValue(value, getContactPiiRule(path), canViewContactField(path));

/** `redactValue` for a customer path. `canViewField` receives the same dotted keys. */
export const redactCustomerField = (
  path: string,
  value: string | null | undefined,
  canViewField: (path: string) => boolean
): string | null | undefined => redactValue(value, getCustomerPiiRule(path), canViewField(path));

/** `redactValue` for a case path. */
export const redactCaseField = (
  path: string,
  value: string | null | undefined,
  canViewCaseField: (path: string) => boolean
): string | null | undefined => redactValue(value, getCasePiiRule(path), canViewCaseField(path));

/**
 * Whether the viewer may **edit** the case's phone field.
 *
 * That one input has two owners, and this is the only place the rule is written down: it
 * displays `customerData.mobileNo` — a column of the customer record, so
 * `pii.user.sensitive.personal` — and it is submitted as the case's own `phoneNo`, so
 * `pii.case.phoneNo`. Editing it is only honest when the viewer may do both, because with
 * either one missing the write is a no-op: the backend's write-back safeguard restores the
 * stored value, so a field left editable would accept a number and silently not persist it.
 *
 * Takes the two predicates rather than a hook so it stays pure and testable — pass
 * `usePiiMasker().canViewCaseField` and `.canViewField` straight in.
 */
export const canEditCasePhoneNo = (
  canViewCaseField: (path: string) => boolean,
  canViewCustomerField: (path: string) => boolean
): boolean => canViewCaseField("phoneNo") && canViewCustomerField("mobileNo");

/**
 * Masks an address per part, keeping the shape so the merged display still reads as an address.
 *
 * Addresses are displayed as a single merged string (`mergeAddress` in
 * `src/cms/store/api/custommerApi.ts`), so there is no per-field seam to mask at render
 * time. Masking the object *before* it is merged is what produces
 * `****, ****, Khlong Toei, Bangkok, 10110` while leaving `mergeAddress` itself untouched.
 *
 * Returns a new object — the input is never mutated.
 *
 * `shouldMaskPart` lets the caller apply the viewer's permissions per part; it defaults to
 * masking every part, which is the behaviour every existing call site had. Every part is
 * classified today (`ADDRESS_PARTS`), so the predicate is uniform in practice — it exists so a
 * later reclassification of one part does not need a new function.
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

  for (const part of ADDRESS_PARTS) {
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
 * govern it. Once the backend redacts what it sends, an edit form loads `****1234` into its
 * state, and `CustomerCreate`'s `handleSubmit` builds its PATCH body from that state rather than
 * from the DOM — so hiding the input is not protection. Omitting the key is. The customer PATCH
 * ignores absent keys, which makes this the semantically correct move rather than a workaround.
 *
 * Belt and braces rather than the only defence: the backend's write-back safeguard also
 * recognises an echoed redaction and restores the stored value (see this module's header). Both
 * mechanisms are kept because each covers a case the other cannot — the safeguard cannot help a
 * payload that carries a redaction in a field it does not classify, and the omit cannot help a
 * caller that never runs it.
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
