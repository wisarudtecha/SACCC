// src/cms/components/workflow/editor/Canvas.tsx
import React from "react";
import { usePermissions } from "@/core/hooks/usePermissions";
import ConnectionLayer, { ConnectionLayerProps } from "@/cms/components/workflow/editor/ConnectionLayer";
import NodeRenderer, { NodeRendererProps } from "@/cms/components/workflow/editor/NodeRenderer";

export interface CanvasProps {
  canvasRef: React.RefObject<HTMLDivElement | null>;
  editable: boolean;
  permissions: ReturnType<typeof usePermissions>;
  handleDragLeave: (e: React.DragEvent) => void;
  handleDragOver: (e: React.DragEvent) => void;
  handleDrop: (e: React.DragEvent) => void;
  handleMouseUp: (e: React.MouseEvent) => void;
  handleMouseMove: (e: React.MouseEvent) => void;
  svgRef: React.RefObject<SVGSVGElement | null>;
  GRID_SIZE: number;
  ConnectionLayerProps: ConnectionLayerProps;
  NodeRendererProps: NodeRendererProps;
}

const Canvas: React.FC<CanvasProps> = ({
  canvasRef,
  editable,
  permissions,
  handleDragLeave,
  handleDragOver,
  handleDrop,
  handleMouseUp,
  handleMouseMove,
  svgRef,
  GRID_SIZE,
  ConnectionLayerProps,
  NodeRendererProps
}) => {
  return (
    <div className="xl:flex-1 relative xl:overflow-x-auto xl:overflow-y-auto min-h-lvh">
      <div
        ref={canvasRef}
        className={`min-w-full min-h-full relative 
          ${editable && permissions?.hasAnyPermission(["workflow.create", "workflow.update"]) ? "cursor-grab active:cursor-grabbing" : "cursor-default"}`
        }
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onMouseLeave={handleMouseUp}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        <svg
          className="xl:absolute inset-0"
          ref={svgRef}
          style={{ width: "2000px", height: "2000px", zIndex: 1 }}
        >
          {/* Grid Pattern */}
          <defs>
            <pattern id="grid" width={GRID_SIZE} height={GRID_SIZE} patternUnits="userSpaceOnUse">
              <path d={`M ${GRID_SIZE} 0 L 0 0 0 ${GRID_SIZE}`} fill="none" stroke="#e5e7eb" strokeWidth="1"/>
            </pattern>
            <pattern id="major-grid" width={GRID_SIZE * 5} height={GRID_SIZE * 5} patternUnits="userSpaceOnUse">
              <path d={`M ${GRID_SIZE * 5} 0 L 0 0 0 ${GRID_SIZE * 5}`} fill="none" stroke="#d1d5db" strokeWidth="1"/>
            </pattern>
            <pattern id="grid-dark" width={GRID_SIZE} height={GRID_SIZE} patternUnits="userSpaceOnUse">
              <path d={`M ${GRID_SIZE} 0 L 0 0 0 ${GRID_SIZE}`} fill="none" stroke="#555555" strokeWidth="1"/>
            </pattern>
            <pattern id="major-grid-dark" width={GRID_SIZE * 5} height={GRID_SIZE * 5} patternUnits="userSpaceOnUse">
              <path d={`M ${GRID_SIZE * 5} 0 L 0 0 0 ${GRID_SIZE * 5}`} fill="none" stroke="#666666" strokeWidth="1"/>
            </pattern>
          </defs>

          <rect width="100%" height="100%" fill="url(#grid)" className="dark:hidden" />
          <rect width="100%" height="100%" fill="url(#major-grid)" className="dark:hidden" />
          <rect width="100%" height="100%" fill="url(#grid-dark)" className="hidden dark:block" />
          <rect width="100%" height="100%" fill="url(#major-grid-dark)" className="hidden dark:block" />

          {/* Connections */}
          <ConnectionLayer {...ConnectionLayerProps} />
        </svg>

        {/* Nodes */}
        <NodeRenderer {...NodeRendererProps} />
      </div>
    </div>
  );
};

export default Canvas;
