// src/cms/components/crm/stock/StockHistory.tsx
// import { Pencil, Trash } from "lucide-react";
import { Table, TableBody, TableCell, TableHeader, TableRow} from "@/core/components/ui/table";
import { useTranslation } from "@/core/hooks/useTranslation";
import { formatDateTime } from "@/cms/utils/productHelper";
// import { useReadInventorySerialNumberQuery } from "@/cms/store/api/inventoryStockApi";
// import type { Inventory } from "@/cms/types/inventory";
// import type { Product } from "@/cms/types/product";
import type { InventorySerialNumber } from "@/cms/types/inventoryStock";
import type { ProductSerialNumber } from "@/cms/types/productStock";
// import Button from "@/core/components/ui/button/Button";

interface Props {
  item: InventorySerialNumber[] | ProductSerialNumber[];
}

// interface StockMovement {
//   serialNumber: string;
//   createdAt: string;
//   updatedAt: string;
// }

const StockHistory = ({ item }: Props) => {
  const { t } = useTranslation();

  // const id = "partId" in item ? item.partId : item.productId;

  // const { data } = useReadInventorySerialNumberQuery({
  //   partId: id,
  //   start: 0,
  //   length: 100000
  // });

  // const history = (data?.data?.[0] as InventorySerialNumber & { movements: StockMovement[] })?.movements || [];
  // const history = data?.data || [];

  return (
    <div>
      <Table className="w-full text-sm">
        <TableHeader>
          <TableRow className="bg-gray-100 font-semibold text-center">
            <TableCell className="p-2">{t("crud.stock.list.header.serialNumber")}</TableCell>
            <TableCell className="p-2">{t("crud.stock.list.header.createdAt")}</TableCell>
            <TableCell className="p-2">{t("crud.stock.list.header.updatedAt")}</TableCell>
            <TableCell className="p-2">{t("crud.stock.list.header.action")}</TableCell>
          </TableRow>
        </TableHeader>
        <TableBody>
          {item.map((h, i) => (
            <TableRow key={i}>
              <TableCell className="p-2">{h.serialNumber}</TableCell>
              <TableCell className="p-2 text-center">{formatDateTime(String(h.createdAt))}</TableCell>
              <TableCell className="p-2 text-center">{formatDateTime(String(h.updatedAt))}</TableCell>
              <TableCell className="p-2 text-center">
                <div className="flex gap-2">
                  {/*
                  <Button size="xs" variant="outline">
                    <Pencil />
                  </Button>
                  <Button size="xs" variant="outline-error">
                    <Trash />
                  </Button>
                  */}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default StockHistory;
