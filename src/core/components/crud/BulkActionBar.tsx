// /src/components/crud/BulkActionBar.tsx
// import React from "react";
import Button from "@/core/components/ui/button/Button";
import {
  CheckCircleIcon,
  CloseIcon,
  // TrashBinIcon,
  // DownloadIcon
} from "@/core/icons";
import type { BulkAction } from "@/core/types/enhanced-crud";

interface BulkActionBarProps<T> {
  selectedCount: number;
  totalCount: number;
  bulkActions: BulkAction<T>[];
  selectedItems: T[];
  onDeselectAll: () => void;
  onAction: (action: BulkAction<T>) => void;
}

export const BulkActionBar = <T,>({
  selectedCount,
  totalCount,
  bulkActions,
  selectedItems,
  onDeselectAll,
  onAction
}: BulkActionBarProps<T>) => {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 px-6 py-4 z-50">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <CheckCircleIcon className="w-5 h-5 text-blue-500" />
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            {selectedCount} of {totalCount} selected
          </span>
        </div>

        <div className="h-6 w-px bg-gray-300 dark:bg-gray-600" />

        <div className="flex items-center gap-2">
          {bulkActions
            .filter(action => !action.condition || action.condition(selectedItems))
            .map(action => {
              const Icon = action.icon;
              return (
                <Button
                  key={action.key}
                  onClick={() => onAction(action)}
                  variant={action.variant}
                  size="sm"
                >
                  {Icon && <Icon />}
                  {action.label}
                </Button>
              );
            })}
        </div>

        <Button
          onClick={onDeselectAll}
          variant="ghost"
          size="sm"
        >
          <CloseIcon className="w-4 h-4" />
          Clear
        </Button>
      </div>
    </div>
  );
};
