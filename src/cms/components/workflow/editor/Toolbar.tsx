// src/cms/components/workflow/editor/Toolbar.tsx
import React from "react";
import { BoxCubeIcon, DownloadIcon, FileIcon, PencilIcon } from "@/core/icons";
import { PermissionGate } from "@/core/components/auth/PermissionGate";
import { usePermissions } from "@/core/hooks/usePermissions";
import type { BaseNode, WorkflowData } from "@/cms/types/workflow";
import Input from "@/core/components/form/input/InputField";
import Radio from "@/core/components/form/input/Radio";
import TextArea from "@/core/components/form/input/TextArea";
import Select from "@/core/components/form/Select";
import Button from "@/core/components/ui/button/Button";

export interface ToolbarProps {
  workflowMetadata: WorkflowData["metadata"];
  updateWorkflowMetadata: (updates: Partial<WorkflowData["metadata"]>) => void;
  workflowStatuses: readonly { value: string; label: string; color: string }[];
  workflowStatusesOptions: { value: string; label: string }[];
  editable: boolean;
  permissions: ReturnType<typeof usePermissions>;
  nodeTypes: Record<string, { button: string; color: string; label: string }>;
  handleDragStart: (e: React.DragEvent, nodeType: BaseNode["type"]) => void;
  addNode: (type: BaseNode["type"]) => void;
  setShowImportDialog: (show: boolean) => void;
  setShowComponentsPreview: (show: boolean) => void;
  handleSaveClick: () => void;
  workflowId?: string;
  workflowAction?: string;
  t: (key: string) => string;
  language: string;
}

