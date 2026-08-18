// src/cms/types/inventoryStock.ts
import type { BaseEntity } from "@/core/types";
import { Store, StockStatusMeta } from "@/cms/types/productStock";

export interface Part {
  en: string;
  partId: string;
  th: string;
}

export interface InventorySerialNumber extends BaseEntity {
  active: boolean;
  id: string;
  orgId: string;
  part: Part;
  serialNumber: string;
  store: Store;
  statusId?: string;
  stockStatusMeta?: StockStatusMeta;
}

export interface InventoryStock extends BaseEntity {
  active: boolean;
  id: string;
  orgId: string;
  part: Part;
  quantity: number;
  serialNumber: string[];
  store: Store;
  statusId?: string;
  stockStatusMeta?: StockStatusMeta;
}

export interface InventoryStockCreateData {
  partId: string;
  serialNumber: string[];
  storeId: string;
}

export interface InventoryStockQueryParams {
  start: number;
  length: number;
  storeId?: string;
  partId?: string;
  createdBy?: string;
  active?: boolean;
  orderBy?: string;
  direction?: string;
  statusId?: string;
}

export interface InventoryStockUpdateData {
  active: boolean;
  partId: string;
  serialNumber: string;
  storeId: string;
}
