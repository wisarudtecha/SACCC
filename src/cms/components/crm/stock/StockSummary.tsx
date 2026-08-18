// src/cms/components/crm/stock/StockSummary.tsx
import { useTranslation } from "@/core/hooks/useTranslation";
// import { useReadInventoryStockQuery } from "@/cms/store/api/inventoryStockApi";
import { formatNumberWithComma, getStockStatus } from "@/cms/utils/productHelper";
// import type { Inventory } from "@/cms/types/inventory";
// import type { Product } from "@/cms/types/product";
import type { InventorySerialNumber } from "@/cms/types/inventoryStock";
import type { ProductSerialNumber } from "@/cms/types/productStock";
// import Button from "@/core/components/ui/button/Button";

interface Props {
  item: InventorySerialNumber[] | ProductSerialNumber[];
}

const StockSummary = ({ item }: Props) => {
  const { t } = useTranslation();

  // const id = "partId" in item ? item.partId : item.productId;

  // const { data } = useReadInventoryStockQuery({
  //   partId: id,
  //   start: 0,
  //   length: 1000
  // });

  // const quantity = data?.data?.[0]?.quantity || 0;
  const quantity = item.length;
  const status = getStockStatus(quantity);

  return (
    <div className="flex gap-4">
      <div
        // className="p-4 bg-gray-100 rounded flex-1 mb-4"
        className="p-4 bg-gray-100 rounded flex-1 mb-4"
      >
        <div className="text-sm text-gray-500">{t("crud.stock.metrics.available")}</div>
        <div className={`text-2xl font-bold text-${status.color}-600`}>
          {formatNumberWithComma(quantity)}
        </div>
      </div>

      <div className="p-4 bg-gray-100 rounded mb-4">
        <div className="text-sm text-gray-500">{t("crud.stock.metrics.status")}</div>
        <div className={`font-semibold text-${status.color}-600`}>{status.label}</div>
      </div>

      {/*
      <div className="p-0 mb-4">
        <Button className="h-21" variant="primary">
          Add Stock
        </Button>
      </div>
      */}
    </div>
  );
};

export default StockSummary;
