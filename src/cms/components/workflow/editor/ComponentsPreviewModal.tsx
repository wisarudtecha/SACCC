// src/cms/components/workflow/editor/ComponentsPreviewModal.tsx
import React from "react";
import { AngleLeftIcon, CheckLineIcon, CloseIcon, FileIcon } from "@/core/icons";
import { Modal } from "@/core/components/ui/modal";
import { FormField } from "@/cms/components/interface/FormField";
import DynamicForm from "@/cms/components/form/dynamic-form/DynamicForm";
import Button from "@/core/components/ui/button/Button";

export type PreviewComponent =
{
  type: "start";
  id: string;
  label: string;
  description?: string;
  continueFromWorkflow?: boolean;
  sourceWorkflowId?: string;
} |
{
  type: "process";
  id: string;
  label: string;
  form?: FormField;
  action?: string;
  sla?: string | number;
  group?: string;
  pic?: string;
} |
{
  type: "dispatch";
  id: string;
  label: string;
  form?: FormField;
  action?: string;
  sla?: string | number;
  group?: string;
  pic?: string;
} |
{
  type: "sla";
  id: string;
  label: string;
  SLA?: string | number;
} |
{
  type: "decision";
  id: string;
  label: string;
  condition?: string;
} |
{
  type: "end";
  id: string;
  label: string;
  description?: string;
  allowContinuation?: boolean;
  nextWorkflowId?: string;
};

export interface ComponentsPreviewModalProps {
  showComponentsPreview: boolean;
  setShowComponentsPreview: (show: boolean) => void;
  t: (key: string) => string;
  generateComponentsPreview: () => PreviewComponent[];
  decisionSelections: Record<string, "yes" | "no">;
  handleDecisionToggle: (nodeId: string, decision: "yes" | "no") => void;
  decisionLang: Record<string, string>;
}

