// src/cms/components/crm/stock/StockModal.tsx
"use client";

import { X } from "lucide-react";
import { useTranslation } from "@/core/hooks/useTranslation";
import { useReadInventorySerialNumberQuery } from "@/cms/store/api/inventoryStockApi";
import { useReadProductSerialNumberQuery } from "@/cms/store/api/productStockApi";
import type { Inventory } from "@/cms/types/inventory";
import type { Product } from "@/cms/types/product";
import type { Store } from "@/cms/types/store";
import Button from "@/core/components/ui/button/Button";
// import StockForm from "@/cms/components/crm/stock/StockForm";
import StockHistory from "@/cms/components/crm/stock/StockHistory";
// import StockInBarcodeForm from "@/cms/components/crm/stock/StockInBarcodeForm";
import StockSummary from "@/cms/components/crm/stock/StockSummary";

interface Props {
  header?: string;
  item: Inventory | Product;
  open: boolean;
  stores: Store[];
  type: "inventory" | "product";
  onClose: () => void;
}

const StockModal = ({
  header = "Stock Management",
  item,
  open,
  // stores,
  type,
  onClose
}: Props) => {
  const { t } = useTranslation();

  const isInventory = type === "inventory";
  const partId = "partId" in item ? item.partId : "";
  const productId = "productId" in item ? item.productId : "";

  const { data: inventoryData } = useReadInventorySerialNumberQuery(
    { partId, start: 0, length: 100000 },
    { skip: !open || !isInventory }
  );

  const { data: productData } = useReadProductSerialNumberQuery(
    { productId, start: 0, length: 100000 },
    { skip: !open || isInventory }
  );

  if (!open) return null;

  const history = (isInventory ? inventoryData?.data : productData?.data) || [];

  return (
    <div className="cursor-default fixed inset-0 bg-white/50 dark:bg-black/70 flex items-center justify-center z-9999">
      <div className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg p-6 max-w-6xl w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-black dark:text-white">{header}: {item.en}</h2>

          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4 text-gray-600 dark:text-gray-400 mb-6">
          <div
            // className="col-span-1"
            className="col-span-2"
          >
            {/* Summary */}
            <StockSummary item={history} />

            {/* History */}
            <StockHistory item={history} />
          </div>

          {/* Actions */}
          {/*
          <div className="col-span-1">
            <StockInBarcodeForm partId={item.partId} stores={stores} onSubmit={(data) => console.log(data)} />
          </div>
          */}
        </div>

        <div className="flex gap-3 justify-end">
          <Button onClick={onClose} variant="outline" size="sm">
            {t("common.close")}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default StockModal;
