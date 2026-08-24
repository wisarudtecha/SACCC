// src/cms/components/crm/View.tsx
"use client"

import {
  KeyboardEvent,
  ReactNode,
  // useMemo,
  useState,
} from "react";
import { ChevronUp, ChevronDown, Edit, Eye, Grid3x3, List, Plus, RotateCcw, Search, Table, Trash2 } from "lucide-react";
import { PermissionGate } from "@/core/components/auth/PermissionGate";
// import { usePermissions } from "@/core/hooks/usePermissions";
import { useTranslation } from "@/core/hooks/useTranslation";
import type { TranslationKey, TranslationParams } from "@/core/types/i18n";
import Input from "@/core/components/form/input/InputField";
import Button from "@/core/components/ui/button/Button";
import Select from "@/core/components/form/Select";
import CustomizableSelect from "@/core/components/form/CustomizableSelect";
import ConfirmModal from "@/cms/components/crm/ConfirmModal";
import DetailModal from "@/cms/components/crm/DetailModal";
import ImagePreviewModal from "@/cms/components/crm/ImagePreviewModal";
import type { Column, ViewFilterConfig } from "@/cms/types/product";

export interface Action<T> {
  icon: ReactNode;
  label: string;
  variant?: "outline" | "primary" | "error" | "outline-error";
  onClick: (item: T) => void;
  show?: (item: T) => boolean;
}

export type CellProps<T> = {
  col: Column<T>;
  item: T;
};

export interface PaginationProps {
  currentPage: number;
  currentPageDataLength: number;
  filtered?: number;
  itemsPerPage: number;
  open: boolean;
  sortedData?: unknown[];
  total: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  // setCurrentPage?: (page: number) => void;
  translation: (key: TranslationKey, params?: TranslationParams) => string;
}

export interface ViewProps<T> {
  columns: Column<T>[];
  createLabel?: string;
  customActions?: Action<T>[];
  data: T[];
  filtered?: number;
  filters?: ViewFilterConfig[];
  initialQuery?: Record<string, unknown>;
  loading?: boolean;
  permissionModule?: string;
  query?: Record<string, unknown>;
  searchFields?: (keyof T)[];
  showViewInTable?: boolean;
  title: string;
  total?: number;
  getItemImage?: (item: T) => { url: string; alt: string } | null;
  gridCardRender?: (item: T, actions?: ReactNode) => ReactNode;
  onAdd?: () => void;
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  onQueryChange?: (query: ViewProps<T>["query"]) => void;
  onView?: (item: T) => void;
}

export const Cell = <T,>({ col, item }: CellProps<T>) => {
  if (col.render) {
    return <>{col.render(item)}</>;
  }
  return <>{String(item[col.key as keyof T] || "")}</>;
};

