// src/cms/components/workflow/editor/ImportModal.tsx
import React from "react";
import { FileIcon } from "@/core/icons";
import { Modal } from "@/core/components/ui/modal";
import { usePermissions } from "@/core/hooks/usePermissions";
import TextArea from "@/core/components/form/input/TextArea";
import Button from "@/core/components/ui/button/Button";

export interface ImportModalProps {
  showImportDialog: boolean;
  editable: boolean;
  permissions: ReturnType<typeof usePermissions>;
  setShowImportDialog: (show: boolean) => void;
  t: (key: string) => string;
  handleFileImport: (event: React.ChangeEvent<HTMLInputElement>) => void;
  importJsonText: string;
  setImportJsonText: (text: string) => void;
  importJsonWorkflow: () => void;
}

const ImportModal: React.FC<ImportModalProps> = ({
  showImportDialog,
  editable,
  permissions,
  setShowImportDialog,
  t,
  handleFileImport,
  importJsonText,
  setImportJsonText,
  importJsonWorkflow
}) => {
  return (
    showImportDialog && editable && permissions?.hasAnyPermission(["workflow.create", "workflow.update"]) && (
      <Modal isOpen={showImportDialog} onClose={() => setShowImportDialog(false)} className="max-w-4xl p-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 cursor-default">
            {t("crud.workflow.builder.modal.import.header")}
          </h3>
        </div>
        
        <div className="p-4">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
              {t("crud.workflow.builder.modal.import.file.label")}
            </label>

            <input
              type="file"
              accept=".json"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent text-gray-900 dark:text-white"
              onChange={handleFileImport}
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
              {t("crud.workflow.builder.modal.import.textarea.label")}
            </label>

            <TextArea
              className="w-full h-64 px-3 py-2 border rounded-lg focus:ring-2 focus:border-transparent font-mono text-sm"
              placeholder={t("crud.workflow.builder.modal.import.textarea.placeholder")}
              value={importJsonText || ""}
              onChange={value => setImportJsonText(value)}
            />
          </div>
        </div>
        
        <div className="flex items-center justify-end gap-2 p-4">
          <Button
            variant="error"
            onClick={() => setShowImportDialog(false)}
          >
            {t("crud.workflow.builder.modal.actions.cancel")}
          </Button>

          <Button
            disabled={!importJsonText?.trim()}
            variant={`${!importJsonText?.trim() && "outline" || "success"}`}
            onClick={importJsonWorkflow}
          >
            <FileIcon className="w-4 h-4 mr-1" /> {t("crud.workflow.builder.modal.import.actions.import")}
          </Button>
        </div>
      </Modal>
    )
  );
};

export default ImportModal;
