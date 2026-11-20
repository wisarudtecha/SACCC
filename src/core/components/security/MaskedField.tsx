// src/core/components/security/MaskedField.tsx
import { usePiiMasker } from "@/core/hooks/useMaskedValue";

/**
 * Renders one PII field as text, redacted for a viewer who may not see it.
 *
 * `path` is the dotted key from `CUSTOMER_PII_FIELDS` (`mobileNo`, `address.no`, ...). A path
 * that is not classified renders unchanged, so this is safe to wrap around a field whose
 * classification is still being decided.
 *
 * **Redaction is not the same question as masking.** This uses `redactValue`, which ignores
 * `PII_MASKING_ENABLED` and answers only to permissions — so the value is hidden here in every
 * deployment, including one whose backend has not started redacting yet. That is deliberate: this
 * component is what stands in for an input the user may not fill in, and a locked field must
 * never show a real value. Do not switch it to `maskValue` to "let the backend own it": that
 * turns every not-yet-migrated deployment into a data leak.
 *
 * Plain text, not a disabled input, because a disabled input still advertises a field the user
 * cannot have. Pass `className` to give it the surrounding form's value styling; without one it
 * renders as a bare fragment.
 *
 * **Text only.** Two customer fields deliberately do not belong here:
 *   - `photo` is a URL — a redaction string in an `<img src>` is a broken image. Branch on
 *     `usePiiMasker().canViewField("photo")` and fall back to the placeholder the call site
 *     already has.
 *   - `dob` redacts to the fixed literal `**`/`**`/1990`, so it must be rendered *instead of*
 *     `formatDate(...)`, never passed through it.
 *
 * Never render the output into a form input — saving the form would write the redaction back
 * over the real record.
 */
export const MaskedField: React.FC<{
  path: string;
  value: string | null | undefined;
  /** Shown when the value is absent. Redaction leaves empty values untouched. */
  fallback?: React.ReactNode;
  /** When set, wraps the text so it can be styled to match the surrounding form. */
  className?: string;
}> = ({ path, value, fallback = "-", className }) => {
  const { redactValue } = usePiiMasker();
  const redactedValue = redactValue(path, value);
  const content = redactedValue ? redactedValue : fallback;

  if (className) {
    return <p className={className}>{content}</p>;
  }

  return <>{content}</>;
};

export default MaskedField;
