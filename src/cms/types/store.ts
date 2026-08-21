// src/cms/types/store.ts
import type { BaseEntity } from "@/core/types";

export interface Store extends BaseEntity {
  active: boolean;
  discount: number;
  en: string;
  id: string;
  orgId: string;
  storeId: string;
  th: string;
}

export interface StoreCreateData {
  active: boolean;
  discount: number;
  en: string;
  th: string;
}

export interface StoreQueryParams {
  start: number;
  length: number;
  // View's search box writes `search` straight into the query object it hands back, and the
  // shared ListDataInput! already carries the field (/brand filters through it the same way).
  search?: string;
  active?: boolean;
  orderBy?: string;
  direction?: string;
}

export interface StoreUpdateData {
  active: boolean;
  discount: number;
  en: string;
  th: string;
}
