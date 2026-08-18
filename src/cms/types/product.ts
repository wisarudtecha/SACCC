// /src/types/product.ts
import { BaseEntity } from "@/core/types";
import { ReactNode } from "react";

export type ViewFilterType =
  | "text"
  | "select"
  | "checkbox"
  | "radio"
  | "date";

export interface Attachment extends BaseEntity {
  attId: string;
  attName: string;
  attUrl: string;
  type: string;
}

export interface Grid {
  colSpan?: 1 | 2;
  colStart?: 1 | 2;
  gridColumn?: "full" | "half";
}

export interface Column<T> extends Grid {
  key: keyof T | string;
  label: string;
  sortable?: boolean;
  width?: string;
  align?: "left" | "center" | "right";
  render?: (item: T) => ReactNode;
}

export interface FieldConfig extends Grid {
  name: string;
  label: string;
  type: "customizable-select" | "datetime-local" | "file" | "input-group" | "number" | "select" | "text" | "textarea";
  required?: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
  multiple?: boolean;
  accept?: string;
  errorMessage?: string;
  customRender?: (value: unknown, onChange: (val: unknown) => void, formData: unknown) => React.ReactNode;
}

export interface Product extends BaseEntity {
  active: boolean;
  attachment: Attachment;
  brandId: string;
  categoryId: string;
  en: string;
  id: string;
  mfd: string;
  orgId: string;
  price: number;
  productCode: string;
  productId: string;
  th: string;
  warranty: number;
}

export interface ProductCreateData {
  active?: boolean;
  brandId?: string;
  categoryId?: string;
  en?: string;
  image?: string;
  mfd?: number;
  price?: number;
  productCode?: string;
  th?: string;
  warranty?: number;
}

export interface ProductQueryParams {
  start: number;
  length: number;
  search?:string;
  active?: boolean;
  categoryId?: string;
  productId?: string;
  brandId?: string;
  mfd?: string;
  warranty?: number;
  price?: string;
  lable?: string;
  customerId?: string;
  orderBy?: string;
  direction?: string;
}

export interface ProductUpdateData {
  productId?: string;
  active?: boolean;
  brandId?: string;
  categoryId?: string;
  en?: string;
  image?: string;
  mfd?: number;
  price?: number;
  productCode?: string;
  th?: string;
  warranty?: number;
}

export interface Store {
  en: string;
  th: string;
  discount: number;
  storeId: string;
}

export interface ProductDetails {
  id: string;
  productId: string;
  en: string;
  th: string;
}

export interface ProductSerial {
  id: string;
  orgId: string;
  serialNumber: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
  store: Store;
  product: ProductDetails;
}

export interface ProductStock {
  id: string;
  quantity: number;
  orgId: string;
  serialNumber: string[];
  active: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
  store: Store;
  product: ProductDetails;
}

export interface ViewFilterOption {
  label: string;
  value: string | number | boolean;
}

export interface ViewFilterConfig {
  key: string;
  label: string;
  type: ViewFilterType;
  options?: ViewFilterOption[];
  placeholder?: string;
  multiple?: boolean;
  searchable?: boolean;
}
