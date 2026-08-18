// /src/components/crud/CrudContainer.tsx
import React, { useState } from "react";
import Button from "@/core/components/ui/button/Button";
import { SearchBar } from "./SearchBar";
import { FilterBar } from "./FilterBar";
import { DisplayModeToggle } from "./DisplayModeToggle";
import { DataTable } from "./DataTable";
import { CardGrid } from "./CardGrid";
import { Pagination } from "./Pagination";
import { ToastContainer } from "./ToastContainer";
import { ConfirmModal } from "./ConfirmModal";
import { usePagination } from "@/core/hooks/usePagination";
import { useSort } from "@/core/hooks/useSort";
import { useFilter } from "@/core/hooks/useFilter";
import { useToast } from "@/core/hooks/useToast";
import { useConfirmDialog } from "@/core/hooks/useConfirmDialog";
import type { CrudConfig } from "@/core/types/crud";

interface CrudContainerProps<T> {
  config: CrudConfig<T>;
  data: T[];
  displayModes?: ("card" | "table" | "matrix" | "hierarchy")[];
  error?: string | null;
  loading?: boolean;
  searchFields?: (keyof T)[];
  customFilterFunction?: (item: T, filters: Record<string, unknown>) => boolean;
  onCreate?: () => void;
  onRefresh?: () => void;
  renderCard?: (item: T) => React.ReactNode;
}

export const CrudContainer = <T extends { id: string }>({
  config,
  data,
  displayModes = ["card", "table", "matrix", "hierarchy"],
  error = null,
  loading = false,
  searchFields = ['name', 'description', 'title'] as (keyof T)[],
  customFilterFunction,
  onCreate,
  onRefresh,
  renderCard
}: CrudContainerProps<T>) => {
  const [displayMode, setDisplayMode] = useState<"card" | "table" | "matrix" | "hierarchy">("card");
  const [searchInput, setSearchInput] = useState<string>("");

  // Custom hooks
  const { filterConfig, filteredData, handleFilter, clearFilters, hasActiveFilters } = useFilter(
    data,
    customFilterFunction,
    searchFields
  );
  
  const { sortConfig, handleSort, sortedData } = useSort(filteredData);
  
  const { 
    pagination, 
    totalPages, 
    startEntry, 
    endEntry, 
    goToPage, 
    changePageSize 
  } = usePagination(sortedData.length);

  const {
    toasts,
    removeToast
  } = useToast();
  const {
    confirmDialog,
    closeConfirmDialog,
    handleConfirm
  } = useConfirmDialog();

  // Paginated data
  const startIndex = (pagination.page - 1) * pagination.pageSize;
  const endIndex = startIndex + pagination.pageSize;
  const paginatedData = sortedData.slice(startIndex, endIndex);

  const handleSearch = () => {
    handleFilter('search', searchInput.trim());
  };

  const handleClearSearch = () => {
    setSearchInput('');
    handleFilter('search', '');
  };

  // Sync search input with filter state
  React.useEffect(() => {
    const searchValue = filterConfig.search as string || '';
    if (searchValue !== searchInput) {
      setSearchInput(searchValue);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterConfig.search]);

  // Clear search input when all filters are cleared
  React.useEffect(() => {
    if (!hasActiveFilters && searchInput) {
      setSearchInput('');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasActiveFilters]);

  return (
    <div
      className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/3 p-6"
    >
      <div className="mx-auto w-full">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                {/* Controls */}
                <DisplayModeToggle mode={displayMode} list={displayModes} onChange={setDisplayMode} />
                <SearchBar
                  value={searchInput}
                  onChange={setSearchInput}
                  onSearch={handleSearch}
                  onClear={handleClearSearch}
                  placeholder={`Search ${config.entityNamePlural.toLowerCase()}...`}
                />

                {/* Filters */}
                {config.filters && (
                  <FilterBar
                    filters={config.filters}
                    values={filterConfig}
                    onChange={handleFilter}
                    onClear={clearFilters}
                    hasActiveFilters={hasActiveFilters}
                  />
                )}
              </div>
            </div>
            {onCreate && (
              <Button onClick={onCreate} variant="primary" className="h-11">
                Create {config.entityName}
              </Button>
            )}
          </div>
        </div>

        {/* Results Info */}
        {/*
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm text-gray-600 dark:text-gray-300">
            Showing {startEntry}-{endEntry} of {sortedData.length} {config.entityNamePlural.toLowerCase()}
          </div>
        </div>
        */}

        {/* Content */}
        {loading ? (
          <div className="text-center py-12">
            <div className="text-gray-500 dark:text-gray-400">Loading...</div>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <div className="text-red-500 dark:text-red-400 mb-4">{error}</div>
            {onRefresh && (
              <Button onClick={onRefresh} variant="primary">
                Retry
              </Button>
            )}
          </div>
        ) : paginatedData.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500 dark:text-gray-400 text-lg mb-2">
              No {config.entityNamePlural.toLowerCase()} found
            </div>
            <p className="text-gray-400 dark:text-gray-500 mb-4">
              {hasActiveFilters
                ? "Try adjusting your filters or search terms"
                : `Create your first ${config.entityName.toLowerCase()} to get started`
              }
            </p>
            {hasActiveFilters && (
              <Button onClick={clearFilters} variant="primary">
                Clear Filters
              </Button>
            )}
          </div>
        ) : displayMode === "card" && renderCard ? (
          <CardGrid
            data={paginatedData}
            renderCard={renderCard}
            actions={config.actions}
            className="mb-8"
          />
        ) : (
          <DataTable
            data={paginatedData}
            columns={config.columns}
            sortConfig={sortConfig}
            onSort={handleSort}
            actions={config.actions}
            className="mb-8"
          />
        )}

        {/* Pagination */}
        <Pagination
          pagination={{ ...pagination, total: sortedData.length }}
          totalPages={totalPages}
          startEntry={startEntry}
          endEntry={endEntry}
          onPageChange={goToPage}
          onPageSizeChange={changePageSize}
        />

        {/* Toast Notifications */}
        <ToastContainer toasts={toasts} onRemove={removeToast} />

        {/* Confirmation Dialog */}
        <ConfirmModal
          dialog={confirmDialog}
          onConfirm={handleConfirm}
          onCancel={closeConfirmDialog}
        />
      </div>
    </div>
  );
};
