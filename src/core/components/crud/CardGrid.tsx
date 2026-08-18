// /src/components/crud/CardGrid.tsx
import React from "react";
import Button from "@/core/components/ui/button/Button";
// import { MoreDotIcon } from "@/core/icons";
import type {
  CrudAction,
  // StatusOption
} from "@/core/types/crud";

interface CardGridProps<T> {
  data: T[];
  renderCard: (item: T) => React.ReactNode;
  actions?: CrudAction<T>[];
  className?: string;
}

export const CardGrid = <T extends { id: string }>({
  data,
  renderCard,
  actions,
  className = ""
}: CardGridProps<T>) => {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${className}`}>
      {data.map((item) => (
        <div
          key={item.id}
          className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow border-gray-200 dark:border-gray-700"
        >
          {renderCard(item)}
          
          {actions && actions.length > 0 && (
            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center gap-2">
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
                      >
                        {Icon && <Icon />}
                        {action.label}
                      </Button>
                    );
                  })}
              </div>
              
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
