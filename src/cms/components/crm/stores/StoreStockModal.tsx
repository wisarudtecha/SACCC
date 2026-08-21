// src/cms/components/crm/stores/StoreStockModal.tsx
"use client";

import { useMemo, useState } from "react";
import { X } from "lucide-react";
import { useTranslation } from "@/core/hooks/useTranslation";
import { formatNumberWithComma, getStockStatus } from "@/cms/utils/productHelper";
import type { InventoryStock } from "@/cms/types/inventoryStock";
import type { ProductStock } from "@/cms/types/productStock";
import type { Store } from "@/cms/types/store";
import Badge, { BadgeColor } from "@/core/components/ui/badge/Badge";
import Button from "@/core/components/ui/button/Button";

export type StoreStockTab = "products" | "parts";

interface StoreStockModalProps {
  initialTab?: StoreStockTab;
  inventoryStock: InventoryStock[];
  open: boolean;
  productStock: ProductStock[];
  store: Store | null;
  onClose: () => void;
}

// One row of the table, after products and spare parts have been flattened to a common shape.
interface StockRow {
  key: string;
  name: string;
  quantity: number;
  serialCount: number;
}

const StoreStockModal = ({
  initialTab = "products",
  inventoryStock,
  open,
  productStock,
  store,
  onClose
}: StoreStockModalProps) => {
  const { language, t } = useTranslation();
  const [tab, setTab] = useState<StoreStockTab>(initialTab);

  const storeId = store?.storeId;

  const productRows: StockRow[] = useMemo(() => productStock
    .filter(stock => stock.store?.storeId === storeId)
    .map(stock => ({
      key: `product-${stock.product?.productId}-${stock.id}`,
      name: (language === "th" ? stock.product?.th : stock.product?.en) || "-",
      quantity: stock.quantity || 0,
      serialCount: stock.serialNumber?.length || 0
    })), [productStock, storeId, language]);

  const partRows: StockRow[] = useMemo(() => inventoryStock
    .filter(stock => stock.store?.storeId === storeId)
    .map(stock => ({
      key: `part-${stock.part?.partId}-${stock.id}`,
      name: (language === "th" ? stock.part?.th : stock.part?.en) || "-",
      quantity: stock.quantity || 0,
      serialCount: stock.serialNumber?.length || 0
    })), [inventoryStock, storeId, language]);

  // The modal is conditionally mounted by its caller, so `tab` resets to initialTab on reopen.
  if (!open || !store) {
    return null;
  }

  const rows = tab === "products" ? productRows : partRows;
  const storeName = (language === "th" ? store.th : store.en) || "";

  const tabClass = (isActive: boolean) => [
    "px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
    isActive
      ? "border-brand-500 text-brand-500"
      : "border-transparent text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white"
  ].join(" ");

  return (
    <div className="cursor-default fixed inset-0 bg-white/50 dark:bg-black/70 flex items-center justify-center z-9999">
      <div className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg p-6 max-w-4xl w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-black dark:text-white">
            {t("crud.store.stock.title").replace("_STORE_", storeName)}
          </h2>

          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700 mb-4">
          <button
            type="button"
            className={tabClass(tab === "products")}
            onClick={() => setTab("products")}
          >
            {t("crud.store.stock.tab.products")} ({productRows.length})
          </button>

          <button
            type="button"
            className={tabClass(tab === "parts")}
            onClick={() => setTab("parts")}
          >
            {t("crud.store.stock.tab.parts")} ({partRows.length})
          </button>
        </div>

        {/* Table */}
        <div className="max-h-[50vh] overflow-y-auto">
          {rows.length === 0 ? (
            <p className="py-10 text-center text-sm text-gray-500 dark:text-gray-400">
              {t("crud.store.stock.empty")}
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-white dark:bg-gray-900">
                <tr className="border-b border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400">
                  <th className="py-2 text-left font-medium">
                    {t("crud.store.stock.header.item")}
                  </th>
                  <th className="py-2 text-right font-medium w-40">
                    {t("crud.store.stock.header.quantity")}
                  </th>
                  <th className="py-2 text-right font-medium w-32">
                    {t("crud.store.stock.header.serials")}
                  </th>
                </tr>
              </thead>

              <tbody>
                {rows.map(row => {
                  // LOW_STOCK_THRESHOLD is a per-item threshold, so the status badge only
                  // carries meaning at this granularity - not on a whole-store total.
                  const stockStatus = getStockStatus(row.quantity);
                  return (
                    <tr
                      key={row.key}
                      className="border-b border-gray-100 dark:border-gray-800 text-black dark:text-white"
                    >
                      <td className="py-2 pr-4">{row.name}</td>
                      <td className="py-2 text-right">
                        <Badge className="mb-0 w-fit" color={stockStatus.variant as BadgeColor}>
                          {stockStatus.label} ({formatNumberWithComma(row.quantity)})
                        </Badge>
                      </td>
                      <td className="py-2 text-right">{formatNumberWithComma(row.serialCount)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        <div className="flex gap-3 justify-end mt-6">
          <Button onClick={onClose} variant="outline" size="sm">
            {t("common.close")}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default StoreStockModal;
