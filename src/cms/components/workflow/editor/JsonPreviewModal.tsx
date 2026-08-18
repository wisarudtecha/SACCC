// src/cms/components/workflow/editor/JsonPreviewModal.tsx
import React from "react";
import { CheckLineIcon, CopyIcon, DownloadIcon } from "@/core/icons";
import { Modal } from "@/core/components/ui/modal";
import { usePermissions } from "@/core/hooks/usePermissions";
import type { BaseNode, Connection, WorkflowData } from "@/cms/types/workflow";
import Button from "@/core/components/ui/button/Button";

export interface JsonPreviewModalProps {
  showJsonPreview: boolean;
  editable: boolean;
  permissions: ReturnType<typeof usePermissions>;
  setShowJsonPreview: (show: boolean) => void;
  loading: boolean;
  workflowMetadata: WorkflowData["metadata"];
  nodes: BaseNode[];
  connections: Connection[];
  t: (key: string) => string;
  copiedJson: boolean;
  copyJsonToClipboard: () => void;
  downloadJsonWorkflow: () => void;
  validationErrors: string[];
  saveWorkflow: () => void;
}

const JsonPreviewModal: React.FC<JsonPreviewModalProps> = ({
  showJsonPreview,
  editable,
  permissions,
  setShowJsonPreview,
  loading,
  workflowMetadata,
  nodes,
  connections,
  t,
  copiedJson,
  copyJsonToClipboard,
  downloadJsonWorkflow,
  validationErrors,
  saveWorkflow
}) => {
  return (
    showJsonPreview && editable && permissions?.hasAnyPermission(["workflow.create", "workflow.update"]) && (
      <Modal className="max-w-4xl p-6" isOpen={showJsonPreview} onClose={() => setShowJsonPreview(loading && true || false)}>
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 cursor-default">
            {t("crud.workflow.builder.modal.save.header")}
          </h3>

          <p className="text-sm text-gray-600 dark:text-gray-300 cursor-default">
            {workflowMetadata?.title || ""}
          </p>
        </div>

        
        <div className="p-4 overflow-auto max-h-[60vh]">
          <pre className="bg-white dark:bg-gray-900 p-4 rounded-lg text-sm overflow-auto text-gray-800 dark:text-gray-100">
            {JSON.stringify({ 
              nodes, 
              connections, 
              metadata: {
                ...workflowMetadata,
                updatedAt: new Date().toISOString()
              }
            }, null, 2)}
          </pre>
        </div>
        
        <div className="flex items-center justify-end gap-2 p-4">
          <Button
            disabled={loading}
            variant="error"
            onClick={() => setShowJsonPreview(false)}
          >
            {t("crud.workflow.builder.modal.actions.cancel")}
          </Button>

          <Button
            variant={`${copiedJson && "success" || "outline"}`}
            onClick={copyJsonToClipboard}
          >
            {copiedJson ? <CheckLineIcon className="w-4 h-4 mr-1" /> : <CopyIcon className="w-4 h-4 mr-1" />}
            {copiedJson ? `${t("crud.workflow.builder.modal.save.actions.copied")}!` : t("crud.workflow.builder.modal.save.actions.copy")}
          </Button>

          <Button
            disabled={loading}
            variant="outline"
            onClick={downloadJsonWorkflow}
          >
            <DownloadIcon className="w-4 h-4 mr-1" /> {t("crud.workflow.builder.modal.save.actions.download")}
          </Button>

          <Button
            disabled={validationErrors?.length > 0 || loading}
            variant={`${validationErrors?.length > 0 && "outline" || "primary"}`}
            onClick={saveWorkflow}
          >
            {loading ? t("crud.workflow.builder.modal.save.actions.saving") : (
              <>
                <span>{t("crud.workflow.builder.modal.save.actions.confirm")}</span>
              </>
            )}
          </Button>
        </div>
      </Modal>
    )
  );
};

export default JsonPreviewModal;
