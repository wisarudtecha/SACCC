// /src/components/auth/ForgotPassword.tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/core/components/ui/dialog/dialog";
import { useTranslation } from "@/core/hooks/useTranslation";
import type { ResetPasswordModalProps } from "@/core/types/user";
import Button from "@/core/components/ui/button/Button";

const ResetPasswordModal = ({
  isOpen,
  onClose
}: ResetPasswordModalProps) => {
  const { language, t } = useTranslation();

  const handleClose = () => {
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white max-w-md w-[90vw] rounded-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-white cursor-default">
            {t("userform.resetPassword") || "รีเซ็ตรหัสผ่าน"}
          </DialogTitle>
          <DialogDescription className="text-gray-700 dark:text-gray-200 mt-1 cursor-default">
            {t("userform.resetPasswordDescription") || "ติดต่อฝ่ายสนับสนุนเพื่อรีเซ็ตรหัสผ่านของคุณ"}
          </DialogDescription>
        </DialogHeader>

        <div>
          <div className="flex gap-2">
            <div className="text-gray-700 dark:text-gray-200 cursor-default">{t("userform.resetPasswordContactEmail")}:</div>
            <div className="text-gray-700 dark:text-gray-200 font-medium">{language === "th" && "จะแจ้งให้ทราบภายหลัง" || "TBA"}</div>
          </div>
          <div className="flex gap-2">
            <div className="text-gray-700 dark:text-gray-200 cursor-default">{t("userform.resetPasswordContactPhone")}:</div>
            <div className="text-gray-700 dark:text-gray-200 font-medium">{language === "th" && "จะแจ้งให้ทราบภายหลัง" || "TBA"}</div>
          </div>
        </div>

        <DialogFooter className="flex justify-end space-x-2">
          <Button variant="outline" onClick={handleClose}>
            {t("common.close") || "ปิด"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default ResetPasswordModal;
