// src/cms/components/crm/products/ProductForm.tsx
"use client"

import { useState } from "react";
import { X } from "lucide-react";
import { ToastContainer } from "@/core/components/crud/ToastContainer";
import { useToast } from "@/core/hooks/useToast";
import { useTranslation } from "@/core/hooks/useTranslation";
// import { useCreateBrandMutation } from "@/cms/store/api/brandApi";
// import { useCreateCategoryMutation } from "@/cms/store/api/categoryApi";
import type {
  Brand,
  // BrandCreateData
} from "@/cms/types/brand";
import type {
  Category,
  // CategoryCreateData
} from "@/cms/types/category";
import type { ProductCreateData, ProductUpdateData } from "@/cms/types/product";
import Button from "@/core/components/ui/button/Button";
import Input from "@/core/components/form/input/InputField";
import Label from "@/core/components/form/Label";
import CustomizableSelect from "@/core/components/form/CustomizableSelect";
import Select from "@/core/components/form/Select";

interface ProductFormProps {
  brands: Brand[];
  categories: Category[];
  formLoading: boolean;
  initialValues?: ProductCreateData | ProductUpdateData;
  onCancel: () => void;
  onSubmit: (formData: ProductCreateData | ProductUpdateData) => void;
}

const initialFormData: ProductCreateData | ProductUpdateData = {
  th: "",
  en: "",
  categoryId: "",
  brandId: "",
  productCode: "",
  mfd: 0,
  warranty: 0,
  price: 0,
  active: true,
  image: "",
};

