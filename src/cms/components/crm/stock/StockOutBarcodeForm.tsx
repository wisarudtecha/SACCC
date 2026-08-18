// src/cms/components/crm/stock/StockOutBarcodeForm.tsx
import { useState } from "react";

interface Props {
  availableCodes: string[];
  onSubmit: (selectedCodes: string[]) => void;
}

const StockOutBarcodeForm = ({ availableCodes, onSubmit }: Props) => {
  const [selected, setSelected] = useState<string[]>([]);

  const toggle = (code: string) => {
    if (selected.includes(code)) {
      setSelected(selected.filter(c => c !== code));
    }
    else {
      setSelected([...selected, code]);
    }
  }

  return (
    <div>
      <h3>Select Barcodes</h3>

      <div className="max-h-64 overflow-auto border">
        {availableCodes.map((code: string) => (
          <div key={code}>
            <input
              type="checkbox"
              checked={selected.includes(code)}
              onChange={() => toggle(code)}
            />

            {code}
          </div>
        ))}
      </div>

      <button
        onClick={() => onSubmit(selected)}
        className="bg-red-600 text-white px-4 py-2 mt-2"
      >
        Stock Out ({selected.length})
      </button>
    </div>
  );
}

export default StockOutBarcodeForm;
