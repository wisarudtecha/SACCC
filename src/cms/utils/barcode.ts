// src/cms/utils/barcode.ts
export const countStock = (barcodes: string[]) => {
  return barcodes.length;
}

export const isDuplicateBarcode = (list: string[], code: string) => {
  return list.includes(code);
}
