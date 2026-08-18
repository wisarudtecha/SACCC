// src/cms/utils/stock.ts
export const calculateAvailableStock = (onHand: number, reserved: number) => {
  return onHand - reserved;
}

export const validateStockOut = (available: number, qty: number) => {
  if (qty > available) {
    throw new Error("Insufficient stock");
  }
}