const Toolbar: React.FC<ToolbarProps> = ({
  workflowMetadata,
  updateWorkflowMetadata,
  workflowStatuses,
  workflowStatusesOptions,
  editable,
  permissions,
  nodeTypes,
  handleDragStart,
  addNode,
  setShowImportDialog,
  setShowComponentsPreview,
  handleSaveClick,
  workflowId,
  workflowAction,
  t,
  language
}) => {
  return (
    <div className="xl:w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 p-4 rounded-l-2xl rounded-r-2xl xl:rounded-r-none">
      {/* Workflow Metadata */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-2 cursor-default">
          {t("crud.workflow.builder.toolbar.header")}
        </h3>
        
        {/* Type Selector */}
        <div className="mb-2">
          <label htmlFor="workflowMetadata.wfType" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
            {t("crud.workflow.builder.metadata.wfType.label")}:
          </label>

          {editable && permissions?.hasAnyPermission(["workflow.create"]) ? (
            <div className="xl:flex gap-6 space-y-1 xl:space-y-0">
              {(workflowId === "new" || !workflowMetadata?.wfType) && (
                <>
                  <Radio
                    id="workflowMetadata.wfType.case"
                    value="case"
                    checked={workflowMetadata?.wfType === "case"}
                    onChange={value => updateWorkflowMetadata({ wfType: value })}
                    onClick={value => updateWorkflowMetadata({ wfType: value })}
                    name="workflowMetadata.wfType"
                    label={t("crud.workflow.builder.metadata.wfType.options.case")}
                  />

                  <Radio
                    id="workflowMetadata.wfType.request"
                    value="request"
                    checked={workflowMetadata?.wfType === "request"}
                    onChange={value => updateWorkflowMetadata({ wfType: value })}
                    onClick={value => updateWorkflowMetadata({ wfType: value })}
                    name="workflowMetadata.wfType"
                    label={t("crud.workflow.builder.metadata.wfType.options.request")}
                  />
                </>
              )}
            </div>
          ) : (
            <div className="w-full appearance-none text-sm bg-transparent text-gray-900 dark:text-white cursor-default">
              {workflowMetadata?.wfType || "-"}
            </div>
          )}
        </div>

        {/* Title Input */}
        <div className="mb-2">
          <label htmlFor="workflowMetadata.title" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
            {t("crud.workflow.builder.metadata.title.label")}:
          </label>

          {editable && permissions?.hasAnyPermission(["workflow.create", "workflow.update"]) ?
            <Input
              type="text"
              id="workflowMetadata.title"
              placeholder={t("crud.workflow.builder.metadata.title.placeholder")}
              value={workflowMetadata?.title}
              onChange={e => updateWorkflowMetadata({ title: e?.target?.value })}
            />
          : <div className="w-full appearance-none text-sm bg-transparent text-gray-900 dark:text-white cursor-default">
              {workflowMetadata?.title || t("crud.workflow.builder.metadata.title.default")}
            </div>
          }
        </div>

        {/* Description Input */}
        <div className="mb-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
            {t("crud.workflow.builder.metadata.description.label")}:
          </label>

          {editable && permissions?.hasAnyPermission(["workflow.create", "workflow.update"]) ?
            <TextArea
              placeholder={t("crud.workflow.builder.metadata.description.placeholder")}
              rows={2}
              value={workflowMetadata?.description}
              onChange={value => updateWorkflowMetadata({ description: value })}
            />
          : <div className="w-full appearance-none text-sm bg-transparent text-gray-900 dark:text-white cursor-default">
              {workflowMetadata?.description || "-"}
            </div>
          }
        </div>

        {/* Status Selector */}
        <div className="mb-3">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
            {t("crud.workflow.builder.metadata.status.label")}:
          </label>

          {editable && permissions?.hasAnyPermission(["workflow.create", "workflow.update"]) ?
            <Select
              className="cursor-pointer"
              options={workflowStatusesOptions || []}
              placeholder={t("crud.workflow.builder.metadata.status.placeholder")}
              value={workflowMetadata?.status}
              onChange={value => updateWorkflowMetadata({ status: (value as WorkflowData["metadata"]["status"]) })}
            />
          : <div className="w-full appearance-none text-sm bg-transparent text-gray-900 dark:text-white cursor-default">
              <span className={`px-2 py-1 rounded-full text-xs font-medium
                ${workflowStatuses?.find(s => s?.value === workflowMetadata?.status)?.color || "text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800"}
              `}>
                {workflowStatuses?.find(s => s?.value === workflowMetadata?.status)?.label}
              </span>
            </div>
          }
        </div>
        
        {/* SLA Input */}
        <div className="mb-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
            {t("crud.workflow.builder.metadata.total_sla")}:
          </label>

          {editable && permissions?.hasAnyPermission(["workflow.create", "workflow.update"]) ?
            <div className=" h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3  dark:bg-gray-900 dark:placeholder:text-white/30  bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-brand-500/20 dark:border-gray-700 dark:text-white/90 dark:focus:border-brand-800 cursor-default">
              {workflowMetadata?.totalSla || 0} {t("crud.workflow.unit.sla.abbr")}
            </div>
          : <div className="w-full appearance-none text-sm bg-transparent text-gray-900 dark:text-white cursor-default">
              {workflowMetadata?.totalSla || 0} {t("crud.workflow.unit.sla.abbr")}
            </div>
          }
        </div>
      </div>

      {editable && (
        <PermissionGate permissions={["workflow.create", "workflow.update"]}>
          {/* Node Types */}
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-2 cursor-default">
              {t("crud.workflow.builder.toolbar.nodes.header")}
            </h3>

            <div className="grid grid-cols-2 gap-2">
              {Object?.entries(nodeTypes)?.map(([type, config]) => {
                return (
                  <div
                    key={type}
                    className={`flex items-center gap-2 p-2 rounded-lg transition-colors cursor-grab active:cursor-grabbing select-none ${config?.button}`}
                    draggable
                    title={`${t("crud.workflow.builder.toolbar.actions.adding")}: ${config?.label}`}
                    onDragStart={e => handleDragStart(e, type as BaseNode["type"])}
                    onClick={() => addNode(type as BaseNode["type"])}
                  >
                    <span className="text-xs text-center w-100">
                      {config.label || ""}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </PermissionGate>
      )}

      <div className="mb-4 border-t border-gray-200 dark:border-gray-700"></div>

      {editable && (
        <PermissionGate permissions={["workflow.create", "workflow.update"]}>
          {/* Actions */}
          <div className="mb-2">
            <Button
              className="w-full mb-2"
              variant="success"
              onClick={() => setShowImportDialog(true)}
            >
              <FileIcon className="w-4 h-4 mr-1" /> {t("crud.workflow.builder.toolbar.actions.import")}
            </Button>

            <Button
              className="w-full mb-2"
              variant="info"
              onClick={() => setShowComponentsPreview(true)}
            >
              <BoxCubeIcon className="w-4 h-4 mr-1" /> {t("crud.workflow.builder.toolbar.actions.preview")}
            </Button>

            <Button
              className="w-full mb-2"
              variant="primary"
              onClick={handleSaveClick}
            >
              <DownloadIcon className="w-4 h-4 mr-1" /> {t("crud.workflow.builder.toolbar.actions.save")}
            </Button>
          </div>

          {/* Instructions */}
          <div className="text-xs text-gray-500 dark:text-gray-400 cursor-default">
            {language === "th" && (
              <>
                <p className="text-gray-600 dark:text-gray-300">
                  <strong>การจัดการ SOP:</strong>
                </p>
                <p>• ตัวบ่งชี้ลำดับความสำคัญแบบภาพในแผงสรุป</p>

                <p className="text-gray-600 dark:text-gray-300">
                  <strong>การทำงานของโหนด:</strong>
                </p>
                <p>• คลิกโหนดเพื่อเพิ่มที่ด้านบนซ้ายของผืนผ้าใบที่มองเห็นได้</p>
                <p>• ลากโหนดจากจานสีไปยังผืนผ้าใบ</p>
                <p>• คลิกเพื่อเลือกโหนด</p>
                <p>• ลากเพื่อย้ายโหนด (สแนปไปยังตาราง)</p>
                <p>• กด Shift+คลิกเพื่อเชื่อมต่อโหนด</p>
                <p>• โหนดการตัดสินใจและ SLA มีตัวเชื่อมต่อแบบใช่/ไม่ใช่</p>

                <p className="text-gray-600 dark:text-gray-300">
                  <strong>คุณสมบัติเวิร์กโฟลว์:</strong>
                </p>
                <p>• ต้องใช้โหนดเริ่มต้น/สิ้นสุดสำหรับการบันทึก</p>
                <p>• การเชื่อมต่อสูงสุด: 1 (ปกติ), 2 (การตัดสินใจ/SLA)</p>
                <p>• นำเข้า/ส่งออกเวิร์กโฟลว์ JSON</p>
                <p>• ดูตัวอย่างส่วนประกอบของแบบฟอร์ม</p>
                <p>• เลื่อนเพื่อดูเวิร์กโฟลว์ขนาดใหญ่</p>
              </>
            ) ||
              <>
                <p className="text-gray-600 dark:text-gray-300">
                  <strong>SOP Management:</strong>
                </p>
                <p>• Visual priority indicators in summary panel</p>

                <p className="text-gray-600 dark:text-gray-300">
                  <strong>Node Operations:</strong>
                </p>
                <p>• Click nodes to add at top-left of visible canvas</p>
                <p>• Drag nodes from palette to canvas</p>
                <p>• Click to select nodes</p>
                <p>• Drag to move nodes (snaps to grid)</p>
                <p>• Shift+click to connect nodes</p>
                <p>• Decision and SLA nodes have Yes/No connectors</p>

                <p className="text-gray-600 dark:text-gray-300">
                  <strong>Workflow Features:</strong>
                </p>
                <p>• Start/End nodes required for save</p>
                <p>• Max connections: 1 (normal), 2 (decision/SLA)</p>
                <p>• Import/Export JSON workflows</p>
                <p>• Preview form components</p>
                <p>• Scroll for large workflows</p>
              </>
            }
          </div>
        </PermissionGate>
      )}

      {workflowId !== "new" && workflowAction !== "edit" && (
        <>
          <Button
            className="w-full mb-2"
            variant="info"
            onClick={() => setShowComponentsPreview(true)}
          >
            <BoxCubeIcon className="w-4 h-4 mr-1" /> {t("crud.workflow.builder.toolbar.actions.preview")}
          </Button>

          <PermissionGate permissions={["workflow.update"]}>
            <div className="mb-2">
              <Button
                className="w-full mb-2"
                variant="warning"
                onClick={() => window.location.replace(`/cms/workflow/editor/v3/${workflowId}/edit`)}
              >
                <PencilIcon className="w-4 h-4 mr-1" /> {t("crud.workflow.builder.toolbar.actions.edit")}
              </Button>
            </div>
          </PermissionGate>
        </>
      )}
    </div>
  );
}

export default Toolbar
