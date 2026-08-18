// /src/components/crud/ClickableCard.tsx
import React from "react";
import { PermissionGate } from "@/core/components/auth/PermissionGate";
import type { CrudAction } from "@/core/types/crud";
import Button from "@/core/components/ui/button/Button";
import Checkbox from "@/core/components/form/input/Checkbox";

interface ClickableCardProps<T> {
  item: T;
  children: React.ReactNode;
  onClick: (item: T) => void;
  actions?: CrudAction<T>[];
  selectedItems: T[];
  onSelectItem: (item: T) => void;
  bulkSelectionEnabled?: boolean;
  className?: string;
  module?: string;
}

export const ClickableCard = <T extends { id: string }>({
  item,
  children,
  onClick,
  actions,
  selectedItems,
  onSelectItem,
  bulkSelectionEnabled = false,
  // className = ""
  module
}: ClickableCardProps<T>) => {
  // const isSelected = selectedItems.some(selected => selected.id === item.id);
  const isSelected = (item: T) => selectedItems.some(selected => selected.id === item.id);

  const handleCardClick = (e: React.MouseEvent) => {
    // Don"t trigger preview if clicking on buttons or checkboxes
    const target = e.target as HTMLElement;
    if (
      target.closest("button") || 
      target.closest(`input[type="checkbox"]`) ||
      target.closest(".action-button")
    ) {
      return;
    }
    
    onClick(item);
  };

  return (
    <div
      className={`bg-white dark:bg-gray-900 p-3 xl:p-6 rounded-lg shadow-sm border transition-all cursor-pointer hover:shadow-md ${
        isSelected(item)
          ? "border-blue-500 ring-2 ring-blue-200 dark:ring-blue-800"
          // : "border-gray-200 dark:border-gray-700 hover:shadow-md"
          : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
      }`}
      onClick={handleCardClick}
    >
      {children}

      {actions && actions.length > 0 && (
        <div className="xl:flex items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="lg:flex items-center gap-2 mb-4 lg:mb-0">
            {actions
              .filter(action => !action.condition || action.condition(item))
              .slice(0, 3)
              .map((action) => {
                const Icon = action.icon;
                return (
                  <PermissionGate key={action.key} module={module} action={`${action?.key as "view" | "create" | "update" | "delete"}`}>
                    <Button
                      key={action.key}
                      onClick={() => action.onClick(item)}
                      variant={action.variant}
                      size="xs"
                      className="lg:block lg:w-full lg:mb-2 mr-2 lg:mr-0"
                    >
                      {Icon && <Icon />}
                      {action.label}
                    </Button>
                  </PermissionGate>
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
        </div>
      )}
    </div>
  );
};
