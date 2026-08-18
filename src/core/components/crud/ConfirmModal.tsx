// /src/components/crud/ConfirmModal.tsx
import React from "react";
import { Modal } from "@/core/components/ui/modal";
import { useTranslation } from "@/core/hooks/useTranslation";
import type { ConfirmDialog } from "@/core/types/crud";
import Button from "@/core/components/ui/button/Button";

interface ConfirmModalProps {
  dialog: ConfirmDialog;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  dialog,
  onConfirm,
  onCancel
}) => {
  const { t } = useTranslation();
  
  const getTitle = () => {
    if (dialog.title) {
      return dialog.title;
    }
    
    switch (dialog.type) {
      case "delete":
        return t("crud.common.confirm_modal.dialog_title.delete");
      case "status":
        return t("crud.common.confirm_modal.dialog_title.status");
      default:
        return t("crud.common.confirm_modal.dialog_title.other");
    }
  };

  const getMessage = () => {
    if (dialog.message) {
      return dialog.message;
    }
    
    switch (dialog.type) {
      case "delete":
        return t("crud.common.confirm_modal.dialog_message.delete").replace("_ENTITY_", dialog.entityName);
      case "status":
        return t("crud.common.confirm_modal.dialog_message.status").replace("_ENTITY_", dialog.entityName).replace("_NEW_", dialog.newValue as string);
      default:
        return t("crud.common.confirm_modal.dialog_message.other");
    }
  };

  return (
    <Modal 
      isOpen={dialog.isOpen}
      onClose={onCancel}
      className="max-w-md p-6"
    >
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {getTitle()}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
          {dialog.type === "delete" ? t("crud.common.confirm_modal.dialog_subtitle.delete") : t("crud.common.confirm_modal.dialog_subtitle.other")}
        </p>
      </div>
      
      <p className="text-gray-700 dark:text-gray-200 mb-6">
        {getMessage()}
      </p>
      
      <div className="flex items-center gap-3 justify-end">
        <Button onClick={onCancel} variant="outline">
          {t("crud.common.confirm_modal.dialog_button.cancel")}
        </Button>
        <Button
          onClick={onConfirm}
          variant={dialog.type === "delete" ? "error" : "primary"}
        >
          {dialog.type === "delete" ? t("crud.common.confirm_modal.dialog_button.delete") : t("crud.common.confirm_modal.dialog_button.other")}
        </Button>
      </div>
    </Modal>
  );
};
