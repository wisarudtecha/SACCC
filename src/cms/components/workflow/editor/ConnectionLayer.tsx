// src/cms/components/workflow/editor/ConnectionLayer.tsx
import React from "react";
import type { Connection, Position } from "@/cms/types/workflow";

export interface ConnectionLayerProps {
  connections: Connection[];
  getNodePosition: (nodeId: string) => Position;
  getNodeConnectionPoint: (fromPos: Position, toPos: Position, isSource: boolean) => Position;
  isConnecting: string | null;
  tempConnection: Position | null;
  connectingFrom: "yes" | "no" | null;
}

const ConnectionLayer: React.FC<ConnectionLayerProps> = ({
  connections,
  getNodePosition,
  getNodeConnectionPoint,
  isConnecting,
  tempConnection,
  connectingFrom
}) => {
  return (
    <>
      {/* Connections */}
      {connections?.map(connection => {
        const sourcePos = getNodePosition(connection?.source);
        const targetPos = getNodePosition(connection?.target);
        const sourcePoint = getNodeConnectionPoint(sourcePos, targetPos, true);
        const targetPoint = getNodeConnectionPoint(sourcePos, targetPos, false);
        
        // Determine if connection is vertical (straight line) or horizontal (curve)
        const isVertical = Math?.abs(sourcePoint?.x - targetPoint?.x) < 10;
        
        let pathD;
        if (isVertical) {
          // Straight line for vertical connections
          pathD = `M ${sourcePoint?.x},${sourcePoint?.y} L ${targetPoint?.x},${targetPoint?.y}`;
        }
        else {
          // Curved line for horizontal connections
          const midX = (sourcePoint?.x + targetPoint?.x) / 2;
          pathD = `M ${sourcePoint?.x},${sourcePoint?.y} C ${midX},${sourcePoint?.y} ${midX},${targetPoint?.y} ${targetPoint?.x},${targetPoint?.y}`;
        }
        
        // Calculate label position
        const labelX = (sourcePoint?.x + targetPoint?.x) / 2;
        const labelY = (sourcePoint?.y + targetPoint?.y) / 2;
        
        return (
          <g key={connection?.id}>
            <path
              d={pathD}
              fill="none"
              markerEnd="url(#arrowhead)"
              stroke="#cccccc"
              strokeWidth="2"
            />

            {connection?.label && (
              <g>
                <circle
                  cx={labelX}
                  cy={labelY}
                  fill="white"
                  r="12"
                  stroke="#6b7280"
                  strokeWidth="1"
                />

                <text
                  dominantBaseline="central"
                  fill="#374151"
                  fontSize="10"
                  fontWeight="bold"
                  textAnchor="middle"
                  x={labelX}
                  y={labelY}
                >
                  {connection?.label === "yes" && "Y" || "N"}
                </text>
              </g>
            )}
          </g>
        );
      }) || null}

      {/* Temporary connection while dragging */}
      {isConnecting && tempConnection && (
        <g>
          <path
            d={`M 
              ${getNodeConnectionPoint(getNodePosition(isConnecting), tempConnection, true)?.x},
              ${getNodeConnectionPoint(getNodePosition(isConnecting), tempConnection, true)?.y} L 
              ${tempConnection?.x},${tempConnection?.y}
            `}
            fill="none"
            stroke="#3b82f6"
            strokeDasharray="5,5"
            strokeWidth="2"
          />

          {connectingFrom && (
            <text
              x={tempConnection?.x + 10}
              y={tempConnection?.y - 10}
              fontSize="12"
              fill="#3b82f6"
              fontWeight="bold"
            >
              {connectingFrom?.toUpperCase()}
            </text>
          )}
        </g>
      )}
    
      {/* Arrow marker */}
      <defs>
        <marker
          id="arrowhead"
          markerHeight="7"
          markerWidth="10"
          orient="auto"
          refX="10"
          refY="3.5"
        >
          <polygon
            fill="#6b7280"
            points="0 0, 10 3.5, 0 7"
          />
        </marker>
      </defs>
    </>
  );
};

export default ConnectionLayer;
