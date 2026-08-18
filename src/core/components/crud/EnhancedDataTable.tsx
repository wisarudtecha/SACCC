// /src/components/crud/EnhancedDataTable.tsx
// import React from "react";
import { Table } from "@/core/components/ui/table";
import Button from "@/core/components/ui/button/Button";
import { ChevronUpIcon, ChevronDownIcon } from "@/core/icons";
import type { TableColumn, SortConfig, CrudAction } from "@/core/types/crud";

interface EnhancedDataTableProps<T> {
  data: T[];
  columns: TableColumn<T>[];
  sortConfig: SortConfig<T>;
  onSort: (key: keyof T) => void;
  actions?: CrudAction<T>[];
  selectedItems: T[];
  onSelectItem: (item: T) => void;
  onSelectAll: () => void;
  isAllSelected: boolean;
  isPartialSelected: boolean;
  bulkSelectionEnabled?: boolean;
  className?: string;
}

export const EnhancedDataTable = <T extends { id: string }>({
  data,
  columns,
  sortConfig,
  onSort,
  actions,
  selectedItems,
  onSelectItem,
  onSelectAll,
  isAllSelected,
  isPartialSelected,
  bulkSelectionEnabled = false,
  className = ""
}: EnhancedDataTableProps<T>) => {
  const renderCell = (item: T, column: TableColumn<T>) => {
    if (column.render) {
      return column.render(item);
    }
    
    const value = item[column.key as keyof T];
    return value?.toString() || "";
  };

  const isSelected = (item: T) => selectedItems.some(selected => selected.id === item.id);

  return (
    <div className={`bg-white dark:bg-gray-900 rounded-lg shadow-sm border-none overflow-hidden ${className}`}>
      <div className="overflow-x-auto">
        <Table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              {bulkSelectionEnabled && (
                <th className="px-6 py-3 text-left w-12">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    ref={(input) => {
                      if (input) input.indeterminate = isPartialSelected;
                    }}
                    onChange={onSelectAll}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                  />
                </th>
              )}
              
              {columns.map((column) => (
                <th key={column.key as string} className="px-6 py-3 text-left">
                  {column.sortable ? (
                    <button
                      onClick={() => onSort(column.key as keyof T)}
                      className="flex items-center gap-1 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                    >
                      {column.label}
                      {sortConfig.key === column.key && (
                        sortConfig.direction === "asc" 
                          ? <ChevronUpIcon className="w-4 h-4" /> 
                          : <ChevronDownIcon className="w-4 h-4" />
                      )}
                    </button>
                  ) : (
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {column.label}
                    </span>
                  )}
                </th>
              ))}
              
              {actions && actions.length > 0 && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
            {data.map((item) => (
              <tr 
                key={item.id} 
                className={`transition-colors ${
                  isSelected(item) 
                    ? "bg-blue-50 dark:bg-blue-900/20" 
                    : "hover:bg-gray-50 dark:hover:bg-gray-800"
                }`}
              >
                {bulkSelectionEnabled && (
                  <td className="px-6 py-4 w-12">
                    <input
                      type="checkbox"
                      checked={isSelected(item)}
                      onChange={() => onSelectItem(item)}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                    />
                  </td>
                )}
                
                {columns.map((column) => (
                  <td key={`${item.id}-${column.key as string}`} className={`px-6 py-4 ${column.className || ""}`}>
                    {renderCell(item, column)}
                  </td>
                ))}
                
                {actions && actions.length > 0 && (
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {actions
                        .filter(action => !action.condition || action.condition(item))
                        .map((action) => {
                          const Icon = action.icon;
                          return (
                            <Button
                              key={action.key}
                              onClick={() => action.onClick(item)}
                              variant={action.variant}
                              size="xs"
                              title={action.label}
                            >
                              {Icon && <Icon />}
                              {action.label}
                            </Button>
                          );
                        })}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
    </div>
  );
};
