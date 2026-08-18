// src/cms/components/crm/stock/StockForm.tsx
import { useState } from "react";
import { Plus } from "lucide-react";
import type { Inventory } from "@/cms/types/inventory";
import Button from "@/core/components/ui/button/Button";
import Input from "@/core/components/form/input/InputField";
import Label from "@/core/components/form/Label";

interface Props {
  inventory: Inventory;
}

type MovementType = "IN" | "OUT" | "ADJUST";

const StockForm = ({ inventory }: Props) => {
  const [type, setType] = useState<MovementType>("IN");
  const [barcode, setBarcode] = useState("");

  const handleSubmit = () => {
    // TODO: call API
    console.log({
      partId: inventory.partId,
      barcode,
    });
  };

  return (
    <div className="border p-4 rounded space-y-4">
      <div className="flex items-end justify-between m-0">
        <Label className="m-0">Stock <span className="lowercase">{type}</span>:</Label>
        <Button size="sm" variant="primary" onClick={() => setType("IN")}>
          <Plus className="h-4 w-4 mr-1" />
          Add Stock
        </Button>
      </div>

      <div className="flex gap-2">

      </div>

      <Input
        type="text"
        placeholder="Scan or enter barcode..."
        value={barcode}
        onChange={e => setBarcode(e.target.value)}
        className="border p-2 w-full"
        disabled
      />

      <Button
        onClick={handleSubmit}
        size="sm"
        variant="primary"
      >
        Submit
      </Button>
    </div>
  );
};

export default StockForm;
