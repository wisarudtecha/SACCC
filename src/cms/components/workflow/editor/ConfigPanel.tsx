// src/cms/components/workflow/editor/ConfigPanel.tsx
import React from "react";
import { PencilIcon } from "@/core/icons";
import { usePermissions } from "@/core/hooks/usePermissions";
import type { BaseNode, Connection, Position, WorkflowData } from "@/cms/types/workflow";
import CustomizableSelect from "@/core/components/form/CustomizableSelect";
import Input from "@/core/components/form/input/InputField";
import TextArea from "@/core/components/form/input/TextArea";
import Select from "@/core/components/form/Select";

export interface ConfigPanelProps {
  t: (key: string) => string;
  selectedNode: BaseNode | null;
  editable: boolean;
  permissions: ReturnType<typeof usePermissions>;
  updateNodeData: (nodeId: string, updates: Partial<BaseNode["data"]>) => void;
  nodeTypes: Record<string, { button: string; color: string; label: string }>;
  GRID_SIZE: number;
  snapToGrid: (position: Position) => Position;
  nodes: BaseNode[];
  setNodes: React.Dispatch<React.SetStateAction<BaseNode[]>>;
  setSelectedNode: React.Dispatch<React.SetStateAction<BaseNode | null>>;
  caseStatusOptions: { value: string; label: string }[];
  requestStatusOptions: { value: string; label: string }[];
  formOptions: { value: string; label: string }[];
  groupOptions: { value: string; label: string }[];
  userOptions: { value: string; label: string }[];
  connections: Connection[];
  workflowMetadata: WorkflowData["metadata"];
  workflowStatuses: readonly { value: string; label: string; color: string }[];
}

