// src/core/hooks/useMaskedValue.ts
import { useMemo } from "react";
import { useIsSystemAdmin } from "@/core/hooks/useIsSystemAdmin";
import { usePermissions } from "@/core/hooks/usePermissions";
import { PII_MASKING_ENABLED } from "@/core/security/piiConfig";
import {
  PII_CASE_PHONE_PERMISSION,
  PII_CUSTOMER_GENERAL_PERMISSION,
  PII_CUSTOMER_SENSITIVE_PERMISSION,
  PII_USER_GENERAL_PERMISSION,
  PII_USER_SENSITIVE_PERMISSION,
  applyMask,
  getCasePiiRule,
  getContactPiiRule,
  getCustomerPiiRule,
  getDynamicFieldPiiRule,
  maskAddressParts,
  maskCaseField,
  maskContactField,
  maskCustomerField,
  redactCaseField,
  redactContactField,
  redactCustomerField,
  redactValue,
} from "@/core/security/piiFields";
import type { PiiMarkedField } from "@/core/security/piiFields";

/** Which of the customer's two addresses a path belongs to, for `maskAddress`. */
export type AddressPrefix = "address" | "currentAddress";

export interface PiiMasker {
  /**
   * Whether this user may see the real value at `path`.
   *
   * A path with no rule is not classified, so it is always viewable — safe to call on a field
   * whose classification is still being decided.
   *
   * This is the write-path gate as much as the read one, and it does **not** consult
   * `PII_MASKING_ENABLED`: whether the frontend masks is a display question, whereas whether a
   * user may edit and submit a field is a permission question that holds either way.
   */
  canViewField: (path: string) => boolean;
  /** The same question for a dynamic form field, which carries its own rule. */
  canViewDynamicField: (field: PiiMarkedField | null | undefined) => boolean;
  /**
   * Whether this user may see the **case's** own PII at `path` (`phoneNo`).
   *
   * Separate from `canViewField` because they are different permissions on the backend: a case
   * phone number is case-owned data (`pii.case.phoneNo`), the customer record is not.
   */
  canViewCaseField: (path: string) => boolean;
  /**
   * Whether this user may see a **customer-contact** field (`contactPhone`).
   *
   * A third table because `/customer_contacts` is its own entity: a customer has many contacts,
   * each with its own number, and the permission class happens to be the same customer-record
   * one.
   */
  canViewContactField: (path: string) => boolean;
  /** Masks `value` if `path` is classified and this user can't see it. Identity when masking is off. */
  maskValue: (path: string, value: string | null | undefined) => string | null | undefined;
  /** `maskValue` for a case path. Identity when masking is off. */
  maskCaseValue: (path: string, value: string | null | undefined) => string | null | undefined;
  /** `maskValue` for a customer-contact path. Identity when masking is off. */
  maskContactValue: (path: string, value: string | null | undefined) => string | null | undefined;
  /** Masks the precise parts of one of the customer's addresses. Identity when masking is off. */
  maskAddress: <T extends object>(address: T | undefined, prefix: AddressPrefix) => T | undefined;
  /**
   * Masks `value` per a dynamic form field's own `pii` marker, or returns it unchanged when
   * the field carries no marker. Identity when masking is off.
   *
   * Distinct from `maskValue`: that one looks up `path` in the static `CUSTOMER_PII_FIELDS`
   * table built for the 22 known customer fields. Dynamic fields carry their own rule
   * directly on the field object instead, since an admin can create arbitrarily many of them.
   */
  maskDynamicField: (field: PiiMarkedField, value: string | null | undefined) => string | null | undefined;
  /**
   * The **locked-field** family: redaction for a field this viewer may not see.
   *
   * Every one of these ignores `PII_MASKING_ENABLED` and answers only to permissions, which is
   * the whole reason they exist separately from the `mask*` family. "Does the client mask?" is a
   * display question about which layer the deployment put in charge; "may this viewer see this
   * value?" is a permission question, and a field the answer excludes must never render its real
   * value — including when the backend sent one by mistake.
   *
   * Use these for a field rendered as **text because it cannot be edited**, and the `mask*` ones
   * for a read-only surface that is only deciding how much to reveal. A locked field is never an
   * `<input disabled>`: a disabled input still advertises a field the user cannot have.
   */
  redactValue: (path: string, value: string | null | undefined) => string | null | undefined;
  /** `redactValue` for a case path. */
  redactCaseValue: (path: string, value: string | null | undefined) => string | null | undefined;
  /** `redactValue` for a customer-contact path. */
  redactContactValue: (path: string, value: string | null | undefined) => string | null | undefined;
  /** Redacts the parts of an address this viewer may not see. Never identity for those parts. */
  redactAddress: <T extends object>(address: T | undefined, prefix: AddressPrefix) => T | undefined;
  /** Redacts a dynamic form field's value when this viewer may not see it. */
  redactDynamicField: (
    field: PiiMarkedField,
    value: string | null | undefined
  ) => string | null | undefined;
}

/**
 * The permission-aware face of `src/core/security/piiFields.ts`.
 *
 * Returns a callable masker rather than a masked value, because the values that need masking
 * are not all known at render-time in a fixed order — `ContactChannelList` masks rows inside
 * a `socials.map(...)`, and the Rules of Hooks forbid a hook call per row. Anything that
 * masks exactly one known field can use `useMaskedValue` below instead.
 *
 * Access mirrors `PermissionGate`: the field's own permission, or system-admin. Note
 * `useIsSystemAdmin` starts `false` and flips asynchronously, so the first render always
 * reports non-admin. For masking that is the safe direction — masked-then-revealed, never
 * revealed-then-masked.
 */
