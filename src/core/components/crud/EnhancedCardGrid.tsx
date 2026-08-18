// /src/components/crud/EnhancedCardGrid.tsx
import React from "react";
import Button from "@/core/components/ui/button/Button";
import Checkbox from "@/core/components/form/input/Checkbox";
// import { MoreDotIcon } from "@/core/icons";
import type { CrudAction } from "@/core/types/crud";

interface EnhancedCardGridProps<T> {
  data: T[];
  renderCard: (item: T) => React.ReactNode;
  actions?: CrudAction<T>[];
  selectedItems: T[];
  onSelectItem: (item: T) => void;
  bulkSelectionEnabled?: boolean;
  className?: string;
}

export const EnhancedCardGrid = <T extends { id: string }>({
  data,
  renderCard,
  actions,
  selectedItems,
  onSelectItem,
  bulkSelectionEnabled = false,
  className = ""
}: EnhancedCardGridProps<T>) => {
  const isSelected = (item: T) => selectedItems.some(selected => selected.id === item.id);

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 xl:gap-6 ${className}`}>
      {data.map((item) => (
        <div
          key={item.id}
          className={`bg-white dark:bg-gray-900 p-3 xl:p-6 rounded-lg shadow-sm border transition-all ${
            isSelected(item)
              ? "border-blue-500 ring-2 ring-blue-200 dark:ring-blue-800"
              : "border-gray-200 dark:border-gray-700 hover:shadow-md"
          }`}
        >
          {renderCard(item)}
          
          {actions && actions.length > 0 && (
            <div className="xl:flex items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="xl:flex items-center gap-2">
                {actions
                  .filter(action => !action.condition || action.condition(item))
                  .slice(0, 3)
                  .map((action) => {
                    const Icon = action.icon;
                    return (
                      <Button
                        key={action.key}
                        onClick={() => action.onClick(item)}
                        variant={action.variant}
                        size="xs"
                        className="lg:block lg:w-full lg:mb-2"
                      >
                        {Icon && <Icon />}
                        {action.label}
                      </Button>
                    );
                  })}
              </div>
              
              {bulkSelectionEnabled && (
                <div className="xl:flex items-center xl:justify-end mb-2">
                  <Checkbox
                    checked={isSelected(item)}
                    onChange={() => onSelectItem(item)}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                  />
                </div>
              )}

              {/*
              {actions.length > 3 && (
                <div className="relative">
                  <Button variant="ghost" size="xs">
                    <MoreDotIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  </Button>
                </div>
              )}
              */}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