const ComponentsPreviewModal: React.FC<ComponentsPreviewModalProps> = ({
  showComponentsPreview,
  setShowComponentsPreview,
  t,
  generateComponentsPreview,
  decisionSelections,
  handleDecisionToggle,
  decisionLang
}) => {
  return (
    showComponentsPreview && (
      <Modal
        isOpen={showComponentsPreview}
        onClose={() => setShowComponentsPreview(false)}
        isFullscreen={true}
      >
        <div className="cursor-default">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
            {t("crud.workflow.builder.modal.preview.header")}
          </h3>

          <p className="text-sm text-gray-600 dark:text-gray-300">
            {t("crud.workflow.builder.modal.preview.description")}
          </p>
        </div>
        
        <div className="py-4 overflow-auto cursor-default">
          {generateComponentsPreview()?.length > 0 ? (
            <div className="space-y-6">
              {generateComponentsPreview()?.map((component, index) => (
                <div key={component?.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-100 text-xs font-medium px-2 py-1 rounded-full">
                      {t("crud.workflow.builder.modal.preview.step")} {index + 1}
                    </span>
                    
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {component?.label || ""}
                    </h4>

                    {/* Component Type Badge */}
                    {component?.type === "start" && (
                      <span className="bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-100 text-xs font-medium px-2 py-1 rounded-full">
                        {t("crud.workflow.builder.toolbar.nodes.start")}
                      </span>
                    )}

                    {component?.type === "process" && (
                      <span className="bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-100 text-xs font-medium px-2 py-1 rounded-full">
                        {t("crud.workflow.builder.node.form.actions.label")}: {component?.action || ""}{" | "}
                        {t("crud.workflow.builder.node.form.sla.label")}: {component?.sla || 0} {t("crud.workflow.unit.sla.label")}{" | "}
                        {t("crud.workflow.builder.node.form.group.label")}: {component?.group || ""}{" | "}
                        {t("crud.workflow.builder.node.form.pic.label")}: {component?.pic || ""}
                      </span>
                    )}

                    {component?.type === "dispatch" && (
                      <span className="bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100 text-xs font-medium px-2 py-1 rounded-full">
                        {t("crud.workflow.builder.toolbar.nodes.dispatch")}: {component?.action || ""}{" | "}
                        {t("crud.workflow.builder.node.form.sla.label")}: {component?.sla || 0} {t("crud.workflow.unit.sla.label")}{" | "}
                        {t("crud.workflow.builder.node.form.group.label")}: {component?.group || ""}{" | "}
                        {t("crud.workflow.builder.node.form.pic.label")}: {component?.pic || ""}
                      </span>
                    )}

                    {component?.type === "sla" && (
                      <span className="bg-green-100 dark:bg-purple-800 text-purple-800 dark:text-purple-100 text-xs font-medium px-2 py-1 rounded-full">
                        {t("crud.workflow.builder.toolbar.nodes.sla")} {component?.SLA || 0} {t("crud.workflow.unit.sla.label")}
                      </span>
                    )}

                    {component?.type === "decision" && (
                      <span className="bg-yellow-100 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-100 text-xs font-medium px-2 py-1 rounded-full">
                        {t("crud.workflow.builder.toolbar.nodes.decision")}
                      </span>
                    )}

                    {component?.type === "end" && (
                      <span className="bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-100 text-xs font-medium px-2 py-1 rounded-full">
                        {t("crud.workflow.builder.toolbar.nodes.end")}
                      </span>
                    )}
                  </div>

                  {/* Start Component */}
                  {component?.type === "start" && (
                    <div className="bg-green-100 dark:bg-green-800 p-4 rounded-lg border border-green-200 dark:border-green-700">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium text-green-800 dark:text-green-100">
                          {t("crud.workflow.builder.modal.preview.start")}
                        </span>

                        {component?.continueFromWorkflow && (
                          <span className="bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-100 text-xs font-medium px-2 py-1 rounded-full">
                            <AngleLeftIcon className="w-4 h-4 mr-1 inline" /> Continues from workflow
                          </span>
                        )}
                      </div>

                      {component?.description && (
                        <p className="text-sm text-green-700 dark:text-green-200">
                          {component.description || ""}
                        </p>
                      )}

                      {component?.continueFromWorkflow && component?.sourceWorkflowId && (
                        <div className="bg-blue-100 dark:bg-blue-800 p-2 rounded border border-blue-200 dark:border-blue-700">
                          <p className="text-xs text-blue-700 dark:text-blue-200">
                            <strong>Source Workflow:</strong> {component?.sourceWorkflowId || ""}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Form Component */}
                  {(component?.type === "process" || component?.type === "dispatch") && component?.form && (
                    <DynamicForm edit={false} editFormData={true} enableFormTitle={false} initialForm={component?.form || null} />
                  )}

                  {component?.type === "process" && (
                    <div>
                      {component?.group && (
                        <div className="mb-2 text-sm text-gray-600 dark:text-gray-300">
                          <strong>{t("crud.workflow.builder.node.form.group.label")}:</strong> {component?.group || ""}
                        </div>
                      )}

                      {component?.pic && (
                        <div className="mb-2 text-sm text-gray-600 dark:text-gray-300">
                          <strong>{t("crud.workflow.builder.node.form.pic.label")}:</strong> {component?.pic || ""}
                        </div>
                      )}
                    </div>
                  )}

                  {/* SLA Component  */}
                  {component?.type === "sla" && (
                    <div className="bg-purple-100 dark:bg-purple-800 p-3 rounded border">
                      <div className="text-sm text-gray-700 dark:text-gray-200">
                        <strong>{t("crud.workflow.builder.modal.preview.sla.header")}:</strong> {component?.SLA || "-"} {t("crud.workflow.unit.sla.label")}
                      </div>

                      {/* Interactive Toggle Buttons */}
                      <div className="mb-4 mt-3">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                          {t("crud.workflow.builder.modal.preview.sla.path")}:
                        </label>

                        <div className="flex gap-2">
                          <Button
                            size="xs"
                            variant={decisionSelections[component?.id] === "yes" && "success" || "outline-success"}
                            onClick={() => handleDecisionToggle(component?.id, "yes")}
                          >
                            <CheckLineIcon className="w-4 h-4 mr-1" /> {t("crud.workflow.builder.modal.preview.sla.yes")}
                          </Button>

                          <Button
                            size="xs"
                            variant={decisionSelections[component?.id] === "no" && "error" || "outline-error"}
                            onClick={() => handleDecisionToggle(component?.id, "no")}
                          >
                            <CloseIcon className="w-4 h-4 mr-1" /> {t("crud.workflow.builder.modal.preview.sla.no")}
                          </Button>
                        </div>
                      </div>

                      {/* Current Selection Display */}
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        {t("crud.workflow.builder.modal.preview.current_path")}:
                        <strong className="ml-1">{decisionSelections[component?.id] === "no" &&
                          t("crud.workflow.builder.modal.preview.sla.no") || t("crud.workflow.builder.modal.preview.sla.yes")}
                        </strong>
                      </div>
                    </div>
                  )}
                  
                  {/* Decision Component */}
                  {component.type === "decision" && (
                    <div className="bg-yellow-100 dark:bg-yellow-800 p-3 rounded border">
                      <div className="text-sm text-gray-700 dark:text-gray-200">
                        <strong className="mr-1">{t("crud.workflow.builder.modal.preview.decision.header")}:</strong>
                        {component?.condition && t("common.yes") || ""}
                      </div>

                      {/* Interactive Toggle Buttons */}
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                          {t("crud.workflow.builder.modal.preview.decision.path")}:
                        </label>

                        <div className="flex gap-2">
                          <Button
                            size="xs"
                            variant={decisionSelections[component?.id] === "yes" && "success" || "outline-success"}
                            onClick={() => handleDecisionToggle(component?.id, "yes")}
                          >
                            <CheckLineIcon className="w-4 h-4 mr-1" /> {t("common.yes")}
                          </Button>

                          <Button
                            size="xs"
                            variant={decisionSelections[component?.id] === "no" && "error" || "outline-error"}
                            onClick={() => handleDecisionToggle(component?.id, "no")}
                          >
                            <CloseIcon className="w-4 h-4 mr-1" /> {t("common.no")}
                          </Button>
                        </div>
                      </div>

                      {/* Current Selection Display */}
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        {t("crud.workflow.builder.modal.preview.current_path")}:
                        <strong className="ml-1">
                          {decisionLang?.[decisionSelections[component?.id]] || decisionLang["yes"] || "yes"}
                        </strong>
                      </div>
                    </div>
                  )}

                  {/* End Component */}
                  {component?.type === "end" && (
                    <div className="bg-red-100 dark:bg-red-800 p-4 rounded-lg border border-red-200 dark:border-red-700">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium text-red-800 dark:text-red-100">
                          {t("crud.workflow.builder.modal.preview.end")}
                        </span>

                        {component?.allowContinuation && (
                          <span className="bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-100 text-xs font-medium px-2 py-1 rounded-full">
                            <AngleLeftIcon className="w-4 h-4 mr-1" /> Allows continuation
                          </span>
                        )}
                      </div>

                      {component?.description && (
                        <p className="text-sm text-red-700 dark:text-red-200">
                          {component?.description || ""}
                        </p>
                      )}

                      {component?.allowContinuation && component?.nextWorkflowId && (
                        <div className="bg-green-100 dark:bg-green-800 p-2 rounded border border-green-200 dark:border-green-700">
                          <p className="text-xs text-green-700 dark:text-green-200">
                            <strong>Next Workflow:</strong> {component?.nextWorkflowId || ""}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <FileIcon className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />

              <div className="text-gray-500 dark:text-gray-400 text-lg mb-2">
                {t("crud.workflow.builder.modal.preview.empty.title")}
              </div>

              <p className="text-gray-400 dark:text-gray-500">
                {t("crud.workflow.builder.modal.preview.empty.description")}
              </p>
            </div>
          )}
        </div>
        
        <div className="flex items-center justify-end gap-2 p-4">
          <Button
            variant="outline"
            onClick={() => setShowComponentsPreview(false)}
          >
            {t("crud.workflow.builder.modal.preview.actions.close")}
          </Button>
        </div>
      </Modal>
    )
  );
};

export default ComponentsPreviewModal;
