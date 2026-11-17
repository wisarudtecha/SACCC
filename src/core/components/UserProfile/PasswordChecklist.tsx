// src/core/components/UserProfile/PasswordChecklist.tsx
// State-free hints shared by the password dialogs.
//
// Both components live at module scope on purpose: a component declared inside another
// component's render body is a brand-new type on every render, so React unmounts and remounts
// the subtree instead of updating it (visible as flicker, and as lost state in the inputs).
import { useTranslation } from "@/core/hooks/useTranslation";
import type { PasswordValidation } from "@/core/utils/passwordValidation";

interface PasswordChecklistProps {
  validation: PasswordValidation;
}

const REQUIREMENTS = [
  {
    key: "minLength",
    isMet: (validation: PasswordValidation) => validation.hasMinLength
  },
  {
    key: "uppercase",
    isMet: (validation: PasswordValidation) => validation.hasUppercase
  },
  {
    key: "specialChar",
    isMet: (validation: PasswordValidation) => validation.hasSpecialChar
  }
] as const;

/**
 * The three password rules, each with its own pass/fail state. Colour is not the only signal:
 * the tick/cross glyph stays visible and a screen-reader-only "met"/"not met" word carries the
 * same information for assistive tech.
 */
export const PasswordChecklist = ({ validation }: PasswordChecklistProps) => {
  const { t } = useTranslation();

  return (
    <div className="space-y-1 text-xs">
      {REQUIREMENTS.map(requirement => {
        const met = requirement.isMet(validation);
        return (
          <div
            key={requirement.key}
            className={`flex items-center space-x-2 ${met ? "text-green-600 dark:text-green-300" : "text-red-600 dark:text-red-300"}`}
          >
            <span aria-hidden="true">{met ? "✓" : "✗"}</span>
            <span className="sr-only">
              {met ? t("userform.passwordValidation.met") : t("userform.passwordValidation.notMet")}
            </span>
            <span>{t(`userform.passwordValidation.${requirement.key}`)}</span>
          </div>
        );
      })}
    </div>
  );
};

interface PasswordMatchHintProps {
  newPassword: string;
  confirmPassword: string;
}

/** Whether the confirmation field still matches the new password. Renders nothing while empty. */
export const PasswordMatchHint = ({ newPassword, confirmPassword }: PasswordMatchHintProps) => {
  const { t } = useTranslation();

  if (!confirmPassword) {
    return null;
  }

  const matches = newPassword !== "" && newPassword === confirmPassword;

  return (
    <div className="space-y-1 text-xs">
      <div className={`flex items-center space-x-2 ${matches ? "text-green-600 dark:text-green-300" : "text-red-600 dark:text-red-300"}`}>
        <span aria-hidden="true">{matches ? "✓" : "✗"}</span>
        <span className="sr-only">
          {matches ? t("userform.passwordValidation.met") : t("userform.passwordValidation.notMet")}
        </span>
        <span>
          {matches
            ? t("userform.passwordsMatch")
            : t("userform.passwordsDoNotMatch")}
        </span>
      </div>
    </div>
  );
};
