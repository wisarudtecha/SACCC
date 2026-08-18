// /src/components/UserProfile/ChangePasswordModal.tsx
import { useState } from "react";
import { AlertIcon, CheckCircleIcon } from "@/core/icons";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/core/components/ui/dialog/dialog";
import { useTranslation } from "@/core/hooks/useTranslation";
import { useChangePasswordMutation } from "@/core/store/api/userApi";
import { readEnvelopeMessage, readEnvelopeStatus } from "@/core/utils/apiResponseStatus";
import type { EnvelopeLike } from "@/core/utils/apiResponseStatus";
import { validatePassword, PasswordValidation } from "@/core/utils/passwordValidation";
import type { ChangePasswordModalProps } from "@/core/types/user";
import PasswordInput from "@/core/components/form/input/PasswordInput";
import Label from "@/core/components/form/Label";
import Button from "@/core/components/ui/button/Button";

const ChangePasswordModal = ({
  isOpen,
  onClose,
  userId,
  onSuccess
}: ChangePasswordModalProps) => {
  const { t } = useTranslation();

  const [changePassword, { isLoading: loading }] = useChangePasswordMutation();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [passwordValidation, setPasswordValidation] = useState<PasswordValidation>({
    isValid: false,
    hasMinLength: false,
    hasUppercase: false,
    hasSpecialChar: false
  });

  const handleChangePassword = async () => {
    if (!currentPassword) {
      setError(t("userform.currentPasswordRequired"));
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

    // Check password validation
    const validation = validatePassword(newPassword);
    if (!validation.isValid) {
      setError(t("userform.pwdHint"));
      return;
    }

    if (currentPassword === newPassword) {
      setError(t("userform.samePassword"));
      return;
    }

    if (!userId) {
      setError(t("userform.changePasswordError"));
      return;
    }

    setError("");

    try {
      const response = await changePassword({
        id: userId,
        currentPassword,
        newPassword
      }).unwrap();

      // A business failure comes back HTTP 200 with a negative envelope, so .unwrap() resolving
      // is not proof of success — inspect the envelope. "unknown" is deliberately treated as
      // failure here: a false failure costs a retry, a false success tells the user their
      // password changed when it did not.
      if (readEnvelopeStatus(response?.status) !== "success") {
        setError(readEnvelopeMessage(response) || t("userform.changePasswordError"));
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
      console.error("Change password error:", err);

      // HTTP status codes only reach us in REST mode (VITE_USE_GRAPHQL unset). Under GraphQL
      // everything is 200 and the wrong-password case is handled by the envelope check above.
      const status = (err as { status?: unknown })?.status;
      if (status === 400) {
        setError(t("userform.incorrectCurrentPassword"));
      }
      else if (status === 401) {
        setError(t("userform.unauthorized"));
      }
      else {
        // Read the BFF's own wording out of the error envelope, but never fall through to a
        // stringified error object — readMutationError ends in String(error), which would put
        // "[object Object]" in front of the user.
        setError(readEnvelopeMessage((err as { data?: EnvelopeLike })?.data) || t("userform.changePasswordError"));
      }
    }
  };

  const handleClose = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setError("");
    setSuccess(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white max-w-md w-[90vw] rounded-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-white">
            {t("userform.changePassword")}
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {t("userform.changePasswordDescription")}
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="flex flex-col items-center py-6 space-y-4">
            <CheckCircleIcon className="w-16 h-16 text-green-400 dark:text-green-500" />
            <p className="text-center text-green-500 dark:text-green-400">
              {t("userform.changePasswordSuccess")}
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

            <div className="space-y-2">
              <Label htmlFor="currentPassword">
                {t("userform.currentPassword")}
              </Label>
              <PasswordInput
                id="currentPassword"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder={t("userform.enterCurrentPassword")}
                className="w-full"
              />
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
              
              {/* Password validation indicators */}
              {newPassword && (
                <div className="space-y-1 text-xs">
                  <div className={`flex items-center space-x-2 ${passwordValidation.hasMinLength ? "text-green-600 dark:text-green-300" : "text-red-600 dark:text-red-300"}`}>
                    <span>{passwordValidation.hasMinLength ? "✓" : "✗"}</span>
                    <span>{t("userform.passwordValidation.minLength")}</span>
                  </div>
                  <div className={`flex items-center space-x-2 ${passwordValidation.hasUppercase ? "text-green-600 dark:text-green-300" : "text-red-600 dark:text-red-300"}`}>
                    <span>{passwordValidation.hasUppercase ? "✓" : "✗"}</span>
                    <span>{t("userform.passwordValidation.uppercase")}</span>
                  </div>
                  <div className={`flex items-center space-x-2 ${passwordValidation.hasSpecialChar ? "text-green-600 dark:text-green-300" : "text-red-600 dark:text-red-300"}`}>
                    <span>{passwordValidation.hasSpecialChar ? "✓" : "✗"}</span>
                    <span>{t("userform.passwordValidation.specialChar")}</span>
                  </div>
                </div>
              )}
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
              onClick={handleChangePassword}
              disabled={loading}
            >
              {loading 
                ? (t("common.loading"))
                : (t("userform.changePassword"))
              }
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default ChangePasswordModal;
