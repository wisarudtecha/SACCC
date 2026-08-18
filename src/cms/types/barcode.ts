// src/cms/types/barcode.ts
import type { BaseEntity } from "@/core/types";

export interface BarcodeRecord extends BaseEntity {
  id: string;
  partId: string;
  storeId: string;
  code: string;
  status: "available" | "reserved" | "used";
}
