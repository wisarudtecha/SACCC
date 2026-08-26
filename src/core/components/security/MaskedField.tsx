// src/core/components/security/MaskedField.tsx
import { useMaskedValue } from "@/core/hooks/useMaskedValue";

/**
 * Renders one customer PII field as text.
 *
 * `path` is the dotted key from `CUSTOMER_PII_FIELDS` (`mobileNo`, `address.no`, ...). A path
 * that is not classified renders unchanged, so this is safe to wrap around a field whose
 * classification is still being decided.
 *
 * What it shows depends on who is masking. With frontend masking on, it applies the field's own
 * rule. With it off, the value has already been redacted by the backend and passes through
 * untouched. Either way the caller does not have to know which mode is live.
 *
 * On an edit form this is what stands in for the input a user may not fill in — plain text, not
 * a disabled input, because a disabled input still advertises a field they cannot have. Pass
 * `className` to give it the surrounding form's value styling; without one it renders as a bare
 * fragment.
 *
 * **Text only.** Two customer fields deliberately do not belong here:
 *   - `photo` is a URL — a mask string in an `<img src>` is a broken image. Branch on
 *     `usePiiMasker().canViewField("photo")` and fall back to the placeholder the call site
 *     already has.
 *   - `dob` masks to the fixed literal `••/••/1990`, so it must be rendered *instead of*
 *     `formatDate(...)`, never passed through it.
 *
 * Never render the output into a form input — saving the form would write the mask string back
 * over the real record.
 */
export const MaskedField: React.FC<{
  path: string;
  value: string | null | undefined;
  /** Shown when the value is absent. Masking leaves empty values untouched. */
  fallback?: React.ReactNode;
  /** When set, wraps the text so it can be styled to match the surrounding form. */
  className?: string;
}> = ({ path, value, fallback = "-", className }) => {
  const maskedValue = useMaskedValue(path, value);
  const content = maskedValue ? maskedValue : fallback;

  if (className) {
    return <p className={className}>{content}</p>;
  }

  return <>{content}</>;
};

export default MaskedField;
