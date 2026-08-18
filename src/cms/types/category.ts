// /src/types/category.ts
import type { BaseEntity } from "@/core/types";

export interface Category extends BaseEntity {
  active: boolean;
  categoryId: string;
  en: string;
  id: string;
  orgId: string;
  th: string;
  type: string;
}

export interface CategoryCreateData {
  en: string;
  th: string;
  active: boolean;
  type: string;
}

export interface CategoryQueryParams {
  start: number;
  length: number;
  type?: string;
  categoryId?: string;
  active?: boolean;
  orderBy?: string;
  direction?: string;
}

export interface CategoryUpdateData {
  en: string;
  th: string;
  active: boolean;
  type: string;
}