const ProductForm = ({
  brands,
  categories,
  formLoading,
  initialValues,
  onCancel,
  onSubmit
}: ProductFormProps) => {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 50 }, (_, i) => currentYear - i); // Last 50 years

  const { toasts, addToast, removeToast } = useToast();
  const {
    language,
    // t
  } = useTranslation();
  
  // const [brandData, setBrandData] = useState<BrandCreateData | null>(null);
  // const [categoryData, setCategoryData] = useState<CategoryCreateData | null>(null);
  const [formData, setFormData] = useState(initialValues || initialFormData);
  // const [loading, setLoading] = useState(false);
  // const [showCreateBrand, setShowCreateBrand] = useState(false);
  // const [showCreateCategory, setShowCreateCategory] = useState(false);
  // const [showLogoBrand, setShowLogoBrand] = useState<string | null>(null);
  const [showProductImage, setShowProductImage] = useState<string | null>(null);

  // const [createBrand] = useCreateBrandMutation();
  // const [createCategory] = useCreateCategoryMutation();

  // const handleAddBrand = async (formData: BrandCreateData) => {
  //   if (formData) {
  //     setLoading(true);
  //     try {
  //       // Convert to FormData for file upload
  //       const data = new FormData();
  //       data.append("en", formData.en);
  //       data.append("th", formData.th);
  //       data.append("active", String(formData.active));
  //       data.append("type", formData.type);
  //       data.append("file", formData.file); // File object

  //       const response = await createBrand(data).unwrap();
  //       if (response?.status) {
  //         addToast("success", "Brand created successfully.");
  //         // setFormData(prev => ({
  //         //   ...prev,
  //         //   brandId: response?.data as unknown as string || ""
  //         // }));
  //       }
  //       else {
  //         addToast("error", "Brand create failed, please try again.");
  //       }
  //     }
  //     catch (err) {
  //       addToast("error", `An error occurred while creating the brand, ${err}`);
  //     }
  //     finally {
  //       setLoading(false);
  //     }
  //   }
  //   setShowCreateBrand(false);
  //   setBrandData(null);
  //   setShowLogoBrand(null);
  // }

  // const handleAddCategory = async (formData: CategoryCreateData) => {
  //   if (formData) {
  //     setLoading(true);
  //     try {
  //       const response = await createCategory(formData).unwrap();
  //       if (response?.status) {
  //         addToast("success", "Category created successfully.");
  //         // setFormData(prev => ({
  //         //   ...prev,
  //         //   categoryId: response?.data as unknown as string || ""
  //         // }));
  //       }
  //       else {
  //         addToast("error", "Category create failed, please try again.");
  //       }
  //     }
  //     catch (err) {
  //       addToast("error", `An error occurred while creating the category, ${err}`);
  //     }
  //     finally {
  //       setLoading(false);
  //     }
  //   }
  //   setShowCreateCategory(false);
  //   setCategoryData(null);
  // }
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, section: string) => {
    const { name, value } = e.target;
    if (section === "brand") {
      // const file = e?.target?.files?.[0];
      // setShowLogoBrand(file ? URL.createObjectURL(file) : null);
      // setBrandData(prev => {
      //   const base: BrandCreateData = prev ?? {
      //     th: "",
      //     en: "",
      //     active: true,
      //     type: "product",
      //     file: new File([], "")
      //   };
      //   if (name === "file") {
      //     return { ...base, file: file ?? new File([], "") };
      //   }
      //   if (name === "th") {
      //     return { ...base, th: String(value) };
      //   }
      //   if (name === "en") {
      //     return { ...base, en: String(value) };
      //   }
      //   return base;
      // });
    }
    else if (section === "category") {
      // setCategoryData(prev => {
      //   const base: CategoryCreateData = prev ?? {
      //     th: "",
      //     en: "",
      //     active: true,
      //     type: "product"
      //   };
      //   if (name === "th") {
      //     return { ...base, th: String(value) };
      //   }
      //   if (name === "en") {
      //     return { ...base, en: String(value) };
      //   }
      //   return base;
      // });
    }
    else {
      const file = e?.target?.files?.[0];
      setShowProductImage(file ? URL.createObjectURL(file) : null);
      setFormData((prev: ProductCreateData | ProductUpdateData) => {
        const base = prev ?? {
          th: "",
          en: "",
          active: true,
          type: "product",
          file: new File([], ""),
          categoryId: "",
          brandId: "",
          productCode: "",
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
        if (name === "productCode") {
          return { ...base, productCode: String(value) };
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

      // setFormData(prev => ({
      //   ...prev,
      //   [name]: value,
      // }));
    }
  }

  const handleSubmit = (e: { preventDefault: () => void; }, section: string) => {
    e.preventDefault();
    if (section === "brand") {
      // if (!brandData?.file || !brandData?.en || !brandData?.th) {
      //   addToast("error", "Please fill in all required fields.");
      //   return;
      // }
      // handleAddBrand(brandData as BrandCreateData);
    }
    else if (section === "category") {
      // if (!categoryData?.en || !categoryData?.th) {
      //   addToast("error", "Please fill in all required fields.");
      //   return;
      // }
      // handleAddCategory(categoryData as CategoryCreateData);
    }
    else {
      if ( formData.price === undefined
        || formData.warranty === undefined
        || formData.mfd === undefined
        || formData.brandId === undefined
        || formData.categoryId === undefined
        || formData.productCode === undefined
        || formData.en === undefined
        || formData.th === undefined
        || formData.image === undefined
      ) {
        addToast("error", "Please fill in all required fields.");
        return;
      }
      onSubmit(formData as ProductCreateData | ProductUpdateData);
    }
  }

  return (
    <>
      <div className="fixed inset-0 bg-white dark:bg-black/50 flex items-center justify-center z-9999 gap-4">
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-6 py-4 flex items-center justify-between z-9999">
            <h2 className="text-xl font-semibold text-black dark:text-white">{initialValues ? "Edit Product" : "Create New Product"}</h2>
            <button
              onClick={onCancel}
              // className="text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white"
              className={`${formLoading ? "disabled cursor-not-allowed" : ""} text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white`}
              disabled={formLoading}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 p-4">
            <div>
              <Label
                // className="text-gray-300 mb-2 block"
                className="mb-2 block"
              >
                Product Name (TH)*
              </Label>
              <Input
                name="th"
                value={formData.th || ""}
                // onChange={handleChange}
                onChange={value => handleChange(value, "product")}
                placeholder="Enter product name"
                // className="bg-gray-800 border-gray-700 text-white"
                required
              />
            </div>
            <div>
              <Label
                // className="text-gray-300 mb-2 block"
                className="mb-2 block"
              >
                Product Name (EN)*
              </Label>
              <Input
                name="en"
                value={formData.en || ""}
                // onChange={handleChange}
                onChange={value => handleChange(value, "product")}
                placeholder="Enter product name"
                // className="bg-gray-800 border-gray-700 text-white"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 p-4">
            <div>
              <Label
                // className="text-gray-300 mb-2 block"
                className="mb-2 block"
              >
                Product Code *
              </Label>
              <Input
                name="productCode"
                value={formData.productCode || ""}
                // onChange={handleChange}
                onChange={value => handleChange(value, "product")}
                placeholder="e.g., SED-X200"
                // className="bg-gray-800 border-gray-700 text-white"
                required
              />
            </div>
            <div>
              <Label
                // className="text-gray-300 mb-2 block"
                className="mb-2 block"
              >
                Category *
              </Label>
              <CustomizableSelect
                // name="categoryId"
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
                // required
                // onCallback={() => {
                //   setShowCreateBrand(false);
                //   setShowCreateCategory(true);
                // }}
                multiple={false}
              />
            </div>
            <div>
              <Label
                // className="text-gray-300 mb-2 block"
                className="mb-2 block"
              >
                Brand *
              </Label>
              <CustomizableSelect
                // name="brandId"
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
                // required
                // onCallback={() => {
                //   setShowCreateBrand(true);
                //   setShowCreateCategory(false);
                // }}
                multiple={false}
              />
            </div>
            <div>
              <Label
                // className="text-gray-300 mb-2 block"
                className="mb-2 block"
              >
                Year *
              </Label>
              {/*
              <Input
                name="mfd"
                type="datetime-local"
                value={formData.mfd.slice(0, 16)}
                onChange={value => handleChange(value, "product")}
                required
              />
              */}
              <Select
                options={years.map(year => ({
                  value: year.toString(),
                  label: year.toString(),
                }))}
                placeholder="Select year"
                value={formData.mfd?.toString()}
                onChange={value => setFormData(prev => ({
                  ...prev,
                  mfd: Number(value)
                }))}
                required
              />
            </div>
            <div>
              <Label
                // className="text-gray-300 mb-2 block"
                className="mb-2 block"
              >
                Warranty (Days)*
              </Label>
              <Input
                name="warranty"
                value={formData.warranty || 0}
                // onChange={handleChange}
                onChange={value => handleChange(value, "product")}
                placeholder="e.g., 2026-01-01"
                // className="bg-gray-800 border-gray-700 text-white"
                required
                type="number"
              />
            </div>
            <div>
              <Label
                // className="text-gray-300 mb-2 block"
                className="mb-2 block"
              >
                Price *
              </Label>
              <Input
                name="price"
                value={formData.price || 0}
                // onChange={handleChange}
                onChange={value => handleChange(value, "product")}
                placeholder="e.g., 25000"
                // className="bg-gray-800 border-gray-700 text-white"
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
                onChange={e => handleChange(e, "product")}
                className="cursor-pointer w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md text-black dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                accept="image/*"
              />
              {showProductImage && (
                <img
                  src={showProductImage}
                  alt="Product Image Preview"
                  // className="h-64 w-full object-cover cursor-pointer py-4"
                  className="w-full object-cover cursor-pointer py-4"
                />
              )}
            </div>
          </div>

          <div className="flex gap-3 justify-end p-4">
            <Button
              // type="button"
              onClick={onCancel}
              variant="outline"
              // className="border-gray-700 text-gray-300 hover:bg-gray-800 bg-transparent"
              size="sm"
              className={`${formLoading ? "disabled cursor-not-allowed" : ""}`}
              disabled={formLoading}
            >
              Cancel
            </Button>
            <Button
              // type="submit"
              // onClick={() => handleSubmit({ preventDefault: () => {} })}
              onClick={() => handleSubmit({ preventDefault: () => {} }, "product")}
              // className="bg-blue-600 hover:bg-blue-700 text-white"
              variant="primary"
              size="sm"
              className={`${formLoading ? "disabled cursor-not-allowed" : ""}`}
              disabled={formLoading}
            >
              {formLoading && "Saving..." || (initialValues ? "Update Product" : "Create Product")}
            </Button>
          </div>
        </div>

        {/*
        {showCreateCategory && (
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-lg max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-black dark:text-white">Create New Category</h2>
              <button
                onClick={() => setShowCreateCategory(false)}
                // className="text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white"
                className={`${loading ? "disabled cursor-not-allowed" : ""} text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white`}
                disabled={loading}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 p-4">
              <div>
                <Label className="mb-2 block">
                  Category Name (TH)*
                </Label>
                <Input
                  name="th"
                  value={categoryData?.th || ""}
                  onChange={value => handleChange(value, "category")}
                  placeholder="Enter category name"
                />
              </div>
              <div>
                <Label className="mb-2 block">
                  Category Name (EN)*
                </Label>
                <Input
                  name="en"
                  value={categoryData?.en || ""}
                  onChange={value => handleChange(value, "category")}
                  placeholder="Enter category name"
                />
              </div>
            </div>

            <div className="flex gap-3 justify-end p-4">
              <Button
                onClick={() => setShowCreateCategory(false)}
                variant="outline"
                size="sm"
                className={`${loading ? "disabled cursor-not-allowed" : ""}`}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                onClick={() => handleSubmit({ preventDefault: () => {} }, "category")}
                variant="primary"
                size="sm"
                className={`${loading ? "disabled cursor-not-allowed" : ""}`}
                disabled={loading}
              >
                {loading && "Saving..." || "Confirm"}
              </Button>
            </div>
          </div>
        )}

        {showCreateBrand && (
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-lg max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-black dark:text-white">Create New Brand</h2>
              <button
                onClick={() => setShowCreateBrand(false)}
                // className="text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white"
                className={`${loading ? "disabled cursor-not-allowed" : ""} text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white`}
                disabled={loading}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 p-4">
              <div>
                <Label className="mb-2 block">
                  Brand Name (TH)*
                </Label>
                <Input
                  name="th"
                  value={brandData?.th || ""}
                  onChange={value => handleChange(value, "brand")}
                  placeholder="Enter brand name"
                />
              </div>
              <div>
                <Label className="mb-2 block">
                  Brand Name (EN)*
                </Label>
                <Input
                  name="en"
                  value={brandData?.en || ""}
                  onChange={value => handleChange(value, "brand")}
                  placeholder="Enter brand name"
                />
              </div>
              <div>
                <Label className="mb-2 block">
                  Logo*
                </Label>
                <input
                  type="file"
                  name="file"
                  onChange={e => handleChange(e, "brand")}
                  className="cursor-pointer w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md text-black dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  accept="image/*"
                />
                {showLogoBrand && (
                  <img
                    src={showLogoBrand}
                    alt="Brand Logo Preview"
                    className="h-64 w-full object-cover cursor-pointer"
                  />
                )}
              </div>
            </div>

            <div className="flex gap-3 justify-end p-4">
              <Button
                onClick={() => setShowCreateBrand(false)}
                variant="outline"
                size="sm"
                className={`${loading ? "disabled cursor-not-allowed" : ""}`}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                onClick={() => handleSubmit({ preventDefault: () => {} }, "brand")}
                variant="primary"
                size="sm"
                className={`${loading ? "disabled cursor-not-allowed" : ""}`}
                disabled={loading}
              >
                {loading && "Saving..." || "Confirm"}
              </Button>
            </div>
          </div>
        )}
        */}
      </div>

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </>
  );
}

export default ProductForm;
