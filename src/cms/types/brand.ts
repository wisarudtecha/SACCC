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
  // The logo travels as a URL, not as bytes: Form uploads the picked file to /upload/brand first
  // and writes the returned attUrl here, the same way ProductCreateData.image works. `file` is
  // only the in-form staging value and is never sent to /brand.
  image?: string;
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
  // See BrandCreateData.image - an unchanged logo re-sends the existing attachment's attUrl,
  // so omitting this on update would clear the brand's logo.
  image?: string;
  file?: File;
}
