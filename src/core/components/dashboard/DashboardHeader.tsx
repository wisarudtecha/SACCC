// /src/components/dashboard/DashboardHeader.tsx
import React from "react";
import Button from "@/core/components/ui/button/Button";
import Select from "@/core/components/form/Select";
import { RotateCcw, Plus, Settings, Share2 } from "lucide-react";

export const DashboardHeader: React.FC<{
  layoutName: string;
  isCustomizing: boolean;
  // Updated: [07-07-2025] v0.1.1
  rowHeight: number;
  onToggleCustomizing: () => void;
  onAddWidget: () => void;
  onRefresh: () => void;
  // Updated: [07-07-2025] v0.1.1
  onRowHeightChange: (height: number) => void;
}> = ({
  layoutName,
  isCustomizing,
  // Updated: [07-07-2025] v0.1.1
  rowHeight,
  onToggleCustomizing,
  onAddWidget,
  onRefresh,
  // Updated: [07-07-2025] v0.1.1
  onRowHeightChange
}) => {
  return (
    <div
      // className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-4"
      // className="bg-white dark:bg-gray-900 px-6 py-4"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{layoutName}</h1>
          {/* <p className="text-sm text-gray-500 dark:text-gray-400">Real-time insights and metrics</p> */}
        </div>
        
        <div className="flex items-center space-x-3">
          {/* Updated: [07-07-2025] v0.1.1 */}
          {isCustomizing && (
            <div className="flex items-center space-x-2">
              <label className="text-sm text-gray-600 dark:text-gray-300">Row Height:</label>
              <Select
                value={`${rowHeight}`}
                onChange={(value) => onRowHeightChange(parseInt(value))}
                options={[
                  { value: "150", label: "Compact (150px)" },
                  { value: "200", label: "Normal (200px)" },
                  { value: "250", label: "Large (250px)" },
                  { value: "300", label: "Extra Large (300px)" }
                ]}
              />
            </div>
          )}

          <Button
            onClick={onRefresh}
            variant="outline"
            size="sm"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          
          <Button
            onClick={onAddWidget}
            disabled={!isCustomizing}
            variant={`${
              isCustomizing 
                ? 'primary' 
                : 'outline'
            }`}
            size="sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Widget
          </Button>
          
          <Button
            onClick={onToggleCustomizing}
            variant={`${
              isCustomizing
                ? 'success'
                : 'warning'
            }`}
            size="sm"
          >
            <Settings className="h-4 w-4 mr-2" />
            {isCustomizing ? 'Done' : 'Customize'}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
          >
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
        </div>
      </div>
    </div>
  );
};
