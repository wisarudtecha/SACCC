// src/cms/components/crm/stock/BarcodeInput.tsx
import { useState } from "react";
import { Plus, X } from "lucide-react";
import Input from "@/core/components/form/input/InputField";
import Button from "@/core/components/ui/button/Button";

interface Props {
  value: string[];
  onChange: (codes: string[]) => void;
}

const BarcodeInput = ({ value, onChange }: Props) => {
  const [input, setInput] = useState("");

  const addCode = () => {
    if (!input.trim()) {
      return;
    }
    if (value.includes(input)) {
      alert("Duplicate barcode");
      return;
    }
    onChange([...value, input]);
    setInput("");
  }

  const removeCode = (code: string) => {
    onChange(value.filter(c => c !== code));
  }

  const updateCode = (oldCode: string, newCode: string) => {
    const updated = value.map(c =>
      c === oldCode ? newCode : c
    );
    onChange(updated);
  }

  // const handleBulkPaste = (text: string) => {
  //   const codes = text.split(/\n|,|\s/).map(c => c.trim()).filter(Boolean);
  //   const unique = Array.from(new Set([...value, ...codes]));
  //   onChange(unique);
  // }

  return (

    <div className="space-y-4">
      {/* Manual Input */}
      <div className="flex gap-2">
        <div className="flex-1">
          <Input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Scan or enter barcode"
            // className="border p-2 w-full"
          />
        </div>

        <div>
          <Button
            onClick={addCode}
            size="sm"
            variant="primary"
          >
            <Plus className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Bulk Paste */}
      {/*
      <textarea
        placeholder="Paste multiple barcodes (comma / newline)"
        className="border p-2 w-full"
        onBlur={(e) => handleBulkPaste(e.target.value)}
      />
      */}

      {/* List */}
      <div
        className={`${value.length === 0 ? "hidden" : ""} max-h-64 overflow-auto`}
        // className={`${value.length === 0 ? "hidden" : ""} border p-2 max-h-64 overflow-auto`}
      >
        {value.map((code) => (
          <div
            key={code}
            className="flex justify-between items-center mb-1 gap-2"
          >
            <div className="flex-1">
              <Input
                value={code}
                onChange={e =>
                  updateCode(code, e.target.value)
                }
                className="border p-1 w-full"
              />
            </div>

            <div>
              <Button
                onClick={() => removeCode(code)}
                size="sm"
                variant="error"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <div className="text-sm text-gray-500">
        Total: {value.length}
      </div>
    </div>
  );
}

export default BarcodeInput;
