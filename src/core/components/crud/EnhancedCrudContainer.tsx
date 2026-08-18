// /src/components/crud/EnhancedCrudContainer.tsx
import React, { useState, useCallback, useMemo } from "react";
import { InfoIcon } from "@/core/icons";
import { PermissionGate } from "@/core/components/auth/PermissionGate";
import { AdvancedFilterPanel } from "@/core/components/crud/AdvancedFilterPanel";
// import { BulkActionBar } from "@/cms/components/crud/BulkActionBar";
import { ClickableCard } from "@/core/components/crud/ClickableCard";
import { ConfirmModal } from "@/core/components/crud/ConfirmModal";
import { DisplayModeToggle } from "@/core/components/crud/DisplayModeToggle";
import { ExportMenu } from "@/core/components/crud/ExportMenu";
import { FilterBar } from "@/core/components/crud/FilterBar";
import { KeyboardShortcuts } from "@/core/components/crud/KeyboardShortcuts";
import { Pagination } from "@/core/components/crud/Pagination";
import { PreviewDialog } from "@/core/components/crud/PreviewDialog";
import { SearchBar } from "@/core/components/crud/SearchBar";
import { TableView } from "@/core/components/crud/TableView";
import { ToastContainer } from "@/core/components/crud/ToastContainer";
import { useApi } from "@/core/hooks/useApi";
import { useBulkSelection } from "@/core/hooks/useBulkSelection";
import { useConfirmDialog } from "@/core/hooks/useConfirmDialog";
import { useFilter } from "@/core/hooks/useFilter";
import { usePagination } from "@/core/hooks/usePagination";
import { usePreview } from "@/core/hooks/usePreview";
import { useRealTimeUpdates } from "@/core/hooks/useRealTimeUpdates";
import { useSort } from "@/core/hooks/useSort";
import { useToast } from "@/core/hooks/useToast";
import { useTranslation } from "@/core/hooks/useTranslation";
import { apiService } from "@/cms/services/api";
import { SYSTEM_ROLE } from "@/cms/utils/constants";
// import { exportToCSV, exportToJSON } from "@/cms/utils/export";
import type {
  CrudConfig,
  // PaginationConfig
} from "@/core/types/crud";
import type { AdvancedFilter, ApiConfig, BulkAction, CrudFeatures, ExportOption, KeyboardShortcut, PreviewConfig } from "@/core/types/enhanced-crud";
import Button from "@/core/components/ui/button/Button";

interface EnhancedCrudContainerProps<T> {
  advancedFilters?: AdvancedFilter[];
  apiConfig?: ApiConfig;
  bulkActions?: BulkAction<T>[];
  config: CrudConfig<T>;
  data: T[];
  // Performs the actual delete. Supply this to route the call through RTK Query (and therefore
  // through createHybridBaseQuery, which is what turns it into GraphQL when VITE_USE_GRAPHQL is
  // on). Without it the container falls back to apiService.delete, a raw fetch that always speaks
  // REST and never invalidates the RTK cache. Rejecting here surfaces the error toast.
  deleteItem?: (id: string) => Promise<unknown>;
  displayModes?: ("card" | "table" | "matrix" | "hierarchy")[];
  displayModeDefault?: "card" | "table" | "matrix" | "hierarchy";
  enableDebug?: boolean;
  error?: string | null;
  exportOptions?: ExportOption[];
  features?: Partial<CrudFeatures>;
  keyboardShortcuts?: KeyboardShortcut[];
  loading?: boolean;
  module?: string;
  previewConfig?: PreviewConfig<T>;
  searchFields?: (keyof T)[];
  customFilterFunction?: (item: T, filters: Record<string, unknown>) => boolean;
  // onAdvancedFilter?: (filters: Record<string, unknown>) => void;
  onChangePageSize?: (size: number) => void;
  onClearFilters?: () => void;
  onCreate?: () => void;
  onDelete?: (id: string) => void;
  onFilter?: (key: string, value: string | number | boolean | null | undefined) => void;
  onGoToPage?: (page: number) => void;
  onItemAction?: (action: string, item: T) => void;
  onItemClick?: (item: T) => void;
  onRefresh?: () => void;
  onSearch?: (searchText: string) => void;
  onSort?: (key: string, direction: string) => void;
  onUpdate?: (item: T) => void;
  renderCard?: (item: T) => React.ReactNode;
  renderHierarchy?: (item: T) => React.ReactNode;
  renderMatrix?: () => React.ReactNode;
}

