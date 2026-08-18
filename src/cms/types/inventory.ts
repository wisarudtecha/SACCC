// /src/types/inventory.ts
import type { BaseEntity } from "@/core/types";
import type { Attachment } from "@/cms/types/product";

export interface Inventory extends BaseEntity {
  active: boolean;
  attachment: Attachment;
  brandId: string;
  categoryId: string;
  en: string;
  id: string;
  mfd: number;
  orgId: string;
  partId: string;
  price: number;
  productId: string;
  th: string;
  warranty: number;
}

export interface InventoryCreateData {
  active?: boolean;
  brandId?: string;
  categoryId?: string;
  en?: string;
  image?: string;
  mfd?: number;
  price?: number;
  productId?: string;
  th?: string;
  warranty?: number;
}

export interface InventoryItem {
  partId: string
  storeId: string
  total: number
  available: number
  reserved: number
}

export interface InventoryQueryParams {
  start: number;
  length: number;
  active?: boolean;
  search?:string;
  categoryId?: string;
  partId?: string;
  productId?: string;
  brandId?: string;
  mfd?: number;
  warranty?: number;
  price?: string;
  lable?: string;
  orderBy?: string;
  direction?: string;
}

export interface InventoryUpdateData {
  active?: boolean;
  brandId?: string;
  categoryId?: string;
  en?: string;
  image?: string;
  mfd?: number;
  price?: number;
  productId?: string;
  th?: string;
  warranty?: number;
}
