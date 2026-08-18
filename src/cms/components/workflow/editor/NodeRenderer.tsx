// src/cms/components/workflow/editor/NodeRenderer.tsx
import React from "react";
import { AngleLeftIcon, AngleRightIcon, TrashBinIcon } from "@/core/icons";
import { usePermissions } from "@/core/hooks/usePermissions";
import type { BaseNode } from "@/cms/types/workflow";

export interface NodeRendererProps {
  nodes: BaseNode[];
  nodeTypes: Record<string, { button: string; color: string; label: string }>;
  selectedNode: BaseNode | null;
  editable: boolean;
  permissions: ReturnType<typeof usePermissions>;
  isDragging: string | null;
  handleNodeMouseDown: (e: React.MouseEvent, nodeId: string) => void;
  deleteNode: (nodeId: string) => void;
}

const NodeRenderer: React.FC<NodeRendererProps> = ({
  nodes,
  nodeTypes,
  selectedNode,
  editable,
  permissions,
  isDragging,
  handleNodeMouseDown,
  deleteNode
}) => {
  return (
    nodes?.map(node => {
      const nodeConfig = nodeTypes[node?.type];
      const isSelected = selectedNode?.id === node?.id;
      const isContinueFromWorkflow = node?.type === "start" && node?.data?.config?.continueFromWorkflow;
      const isAllowContinuation = node?.type === "end" && node?.data?.config?.allowContinuation;
      
      return (
        <div
          key={node?.id}
          data-node-id={node?.id}
          className={`absolute pointer-events-auto select-none transition-all rounded-lg ${isSelected ?
              "ring-2 ring-blue-500 dark:ring-blue-400 ring-offset-0" : ""
            } ${editable && permissions?.hasAnyPermission(["workflow.create", "workflow.update"]) ? (isDragging === node?.id ?
              "cursor-grabbing" : "cursor-grab") : "cursor-default"}
          `}
          style={{
            left: node?.position?.x,
            top: node?.position?.y,
            zIndex: 2
          }}
          onMouseDown={e => handleNodeMouseDown(e, node?.id)}
        >
          {(node.type === "decision" || node.type === "sla") ? (
            // Diamond shape for decision nodes
            <div className="relative w-24 h-16 flex items-center justify-center">
              <svg width="96" height="64" className="absolute inset-0">
                <polygon
                  points="48,4 88,32 48,60 8,32"
                  fill={node?.type === "decision" ? "rgb(234 179 8)" : "rgb(168 85 247)"}
                  stroke="white"
                  strokeWidth="2"
                  className="drop-shadow-lg"
                />
              </svg>

              <div className="relative z-10 flex flex-col items-center justify-center text-white dark:text-gray-900">
                <span className="text-xs font-medium truncate px-1 max-w-16 text-center">
                  {node.data.label}
                </span>
              </div>
            </div>
          ) : (
            // Rectangle shape for other nodes
            <div className={`w-24 h-16 rounded-lg border-2 border-white dark:border-gray-900 shadow-lg flex flex-col items-center justify-center text-white dark:text-gray-900 ${nodeConfig.color}`}>
              <span className="text-xs font-medium truncate px-1">
                {node.data.label}
              </span>

              {/* Visual indicators for workflow continuation */}
              {isContinueFromWorkflow ? (
                <div className="absolute -top-2 -left-2 w-6 h-6 bg-blue-400 border border-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-xs">
                    <AngleLeftIcon className="w-3 h-3" />
                  </span>
                </div>
              ) : ""}
              
              {/* Visual indicators for workflow continuation */}
              {isAllowContinuation ? (
                <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-green-400 border border-green-600 rounded-full flex items-center justify-center">
                  <span className="text-xs">
                    <AngleRightIcon className="w-3 h-3" />
                  </span>
                </div>
              ) : ""}
            </div>
          )}
          
          {isSelected && editable && permissions?.hasAnyPermission(["workflow.create", "workflow.update"]) && (
            <button
              className="absolute -top-2 -right-2 w-6 h-6 bg-red-400 border border-red-600 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
              onClick={e => {
                e?.stopPropagation();
                deleteNode(node?.id);
              }}
            >
              <TrashBinIcon className="w-3 h-3" />
            </button>
          )}
        </div>
      );
    }) || null
  );
};

export default NodeRenderer;
