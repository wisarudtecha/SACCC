// src/cms/components/crm/stock/StockInBarcodeForm.tsx
import { useState } from "react";
import { useTranslation } from "@/core/hooks/useTranslation";
import { useBarcodeScanner } from "@/cms/hooks/useBarcodeScanner";
import type { Store } from "@/cms/types/store";
import Select from "@/core/components/form/Select";
import Button from "@/core/components/ui/button/Button";
import BarcodeInput from "@/cms/components/crm/stock/BarcodeInput";

interface StockInBarcodeData {
  partId: string;
  storeId: string;
  serialNumber: string[];
}

interface Props {
  partId: string;
  stores: Store[];
  onSubmit: (data: StockInBarcodeData) => void;
}

const StockInBarcodeForm = ({ partId, stores, onSubmit }: Props) => {
  const { language } = useTranslation();

  const [storeId, setStoreId] = useState("");
  const [serialNumber, setserialNumber] = useState<string[]>([]);

  useBarcodeScanner(code => {
    if (!serialNumber.includes(code)) {
      setserialNumber(prev => [...prev, code]);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!partId || !storeId) {
      alert("Product & Warehouse required");
      return;
    }
    if (serialNumber.length === 0) {
      alert("No barcode");
      return;
    }
    onSubmit({
      partId,
      storeId,
      serialNumber
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4"
    >

      <Select
        placeholder="Store / Warehouse"
        value={storeId}
        onChange={value => setStoreId(value)}
        options={stores.map(s => ({
          value: s.storeId,
          label: language === "th" && s.th || s.en
        }))}
        className="cursor-pointer"
      />

      <BarcodeInput
        value={serialNumber}
        onChange={setserialNumber}
      />

      <Button size="sm" variant="success">
        Save Stock
      </Button>
    </form>
  );
}

export default StockInBarcodeForm;