export const usePiiMasker = (): PiiMasker => {
  const { hasPermission } = usePermissions();
  const isSystemAdmin = useIsSystemAdmin();

  // Resolved eagerly, one boolean per permission in the backend's taxonomy, so the memo below
  // can depend on stable primitives. `usePermissions()` builds a fresh object on every render,
  // so depending on it (or on `hasPermission`) directly would hand out a new masker each time
  // and defeat any downstream memoisation.
  const canViewCasePhone = isSystemAdmin || hasPermission(PII_CASE_PHONE_PERMISSION);
  const canViewCustomerGeneral = isSystemAdmin || hasPermission(PII_CUSTOMER_GENERAL_PERMISSION);
  const canViewCustomerSensitive = isSystemAdmin || hasPermission(PII_CUSTOMER_SENSITIVE_PERMISSION);
  const canViewUserGeneral = isSystemAdmin || hasPermission(PII_USER_GENERAL_PERMISSION);
  const canViewUserSensitive = isSystemAdmin || hasPermission(PII_USER_SENSITIVE_PERMISSION);

  return useMemo<PiiMasker>(() => {
    const grants: Record<string, boolean> = {
      [PII_CASE_PHONE_PERMISSION]: canViewCasePhone,
      [PII_CUSTOMER_GENERAL_PERMISSION]: canViewCustomerGeneral,
      [PII_CUSTOMER_SENSITIVE_PERMISSION]: canViewCustomerSensitive,
      [PII_USER_GENERAL_PERMISSION]: canViewUserGeneral,
      [PII_USER_SENSITIVE_PERMISSION]: canViewUserSensitive,
    };

    // Fails closed on an unrecognised permission. The form builder only ever writes one of the
    // five above, so reaching this means a hand-edited `formFieldJson` or a permission the
    // backend renamed — in both cases hiding the field is the safe reading.
    const isGranted = (permission: string): boolean => grants[permission] ?? false;

    const canViewField = (path: string): boolean => {
      const rule = getCustomerPiiRule(path);
      return rule ? isGranted(rule.permission) : true;
    };

    const canViewDynamicField = (field: PiiMarkedField | null | undefined): boolean => {
      const rule = getDynamicFieldPiiRule(field);
      return rule ? isGranted(rule.permission) : true;
    };

    const canViewCaseField = (path: string): boolean => {
      const rule = getCasePiiRule(path);
      return rule ? isGranted(rule.permission) : true;
    };

    const canViewContactField = (path: string): boolean => {
      const rule = getContactPiiRule(path);
      return rule ? isGranted(rule.permission) : true;
    };

    return {
      canViewField,
      canViewDynamicField,
      canViewCaseField,
      canViewContactField,
      maskValue: (path, value) =>
        PII_MASKING_ENABLED && !canViewField(path) ? maskCustomerField(path, value) : value,
      maskCaseValue: (path, value) =>
        PII_MASKING_ENABLED && !canViewCaseField(path) ? maskCaseField(path, value) : value,
      maskContactValue: (path, value) =>
        PII_MASKING_ENABLED && !canViewContactField(path) ? maskContactField(path, value) : value,
      maskAddress: <T extends object>(address: T | undefined, prefix: AddressPrefix) => {
        if (!PII_MASKING_ENABLED || !address) {
          return address;
        }
        return maskAddressParts(address, part => !canViewField(`${prefix}.${part}`));
      },
      maskDynamicField: (field, value) => {
        if (!PII_MASKING_ENABLED || canViewDynamicField(field)) {
          return value;
        }
        const rule = getDynamicFieldPiiRule(field);
        return rule ? applyMask(value, rule) : value;
      },

      // The locked-field family. Note the absence of a `PII_MASKING_ENABLED` check: these run
      // in every deployment, because a field this viewer may not see must not render its value
      // even when the backend failed to redact it.
      redactValue: (path, value) => redactCustomerField(path, value, canViewField),
      redactCaseValue: (path, value) => redactCaseField(path, value, canViewCaseField),
      redactContactValue: (path, value) => redactContactField(path, value, canViewContactField),
      redactAddress: <T extends object>(address: T | undefined, prefix: AddressPrefix) => {
        if (!address) {
          return address;
        }
        return maskAddressParts(address, part => !canViewField(`${prefix}.${part}`));
      },
      redactDynamicField: (field, value) =>
        redactValue(value, getDynamicFieldPiiRule(field), canViewDynamicField(field)),
    };
  }, [
    canViewCasePhone,
    canViewCustomerGeneral,
    canViewCustomerSensitive,
    canViewUserGeneral,
    canViewUserSensitive,
  ]);
};

/**
 * Masks a single known customer field.
 *
 * Convenience over `usePiiMasker` for the common case of one field in one place. Use the
 * masker directly when the number of values varies at runtime.
 */
export const useMaskedValue = (
  path: string,
  value: string | null | undefined
): string | null | undefined => {
  const { maskValue } = usePiiMasker();
  return maskValue(path, value);
};
