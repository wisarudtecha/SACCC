// src/cms/components/crm/inventory/InventoryForm.tsx
"use client"

import { useState } from "react";
import { X } from "lucide-react";
import { ToastContainer } from "@/core/components/crud/ToastContainer";
import { useToast } from "@/core/hooks/useToast";
import { useTranslation } from "@/core/hooks/useTranslation";
import type { Brand } from "@/cms/types/brand";
import type { Category } from "@/cms/types/category";
import type { InventoryCreateData, InventoryUpdateData } from "@/cms/types/inventory";
import type { Product } from "@/cms/types/product";
import Button from "@/core/components/ui/button/Button";
import Input from "@/core/components/form/input/InputField";
import Label from "@/core/components/form/Label";
import CustomizableSelect from "@/core/components/form/CustomizableSelect";

interface InventoryFormProps {
  brands: Brand[];
  categories: Category[];
  formLoading: boolean;
  initialValues?: InventoryCreateData | InventoryUpdateData;
  products: Product[];
  onCancel: () => void;
  onSubmit: (formData: InventoryCreateData | InventoryUpdateData) => void;
}

const initialFormData: InventoryCreateData | InventoryUpdateData = {
  th: "",
  en: "",
  categoryId: "",
  brandId: "",
  productId: "",
  mfd: 0,
  warranty: 0,
  price: 0,
  active: true,
  image: "",
};

