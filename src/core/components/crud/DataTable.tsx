// /src/components/crud/DataTable.tsx
// import React from "react";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/core/components/ui/table";
import Button from "@/core/components/ui/button/Button";
import { ChevronUpIcon, ChevronDownIcon } from "@/core/icons";
import type { TableColumn, SortConfig, CrudAction } from "@/core/types/crud";

interface DataTableProps<T> {
  data: T[];
  columns: TableColumn<T>[];
  sortConfig: SortConfig<T>;
  onSort: (key: keyof T) => void;
  actions?: CrudAction<T>[];
  className?: string;
}

export const DataTable = <T extends { id: string }>({
  data,
  columns,
  sortConfig,
  onSort,
  actions,
  className = ""
}: DataTableProps<T>) => {
  const renderCell = (item: T, column: TableColumn<T>) => {
    if (column.render) {
      return column.render(item);
    }
    
    const value = item[column.key as keyof T];
    return value?.toString() || "";
  };

  return (
    <div className={`bg-white dark:bg-gray-900 rounded-lg shadow-sm border-none overflow-hidden ${className}`}>
      <div className="overflow-x-auto">
        <Table className="w-full">
          <TableHeader className="bg-gray-100 dark:bg-gray-800">
            <TableRow>
              {columns.map((column) => (
                <TableCell isHeader key={column.key as string} className="px-6 py-3 text-left">
                  {column.sortable ? (
                    <button
                      onClick={() => onSort(column.key as keyof T)}
                      className="flex items-center gap-1 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hover:text-gray-700 dark:hover:text-gray-200"
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
                </TableCell>
              ))}
              {actions && actions.length > 0 && (
                <TableCell isHeader className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </TableCell>
              )}
            </TableRow>
          </TableHeader>
          <TableBody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
            {data.map((item) => (
              <TableRow key={item.id} className="hover:bg-gray-100 dark:hover:bg-gray-800">
                {columns.map((column) => (
                  <TableCell key={`${item.id}-${column.key as string}`} className={`px-6 py-4 ${column.className || ""} font-medium text-gray-900 dark:text-white`}>
                    {renderCell(item, column)}
                  </TableCell>
                ))}
                {actions && actions.length > 0 && (
                  <TableCell className="px-6 py-4">
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
                              title={action.label}
                              size="xs"
                            >
                              {Icon && <Icon />}
                              {action.label}
                            </Button>
                          );
                        })}
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
