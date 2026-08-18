// src/cms/components/crm/request/InventoryRequestForm.tsx
"use client"

import { useState } from "react";
import type { Inventory } from "@/cms/types/inventory";
import type { InventoryRequestCreateData } from "@/cms/types/inventoryRequest";
import CustomizableSelect from "@/core/components/form/CustomizableSelect";
import Input from "@/core/components/form/input/InputField";
import Label from "@/core/components/form/Label";
import Button from "@/core/components/ui/button/Button";
import InventoryRequestView from "@/cms/components/crm/request/__InventoryRequestView";

interface Props {
  inventories: Inventory[];
  loading?: boolean;
  onCancel: () => void;
  onSubmit: (data: InventoryRequestCreateData) => void;
}

const InventoryRequestForm = ({
  inventories,
  loading,
  onCancel,
  // onSubmit,
}: Props) => {
  // const [items, setItems] = useState<{ partId: string; quantity: number }[]>([]);
  const [inventoryId, setInventoryId] = useState("");
  const [remark, setRemark] = useState("");
  const [qty, setQty] = useState(1);

  const addItem = () => {
    if (!inventoryId || qty <= 0) {
      return;
    }

    // setItems(prev => [
    //   ...prev,
    //   {
    //     partId: inventoryId,
    //     quantity: qty
    //   }
    // ]);

    setInventoryId("");
    setQty(1);
  }

  // const removeItem = (index: number) => {
  //   setItems(prev => prev.filter((_,i)=> i !== index));
  // }

  const handleSubmit = () => {
    // const payload: InventoryRequestCreateData = {
    //   requestId: "CURRENT_USER",
    //   remark,
    //   items
    // };

    // onSubmit(payload);
  }

  return (
    <div className="p-6 space-y-4">
      <div>
        <Label>Remark</Label>

        <Input
          value={remark}
          onChange={e => setRemark(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-3 gap-2">
        <CustomizableSelect
          value={inventoryId}
          onChange={v => setInventoryId(v as string)}
          options={inventories.map(i => ({
            value: i.partId,
            label: i.en
          }))}
        />

        <Input
          type="number"
          value={qty}
          onChange={e => setQty(Number(e.target.value))}
        />

        <Button onClick={addItem}>
          Add
        </Button>
      </div>

      <InventoryRequestView
        // items={items}
        // inventories={inventories}
        // onRemove={removeItem}
      />

      <div className="flex gap-2 justify-end">
        <Button
          variant="outline"
          onClick={onCancel}
        >
          Cancel
        </Button>

        <Button
          variant="primary"
          onClick={handleSubmit}
          disabled={loading}
        >
          Submit Request
        </Button>
      </div>
    </div>
  );
}

export default InventoryRequestForm;