const InventoryForm = ({
  brands,
  categories,
  formLoading,
  initialValues,
  products,
  onCancel,
  onSubmit
}: InventoryFormProps) => {
  const { toasts, addToast, removeToast } = useToast();
  const {
    language,
    // t
  } = useTranslation();
  
  const [formData, setFormData] = useState(initialValues || initialFormData);
  const [showInventoryImage, setShowInventoryImage] = useState<string | null>(null);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, section: string) => {
    const { name, value } = e.target;
    if (section === "brand") {
      //
    }
    else if (section === "category") {
      //
    }
    else {
      const file = e?.target?.files?.[0];
      setShowInventoryImage(file ? URL.createObjectURL(file) : null);
      setFormData((prev: InventoryCreateData | InventoryUpdateData) => {
        const base = prev ?? {
          th: "",
          en: "",
          active: true,
          type: "inventory",
          file: new File([], ""),
          categoryId: "",
          brandId: "",
          productId: "",
          mfd: 0,
          warranty: 0,
          price: 0,
        };
        if (name === "file") {
          return { ...base, file: file ?? new File([], "") };
        }
        if (name === "th") {
          return { ...base, th: String(value) };
        }
        if (name === "en") {
          return { ...base, en: String(value) };
        }
        if (name === "categoryId") {
          return { ...base, categoryId: String(value) };
        }
        if (name === "brandId") {
          return { ...base, brandId: String(value) };
        }
        if (name === "productId") {
          return { ...base, productId: String(value) };
        }
        if (name === "mfd") {
          return { ...base, mfd: Number(value) };
        }
        if (name === "warranty") {
          return { ...base, warranty: Number(value) };
        }
        if (name === "price") {
          return { ...base, price: Number(value) };
        }
        return base;
      });
    }
  }

  const handleSubmit = (e: { preventDefault: () => void; }, section: string) => {
    e.preventDefault();
    if (section === "brand") {
      // 
    }
    else if (section === "category") {
      // 
    }
    else {
      if ( formData.price === undefined
        || formData.warranty === undefined
        || formData.mfd === undefined
        || formData.brandId === undefined
        || formData.categoryId === undefined
        || formData.productId === undefined
        || formData.en === undefined
        || formData.th === undefined
        || formData.image === undefined
      ) {
        addToast("error", "Please fill in all required fields.");
        return;
      }
      onSubmit(formData as InventoryCreateData | InventoryUpdateData);
    }
  }

  return (
    <>
      <div className="fixed inset-0 bg-white dark:bg-black/50 flex items-center justify-center z-9999 gap-4">
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-6 py-4 flex items-center justify-between z-9999">
            <h2 className="text-xl font-semibold text-black dark:text-white">{initialValues ? "Edit Inventory" : "Create New Inventory"}</h2>
            <button
              onClick={onCancel}
              className={`${formLoading ? "disabled cursor-not-allowed" : ""} text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white`}
              disabled={formLoading}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 p-4">
            <div>
              <Label className="mb-2 block">
                Inventory Name (TH)*
              </Label>
              <Input
                name="th"
                value={formData.th || ""}
                onChange={value => handleChange(value, "inventory")}
                placeholder="Enter inventory name"
                required
              />
            </div>
            <div>
              <Label className="mb-2 block">
                Inventory Name (EN)*
              </Label>
              <Input
                name="en"
                value={formData.en || ""}
                onChange={value => handleChange(value, "inventory")}
                placeholder="Enter inventory name"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 p-4">
            <div>
              <Label className="mb-2 block">
                Category *
              </Label>
              <CustomizableSelect
                value={(formData.categoryId && categories.find(category => category.categoryId === formData.categoryId)?.categoryId) || ""}
                onChange={value => setFormData(prev => ({
                  ...prev,
                  categoryId: value as string
                }))}
                options={categories.map(category => ({
                  value: category.categoryId,
                  label: language === "th" && category.th || category.en,
                }))}
                placeholder="Select category"
                multiple={false}
              />
            </div>
            <div>
              <Label className="mb-2 block">
                Brand *
              </Label>
              <CustomizableSelect
                value={(formData.brandId && brands.find(brand => brand.brandId === formData.brandId)?.brandId) || ""}
                onChange={value => setFormData(prev => ({
                  ...prev,
                  brandId: value as string
                }))}
                options={brands.map(brand => ({
                  value: brand.brandId,
                  label: language === "th" && brand.th || brand.en,
                }))}
                placeholder="Select brand"
                multiple={false}
              />
            </div>
            <div>
              <Label className="mb-2 block">
                Product *
              </Label>
              <CustomizableSelect
                value={(formData.productId && products.find(product => product.productId === formData.productId)?.productId) || ""}
                onChange={value => setFormData(prev => ({
                  ...prev,
                  productId: value as string
                }))}
                options={products.map(product => ({
                  value: product.productId,
                  label: language === "th" && product.th || product.en,
                }))}
                placeholder="Select product"
                multiple={false}
              />
            </div>
            <div>
              <Label className="mb-2 block">
                Year *
              </Label>
              <Input
                name="mfd"
                value={formData.mfd}
                onChange={value => handleChange(value, "inventory")}
                required
              />
            </div>
            <div>
              <Label className="mb-2 block">
                Warranty (Month)*
              </Label>
              <Input
                name="warranty"
                value={formData.warranty || 0}
                onChange={value => handleChange(value, "inventory")}
                placeholder="e.g., 2026-01-01"
                required
                type="number"
              />
            </div>
            <div>
              <Label className="mb-2 block">
                Price *
              </Label>
              <Input
                name="price"
                value={formData.price || 0}
                onChange={value => handleChange(value, "inventory")}
                placeholder="e.g., 25000"
                required
                type="number"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 p-4">
            <div>
              <Label className="mb-2 block">
                Image*
              </Label>
              <input
                type="file"
                name="file"
                onChange={e => handleChange(e, "inventory")}
                className="cursor-pointer w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md text-black dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                accept="image/*"
              />
              {showInventoryImage && (
                <img
                  src={showInventoryImage}
                  alt="Inventory Image Preview"
                  className="w-full object-cover cursor-pointer py-4"
                />
              )}
            </div>
          </div>

          <div className="flex gap-3 justify-end p-4">
            <Button
              onClick={onCancel}
              variant="outline"
              size="sm"
              className={`${formLoading ? "disabled cursor-not-allowed" : ""}`}
              disabled={formLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={() => handleSubmit({ preventDefault: () => {} }, "inventory")}
              variant="primary"
              size="sm"
              className={`${formLoading ? "disabled cursor-not-allowed" : ""}`}
              disabled={formLoading}
            >
              {formLoading && "Saving..." || (initialValues ? "Update Inventory" : "Create Inventory")}
            </Button>
          </div>
        </div>
      </div>

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </>
  );
}

export default InventoryForm;
