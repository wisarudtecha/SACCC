// /src/types/crud.ts
import { Variant } from "@/cms/types";

export interface SortConfig<T> {
  key: keyof T | null;
  direction: "asc" | "desc";
}

export interface FilterConfig {
  [key: string]: string | number | boolean | unknown | undefined;
}

export interface PaginationConfig {
  page: number;
  pageSize: number;
  total?: number;
  totalPage?: number;
}

export interface ConfirmDialog {
  isOpen: boolean;
  type: "delete" | "status" | "custom";
  entityId: string;
  entityName: string;
  title?: string;
  message?: string;
  newValue?: unknown;
  onConfirm?: () => void;
}

export interface Toast {
  id: string;
  type: "success" | "error" | "warning" | "info" | "loading";
  message: string;
  duration?: number;
  isI18N?:boolean
}

export interface CrudConfig<T> {
  entityName: string;
  entityNamePlural: string;
  apiEndpoints: {
    list?: string;
    create?: string;
    read?: string;
    update?: string;
    delete?: string;
    bulkDelete?: string;
    export?: string;
  };
  columns: TableColumn<T>[];
  filters?: FilterDefinition[];
  actions?: CrudAction<T>[];
  statusOptions?: StatusOption[];
}

export interface TableColumn<T> {
  key: keyof T | string;
  label: string;
  sortable?: boolean;
  render?: (item: T) => React.ReactNode;
  className?: string;
}

export interface TableViewProps<T> {
  actions?: CrudAction<T>[];
  bulkSelectionEnabled: boolean;
  columns: TableColumn<T>[];
  data: T[];
  isAllSelected: boolean;
  module?: string;
  selectedItems: T[];
  sortConfig: { key: string | keyof T; direction: "asc" | "desc" };
  onClickItem: (item: T) => void;
  onSort: (key: keyof T) => void;
  selectItem: (item: T) => void;
  toggleSelectAll: () => void;
}

export interface FilterDefinition {
  key: string;
  label: string;
  type: "select" | "text" | "date" | "boolean";
  options?: { value: string; label: string }[];
  placeholder?: string;
}

export interface CrudAction<T> {
  key: string;
  label: string;
  variant: Variant;
  icon?: React.ComponentType<unknown>;
  onClick: (item: T) => void;
  condition?: (item: T) => boolean;
}

export interface StatusOption {
  value: string;
  label: string;
  color: string;
  icon?: React.ComponentType<unknown>;
}