const Pagination = ({
  currentPage,
  currentPageDataLength,
  filtered,
  itemsPerPage,
  open,
  // sortedData,
  total,
  totalPages,
  onPageChange,
  onPageSizeChange,
  // setCurrentPage,
  translation
}: PaginationProps) => {
  if (!open) {
    return null;
  }

  const startEntry = total === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endEntry = Math.min((currentPage - 1) * itemsPerPage + currentPageDataLength, total);
  const filteredCount = filtered !== undefined ? filtered : total;

  return (
    // <div className="flex items-center gap-4">
    //   <div className="flex items-center gap-2">
    //     <div className="text-sm text-gray-500 dark:text-gray-400">
    //       {translation("crud.common.info")
    //         .replace("_START_", String(startEntry))
    //         .replace("_END_", String(endEntry))
    //         .replace("_TOTAL_", String(filteredCount < total ? filtered : total))}
    //     </div>
    //     <Select
    //       value={String(itemsPerPage)}
    //       onChange={value => onPageSizeChange(Number(value))}
    //       className="h-9 rounded-lg border border-gray-300 px-2 text-sm bg-white dark:bg-gray-800 dark:border-gray-700"
    //       options={[
    //         { label: "10", value: "10" },
    //         { label: "20", value: "20" },
    //         { label: "50", value: "50" },
    //         { label: "100", value: "100" },
    //       ]}
    //     />
    //   </div>
    //   <div className="flex gap-1">
    //     <Button
    //       variant="outline"
    //       size="sm"
    //       onClick={() => onPageChange(Math.max(1, currentPage - 1)) }
    //       disabled={currentPage === 1}
    //     >
    //       {translation("crud.common.paginate.previous")}
    //     </Button>
    //     <div className="flex items-center gap-1">
    //       {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
    //         let pageNum;
    //         if (totalPages <= 5) {
    //           pageNum = i + 1;
    //         }
    //         else if (currentPage <= 3) {
    //           pageNum = i + 1;
    //         }
    //         else if (currentPage >= totalPages - 2) {
    //           pageNum = totalPages - 4 + i;
    //         }
    //         else {
    //           pageNum = currentPage - 2 + i;
    //         }
    //         return (
    //           <Button
    //             key={pageNum}
    //             variant={pageNum === currentPage ? "primary" : "outline"}
    //             size="sm"
    //             onClick={() => onPageChange(pageNum) }
    //           >
    //             {pageNum}
    //           </Button>
    //         );
    //       })}
    //     </div>
    //     <Button
    //       variant="outline"
    //       size="sm"
    //       onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
    //       disabled={currentPage === totalPages}
    //     >
    //       {translation("crud.common.paginate.next")}
    //     </Button>
    //   </div>
    // </div>

    <div className="flex items-center justify-between mt-0 p-4">
      <div className="xl:flex items-center text-sm text-gray-500 dark:text-gray-400">
        <div className="mr-4">
          {translation("crud.common.info")
            .replace("_START_", String(startEntry))
            .replace("_END_", String(endEntry))
            .replace("_TOTAL_", String(filteredCount < total ? filtered : total))
          }
        </div>
        <div className="flex items-center gap-2">
          <span>{translation("crud.common.length_menu.show")}</span>
          <Select
            value={String(itemsPerPage)}
            onChange={value => onPageSizeChange(Number(value))}
            className="max-w-25"
            options={[
              { label: "10", value: "10" },
              { label: "20", value: "20" },
              { label: "50", value: "50" },
              { label: "100", value: "100" },
            ]}
          />
          <span>{translation("crud.common.length_menu.entries")}</span>
        </div>
      </div>
      <div className="flex gap-1">
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            onPageChange(Math.max(1, currentPage - 1))
            // setCurrentPage(Math.max(1, currentPage - 1))
          }
          disabled={currentPage === 1}
        >
          {translation("crud.common.paginate.previous")}
        </Button>
        <div className="flex items-center gap-1">
          {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
            let pageNum;
            if (totalPages <= 5) {
              pageNum = i + 1;
            }
            else if (currentPage <= 3) {
              pageNum = i + 1;
            }
            else if (currentPage >= totalPages - 2) {
              pageNum = totalPages - 4 + i;
            }
            else {
              pageNum = currentPage - 2 + i;
            }
            return (
              <Button
                key={pageNum}
                variant={pageNum === currentPage ? "primary" : "outline"}
                size="sm"
                onClick={() =>
                  onPageChange(pageNum)
                  // setCurrentPage(pageNum)
                }
              >
                {pageNum}
              </Button>
            );
          })}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            onPageChange(Math.min(totalPages, currentPage + 1))
            // setCurrentPage(Math.min(totalPages, currentPage + 1))
          }
          disabled={currentPage === totalPages}
        >
          {translation("crud.common.paginate.next")}
        </Button>
      </div>
    </div>
  );
}

