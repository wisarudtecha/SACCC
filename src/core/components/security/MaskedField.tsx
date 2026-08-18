// src/core/components/security/MaskedField.tsx
import { useMaskedValue } from "@/core/hooks/useMaskedValue";

/**
 * Renders one customer PII field as text, masked unless the user holds `pii.view`.
 *
 * `path` is the dotted key from `CUSTOMER_PII_FIELDS` (`mobileNo`, `address.no`, ...). A path
 * that is not classified renders unchanged, so this is safe to wrap around a field whose
 * classification is still being decided.
 *
 * **Text only.** Two customer fields deliberately do not belong here:
 *   - `photo` is a URL — a mask string in an `<img src>` is a broken image. Branch on
 *     `usePiiMasker().canViewPii` and fall back to the placeholder the call site already has.
 *   - `dob` masks to the fixed literal `••/••/1990`, so it must be rendered *instead of*
 *     `formatDate(...)`, never passed through it.
 *
 * For read/display surfaces only. Never render the output into a form input — saving the
 * form would write the mask string back over the real record.
 */
export const MaskedField: React.FC<{
  path: string;
  value: string | null | undefined;
  /** Shown when the value is absent. Masking leaves empty values untouched. */
  fallback?: React.ReactNode;
}> = ({ path, value, fallback = "-" }) => {
  const maskedValue = useMaskedValue(path, value);

  return <>{maskedValue ? maskedValue : fallback}</>;
};
