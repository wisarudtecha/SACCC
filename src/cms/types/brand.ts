// /src/types/brand.ts
import type { BaseEntity } from "@/core/types";

export interface Attachment extends BaseEntity {
  attId: string;
  attName: string;
  attUrl: string;
  type: string;
}

export interface Brand extends BaseEntity {
  active: boolean;
  attachment: Attachment;
  brandId: string;
  en: string;
  id: string;
  orgId: string;
  th: string;
  type: string;
}

export interface BrandCreateData {
  en: string;
  th: string;
  active: boolean;
  type: string;
  // Optional: the brand management form does not upload a logo yet, so create posts plain JSON
  // the same way createCategory/createProduct do.
  file?: File;
}

export interface BrandQueryParams {
  start: number;
  length: number;
  search?:string;
  type?: string;
  brandId?: string;
  active?: boolean;
}

export interface BrandUpdateData {
  en: string;
  th: string;
  active: boolean;
  type: string;
  file?: File;
}