const ConfigPanel: React.FC<ConfigPanelProps> = ({
  t,
  selectedNode,
  editable,
  permissions,
  updateNodeData,
  nodeTypes,
  GRID_SIZE,
  snapToGrid,
  nodes,
  setNodes,
  setSelectedNode,
  caseStatusOptions,
  requestStatusOptions,
  formOptions,
  groupOptions,
  userOptions,
  connections,
  workflowMetadata,
  workflowStatuses
}) => {
  return (
    <div className="xl:w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 p-4 rounded-r-2xl rounded-l-2xl xl:rounded-l-none">
      <div className="flex items-center gap-2 mb-2">
        <PencilIcon className="w-5 h-5 text-lg font-semibold text-gray-700 dark:text-gray-200" />

        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 cursor-default">
          {t("crud.workflow.builder.node.header")}
        </h3>
      </div>

      {selectedNode ? (
        <div className="space-y-2">
          <div>
            <label htmlFor="selectedNode.data.label" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
              {t("crud.workflow.builder.node.form.label.label")}
            </label>

            {editable && permissions?.hasAnyPermission(["workflow.create", "workflow.update"]) ?
              <Input
                type="text"
                id="selectedNode.data.label"
                value={selectedNode?.data?.label}
                onChange={e => updateNodeData(selectedNode?.id, { label: e?.target?.value })}
              />
            : <div className="h-11 w-full rounded-lg appearance-none py-2.5 text-sm bg-transparent text-gray-800 dark:text-gray-100 cursor-default">
                {selectedNode?.data?.label || ""}
              </div>
            }
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
              {t("crud.workflow.builder.node.form.description.label")}
            </label>

            {editable && permissions?.hasAnyPermission(["workflow.create", "workflow.update"]) ?
              <TextArea
                value={selectedNode?.data?.description || ""}
                placeholder={t("crud.workflow.builder.node.form.description.placeholder")}
                rows={1}
                onChange={value => updateNodeData(selectedNode?.id, { description: value })}
              />
            : <div className="h-11 w-full rounded-lg appearance-none py-2.5 text-sm bg-transparent text-gray-800 dark:text-gray-100 cursor-default">
                {selectedNode?.data?.description || ""}
              </div>
            }
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
              {t("crud.workflow.builder.node.form.node_type.label")}
            </label>

            <div className="flex items-center gap-2 p-2 bg-gray-200 dark:bg-gray-700 rounded-lg">
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {nodeTypes[selectedNode?.type]?.label || ""}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
              {t("crud.workflow.builder.node.form.position.label")}
            </label>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label htmlFor="selectedNode.position.x" className="block text-xs text-gray-500 dark:text-gray-400">
                  X
                </label>
                
                {editable && permissions?.hasAnyPermission(["workflow.create", "workflow.update"]) ?
                  <Input
                    type="number"
                    id="selectedNode.position.x"
                    step={GRID_SIZE}
                    value={Math?.round(selectedNode?.position?.x)}
                    onChange={e => {
                      const newPosition = snapToGrid({ 
                        x: parseInt(e?.target?.value) || 0, 
                        y: selectedNode?.position?.y 
                      });
                      const newNodes = nodes.map(n => n?.id === selectedNode?.id ? { ...n, position: newPosition } : n);
                      setNodes(newNodes);
                      setSelectedNode({ ...selectedNode, position: newPosition });
                    }}
                  />
                : <div className="h-11 w-full rounded-lg appearance-none py-2.5 text-sm bg-transparent text-gray-800 dark:text-gray-100 cursor-default">
                    {Math?.round(selectedNode?.position?.x) || 0}
                  </div>
                }
              </div>

              <div>
                <label htmlFor="selectedNode.position.y" className="block text-xs text-gray-500 dark:text-gray-400">
                  Y
                </label>

                {editable && permissions?.hasAnyPermission(["workflow.create", "workflow.update"]) ?
                  <Input
                    type="number"
                    id="selectedNode.position.y"
                    step={GRID_SIZE}
                    value={Math?.round(selectedNode?.position?.y)}
                    onChange={e => {
                      const newPosition = snapToGrid({ 
                        x: selectedNode?.position?.x, 
                        y: parseInt(e?.target?.value) || 0 
                      });
                      const newNodes = nodes?.map(n => n?.id === selectedNode?.id ? { ...n, position: newPosition } : n);
                      setNodes(newNodes);
                      setSelectedNode({ ...selectedNode, position: newPosition });
                    }}
                  />
                : <div className="h-11 w-full rounded-lg appearance-none py-2.5 text-sm bg-transparent text-gray-800 dark:text-gray-100 cursor-default" >
                    {Math?.round(selectedNode?.position?.y) || 0}
                  </div>
                }
              </div>
            </div>
          </div>

          {/* Type-specific configuration */}
          {selectedNode?.type === "decision" && (
            <div>
              <label htmlFor="selectedNode.data.config.condition" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                {t("crud.workflow.builder.node.form.conditions.label")}
              </label>

              {editable && permissions?.hasAnyPermission(["workflow.create", "workflow.update"]) ?
                <Input
                  type="text"
                  id="selectedNode.data.config.condition"
                  placeholder={t("crud.workflow.builder.node.form.conditions.placeholder")}
                  value={typeof selectedNode?.data?.config?.condition === "string" ? selectedNode?.data?.config?.condition : ""}
                  onChange={e => updateNodeData(selectedNode?.id, { 
                    config: { ...(selectedNode?.data?.config ?? {}), condition: e?.target?.value }
                  })}
                />
              : <div className="h-11 w-full rounded-lg appearance-none py-2.5 text-sm bg-transparent text-gray-800 dark:text-gray-100 cursor-default">
                  {typeof selectedNode?.data?.config?.condition === "string" ? selectedNode?.data?.config?.condition : ""}
                </div>
              }
            </div>
          )}

          {selectedNode?.type === "sla" && (
            <div>
              <label htmlFor="selectedNode.data.config.SLA" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                {t("crud.workflow.builder.node.form.sla.label")}
              </label>

              {editable && permissions?.hasAnyPermission(["workflow.create", "workflow.update"]) ?
                <Input
                  type="number"
                  id="selectedNode.data.config.SLA"
                  max="720"
                  min="1"
                  value={
                    typeof selectedNode?.data?.config?.SLA === "string" || typeof selectedNode?.data?.config?.SLA === "number"
                    ? selectedNode?.data?.config?.SLA : ""
                  }
                  onChange={(e) => updateNodeData(selectedNode.id, { 
                    config: { ...selectedNode?.data?.config, SLA: e?.target?.value }
                  })}
                />
              : <div className="h-11 w-full rounded-lg appearance-none py-2.5 text-sm bg-transparent text-gray-500 dark:text-gray-400 cursor-default">
                  {
                    typeof selectedNode?.data?.config?.SLA === "string" || typeof selectedNode?.data?.config?.SLA === "number"
                    ? selectedNode?.data?.config?.SLA : ""
                  }
                </div>
              }
            </div>
          )}

          {(selectedNode?.type === "process" || selectedNode?.type === "dispatch") && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                  {t("crud.workflow.builder.node.form.actions.label")}
                </label>

                {editable && permissions?.hasAnyPermission(["workflow.create", "workflow.update"]) ?
                  (workflowMetadata?.wfType === "request" && (
                    <Select
                      className="bg-white dark:bg-gray-900 cursor-pointer"
                      options={requestStatusOptions || []}
                      placeholder={t("crud.workflow.builder.node.form.actions.placeholder")}
                      value={typeof selectedNode?.data?.config?.action === "string" ? selectedNode?.data?.config?.action : ""}
                      onChange={value => updateNodeData(selectedNode?.id, {
                        config: { ...selectedNode?.data?.config, action: value }
                      })}
                    />
                  )) ||
                  (workflowMetadata?.wfType === "case" && (
                    <Select
                      className="bg-white dark:bg-gray-900 cursor-pointer"
                      options={caseStatusOptions || []}
                      placeholder={t("crud.workflow.builder.node.form.actions.placeholder")}
                      value={typeof selectedNode?.data?.config?.action === "string" ? selectedNode?.data?.config?.action : ""}
                      onChange={value => updateNodeData(selectedNode?.id, {
                        config: { ...selectedNode?.data?.config, action: value }
                      })}
                    />
                  ))
                : <div className="h-11 w-full rounded-lg appearance-none py-2.5 text-sm bg-transparent text-gray-800 dark:text-gray-100 cursor-default">
                    {(workflowMetadata?.wfType === "request" && (
                      requestStatusOptions?.find(a => a?.value === selectedNode?.data?.config?.action)?.label || ""
                    )) ||
                    (workflowMetadata?.wfType === "case" && (
                      caseStatusOptions?.find(a => a?.value === selectedNode?.data?.config?.action)?.label || ""
                    )) ||
                    "-"}
                  </div>
                }
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                  {t("crud.workflow.builder.node.form.form.label")}
                </label>

                {editable && permissions?.hasAnyPermission(["workflow.create", "workflow.update"]) ?
                  <Select
                    className="bg-white dark:bg-gray-900 cursor-pointer"
                    options={formOptions || []}
                    placeholder={t("crud.workflow.builder.node.form.form.placeholder")}
                    value={typeof selectedNode?.data?.config?.formId === "string" ? selectedNode?.data?.config?.formId : ""}
                    onChange={value => updateNodeData(selectedNode?.id, { 
                      config: { ...selectedNode?.data?.config, formId: value }
                    })}
                  />
                : <div className="h-11 w-full rounded-lg appearance-none py-2.5 text-sm bg-transparent text-gray-800 dark:text-gray-100 cursor-default">
                    {formOptions?.find(f => f?.value === selectedNode?.data?.config?.formId)?.label || ""}
                  </div>
                }
              </div>

              <div>
                <label htmlFor="selectedNode.data.config.sla" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                  {t("crud.workflow.builder.node.form.sla.label")}
                </label>

                {editable && permissions?.hasAnyPermission(["workflow.create", "workflow.update"]) ?
                  <Input
                    type="number"
                    id="selectedNode.data.config.sla"
                    max="720"
                    min="1"
                    value={
                      typeof selectedNode?.data?.config?.sla === "string" || typeof selectedNode?.data?.config?.sla === "number"
                      ? selectedNode?.data?.config?.sla : ""
                    }
                    onChange={e => updateNodeData(selectedNode?.id, { 
                      config: { ...selectedNode?.data?.config, sla: e?.target?.value }
                    })}
                  />
                : <div className="h-11 w-full rounded-lg appearance-none py-2.5 text-sm bg-transparent text-gray-800 dark:text-gray-100 cursor-default">
                    {typeof selectedNode.data.config?.sla === "string" || typeof selectedNode.data.config?.sla === "number" ? selectedNode.data.config.sla : ""}
                  </div>
                }
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                  {t("crud.workflow.builder.node.form.group.label")}
                </label>

                {editable && permissions?.hasAnyPermission(["workflow.create", "workflow.update"]) ?
                  <CustomizableSelect
                    options={groupOptions || []}
                    placeholder={t("crud.workflow.builder.node.form.group.placeholder")}
                    value={Array?.isArray(selectedNode?.data?.config?.group) ? selectedNode?.data?.config?.group : []}
                    onChange={value => updateNodeData(selectedNode?.id, {
                      config: { ...selectedNode?.data?.config, group: value }
                    })}
                  />
                : <div className="h-11 w-full rounded-lg appearance-none py-2.5 text-sm bg-transparent text-gray-800 dark:text-gray-100 cursor-default">
                    {Array?.isArray(selectedNode?.data?.config?.group) ? selectedNode?.data?.config?.group?.map(
                      group => groupOptions?.find(g => g?.value === group)?.label
                    ).join(", ") : ""}
                  </div>
                }
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                  {t("crud.workflow.builder.node.form.pic.label")}
                </label>

                {editable && permissions?.hasAnyPermission(["workflow.create", "workflow.update"]) ?
                  <CustomizableSelect
                    options={userOptions || []}
                    placeholder={t("crud.workflow.builder.node.form.pic.placeholder")}
                    value={Array?.isArray(selectedNode?.data?.config?.pic) ? selectedNode?.data?.config?.pic : []}
                    onChange={value => updateNodeData(selectedNode.id, { 
                      config: { ...selectedNode?.data?.config, pic: value }
                    })}
                  />
                : <div className="h-11 w-full rounded-lg appearance-none py-2.5 text-sm bg-transparent text-gray-800 dark:text-gray-100 cursor-default">
                    {Array?.isArray(selectedNode?.data?.config?.pic) ? selectedNode?.data?.config?.pic?.map(
                      pic => userOptions?.find(u => u?.value === pic)?.label
                    ).join(", ") : ""}
                  </div>
                }
              </div>
            </>
          )}

          {/* Connection Info */}
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700 cursor-default">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
              {t("crud.workflow.builder.node.connections.header")}
            </h4>

            <div className="text-xs text-gray-600 dark:text-gray-300 space-y-1">
              <div>
                {t("crud.workflow.builder.node.connections.outgoing")}: {connections?.filter(c => c?.source === selectedNode?.id)?.length}
                {(selectedNode?.type === "decision" || selectedNode?.type === "sla") && " / 2 (Yes/No)"}
                {selectedNode?.type !== "decision" && selectedNode?.type !== "sla" && " / 1"}
              </div>

              <div>{t("crud.workflow.builder.node.connections.incoming")}: {connections?.filter(c => c?.target === selectedNode?.id)?.length}</div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center text-gray-600 dark:text-gray-300 py-8 cursor-default">
          <PencilIcon className="w-12 h-12 mx-auto mb-2 opacity-30" />

          <p>
            {t("crud.workflow.builder.node.description")}
          </p>
        </div>
      )}

      {/* Workflow Stats */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 cursor-default">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
          {t("crud.workflow.builder.node.stats.header")}
        </h4>

        <div className="text-xs text-gray-600 dark:text-gray-300 space-y-1">
          <div>
            {t("crud.workflow.builder.node.stats.title")}: <span className="font-medium">{workflowMetadata?.title || ""}</span>
          </div>

          <div>
            {t("crud.workflow.builder.node.stats.status")}: <span className={`px-1 py-0.5 rounded text-xs ${
              workflowStatuses?.find(s => s?.value === workflowMetadata?.status)?.color
              || "text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-900"
            }`}>
              {workflowStatuses?.find(s => s?.value === workflowMetadata?.status)?.label}
            </span>
          </div>

          <div>{t("crud.workflow.builder.node.stats.nodes")}: {nodes?.length || 0}</div>

          <div>{t("crud.workflow.builder.node.stats.connections")}: {connections?.length || 0}</div>

          <div>{t("crud.workflow.builder.node.stats.start_nodes")}: {nodes?.filter(n => n?.type === "start")?.length || 0}</div>

          <div>{t("crud.workflow.builder.node.stats.end_nodes")}: {nodes?.filter(n => n?.type === "end")?.length || 0}</div>
        </div>
      </div>
    </div>
  );
};

export default ConfigPanel;
