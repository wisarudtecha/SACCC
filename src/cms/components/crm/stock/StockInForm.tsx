// src/cms/components/crm/stock/StockInForm.tsx
import { useState } from "react"

interface Props {
  onSubmit: (data: unknown) => void
}

const StockInForm = ({ onSubmit }: Props) => {
  const [productId, setProductId] = useState("")
  const [qty, setQty] = useState(0)

  const submit = () => {
    onSubmit({
      productId,
      quantity: qty,
    })
  }

  return (
    <div className="space-y-3">

      <input
        placeholder="Product ID"
        className="border p-2 w-full"
        value={productId}
        onChange={(e) => setProductId(e.target.value)}
      />

      <input
        type="number"
        className="border p-2 w-full"
        value={qty}
        onChange={(e) => setQty(Number(e.target.value))}
      />

      <button
        onClick={submit}
        className="bg-blue-600 text-white px-4 py-2 rounded"
      >
        Stock In
      </button>

    </div>
  )
}

export default StockInForm;