// `id` is only ever read to build React keys here, so it is widened to accept
// numeric ids too - the area-template records key on a numeric DB id, unlike the
// CRM entities this component was first written for.
const View = <T extends { id?: string | number }>({
  columns,
  createLabel = "Create New",
  customActions = [],
  data,
  filtered = 0,
  filters = [],
  initialQuery = {},
  loading = false,
  permissionModule,
  query = {},
  // searchFields,
  showViewInTable = true,
  title,
  total = 0,
  getItemImage,
  gridCardRender,
  onAdd,
  onEdit,
  onDelete,
  onQueryChange = () => {},
  onView
}: ViewProps<T>) => {
  // const permissions = usePermissions();
  const { t } = useTranslation();

  const [viewMode, setViewMode] = useState<"list" | "grid" | "table">("list");
  // const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const [showFilters, setShowFilters] = useState(false);
  const [searchInput, setSearchInput] = useState(String(query.search || ""));

  // const [searchTerm, setSearchTerm] = useState("");

  const currentPage = Math.floor(Number(query.start || 0) / Number(query.length || 10)) + 1;
  // const currentPage = Math.floor((query.start as number) / (query.length as number)) + 1;
  // const [currentPage, setCurrentPage] = useState(1);

  const [deleteConfirm, setDeleteConfirm] = useState<T | null>(null);
  const [viewDetail, setViewDetail] = useState<T | null>(null);
  const [imagePreview, setImagePreview] = useState<{ url: string; alt: string } | null>(null);

  const [
    sortConfig,
    // setSortConfig
  ] = useState<{ key: string; direction: "asc" | "desc" } | null>(null);

  // const filteredData = useMemo(() => {
  //   if (!searchTerm) {
  //     return data;
  //   }
  //   const term = searchTerm.toLowerCase();
  //   return data.filter(item =>
  //     searchFields.some(field => {
  //       const value = item[field];
  //       return value?.toString().toLowerCase().includes(term);
  //     })
  //   );
  // }, [data, searchTerm, searchFields]);

  // Sort data
  // const sortedData = useMemo(() => {
  //   if (!sortConfig) {
  //     return filteredData;
  //   }
  //   return [...filteredData].sort((a, b) => {
  //     const aValue = a[sortConfig.key as keyof T];
  //     const bValue = b[sortConfig.key as keyof T];
  //     if (aValue === null || aValue === undefined) {
  //       return 1;
  //     }
  //     if (bValue === null || bValue === undefined) {
  //       return -1;
  //     }
  //     if (aValue < bValue) {
  //       return sortConfig.direction === "asc" ? -1 : 1;
  //     }
  //     if (aValue > bValue) {
  //       return sortConfig.direction === "asc" ? 1 : -1;
  //     }
  //     return 0;
  //   });
  // }, [filteredData, sortConfig]);

  const filteredCount = filtered !== undefined ? filtered : total;
  const totalPages = Math.ceil((filteredCount < total ? filtered : total) / (query.length as number));
  // const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  // const paginatedData = useMemo(
  //   () => filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage),
  //   [filteredData, currentPage, itemsPerPage]
  // );

  const isSearchDisabled = searchInput.length > 0 && searchInput.length < 3;

  const handleFilterChange = (key: string, value: unknown) => {
    onQueryChange({
      ...query,
      [key]: value,
      start: 0
    });
  };

  const handlePageSizeChange = (size: number) => {
    onQueryChange({
      ...query,
      length: size,
      start: 0
    });
  };

  const handleResetFilters = () => {
    setSearchInput("");
    onQueryChange({ ...initialQuery });
  };

  const handleSearch = () => {
    onQueryChange({
      ...query,
      search: searchInput,
      start: 0
    });
  };

  const handleSearchKeyDown = (
    event: KeyboardEvent<HTMLInputElement>
  ) => {
    if (event.key === "Enter" && !isSearchDisabled) {
      handleSearch();
    }
  };

  const handleSort = (key: string) => {
    onQueryChange({
      ...query,
      sortBy: key,
      sortDirection:
        query.sortBy !== key
          ? "asc"
          : query.sortDirection === "asc"
            ? "desc"
            : undefined
    });

    // setSortConfig(current => {
    //   if (!current || current.key !== key) {
    //     return { key, direction: "asc" };
    //   }
    //   if (current.direction === "asc") {
    //     return { key, direction: "desc" };
    //   }
    //   return null;
    // });
  };

  const renderActions = (item: T, compact: boolean = false, viewMode: string = "") => {
    const actions: ReactNode[] = [];

    if (onView && showViewInTable) {
      actions.push(
        <Button
          key={`Button-view-${item.id}-${viewMode}`}
          variant="outline"
          size="sm"
          onClick={() => setViewDetail(item)}
          className="xl:flex-1"
          title="View details"
        >
          <Eye className="w-3 h-3 mr-1" />
          {!compact &&
            <span className="ml-1 hidden xl:flex">
              {t("crud.common.read")}
            </span>
          }
        </Button>
      );
    }

    if (onEdit) {
      actions.push(
        <PermissionGate permission={`${permissionModule}.update`} key={`PermissionGate-edit-${item.id}-${viewMode}`}>
          <Button
            key={`Button-edit-${item.id}-${viewMode}`}
            variant="outline"
            size="sm"
            onClick={() => {
              // if (permissions.hasPermission(`${permissionModule}.update`)) {
              //   onEdit(item);
              // }
              onEdit(item);
            }}
            className="xl:flex-1"
          >
            <Edit className="w-3 h-3 mr-1" />
            {!compact &&
              <span className="ml-1 hidden xl:flex">
                {t("crud.common.update")}
              </span>
            }
          </Button>
        </PermissionGate>
      );
    }

    if (onDelete) {
      actions.push(
        <PermissionGate permission={`${permissionModule}.delete`} key={`PermissionGate-delete-${item.id}-${viewMode}`}>
          <Button
            key={`Button-delete-${item.id}-${viewMode}`}
            variant="outline-error"
            size="sm"
            onClick={() => {
              // if (permissions.hasPermission(`${permissionModule}.delete`)) {
              //   setDeleteConfirm(item);
              // }
              setDeleteConfirm(item);
            }}
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </PermissionGate>
      );
    }

    customActions
      .filter(action => !action.show || action.show(item))
      .forEach((action, idx) => {
        actions.push(
          <Button
            key={`custom-${idx}-${item.id}`}
            variant={action.variant || "outline"}
            size="sm"
            onClick={() => action.onClick(item)}
            title={action.label}
          >
            {action.icon}
          </Button>
        );
      });

    return <div className="flex gap-2">{actions}</div>;
  };

  const renderFilterField = (filter: ViewFilterConfig) => {
    switch (filter.type) {
      case "select":
        return (
          <CustomizableSelect
            value={String(query[filter.key] || "")}
            onChange={value => handleFilterChange(filter.key, value)}
            options={filter.options?.map(option => ({
              label: option.label,
              value: String(option.value)
            })) || []}
            placeholder={filter.placeholder || `Select ${filter.label}`}
            multiple={false}
          />

          // <select
          //   className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
          //   value={String(query[filter.key] || "")}
          //   onChange={event => handleFilterChange(filter.key, event.target.value)}
          // >
          //   <option value="">{filter.placeholder || `Select ${filter.label}`}</option>
          //   {filter.options?.map(option => (
          //     <option key={String(option.value)} value={String(option.value)}>{option.label}</option>
          //   ))}
          // </select>
        );

      case "radio":
        return (
          <div className="flex gap-4 flex-wrap">
            {filter.options?.map(option => (
              <label key={String(option.value)} className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                <input
                  type="radio"
                  name={filter.key}
                  // checked={String(query[filter.key]) === String(option.value)}
                  onChange={() => handleFilterChange(filter.key, option.value)}
                />
                <span>{option.label}</span>
              </label>
            ))}
          </div>
        );

      case "checkbox":
        return (
          <label className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
            <input
              type="checkbox"
              checked={Boolean(query[filter.key])}
              onChange={event => handleFilterChange(filter.key, event.target.checked)}
            />
            <span>{filter.label}</span>
          </label>
        );
      
      default: return (
        <Input
          value={String( query[filter.key] || "")}
          placeholder={filter.placeholder}
          onChange={event => handleFilterChange(filter.key, event.target.value)}
        />
      );
    }
  };

  // const paginationNode = (
  //   <Pagination
  //     currentPage={currentPage}
  //     currentPageDataLength={data.length}
  //     itemsPerPage={Number(query.length || 10)}
  //     open={totalPages > 0 && data.length > 0}
  //     total={total}
  //     totalPages={totalPages}
  //     onPageChange={page => {
  //       onQueryChange({
  //         ...query,
  //         start: (page - 1) * Number(query.length || 10)
  //       });
  //     }}
  //     translation={t}
  //   />
  // );

  return loading ? (
    <div className="flex-1 flex items-center justify-center bg-white dark:bg-black h-full">
      <p className="text-gray-500 dark:text-gray-400">
        {t("crud.common.loading_records")}
      </p>
    </div>
  ) : (
    <div className="flex-1 flex flex-col bg-white dark:bg-black h-full cursor-default">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 px-4 py-2">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-semibold text-black dark:text-white">{title}</h2>

          {onAdd && (
            <PermissionGate permission={`${permissionModule}.create`}>
              <Button onClick={onAdd} variant="primary" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                {createLabel}
              </Button>
            </PermissionGate>
          )}
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex gap-2 w-full">
              <Input
                placeholder={`${t("crud.common.search")}...`}
                value={searchInput}
                // value={searchTerm}
                onChange={e => {
                  setSearchInput(e.target.value);

                  // onQueryChange({
                  //   ...query,
                  //   search: e.target.value,
                  //   start: 0
                  // });

                  // setSearchTerm(e.target.value);
                  // setCurrentPage(1);
                }}
                onKeyDown={handleSearchKeyDown}
              />

              <Button
                variant="primary"
                size="sm"
                disabled={isSearchDisabled}
                onClick={handleSearch}
              >
                <Search className="w-4 h-4 mr-2" /> {t("common.search")}
              </Button>

              {filters.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters(current => !current)}
                >
                  {t("common.filters")}
                </Button>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={handleResetFilters}
              >
                <RotateCcw className="w-4 h-4 mr-2" /> {t("crud.common.form.action.reset")}
              </Button>
            </div>

            <div className="flex gap-2">
              <Button
                variant={viewMode === "list" ? "primary" : "outline"}
                size="sm"
                onClick={() => {
                  // setItemsPerPage(10);
                  setViewMode("list");
                }}
              >
                <List className="w-4 h-4" />
              </Button>

              {gridCardRender &&
                <Button
                  variant={viewMode === "grid" ? "primary" : "outline"}
                  size="sm"
                  onClick={() => {
                    // setItemsPerPage(10);
                    setViewMode("grid");
                  }}
                >
                  <Grid3x3 className="w-4 h-4" />
                </Button>
              }
              
              <Button
                variant={viewMode === "table" ? "primary" : "outline"}
                size="sm"
                onClick={() => {
                  // setItemsPerPage(10);
                  setViewMode("table");
                }}
              >
                <Table className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {showFilters && filters.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
              {filters.map(filter => (
                <div key={filter.key} className="flex flex-col gap-2">
                  <label className="text-gray-400 dark:text-gray-500 text-sm font-medium">{filter.label}</label>
                  {renderFilterField(filter)}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Grid View */}
      {viewMode === "grid" && gridCardRender && (
        <div className="flex-1 overflow-auto px-4 flex flex-col bg-white dark:bg-gray-800">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 flex-1">
            {// paginatedData
            data.map((item, idx) => (
              <div key={item.id || idx}>
                {gridCardRender ? (
                  gridCardRender(item, renderActions(item, false, viewMode))
                ) : (
                  <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-lg p-4">
                    <pre className="text-sm">{JSON.stringify(item, null, 2)}</pre>
                    {renderActions(item, false, viewMode)}
                  </div>
                )}
              </div>
            ))}

            {/* Empty state */}
            {// paginatedData.length === 0
            data.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500 dark:text-gray-400">
                  {t("crud.common.zero_records")}
                </p>
              </div>
            )}
          </div>

          {/* Pagination */}
          {/* {paginationNode} */}
          <Pagination 
            currentPage={currentPage}
            currentPageDataLength={data.length}
            filtered={filtered}
            itemsPerPage={Number(query.length || 10)}
            // itemsPerPage={itemsPerPage}
            open={totalPages > 0 && data.length > 0}
            // open={totalPages > 0 && paginatedData.length > 0}
            sortedData={data}
            // sortedData={sortedData}
            total={total}
            totalPages={totalPages}
            onPageChange={page => {
              onQueryChange({
                ...query,
                start: (page - 1) * (query.length as number || 10)
                // start: (currentPage - 1) * (query.length as number)
              });
            }}
            onPageSizeChange={handlePageSizeChange}
            // setCurrentPage={setCurrentPage}
            translation={t}
          />
        </div>
      )}

      {/* List View */}
      {viewMode === "list" && (
        <div className="flex-1 overflow-auto flex flex-col dark:bg-gray-800">
          <div className="p-4 space-y-2 flex-1">
            {// paginatedData
            data.map((item, idx) => (
              <div
                key={item.id || idx}
                className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-lg p-4 hover:border-gray-200 dark:hover:border-gray-700 transition-colors xl:flex items-center justify-between"
              >
                <div className="xl:flex-1 xl:grid xl:grid-cols-4 gap-4">
                  {columns.map(col => (
                    <div key={String(col.key)}>
                      <span className="text-gray-400 dark:text-gray-500 mr-2">
                        {col.label}:
                      </span>
                      <span className="text-gray-500 dark:text-gray-400">
                        {/* {col.render ? col.render(item) : String(item[col.key as keyof T] || "-")} */}
                        <Cell col={col} item={item} />
                      </span>
                    </div>
                  ))}
                </div>
                {renderActions(item, false, viewMode)}
              </div>
            ))}

            {/* Empty state */}
            {// paginatedData.length === 0
            data.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500 dark:text-gray-400">
                  {t("crud.common.zero_records")}
                </p>
              </div>
            )}
          </div>

          {/* Pagination */}
          {/* {paginationNode} */}
          <Pagination 
            currentPage={currentPage}
            currentPageDataLength={data.length}
            filtered={filtered}
            itemsPerPage={Number(query.length || 10)}
            // itemsPerPage={itemsPerPage}
            open={totalPages > 0 && data.length > 0}
            // open={totalPages > 0 && paginatedData.length > 0}
            sortedData={data}
            // sortedData={sortedData}
            total={total}
            totalPages={totalPages}
            onPageChange={page => {
              onQueryChange({
                ...query,
                start: (page - 1) * (query.length as number || 10)
                // start: (currentPage - 1) * (query.length as number)
              });
            }}
            onPageSizeChange={handlePageSizeChange}
            // setCurrentPage={setCurrentPage}
            translation={t}
          />
        </div>
      )}

      {/* Table View */}
      {viewMode === "table" && (
        <div className="flex-1 flex flex-col overflow-hidden p-4 dark:bg-gray-800">
          <div className="flex-1 overflow-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0 z-10">
                <tr>
                  {columns.map(col => (
                    <th
                      key={String(col.key)}
                      className={`
                        px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider
                        ${col.width || ""}
                        ${col.sortable ? "cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 select-none" : ""}
                      `}
                      onClick={() => col.sortable && handleSort(String(col.key))}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <div className="w-full">{col.label}</div>
                        {col.sortable && (
                          <span className="inline-flex flex-col">
                            {sortConfig?.key === col.key ? (
                              sortConfig.direction === "asc" ? (
                                <ChevronUp className="w-4 h-4" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )
                            ) : (
                              <ChevronUp className="w-4 h-4 opacity-30" />
                            )}
                          </span>
                        )}
                      </div>
                    </th>
                  ))}
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-32">
                    {t("crud.common.action")}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                {// paginatedData
                data.map((item, idx) => (
                  <tr
                    key={item.id || idx}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    {columns.map(col => (
                      <td
                        key={String(col.key)}
                        className={`
                          px-4 py-4 text-sm text-gray-900 dark:text-gray-100
                          ${col.align === "center" ? "text-center" : col.align === "right" ? "text-right" : "text-left"}
                        `}
                      >
                        {/* {col.render ? col.render(item) : String(item[col.key as keyof T] || "-")} */}
                        <Cell col={col} item={item} />
                      </td>
                    ))}
                    <td className="px-4 py-4 whitespace-nowrap text-right text-sm">
                      {renderActions(item, true, viewMode)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Empty state */}
            {// paginatedData.length === 0
            data.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500 dark:text-gray-400">
                  {t("crud.common.zero_records")}
                </p>
              </div>
            )}
          </div>

          {/* Pagination */}
          {/* {paginationNode} */}
          <Pagination 
            currentPage={currentPage}
            currentPageDataLength={data.length}
            filtered={filtered}
            itemsPerPage={Number(query.length || 10)}
            // itemsPerPage={itemsPerPage}
            open={totalPages > 0 && data.length > 0}
            // open={totalPages > 0 && paginatedData.length > 0}
            sortedData={data}
            // sortedData={sortedData}
            total={total}
            totalPages={totalPages}
            onPageChange={page => {
              onQueryChange({
                ...query,
                start: (page - 1) * (query.length as number || 10)
                // start: (currentPage - 1) * (query.length as number)
              });
            }}
            onPageSizeChange={handlePageSizeChange}
            // setCurrentPage={setCurrentPage}
            translation={t}
          />
        </div>
      )}

      {/* Modals */}
      <PermissionGate permission={`${permissionModule}.delete`}>
        <ConfirmModal
          cancelLabel={t("crud.common.form.action.cancel")}
          title={t("crud.common.confirm_modal.dialog_title.delete")}
          message={t("crud.common.confirm_modal.dialog_message.delete").replace("_ENTITY_", "")}
          onConfirm={() => {
            if (!deleteConfirm) {
              return;
            }
            onDelete?.(deleteConfirm);
            setDeleteConfirm(null);
          }}
          onCancel={() => setDeleteConfirm(null)}
          confirmLabel={t("crud.common.confirm_modal.dialog_button.delete")}
          confirmVariant="error"
          open={!!deleteConfirm && !!onDelete}
        />
      </PermissionGate>

      <DetailModal
        columns={columns}
        data={viewDetail}
        open={!!viewDetail}
        title="Item Details"
        getImage={getItemImage}
        onClose={() => setViewDetail(null)}
        onDelete={onDelete ? () => {
          if (!viewDetail) {
            return;
          }
          setViewDetail(null);
          setDeleteConfirm(viewDetail);
        } : undefined}
        onEdit={onEdit ? () => {
          if (!viewDetail) {
            return;
          }
          setViewDetail(null);
          onEdit(viewDetail);
        } : undefined}
        onImageClick={(url, alt) => setImagePreview({ url, alt })}
      />

      <ImagePreviewModal
        alt={imagePreview?.alt}
        open={!!imagePreview}
        url={imagePreview?.url}
        onClose={() => setImagePreview(null)}
      />
    </div>
  );
}

export default View;
