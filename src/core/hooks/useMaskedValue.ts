// src/core/hooks/useMaskedValue.ts
import { useMemo } from "react";
import { useIsSystemAdmin } from "@/core/hooks/useIsSystemAdmin";
import { usePermissions } from "@/core/hooks/usePermissions";
import {
  PII_FULL_MASK,
  PII_VIEW_PERMISSION,
  applyMask,
  getCustomerPiiRule,
  getDynamicFieldPiiRule,
  maskAddressParts,
  maskCustomerField,
} from "@/core/security/piiFields";
import type { PiiMarkedField } from "@/core/security/piiFields";

/**
 * Props that lock a form input, spread over whatever the field already declares.
 *
 * Empty when the field is viewable, so the same spread is harmless on every input.
 */
export interface LockedPiiInputProps {
  disabled?: boolean;
  value?: string;
  placeholder?: string;
}

export interface PiiMasker {
  /** True when this user may see unmasked customer PII. */
  canViewPii: boolean;
  /** Masks `value` if `path` is a classified customer field. Identity when `canViewPii`. */
  maskValue: (path: string, value: string | null | undefined) => string | null | undefined;
  /** Masks the precise parts of an address. Identity when `canViewPii`. */
  maskAddress: <T extends object>(address: T | undefined) => T | undefined;
  /**
   * Masks `value` per a dynamic form field's own `pii` marker, or returns it unchanged when
   * the field carries no marker. Identity when `canViewPii`.
   *
   * Distinct from `maskValue`: that one looks up `path` in the static `CUSTOMER_PII_FIELDS`
   * table built for the 22 known customer fields. Dynamic fields carry their own rule
   * directly on the field object instead, since an admin can create arbitrarily many of them.
   */
  maskDynamicField: (field: PiiMarkedField, value: string | null | undefined) => string | null | undefined;
  /**
   * Locks a PII form input for users without `pii.view`.
   *
   * Spread this **after** `value` so it overrides what the field would otherwise render:
   *
   * ```tsx
   * <Input name="citizenId" value={formData.citizenId} onChange={...} {...lockPiiInput("citizenId")} />
   * ```
   *
   * It blanks the *display* only. The real value stays in the form's own state and is what
   * gets validated and submitted, so locking a field never overwrites the record — which is
   * exactly why a masked string must never be used here instead.
   */
  lockPiiInput: (path: string) => LockedPiiInputProps;
}

/** Nothing to override — the field renders and behaves as its own JSX declares. */
const UNLOCKED: LockedPiiInputProps = {};

/**
 * The permission-aware face of `src/core/security/piiFields.ts`.
 *
 * Returns a callable masker rather than a masked value, because the values that need masking
 * are not all known at render-time in a fixed order — `ContactChannelList` masks rows inside
 * a `socials.map(...)`, and the Rules of Hooks forbid a hook call per row. Anything that
 * masks exactly one known field can use `useMaskedValue` below instead.
 *
 * Access mirrors `PermissionGate`: the `pii.view` permission, or system-admin. Note
 * `useIsSystemAdmin` starts `false` and flips asynchronously, so the first render always
 * reports non-admin. For masking that is the safe direction — masked-then-revealed, never
 * revealed-then-masked.
 */
export const usePiiMasker = (): PiiMasker => {
  const { hasPermission } = usePermissions();
  const isSystemAdmin = useIsSystemAdmin();

  const canViewPii = hasPermission(PII_VIEW_PERMISSION) || isSystemAdmin;

  // Memoised on the boolean alone. `usePermissions()` builds a fresh object on every render,
  // so depending on it directly would hand out a new masker each time and defeat any
  // downstream memoisation.
  return useMemo<PiiMasker>(() => ({
    canViewPii,
    maskValue: (path, value) => (canViewPii ? value : maskCustomerField(path, value)),
    maskAddress: <T extends object>(address: T | undefined) => {
      if (canViewPii || !address) {
        return address;
      }
      return maskAddressParts(address);
    },
    maskDynamicField: (field, value) => {
      if (canViewPii) {
        return value;
      }
      const rule = getDynamicFieldPiiRule(field);
      return rule ? applyMask(value, rule) : value;
    },
    lockPiiInput: (path) => {
      if (canViewPii || !getCustomerPiiRule(path)) {
        return UNLOCKED;
      }
      return { disabled: true, value: "", placeholder: PII_FULL_MASK };
    },
  }), [canViewPii]);
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
