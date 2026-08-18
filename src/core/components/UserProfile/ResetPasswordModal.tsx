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
import type { ResetPasswordModalProps } from "@/core/types/user";
import Input from "@/core/components/form/input/InputField";
import PasswordInput from "@/core/components/form/input/PasswordInput";
import Label from "@/core/components/form/Label";
import Button from "@/core/components/ui/button/Button";

const ResetPasswordModal = ({
  isOpen,
  onClose,
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

  const [email, setEmail] = useState("");
  const [inputUsername, setInputUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleReset = async () => {
    if (!canResetOthers) {
      setError(t("userform.unauthorized"));
      return;
    }

    if (!email) {
      setError(t("forms.email") || "กรุณากรอกอีเมล");
      return;
    }

    if (!inputUsername) {
      setError(t("forms.username") || "กรุณากรอกชื่อผู้ใช้");
      return;
    }

    if (!newPassword) {
      setError(t("userform.newPasswordRequired") || "กรุณากรอกรหัสผ่านใหม่");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(t("userform.passwordMismatch") || "รหัสผ่านไม่ตรงกัน");
      return;
    }

    if (newPassword.length < 8) {
      setError(t("userform.passwordTooShort") || "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร");
      return;
    }

    // Check password validation
    const validation = validatePassword(newPassword);
    if (!validation.isValid) {
      setError(t("userform.pwdHint") || "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร ตัวใหญ่ 1 ตัว และอักขระพิเศษ 1 ตัว");
      return;
    }

    setError("");

    try {
      const response = await resetPassword({
        email,
        username: inputUsername,
        newPassword
      }).unwrap();

      // A business failure comes back HTTP 200 with a negative envelope, so .unwrap() resolving
      // is not proof of success — inspect the envelope. "unknown" is deliberately treated as
      // failure here: a false failure costs a retry, a false success tells the admin the password
      // was reset when it was not.
      if (readEnvelopeStatus(response?.status) !== "success") {
        setError(readEnvelopeMessage(response) || t("userform.resetPasswordError") || "ไม่สามารถรีเซ็ตรหัสผ่านได้");
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
          || "ไม่สามารถรีเซ็ตรหัสผ่านได้"
        );
      }
    }
  };

  const handleClose = () => {
    setEmail("");
    setInputUsername("");
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
          <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-white cursor-default">
            {t("userform.resetPassword") || "รีเซ็ตรหัสผ่าน"}
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {t("userform.resetPasswordDescriptionForAdmin") || "กรอกอีเมล ชื่อผู้ใช้ และรหัสผ่านใหม่เพื่อรีเซ็ต"}
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="flex flex-col items-center py-6 space-y-4">
            <CheckCircleIcon className="w-16 h-16 text-green-400 dark:text-green-500" />
            <p className="text-center text-green-500 dark:text-green-400">
              {t("userform.resetPasswordSuccess") || "รีเซ็ตรหัสผ่านสำเร็จ!"}
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
              <Label htmlFor="email">
                {t("forms.email") || "อีเมล"}
              </Label>
              <Input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("forms.email") || "กรอกอีเมล"}
                className="w-full"
                // className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="username">
                {t("forms.username") || "ชื่อผู้ใช้"}
              </Label>
              <Input
                id="username"
                value={inputUsername}
                onChange={(e) => setInputUsername(e.target.value)}
                placeholder={t("forms.username") || "กรอกชื่อผู้ใช้"}
                className="w-full"
                // className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">
                {t("userform.newPassword") || "รหัสผ่านใหม่"}
              </Label>
              <PasswordInput
                id="newPassword"
                value={newPassword}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewPassword(e.target.value)}
                placeholder={t("userform.enterNewPassword") || "กรอกรหัสผ่านใหม่"}
                className="w-full"
              />
              
              {/* Password validation indicators */}
              {newPassword && (
                <div className="space-y-1 text-xs">
                  {(() => {
                    const validation = validatePassword(newPassword);
                    return (
                      <>
                        <div className={`flex items-center space-x-2 ${validation.hasMinLength ? "text-green-600 dark:text-green-300" : "text-red-600 dark:text-red-300"}`}>
                          <span>{validation.hasMinLength ? "✓" : "✗"}</span>
                          <span>{t("userform.passwordValidation.minLength") || "อย่างน้อย 8 ตัวอักษร"}</span>
                        </div>
                        <div className={`flex items-center space-x-2 ${validation.hasUppercase ? "text-green-600 dark:text-green-300" : "text-red-600 dark:text-red-300"}`}>
                          <span>{validation.hasUppercase ? "✓" : "✗"}</span>
                          <span>{t("userform.passwordValidation.uppercase") || "อย่างน้อยตัวใหญ่ 1 ตัว"}</span>
                        </div>
                        <div className={`flex items-center space-x-2 ${validation.hasSpecialChar ? "text-green-600 dark:text-green-300" : "text-red-600 dark:text-red-300"}`}>
                          <span>{validation.hasSpecialChar ? "✓" : "✗"}</span>
                          <span>{t("userform.passwordValidation.specialChar") || "อย่างน้อยอักขระพิเศษ 1 ตัว"}</span>
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">
                {t("userform.confirmPassword") || "ยืนยันรหัสผ่าน"}
              </Label>
              <PasswordInput
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)}
                placeholder={t("userform.confirmNewPassword") || "ยืนยันรหัสผ่านใหม่"}
                className="w-full"
              />
              
              {/* Password match indicator */}
              {confirmPassword && (
                <div className="space-y-1 text-xs">
                  <div className={`flex items-center space-x-2 ${newPassword === confirmPassword && newPassword !== "" ? "text-green-600 dark:text-green-300" : "text-red-600 dark:text-red-300"}`}>
                    <span>{newPassword === confirmPassword && newPassword !== "" ? "✓" : "✗"}</span>
                    <span>{newPassword === confirmPassword && newPassword !== "" ? 
                      (t("userform.passwordsMatch") || "รหัสผ่านตรงกัน") : 
                      (t("userform.passwordsDoNotMatch") || "รหัสผ่านไม่ตรงกัน")
                    }</span>
                  </div>
                </div>
              )}
            </div>

            <div className="text-sm text-gray-500 dark:text-gray-400 cursor-default">
              <p>{t("userform.passwordRequirements") || "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร"}</p>
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
              {t("common.cancel") || "ยกเลิก"}
            </Button>
            <Button
              variant="primary"
              onClick={handleReset}
              disabled={loading}
            >
              {loading 
                ? (t("userform.resetting") || "กำลังรีเซ็ต...")
                : (t("userform.resetPassword") || "รีเซ็ตรหัสผ่าน")
              }
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default ResetPasswordModal;
