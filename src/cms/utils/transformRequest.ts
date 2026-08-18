// src/cms/utils/transformRequest.ts
import { InventoryRequest } from "@/cms/types/inventoryRequest";

export interface RequestRow {
  id: string;
  requestId: string;
  quantity: number;
  storeTh: string;
  storeEn: string;
  partId: string;
  partTh: string;
  partEn: string;
  statusTh: string;
  statusEn: string;
  discount: number;
  createdAt: string | Date;
  createdBy: string;
}

export const transformRequest = (data: InventoryRequest[]): RequestRow[] => {
  return data.map(item => ({
    id: item.id,
    requestId: item.requestId,
    quantity: item.quantity,
    storeTh: item.store?.th || "",
    storeEn: item.store?.en || "",
    partId: item.part?.partId || "",
    partTh: item.part?.th || "",
    partEn: item.part?.en || "",
    statusTh: item.status?.th || "",
    statusEn: item.status?.en || "",
    discount: item.store?.discount ?? 0,
    createdAt: item.createdAt,
    createdBy: item.createdBy ? item.createdBy.trim() : ""
  }));
};
