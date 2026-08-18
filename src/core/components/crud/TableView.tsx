// /src/components/crud/TableView.tsx
import { ChevronDownIcon, ChevronUpIcon } from "@/core/icons";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/core/components/ui/table";
import { ClickableTableRow } from "@/core/components/crud/ClickableTableRow";
import { useTranslation } from "@/core/hooks/useTranslation";
import type { TableViewProps } from "@/core/types/crud";
import Checkbox from "@/core/components/form/input/Checkbox";

export function TableView<T extends { id: string }>({
  actions,
  bulkSelectionEnabled,
  data,
  columns,
  isAllSelected,
  module,
  selectedItems,
  sortConfig,
  onClickItem,
  onSort,
  selectItem,
  toggleSelectAll,
}: TableViewProps<T>) {
  const { t } = useTranslation();
  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border-none overflow-hidden">
      <div className="overflow-x-auto">
        <Table className="w-full">
          <TableHeader className="bg-gray-50 dark:bg-gray-800">
            <TableRow>
              {bulkSelectionEnabled && (
                <TableCell isHeader className="px-6 py-3 text-left w-12">
                  <Checkbox
                    checked={isAllSelected}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                  />
                </TableCell>
              )}

              {columns.map((column) => (
                <TableCell isHeader key={column.key as string} className="px-6 py-3 text-left">
                  {column.sortable ? (
                    <button
                      onClick={() => onSort(column.key as keyof T)}
                      className="flex items-center gap-1 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                    >
                      {column.label}
                      {sortConfig.key === column.key &&
                        (sortConfig.direction === "asc" ? (
                          <ChevronUpIcon className="w-4 h-4" />
                        ) : (
                          <ChevronDownIcon className="w-4 h-4" />
                        ))}
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
                  {t("crud.common.action")}
                </TableCell>
              )}
            </TableRow>
          </TableHeader>

          <TableBody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
            {data.map((item) => (
              <ClickableTableRow
                key={item.id}
                item={item}
                actions={actions}
                bulkSelectionEnabled={bulkSelectionEnabled}
                columns={columns}
                selectedItems={selectedItems}
                module={module}
                onClick={onClickItem}
                onSelectItem={selectItem}
              />
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
