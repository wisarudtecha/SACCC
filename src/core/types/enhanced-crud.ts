// /src/types/enhanced-crud.ts
import { Variant } from "@/cms/types";

export interface BulkAction<T> {
  key: string;
  label: string;
  icon?: React.ComponentType<unknown>;
  // variant: "primary" | "warning" | "error";
  variant: Variant;
  onClick: (selectedItems: T[]) => Promise<void>;
  condition?: (selectedItems: T[]) => boolean;
  confirmationRequired?: boolean;
  confirmationMessage?: (selectedItems: T[]) => string;
}

export interface ExportOption {
  key: string;
  label: string;
  format: "csv" | "excel" | "pdf" | "json";
  icon?: React.ComponentType<unknown>;
  columns?: string[];
}

export interface AdvancedFilterOption {
  value: string;
  label: string;
  disabled?: boolean;
  color?: string;
  icon?: React.ReactNode;
}

export interface AdvancedFilter {
  key: string;
  label: string;
  // type: "select" | "multiselect" | "customizable-select" | "date-range" | "number-range" | "text" | "boolean";
  type: "boolean" | "checkbox" | "checkbox-group" | "color" | "customizable-select"
    | "date" | "date-range" | "multiselect" | "number" | "number-range"
    | "radio" | "select" | "tags" | "text" | "toggle";
  placeholder?: string;
  // options?: { value: string; label: string }[];
  options?: AdvancedFilterOption[];
  multiple?: boolean;
  required?: boolean;
  min?: number;
  max?: number;
  step?: number;
  validation?: RegExp;
  conditionalOn?: string;
  description?: string;
  groupBy?: string;
  clearable?: boolean;
  isFullscreen?: boolean;
  maxSelections?: number;
  searchable?: boolean;
}

export interface KeyboardShortcut {
  key: string;
  description: string;
  action: () => void;
  modifier?: "ctrl" | "alt" | "shift";
}

export interface CrudFeatures {
  search: boolean;
  sorting: boolean;
  filtering: boolean;
  pagination: boolean;
  bulkActions: boolean;
  export: boolean;
  // preview: boolean;
  realTimeUpdates: boolean;
  dragAndDrop: boolean;
  keyboardShortcuts: boolean;
}

export interface ApiConfig {
  baseUrl: string;
  endpoints: {
    list?: string;
    create?: string;
    read?: string;
    update?: string;
    delete?: string;
    bulkDelete?: string;
    export?: string;
  };
  headers?: Record<string, string>;
  currentPage?: number;
  pageSize?: number;
  serverSide?: boolean;
  totalFiltered?: number;
  totalPage?: number;
  totalRecords?: number;
}

export interface PreviewField<T = string> {
  key: string;
  label: string;
  type: "text" | "badge" | "date" | "number" | "tags" | "json" | "custom";
  render?: (value: string, item: T) => React.ReactNode;
  className?: string;
  copyable?: boolean;
}

export interface PreviewTab<T = string> {
  actions?: PreviewAction<T>[];
  fields?: PreviewField<T>[];
  key: string;
  label: string;
  icon?: React.ComponentType<unknown>;
  render?: (item: T) => React.ReactNode;
}

export interface PreviewConfig<T> {
  // title: (item: T) => string;
  title?: (item: T) => React.ReactNode | string;
  // subtitle?: (item: T) => string;
  subtitle?: (item: T) => React.ReactNode | string;
  avatar?: (item: T) => React.ReactNode;
  tabs: PreviewTab<T>[];
  actions?: PreviewAction<T>[];
  enableNavigation?: boolean;
  size?: "sm" | "md" | "lg" | "xl" | "full";
  // Read-only preview: navigation, copy, and actions are all suppressed. Closing still works.
  viewOnly?: boolean;
}

export interface PreviewAction<T> {
  key: string;
  label: string;
  icon?: React.ComponentType<unknown>;
  variant: Variant;
  onClick: (item: T, closePreview: () => void) => void;
  condition?: (item: T) => boolean;
}

export interface PreviewState<T> {
  isOpen: boolean;
  item: T | null;
  currentIndex: number;
  totalItems: number;
}
