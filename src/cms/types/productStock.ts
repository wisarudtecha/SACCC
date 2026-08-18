// src/cms/types/productStock.ts
import type { BaseEntity } from "@/core/types";

export interface Product {
  en: string;
  id: string;
  productId: string;
  th: string;
}

export interface StockStatusMeta {
  active?: boolean;
  en?: string;
  statusId?: string;
  th?: string;
}

export interface Store {
  discount: number;
  en: string;
  storeId: string;
  th: string;
}

export interface ProductSerialNumber extends BaseEntity {
  active: boolean;
  id: string;
  orgId: string;
  product: Product;
  quantity: number;
  serialNumber: string;
  store: Store;
  registerDate: string;
  mfw: string;
  statusId?: string;
  purchaseDate: string;
  endWarrantyDate: string;
  stockStatusMeta?: StockStatusMeta;
}

export interface ProductStock extends BaseEntity {
  active: boolean;
  id: string;
  orgId: string;
  product: Product;
  quantity: number;
  serialNumber: string[];
  store: Store;
  registerDate: string;
  mfw: string;
  statusId?: string;
  purchaseDate: string;
  endWarrantyDate: string;
  stockStatusMeta?: StockStatusMeta;
}

export interface ProductStockItem {
  // registerDate?: string;
  // mfw?: string;
  serialNumber: string;
}

export interface ProductStockCreateData {
  Item: ProductStockItem[];
  active: boolean;
  productId: string;
  registerDate: string;
  mfw: string;
  storeId: string;
}

export interface ProductStockQueryParams {
  start: number;
  length: number;
  storeId?: string;
  productId?: string;
  createdBy?: string;
  active?: boolean;
  isBought?: boolean;
  orderBy?: string;
  direction?: string;
  statusId?: string;
}

export interface ProductStockUpdateData {
  Item?: ProductStockItem[];
  active: boolean;
  productId: string;
  registerDate?: string;
  purchaseDate?: string;
  mfw?: string;
  serialNumber: string;
  storeId: string;
}
