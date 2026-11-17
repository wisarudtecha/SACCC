// /src/components/UserProfile/ResetPasswordModal.tsx
import { useState } from "react";
import { AlertIcon, CheckCircleIcon } from "@/core/icons";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/core/components/ui/dialog/dialog";
import { useIsSystemAdmin } from "@/core/hooks/useIsSystemAdmin";
import { usePermissions } from "@/core/hooks/usePermissions";
import { useTranslation } from "@/core/hooks/useTranslation";
import { useResetPasswordMutation } from "@/core/store/api/userApi";
import { readEnvelopeMessage, readEnvelopeStatus } from "@/core/utils/apiResponseStatus";
import type { EnvelopeLike } from "@/core/utils/apiResponseStatus";
import { validatePassword } from "@/core/utils/passwordValidation";
import type { PasswordValidation } from "@/core/utils/passwordValidation";
import type { ResetPasswordModalProps } from "@/core/types/user";
import PasswordInput from "@/core/components/form/input/PasswordInput";
import Label from "@/core/components/form/Label";
import Button from "@/core/components/ui/button/Button";
import { PasswordChecklist, PasswordMatchHint } from "@/core/components/UserProfile/PasswordChecklist";

const EMPTY_VALIDATION: PasswordValidation = {
  isValid: false,
  hasMinLength: false,
  hasUppercase: false,
  hasSpecialChar: false
};