export const EnhancedCrudContainer = <T extends { id: string }>({
  advancedFilters = [],
  apiConfig,
  // bulkActions = [],
  config,
  data,
  deleteItem,
  displayModes = ["card", "table", "matrix", "hierarchy"],
  displayModeDefault = "card",
  enableDebug = false,
  error = null,
  exportOptions = [],
  features = {},
  keyboardShortcuts = [],
  loading = false,
  module,
  previewConfig,
  searchFields = [],
  customFilterFunction,
  // onAdvancedFilter,
  onChangePageSize,
  onClearFilters,
  onCreate,
  onDelete,
  onFilter,
  onGoToPage,
  onItemAction,
  onItemClick,
  onRefresh,
  onSearch,
  // onSort,
  onUpdate,
  renderCard,
  renderHierarchy,
  renderMatrix
}: EnhancedCrudContainerProps<T>) => {
  const { t } = useTranslation();

  const [displayMode, setDisplayMode] = useState<"card" | "table" | "matrix" | "hierarchy">(displayModeDefault);
  const [searchInput, setSearchInput] = useState<string>("");

  // ===================================================================
  // Feature Flags with Defaults
  // ===================================================================

  const enabledFeatures: CrudFeatures = {
    bulkActions: false,
    dragAndDrop: false,
    export: true,
    filtering: true,
    keyboardShortcuts: true,
    pagination: true,
    realTimeUpdates: false,
    search: true,
    sorting: true,
    ...features
  };

  // ===================================================================
  // Custom Hooks
  // ===================================================================

  const { confirmDialog, closeConfirmDialog, handleConfirm, openConfirmDialog } = useConfirmDialog();
  const { filterConfig, filteredData, hasActiveFilters, clearFilters, handleFilter } = useFilter(data, customFilterFunction, searchFields);
  const { sortConfig, sortedData, handleSort } = useSort(filteredData);
  const { isAllSelected, selectedItems, deselectAll, getSelectedCount, selectItem, selectAll, toggleSelectAll } = useBulkSelection(sortedData);

  const { endEntry, pagination, startEntry, totalPages, changePageSize, goToPage } = usePagination(sortedData.length);
  // const { endEntry, pagination, startEntry, totalPages, changePageSize, goToPage } = usePagination(
  //   apiConfig?.serverSide && data.length || sortedData.length,
  //   apiConfig?.pageSize ?? 10,
  //   apiConfig?.currentPage ?? 0,
  //   apiConfig?.totalPage ?? 0
  // );

  const { toasts, addToast, removeToast } = useToast();

  // Preview functionality
  const { canGoNext, canGoPrev, previewState, closePreview, nextItem, openPreview, prevItem } = usePreview<T>();

  // API functionality
  // const bulkDeleteApi = useApi(apiService.bulkDelete as (...args: unknown[]) => Promise<unknown>);
  const deleteApi = useApi(((endpoint: string) => apiService.delete(endpoint)) as (...args: unknown[]) => Promise<unknown>);
  // API functionality (custom)
  const cancelApi = useApi(((endpoint: string, data: unknown) => apiService.patch(endpoint, data)) as (...args: unknown[]) => Promise<unknown>);

  // ===================================================================
  // Debug
  // ===================================================================

  // Debug the confirmDialog state changes
  // React.useEffect(() => {
  //   console.log("EnhancedCrudContainer: confirmDialog state changed:", confirmDialog);
  // }, [confirmDialog]);

  // ===================================================================
  // Real Time Updates
  // ===================================================================

  useRealTimeUpdates<T>({
    endpoint: config.entityNamePlural.toLowerCase(),
    onUpdate: (updatedItem) => {
      if (onUpdate) onUpdate(updatedItem);
      addToast("info", `${config.entityName} updated`);
    },
    onDelete: (deletedId) => {
      if (onDelete) onDelete(deletedId);
      addToast("info", `${config.entityName} deleted`);
    },
    onCreate: (newItem) => {
      addToast("success", `New ${config.entityName.toLowerCase()} created`);
      console.log("success", `New ${config.entityName.toLowerCase()} created`, newItem);
    },
    enabled: enabledFeatures.realTimeUpdates
  });

  // ===================================================================
  // Paginated Data
  // ===================================================================

  const startIndex = enabledFeatures.pagination ? (pagination.page - 1) * pagination.pageSize : 0;
  // const startIndex = !apiConfig?.serverSide && enabledFeatures.pagination ? (pagination.page - 1) * pagination.pageSize : 0;
  const endIndex = enabledFeatures.pagination ? startIndex + pagination.pageSize : sortedData.length;
  // const endIndex = !apiConfig?.serverSide && enabledFeatures.pagination ? startIndex + pagination.pageSize : sortedData.length;
  // const paginatedData = sortedData.slice(startIndex, endIndex);
  const paginatedData = apiConfig?.serverSide && data || sortedData.slice(startIndex, endIndex);

  // ===================================================================
  // Handlers
  // ===================================================================

  // Handle bulk actions
  // const handleBulkAction = useCallback(async (action: BulkAction<T>) => {
  //   if (action.confirmationRequired) {
  //     openConfirmDialog({
  //       type: "custom",
  //       entityId: "",
  //       entityName: "",
  //       title: `${action.label} ${getSelectedCount()} items`,
  //       message: action.confirmationMessage 
  //         ? action.confirmationMessage(selectedItems)
  //         : `Are you sure you want to ${action.label.toLowerCase()} ${getSelectedCount()} items?`,
  //       onConfirm: async () => {
  //         try {
  //           await action.onClick(selectedItems);
  //           deselectAll();
  //           addToast("success", `${action.label} completed successfully`);
  //         }
  //         catch (error) {
  //           addToast("error", `${action.label} failed`);
  //           console.error(error);
  //         }
  //       }
  //     });
  //   }
  //   else {
  //     try {
  //       await action.onClick(selectedItems);
  //       deselectAll();
  //       addToast("success", `${action.label} completed successfully`);
  //     }
  //     catch (error) {
  //       addToast("error", `${action.label} failed`);
  //       console.error(error);
  //     }
  //   }
  // }, [selectedItems, addToast, deselectAll, getSelectedCount, openConfirmDialog]);

  // Handle clear search
  const handleClearSearch = () => {
    setSearchInput("");
    handleFilter("search", "");
  };

  // Handle delete item
  const handleDeleteItem = useCallback(async (item: T) => {
    // console.log("handleDeleteItem called for item:", item);

    const newValue = (module === "case" && "caseId" in item) ? t("crud.case_history.list.body.actions.cancel") : "";
    const confirmDialogType = (module === "case" && "caseId" in item) ? "status" : "delete";
    const id = (module === "workflow" && "wfId" in item) ? (item as { wfId: string }).wfId : item.id;
    const entityName = (item as Record<string, unknown>).name as string || (item as Record<string, unknown>).title as string || id;

    openConfirmDialog({
      type: confirmDialogType,
      entityId: id,
      entityName: entityName,
      newValue: newValue,
      onConfirm: async () => {
        // console.log("Delete confirmed for item:", id);
        try {
          if (deleteItem) {
            await deleteItem(id);
          }
          else if (apiConfig?.endpoints?.delete) {
            if (module === "case" && "caseId" in item) {
              await cancelApi.execute(`${apiConfig.endpoints.delete.replace(":id", id)}`, { statusId: "S014" });
            }
            else {
              await deleteApi.execute(`${apiConfig.endpoints.delete.replace(":id", id)}`);
            }
          }
          if (onDelete) {
            onDelete(id);
          }
          addToast("success", t("crud.common.delete_success").replace("_ENTITY_", config.entityName.toLowerCase()));
        }
        catch (error) {
          console.error("Delete failed:", error);
          addToast("error", t("crud.common.delete_error").replace("_ENTITY_", config.entityName.toLowerCase()));
        }
      }
    });
  }, [apiConfig, cancelApi, config, deleteApi, deleteItem, module, addToast, onDelete, openConfirmDialog, t]);

  // Handle export
  const handleExport = useCallback(async (
    option: ExportOption,
    // exportData: T[]
  ) => {
    try {
      // const filename = `${config.entityNamePlural.toLowerCase()}_${new Date().toISOString().split("T")[0]}`;
      
      switch (option.format) {
        case "csv":
          // exportToCSV(exportData, filename, option.columns);
          break;
        case "json":
          // exportToJSON(exportData, filename);
          break;
        case "excel":
          // Would implement Excel export
          addToast("warning", "Excel export not implemented yet");
          break;
        case "pdf":
          // Would implement PDF export
          addToast("warning", "PDF export not implemented yet");
          break;
        default:
          throw new Error(`Unsupported export format: ${option.format}`);
      }
      
      addToast("success", `Data exported as ${option.format.toUpperCase()}`);
    }
    catch (error) {
      addToast("error", `Export failed: ${error instanceof Error ? error.message : "Unknown error"}`);
      throw error;
    }
  }, [
    // config.entityNamePlural,
    addToast
  ]);

  // Handle item click for preview
  const handleItemClick = useCallback((item: T) => {
    if (previewConfig) {
      openPreview(item, sortedData);
    }
  }, [previewConfig, sortedData, openPreview]);

  // Handle item actions with special handling for delete
  const handleItemAction = useCallback((actionKey: string, item: T) => {
    // console.log("handleItemAction called:", { actionKey, itemId: item.id });
    
    if (actionKey === "delete") {
      // console.log("Delete action detected, calling handleDeleteItem");
      handleDeleteItem(item);
      return;
    }

    // Find the action in config and execute it
    const action = config.actions?.find(a => a.key === actionKey);
    if (action) {
      // console.log("Executing action from config:", action.key);
      
      if (actionKey === "view" && (
        module === "case" ||
        module === "settings" ||
        module === "skill" ||
        module === "user" ||
        module === "unit"
      )) {
        handleItemClick(item);
      }
      else {
        action.onClick(item);
      }
    }
    else {
      console.warn("Action not found in config:", actionKey);
    }

    // Call custom action handler if provided
    if (onItemAction) {
      onItemAction(actionKey, item);
    }
  }, [config.actions, module, handleDeleteItem, onItemAction, handleItemClick]);

  const actualClickHandler = onItemClick || handleItemClick;

  // Handle search
  const handleSearch = () => {
    handleFilter("search", searchInput.trim());
  };

  // ===================================================================
  // Utility Functions
  // ===================================================================

  // Create enhanced actions with proper delete handling
  const enhancedActions = useMemo(() => {
    if (!config.actions) {
      return undefined;
    }

    return config.actions.map(action => ({
      ...action,
      onClick: (item: T) => handleItemAction(action.key, item)
    }));
  }, [config.actions, handleItemAction]);

  // Default bulk actions
  // const defaultBulkActions: BulkAction<T>[] = [
  //   {
  //     key: "delete",
  //     label: "Delete Selected",
  //     variant: "error",
  //     onClick: async (items) => {
  //       const ids = items.map(item => item.id);
  //       if (apiConfig) {
  //         await bulkDeleteApi.execute(apiConfig.endpoints.bulkDelete, ids);
  //       }
  //       ids.forEach(id => onDelete && onDelete(id));
  //     },
  //     confirmationRequired: true,
  //     confirmationMessage: (items) => `Are you sure you want to delete ${items.length} ${config.entityNamePlural}? This action cannot be undone.`
  //   }
  // ];

  // const allBulkActions = [...defaultBulkActions, ...bulkActions];

  // Default export options
  const defaultExportOptions: ExportOption[] = [
    {
      key: "csv",
      label: "CSV File",
      format: "csv"
    },
    {
      key: "json",
      label: "JSON File",
      format: "json"
    }
  ];

  const allExportOptions = [...defaultExportOptions, ...exportOptions];

  // Default keyboard shortcuts
  const defaultShortcuts: KeyboardShortcut[] = [
    {
      key: "n",
      modifier: "ctrl",
      description: "Create new item",
      action: () => onCreate && onCreate()
    },
    {
      key: "r",
      modifier: "ctrl",
      description: "Refresh data",
      action: () => onRefresh && onRefresh()
    },
    {
      key: "a",
      modifier: "ctrl",
      description: "Select all",
      action: () => enabledFeatures.bulkActions && selectAll()
    },
    {
      key: "Escape",
      description: "Clear selection",
      action: () => deselectAll()
    }
  ];

  const allShortcuts = [...defaultShortcuts, ...keyboardShortcuts];

  const createEntity = t("crud.common.create").replace("_ENTITY_", `${config.entityName}`);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-white/3 p-6">
      <div className="mx-auto w-full">
        {/* Keyboard Shortcuts */}
        {enabledFeatures.keyboardShortcuts && (
          <KeyboardShortcuts shortcuts={allShortcuts} />
        )}

        {/* Header */}
        <div className="mb-0">
          <div className="xl:flex items-center justify-between mb-4">
            <div>
              {/* Controls */}
              <div className="flex flex-col xl:flex-row gap-4 items-start xl:items-center justify-between">
                <div className="xl:flex items-center gap-4">
                  {/* Display Modes (Card / Table / Matrix / Hierarchy) */}
                  {displayModes.length > 1 && (
                    <div className="mb-2 xl:mb-0">
                      <DisplayModeToggle mode={displayMode} list={displayModes} onChange={setDisplayMode} />
                    </div>
                  )}

                  {/* Search Bar */}
                  {enabledFeatures.search && displayMode != "matrix" && (
                    <div className="mb-2 xl:mb-0">
                      <SearchBar
                        value={searchInput}
                        onChange={setSearchInput}
                        // onSearch={handleSearch}
                        // onSearch={() => apiConfig?.serverSide && onSearch?.(searchInput.trim()) || handleSearch}
                        onSearch={() => apiConfig?.serverSide && onSearch?.(searchInput.trim()) || handleSearch()}
                        onClear={handleClearSearch}
                        placeholder={`${t("crud.common.search")} ${config.entityNamePlural.toLowerCase()}...`}
                      />
                    </div>
                  )}

                  {/* Basic Filters */}
                  {enabledFeatures.filtering && config.filters && displayMode != "matrix" && (
                    <div className="mb-2 xl:mb-0">
                      <FilterBar
                        filters={config.filters}
                        values={filterConfig}
                        // onChange={handleFilter}
                        onChange={apiConfig?.serverSide && (onFilter as (key: string, value: string | number | boolean | undefined) => void) || handleFilter}
                        onClear={clearFilters}
                        onClearFilters={apiConfig?.serverSide && onClearFilters || clearFilters}
                        hasActiveFilters={hasActiveFilters}
                      />
                    </div>
                  )}

                  {/* Advanced Filters */}
                  {advancedFilters.length > 0 && displayMode != "matrix" && (
                    <div className="mb-2 xl:mb-0">
                      <AdvancedFilterPanel
                        filters={advancedFilters}
                        values={filterConfig}
                        onChange={(filters) => Object.entries(filters).forEach(([key, value]) => 
                          // handleFilter(key, value as string | number | boolean | null | undefined)
                          apiConfig?.serverSide
                            && onFilter?.(key, value as string | number | boolean | null | undefined)
                            || handleFilter(key, value as string | number | boolean | null | undefined)
                        )}
                        onApply={() => {}}
                        onReset={clearFilters}
                        onClearFilters={apiConfig?.serverSide && onClearFilters || clearFilters}
                      />
                    </div>
                  )}

                  {/* Export Button */}
                  {enabledFeatures.export && allExportOptions.length > 0 && (
                    <div className="mb-2 xl:mb-0">
                      <ExportMenu
                        data={selectedItems.length > 0 ? selectedItems : sortedData}
                        exportOptions={allExportOptions}
                        onExport={handleExport}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Create Button */}
            {onCreate && (
              <PermissionGate key="create" module={module} action="create">
                <Button onClick={onCreate} variant="primary" className="h-11">
                  {/* Create {config.entityName} */}
                  {createEntity}
                </Button>
              </PermissionGate>
            )}
          </div>
        </div>

        {/* Content */}
        {loading ? (
          // Loading State
          <div className="text-center py-12">
            <div className="text-gray-500 dark:text-gray-400">{t("crud.common.loading_records")}</div>
          </div>
        ) : error ? (
          // Error
          <div className="text-center py-12">
            <div className="text-red-500 dark:text-red-400 mb-4">{error}</div>
            {onRefresh && (
              <Button onClick={onRefresh} variant="primary">
                {t("common.retry")}
              </Button>
            )}
          </div>
        ) : paginatedData.length === 0 ? (
          // No Data
          <div className="text-center py-12">
            <div className="text-gray-500 dark:text-gray-400 text-lg mb-2 cursor-default">
              {t("crud.common.zero_records")}
            </div>

            <p className="text-gray-400 dark:text-gray-500 mb-4 cursor-default">
              {hasActiveFilters ? t("crud.common.no_filters_active") : `${t("crud.common.no_records").replace("_ENTITY_", config.entityName.toLowerCase())}`}
            </p>

            {hasActiveFilters && (
              <Button onClick={apiConfig?.serverSide && onClearFilters || clearFilters} variant="primary">
                {t("common.clear_filters")}
              </Button>
            )}
          </div>
        ) : displayMode === "card" && renderCard ? (
          // Card View
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 xl:gap-6 mb-8">
            {paginatedData.map((item) => (
              <ClickableCard
                key={item.id}
                item={item}
                actions={enhancedActions}
                bulkSelectionEnabled={enabledFeatures.bulkActions}
                selectedItems={selectedItems}
                onClick={handleItemClick}
                onSelectItem={selectItem}
                module={module}
              >
                {renderCard(item)}
              </ClickableCard>
            ))}
          </div>
        ) : displayMode === "matrix" && renderMatrix ? (
          // Matrix View
          <div>{renderMatrix()}</div>
        ) : displayMode === "hierarchy" && renderHierarchy ? (
          // Hierarchy View
          <></>
        ) : (
          // Table View (Default)
          config?.columns ? (
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border-none overflow-hidden mb-8">
              <div className="overflow-x-auto">
                <TableView
                  data={paginatedData}
                  columns={config.columns}
                  sortConfig={sortConfig as { key: keyof T; direction: "asc" | "desc" }}
                  onSort={handleSort}
                  onClickItem={actualClickHandler}
                  actions={enhancedActions}
                  selectedItems={selectedItems}
                  selectItem={selectItem}
                  isAllSelected={isAllSelected}
                  toggleSelectAll={toggleSelectAll}
                  bulkSelectionEnabled={enabledFeatures.bulkActions}
                  module={module}
                />
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-500 dark:text-gray-400">{t("crud.common.empty_table")}</div>
            </div>
          )
        )}

        {/* Pagination */}
        {enabledFeatures.pagination && displayMode !== "matrix" && displayMode !== "hierarchy" && (
          <Pagination
            // endEntry={endEntry}
            endEntry={
              apiConfig?.serverSide && Math.min(
                (apiConfig.currentPage ?? 0) * (apiConfig.pageSize ?? 0), (apiConfig.totalFiltered ?? 0)
              ) || endEntry
            }
            // pagination={{
            //   ...pagination,
            //   total: sortedData.length
            //   // total: apiConfig?.serverSide && data.length || sortedData.length
            // }}
            pagination={
              apiConfig?.serverSide && {
                page: apiConfig?.currentPage ?? 0,
                pageSize: apiConfig?.pageSize ?? 0,
                total: apiConfig?.totalFiltered ?? 0
              } || {
                ...pagination,
                total: sortedData.length
              }
            }
            // startEntry={startEntry}
            startEntry={
              apiConfig?.serverSide && (
                (((apiConfig?.currentPage ?? 0) - 1) * (apiConfig?.pageSize ?? 0)) + 1
              ) || startEntry
            }
            // totalFiltered={apiConfig?.totalFiltered || sortedData.length}
            // totalPages={totalPages}
            totalPages={
              apiConfig?.serverSide && apiConfig?.totalPage || totalPages
              // apiConfig?.serverSide && Math.ceil(
              //   (apiConfig?.totalFiltered ?? 0) / (apiConfig?.pageSize ?? 0)
              // ) || totalPages
            }
            // onPageChange={goToPage}
            // onPageChange={(page: number, dir?: string) => onGoToPage?.(page, dir) || goToPage}
            onPageChange={apiConfig?.serverSide && onGoToPage || goToPage}
            // onPageSizeChange={changePageSize}
            // onPageSizeChange={(size: number) => onChangePageSize?.(size) || changePageSize}
            onPageSizeChange={apiConfig?.serverSide && onChangePageSize || changePageSize}
          />
        )}

        {/* Bulk Action Bar */}
        {/*
        {enabledFeatures.bulkActions && (
          <BulkActionBar
            selectedCount={getSelectedCount()}
            totalCount={sortedData.length}
            bulkActions={allBulkActions}
            selectedItems={selectedItems}
            onDeselectAll={deselectAll}
            onAction={handleBulkAction}
          />
        )}
        */}

        {/* Confirmation Dialog */}
        <ConfirmModal
          dialog={confirmDialog}
          onConfirm={handleConfirm}
          onCancel={closeConfirmDialog}
        />

        {/* Preview Dialog */}
        {previewConfig && (
          <>
            <PreviewDialog
              previewState={previewState}
              config={previewConfig}
              onClose={closePreview}
              onNext={nextItem}
              onPrev={prevItem}
              canGoNext={canGoNext}
              canGoPrev={canGoPrev}
              module={module}
            />
          </>
        )}

        {/* Toast Notifications */}
        <ToastContainer toasts={toasts} onRemove={removeToast} />

        {/* Debug Info (only in development) */}
        {!enableDebug && SYSTEM_ROLE && (
          <div
            className="
              bg-gray-200
              dark:bg-gray-700
              text-gray-700
              dark:text-gray-200
              border-gray-300
              dark:border-gray-600
              border
              cursor-default
              fixed
              bottom-12
              xl:bottom-6
              right-12
              xl:right-3
              font-mono
              h-9
              active:h-auto
              hover:h-auto
              w-9
              active:w-auto
              hover:w-auto
              max-w-sm
              overflow-hidden
              p-2
              rounded-lg
              shadow-lg
              text-xs
              z-99999
            "
          >
            <InfoIcon className="w-5 h-5" />
            <div className="font-bold mt-2">Debug Info</div>
            <div>Total Items: {data.length}</div>
            <div>Filtered Items: {filteredData.length}</div>
            <div>Selected Items: {getSelectedCount()}</div>
            <div>Display Mode: {displayMode}</div>
            <div>Actions Count: {enhancedActions?.length || 0}</div>
            
            <div className="mt-2 pt-2 border-t border-gray-300 dark:border-gray-600">
              <div className="font-bold">Confirm Dialog</div>
              <div>Is Open: {confirmDialog.isOpen ? "YES" : "NO"}</div>
              <div>Type: {confirmDialog.type}</div>
              <div>Entity: {confirmDialog.entityName}</div>
              <div>Has onConfirm: {confirmDialog.onConfirm ? "YES" : "NO"}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
