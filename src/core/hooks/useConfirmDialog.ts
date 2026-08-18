// /src/hooks/useConfirmDialog.ts
import { useState } from "react";
import type { ConfirmDialog } from "@/core/types/crud";

export interface UseConfirmDialogResult {
  confirmDialog: ConfirmDialog;
  openConfirmDialog: (config: Partial<ConfirmDialog>) => void;
  closeConfirmDialog: () => void;
  handleConfirm: () => void;
}

export const useConfirmDialog = (): UseConfirmDialogResult => {
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialog>({
    isOpen: false,
    type: "delete",
    entityId: "",
    entityName: ""
  });

  const openConfirmDialog = (config: Partial<ConfirmDialog>) => {
    setConfirmDialog(prev => ({ ...prev, ...config, isOpen: true }));
  };

  const closeConfirmDialog = () => {
    setConfirmDialog(prev => ({ ...prev, isOpen: false }));
  };

  const handleConfirm = () => {
    if (confirmDialog.onConfirm) {
      confirmDialog.onConfirm();
    }
    closeConfirmDialog();
  };

  return {
    confirmDialog,
    openConfirmDialog,
    closeConfirmDialog,
    handleConfirm
  };
};