const ResetPasswordModal = ({
  isOpen,
  onClose,
  email,
  username,
  displayName,
  onSuccess
}: ResetPasswordModalProps) => {
  const { t } = useTranslation();
  const permissions = usePermissions();
  const isSystemAdmin = useIsSystemAdmin();
  const [resetPassword, { isLoading: loading }] = useResetPasswordMutation();

  // Setting *another* user's password requires `user.reset_password`. UserMetaCard already gates
  // the render, but this component is exported and independently importable, so it re-checks here.
  // Note this is defence in depth, not the control: the request now carries the Bearer token so
  // the BFF can enforce the permission server-side, which is what actually closes the hole.
  const canResetOthers = permissions.hasPermission("user.reset_password") || isSystemAdmin;

  // The target's identity is no longer typed by the admin — it is read off the account record
  // this dialog was opened from. POST /users/reset_password (User.ResetPassword) still identifies
  // the account by email + username, so both go into the payload exactly as before; only the
  // re-entry is gone. They are trimmed and validated here because the GraphQL input cleaner drops
  // empty strings: a blank value would reach the BFF as a *missing* field and come back as an
  // opaque rejection instead of an obvious "who are we resetting?" error.
  const targetEmail = (email ?? "").trim();
  const targetUsername = (username ?? "").trim();
  const hasTargetIdentity = targetEmail !== "" && targetUsername !== "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [passwordValidation, setPasswordValidation] = useState<PasswordValidation>(EMPTY_VALIDATION);

  const handleReset = async () => {
    if (!canResetOthers) {
      setError(t("userform.unauthorized"));
      return;
    }

    if (!hasTargetIdentity) {
      setError(t("userform.resetPasswordTargetMissing"));
      return;
    }

    if (!newPassword) {
      setError(t("userform.newPasswordRequired"));
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(t("userform.passwordMismatch"));
      return;
    }

    if (newPassword.length < 8) {
      setError(t("userform.passwordTooShort"));
      return;
    }

    if (!validatePassword(newPassword).isValid) {
      setError(t("userform.passwordRequirementsNotMet"));
      return;
    }

    setError("");

    try {
      // Same payload shape as before: email + username + newPassword.
      const response = await resetPassword({
        email: targetEmail,
        username: targetUsername,
        newPassword
      }).unwrap();

      // A business failure comes back HTTP 200 with a negative envelope, so .unwrap() resolving
      // is not proof of success — inspect the envelope. "unknown" is deliberately treated as
      // failure here: a false failure costs a retry, a false success tells the admin the password
      // was reset when it was not.
      if (readEnvelopeStatus(response?.status) !== "success") {
        setError(readEnvelopeMessage(response) || t("userform.resetPasswordError"));
        return;
      }

      setSuccess(true);
      if (onSuccess) {
        onSuccess();
      }
      setTimeout(() => {
        handleClose();
      }, 2000);
    }
    catch (err) {
      console.error("Reset password error:", err);

      // HTTP status codes only reach us in REST mode (VITE_USE_GRAPHQL unset); under GraphQL
      // everything is 200 and the envelope check above is what catches a rejected reset.
      const status = (err as { status?: unknown })?.status;
      if (status === 401 || status === 403) {
        setError(t("userform.unauthorized"));
      }
      else {
        // Read the BFF's own wording out of the error envelope, but never fall through to a
        // stringified error object — readMutationError ends in String(error), which would put
        // "[object Object]" in front of the user.
        setError(
          readEnvelopeMessage((err as { data?: EnvelopeLike })?.data)
          || t("userform.resetPasswordError")
        );
      }
    }
  };

  const handleClose = () => {
    setNewPassword("");
    setConfirmPassword("");
    setError("");
    setSuccess(false);
    setPasswordValidation(EMPTY_VALIDATION);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white max-w-md w-[90vw] rounded-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-white cursor-default">
            {t("userform.resetPassword")}
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {t("userform.resetPasswordDescriptionForAdmin")}
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="flex flex-col items-center py-6 space-y-4">
            <CheckCircleIcon className="w-16 h-16 text-green-400 dark:text-green-500" />
            <p className="text-center text-green-500 dark:text-green-400">
              {t("userform.resetPasswordSuccess")}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {error && (
              <div className="flex items-center space-x-2 p-3 bg-red-100 dark:bg-red-900 border border-red-100 dark:border-red-800 rounded-lg">
                <AlertIcon className="w-5 h-5 text-red-400 dark:text-red-500" />
                <span className="text-red-500 dark:text-red-400 text-sm">{error}</span>
              </div>
            )}

            {/* Who the reset applies to. Read-only text, not a disabled input: these values come
                from the selected account and are not the admin's to edit here. */}
            <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-white/5 p-3 space-y-1">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                {t("userform.resetPasswordTargetTitle")}
              </p>

              {displayName && (
                <p className="text-sm font-semibold text-gray-900 dark:text-white wrap-break-word">
                  {displayName}
                </p>
              )}

              <dl className="text-xs text-gray-600 dark:text-gray-300 space-y-0.5">
                <div className="flex flex-wrap gap-x-2">
                  <dt className="text-gray-500 dark:text-gray-400">{t("userform.username")}:</dt>
                  <dd className="font-medium wrap-break-word">{targetUsername || "—"}</dd>
                </div>
                <div className="flex flex-wrap gap-x-2">
                  <dt className="text-gray-500 dark:text-gray-400">{t("userform.email")}:</dt>
                  <dd className="font-medium wrap-break-word">{targetEmail || "—"}</dd>
                </div>
              </dl>

              {hasTargetIdentity ? (
                <p className="text-xs text-gray-500 dark:text-gray-400 pt-1">
                  {t("userform.resetPasswordTargetNote")}
                </p>
              ) : (
                <p className="text-xs text-red-600 dark:text-red-400 pt-1">
                  {t("userform.resetPasswordTargetMissing")}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">
                {t("userform.newPassword")}
              </Label>
              <PasswordInput
                id="newPassword"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  setPasswordValidation(validatePassword(e.target.value));
                }}
                placeholder={t("userform.enterNewPassword")}
                className="w-full"
              />

              {newPassword && <PasswordChecklist validation={passwordValidation} />}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">
                {t("userform.confirmPassword")}
              </Label>
              <PasswordInput
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={t("userform.confirmNewPassword")}
                className="w-full"
              />

              <PasswordMatchHint newPassword={newPassword} confirmPassword={confirmPassword} />
            </div>

            <div className="text-sm text-gray-500 dark:text-gray-400">
              <p>{t("userform.passwordRequirements")}</p>
            </div>
          </div>
        )}

        {!success && (
          <DialogFooter className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={loading}
            >
              {t("common.cancel")}
            </Button>
            <Button
              variant="primary"
              onClick={handleReset}
              disabled={loading || !hasTargetIdentity}
            >
              {loading
                ? t("userform.resetting")
                : t("userform.resetPassword")}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default ResetPasswordModal;
