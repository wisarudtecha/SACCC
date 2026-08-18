// src/cms/types/inventoryRequest.ts
import type { BaseEntity, LocalizedEntity } from "@/core/types";

export interface Part extends LocalizedEntity {
  partId: string;
}

export interface Status extends LocalizedEntity {
  statusId: string;
}

export interface Store extends LocalizedEntity {
  storeId: string;
  discount: number;
}

export interface InventoryRequest extends BaseEntity {
  active: boolean;
  id: string;
  orgId: string;
  part: Part;
  quantity: number;
  requestId: string;
  status: Status;
  store: Store;
}

export interface InventoryRequestCreateData {
  active: boolean;
  partId: string;
  quantity: number;
  statusId: string;
  storeId: string;
}

export interface InventoryRequestQueryParams {
  start: number;
  length: number;
  requestSpanPartId?: string;
  statusId?: string;
  storeId?: string;
  partId?: string;
  createdBy?: string;
  active?: boolean;
}

export interface InventoryRequestUpdateData {
  active: boolean;
  partId: string;
  quantity: number;
  statusId: string;
  storeId: string;
}

export interface OrderStatus extends BaseEntity {
  active: boolean;
  en: string;
  id: string;
  orgId: string;
  statusId: string;
  th: string;
}

export interface OrderStatusQueryParams {
  start: number;
  length: number;
  active?: boolean;
}

export interface RequestStatus extends BaseEntity {
  active: boolean;
  en: string;
  id: string;
  orgId: string;
  statusId: string;
  th: string;
}

export interface RequestStatusQueryParams {
  start: number;
  length: number;
  active?: boolean;
}
