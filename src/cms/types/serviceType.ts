// src/cms/types/serviceType.ts
import type { Attachment } from "@/cms/types/product";

export interface ServiceType {
  id: string;
  serviceId: string;
  orgId: string;
  en: string | null;
  th: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  priority:string
  createdBy: string | null;
  updatedBy: string | null;
  attachment?: Attachment;
  price:number;
  serviceDate:string;
}

export interface ServiceInsert {
  serviceId?: string;
  en: string | null;
  th: string | null;
  priority:string
  active: boolean;
  price: number;
  image?: string;
}

export interface ServiceUpdate {
  serviceId: string;
  en: string | null;
  th: string | null;
  priority:string
  active: boolean;
  price: number;
  image?: string;
}
