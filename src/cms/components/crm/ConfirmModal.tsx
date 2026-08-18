// src/cms/components/crm/ConfirmModal.tsx
import { X } from "lucide-react";
import { useTranslation } from "@/core/hooks/useTranslation";
import Button from "@/core/components/ui/button/Button";

interface ConfirmModalProps {
  cancelLabel?: string;
  confirmLabel?: string;
  confirmVariant?: "primary" | "error" | "success";
  loading?: boolean;
  message: string;
  open?: boolean;
  title: string;
  onCancel: () => void;
  onConfirm: () => void;
}

const ConfirmModal = ({
  cancelLabel = "Cancel",
  confirmLabel = "Confirm",
  confirmVariant = "primary",
  loading = false,
  message,
  open,
  title,
  onCancel,
  onConfirm
}: ConfirmModalProps) => {
  const { t } = useTranslation();

  if (!open || !message) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-white/50 dark:bg-black/70 flex items-center justify-center z-9999">
      <div className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-black dark:text-white">{title}</h2>

          <button
            onClick={onCancel}
            disabled={loading}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-gray-600 dark:text-gray-400 mb-6">{message}</p>
        
        <div className="flex gap-3 justify-end">
          <Button onClick={onCancel} variant="outline" size="sm" disabled={loading}>
            {cancelLabel}
          </Button>
          <Button onClick={onConfirm} variant={confirmVariant} size="sm" disabled={loading}>
            {loading ? t("crud.common.processing") : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmModal;
