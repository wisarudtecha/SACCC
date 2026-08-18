// src/cms/components/crm/products/ProductView.tsx
"use client"

import {
  useCallback,
  useMemo,
  useState
} from "react";
import { ExternalLink } from "lucide-react";
import { ToastContainer } from "@/core/components/crud/ToastContainer";
import { usePermissions } from "@/core/hooks/usePermissions";
import { useToast } from "@/core/hooks/useToast";
import { useTranslation } from "@/core/hooks/useTranslation";
import { useReadBrandQuery } from "@/cms/store/api/brandApi";
import { useReadCategoryQuery } from "@/cms/store/api/categoryApi";
import { useReadProductQuery, useCreateProductMutation, useUpdateProductMutation, useDeleteProductMutation } from "@/cms/store/api/productApi";
import { useReadProductStockQuery } from "@/cms/store/api/productStockApi";
import { useReadStoreQuery } from "@/cms/store/api/storeApi";
import { convertDaysToMonths, formatNumberWithComma, formatPrice, getStockStatus } from "@/cms/utils/productHelper";
import type { Column, FieldConfig, Product, ProductCreateData, ProductQueryParams, ProductUpdateData, ViewFilterConfig } from "@/cms/types/product";
import Badge, { BadgeColor } from "@/core/components/ui/badge/Badge";
import Form from "@/cms/components/crm/Form";
import ImagePreviewModal from "@/cms/components/crm/ImagePreviewModal";
import ItemCard from "@/cms/components/crm/ItemCard";
import ItemList from "@/cms/components/crm/ItemList";
import View from "@/cms/components/crm/View";
import StockModal from "@/cms/components/crm/stock/StockModal";

const ProductView = () => {
  const permissions = usePermissions();
  const { language, t } = useTranslation();
  const { toasts, addToast, removeToast } = useToast();
  
  // State management
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductUpdateData | null>(null);
  const [imagePreview, setImagePreview] = useState<{ url: string; alt: string } | null>(null);
  const [showStock, setShowStock] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // API hooks
  const { data: brandData } = useReadBrandQuery({ 
    start: 0, 
    length: 100, 
    type: "product" 
  });
  
  const { data: categoryData } = useReadCategoryQuery({ 
    start: 0, 
    length: 100, 
    type: "product" 
  });

  const { data: storeData } = useReadStoreQuery({ 
    start: 0, 
    length: 1000
  });

  const { data: stockData } = useReadProductStockQuery({ 
    start: 0, 
    length: 10000
  });

  const initialQuery: ProductQueryParams = {
    start: 0,
    length: 10,
    search: undefined,
    active: undefined,
    categoryId: undefined,
    productId: undefined,
    brandId: undefined,
    mfd: undefined,
    warranty: undefined,
    price: undefined,
    lable: undefined,
    customerId: undefined,
    orderBy: undefined,
    direction: undefined
  };

  const [query, setQuery] = useState<ProductQueryParams>(initialQuery);

  // const [query, setQuery] = useState<ProductQueryParams>({
  //   start: 0,
  //   length: 10,
  //   search: "",
  //   active: undefined,
  //   categoryId: "",
  //   productId: "",
  //   brandId: "",
  //   mfd: "",
  //   warranty: undefined,
  //   price: "",
  //   lable: "",
  //   customerId: "",
  //   orderBy: "",
  //   direction: ""
  // });
  
  const { 
    data: productData, 
    isLoading: isLoadingProducts,
    refetch: refetchProducts 
  } = useReadProductQuery(query);
  
  const [createProduct, { isLoading: isCreating }] = useCreateProductMutation();
  const [updateProduct, { isLoading: isUpdating }] = useUpdateProductMutation();
  const [deleteProduct, { isLoading: isDeleting }] = useDeleteProductMutation();

  // Extract data
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const brands = brandData?.data || [];
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const categories = categoryData?.data || [];
  const stores = storeData?.data || [];
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const stocks = stockData?.data || [];
  const products = productData?.data || [];

  // Combined loading state
  const loading = isLoadingProducts || isCreating || isUpdating || isDeleting;

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear - i); // Last 10 years

  // Field configuration for the form
  const formFields: FieldConfig[] = useMemo(() => [
    {
      name: "attachment",
      label: t("crud.product.form.attachment.label"),
      type: "file",
      colSpan: 1,
      accept: "image/*"
    },
    {
      name: "th",
      label: t("crud.product.form.th.label"),
      type: "text",
      required: true,
      placeholder: t("crud.product.form.th.placeholder"),
      colSpan: 1,
      errorMessage: `${t("common.required_field")} ${t("crud.product.form.th.label")}`
    },
    {
      name: "en",
      label: t("crud.product.form.en.label"),
      type: "text",
      required: true,
      placeholder: t("crud.product.form.en.placeholder"),
      colSpan: 1,
      errorMessage: `${t("common.required_field")} ${t("crud.product.form.en.label")}`
    },
    {
      name: "productCode",
      label: t("crud.product.form.productCode.label"),
      type: "text",
      required: true,
      placeholder: t("crud.product.form.productCode.placeholder"),
      colSpan: 1,
      errorMessage: `${t("common.required_field")} ${t("crud.product.form.productCode.label")}`
    },
    {
      name: "categoryId",
      label: t("crud.product.form.categoryId.label"),
      type: "customizable-select",
      required: true,
      placeholder: t("crud.product.form.categoryId.placeholder"),
      colSpan: 1,
      options: categories.map(c => ({
        value: c.categoryId,
        label: language === "th" ? c.th : c.en
      })),
      errorMessage: `${t("common.required_field")} ${t("crud.product.form.categoryId.label")}`
    },
    {
      name: "brandId",
      label: t("crud.product.form.brandId.label"),
      type: "customizable-select",
      required: true,
      placeholder: t("crud.product.form.brandId.placeholder"),
      colSpan: 1,
      options: brands.map(b => ({
        value: b.brandId,
        label: language === "th" ? b.th : b.en
      })),
      errorMessage: `${t("common.required_field")} ${t("crud.product.form.brandId.label")}`
    },
    {
      name: "mfd",
      label: t("crud.product.form.mfd.label"),
      type: "select",
      required: true,
      placeholder: t("crud.product.form.mfd.placeholder"),
      colSpan: 1,
      options: years.map(y => ({
        value: y.toString(),
        label: y.toString()
      })),
      errorMessage: `${t("common.required_field")} ${t("crud.product.form.mfd.label")}`
    },
    {
      name: "warranty",
      label: t("crud.product.form.warranty.label"),
      type: "number",
      required: true,
      placeholder: t("crud.product.form.warranty.placeholder"),
      colSpan: 1,
      errorMessage: `${t("common.required_field")} ${t("crud.product.form.warranty.label")}`
    },
    {
      name: "price",
      label: t("crud.product.form.price.label"),
      type: "number",
      required: true,
      placeholder: t("crud.product.form.price.placeholder"),
      colSpan: 1,
      errorMessage: `${t("common.required_field")} ${t("crud.product.form.price.label")}`
    }
  ], [
    brands,
    categories,
    language,
    years,
    t
  ]);

  const handleStock = useCallback((product: Product) => {
    setSelectedProduct(product);
    setShowStock(true);
  }, []);

  // Column configuration for table/list view
  const columns: Column<Product>[] = useMemo(() => [
    {
      key: "name",
      label: t("crud.product.list.header.name"),
      sortable: true,
      width: "min-w-64",
      align: "left",
      colSpan: 2,
      render: product => (
        <ItemList
          item={product as unknown as Record<string, React.ReactNode>}
          language={language}
        />
      )
    },
    {
      key: "productCode",
      label: t("crud.product.list.header.productCode"),
      sortable: true,
      width: "w-32",
      align: "left",
      colSpan: 1,
    },
    {
      key: "stock",
      label: t("crud.product.list.header.stock"),
      sortable: false,
      width: "w-32",
      align: "left",
      colSpan: 1,
      render: product => {
        if (permissions.hasPermission("product_stock.view")) {
          const stock = stocks.find(s => s.product.productId === product.productId);
          const stockStatus = getStockStatus(stock?.quantity as number);
          return (
            <div className="flex item-center gap-2">
              <Badge className="mb-0 w-fit" color={stockStatus.variant as BadgeColor}>
                {stockStatus.label} ({formatNumberWithComma(stock?.quantity || 0)})
              </Badge>
              <button
                className="p-0 text-blue-500 hover:text-blue-700"
                onClick={() => handleStock(product)}
              >
                <ExternalLink className="h-4 w-4" />
              </button>
            </div>
          );
        }
      }
    },
    {
      key: "brandId",
      label: t("crud.product.list.header.brandId"),
      sortable: false,
      width: "w-32",
      align: "left",
      colSpan: 1,
      render: product => {
        const brand = brands.find(b => b.brandId === product.brandId);
        return brand ? (language === "th" ? brand.th : brand.en) : "-";
      }
    },
    {
      key: "categoryId",
      label: t("crud.product.list.header.categoryId"),
      sortable: false,
      width: "w-32",
      align: "left",
      colSpan: 1,
      render: product => {
        const category = categories.find(c => c.categoryId === product.categoryId);
        return category ? (language === "th" ? category.th : category.en) : "-";
      }
    },
    {
      key: "mfd",
      label: t("crud.product.list.header.mfd"),
      sortable: true,
      width: "w-32",
      align: "right",
      colSpan: 1
    },
    {
      key: "price",
      label: t("crud.product.list.header.price"),
      sortable: true,
      width: "w-32",
      align: "right",
      colSpan: 1,
      render: product => (
        <span className="font-semibold">{formatPrice(product.price)}</span>
      )
    },
    {
      key: "warranty",
      label: t("crud.product.list.header.warranty"),
      sortable: true,
      width: "w-32",
      align: "right",
      colSpan: 1,
      render: product => product.warranty ? (
        <Badge color="success" className="text-xs">
          {convertDaysToMonths(product.warranty)}
        </Badge>
      ) : "-",
    }
  ], [
    brands,
    categories,
    language,
    permissions,
    stocks,
    handleStock,
    t
  ]);

  const filters: ViewFilterConfig[] = [
    {
      key: "brandId",
      label: t("crud.product.form.brandId.label"),
      type: "select",
      placeholder: t("crud.product.form.brandId.placeholder"),
      options: brands.map(b => ({
        value: b.brandId,
        label: language === "th" ? b.th : b.en
      }))
    },
    {
      key: "categoryId",
      label: t("crud.product.form.categoryId.label"),
      type: "select",
      placeholder: t("crud.product.form.categoryId.placeholder"),
      options: categories.map(c => ({
        value: c.categoryId,
        label: language === "th" ? c.th : c.en
      }))
    },
    {
      key: "active",
      label: t("common.status"),
      type: "radio",
      options: [
        { label: t("common.active"), value: true },
        { label: t("common.inactive"), value: false }
      ]
    }
  ];

  // Handle form submission (Create or Update)
  const handleSubmit = async (formData: Record<string, unknown>) => {
    try {
      const data = {
        active: typeof formData.active === "boolean" ? formData.active : true,
        brandId: String(formData.brandId),
        categoryId: String(formData.categoryId),
        en: String(formData.en),
        image: String(formData.image),
        mfd: Number(formData.mfd),
        price: Number(formData.price),
        productCode: String(formData.productCode),
        th: String(formData.th),
        warranty: Number(formData.warranty)
      }
      
      // Append file if exists
      if (formData.file && formData.file instanceof File && formData.file.size > 0) {
        // data.append("file", formData.file);
      }

      let response;
      
      if (editingProduct) {
        // Update existing product
        response = await updateProduct({ 
          productId: editingProduct.productId || "", 
          data: data 
        }).unwrap();
        
        
        if (response?.status && typeof response?.status === "string" && response?.status !== "-1") {
          addToast("success", response?.message || response?.desc || response?.msg || t("crud.common.form.action.update.success").replace("_ENTITY_", t("crud.product.name")));
          setShowForm(false);
          setEditingProduct(null);
          refetchProducts();
        }
        else {
          addToast("error", response?.message || response?.desc || response?.msg || t("crud.common.form.action.update.error").replace("_ENTITY_", t("crud.product.name")));
        }
      }
      else {
        // Create new product
        response = await createProduct(data).unwrap();
        
        if (response?.status && typeof response?.status === "string" && response?.status !== "-1") {
          addToast("success", response?.message || response?.desc || response?.msg || t("crud.common.form.action.create.success").replace("_ENTITY_", t("crud.product.name")));
          setShowForm(false);
          refetchProducts();
        }
        else {
          addToast("error", response?.message || response?.desc || response?.msg || t("crud.common.form.action.create.error").replace("_ENTITY_", t("crud.product.name")));
        }
      }
    }
    catch (error: unknown) {
      console.error("Submit error:", error);
      addToast("error", (error as { data?: { message?: string } })?.data?.message
        || (error as { data?: { desc?: string } })?.data?.desc
        || (error as { data?: { msg?: string } })?.data?.msg
        || `Operation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  // Handle product deletion
  const handleDelete = async (product: Product) => {
    try {
      const response = await deleteProduct(product.productId).unwrap();
      
      if (response?.status) {
        addToast("success", response?.message || response?.desc || response?.msg || t("crud.common.form.action.delete.success").replace("_ENTITY_", t("crud.product.name")));
        refetchProducts();
      }
      else {
        addToast("error", response?.message || response?.desc || response?.msg || t("crud.common.form.action.delete.error").replace("_ENTITY_", t("crud.product.name")));
      }
    }
    catch (error: unknown) {
      console.error("Delete error:", error);
      addToast("error", (error as { data?: { message?: string } })?.data?.message
        || (error as { data?: { desc?: string } })?.data?.desc
        || (error as { data?: { msg?: string } })?.data?.msg
        || `Delete failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  // Handle edit action
  const handleEdit = (product: Product) => {
    // Format the product data for the form
    const formattedProduct = {
      ...product,
      // mfd: formatDateTime(product.mfd),
      file: new File([], "") // Empty file for edit mode
    };
    
    // setEditingProduct(product);
    setEditingProduct(formattedProduct as unknown as ProductUpdateData);
    setShowForm(true);
  };

  // Custom grid card renderer
  const renderGridCard = (product: Product, actions: React.ReactNode) => {
    const item = {
      ...product,
      code: product.productCode,
    };

    return (
      <ItemCard
        actions={actions}
        brands={brands}
        categories={categories}
        item={item as unknown as Record<string, React.ReactNode>}
        language={language}
        onPreview={(url, alt) => setImagePreview({ url, alt })}
      />
    );
  };

  return (
    <>
      <View
        columns={columns}
        createLabel={t("crud.common.create").replace("_ENTITY_", t("navigation.super_app.topbar.product"))}
        data={products}
        filtered={productData?.totalFiltered as number || 0}
        filters={filters}
        initialQuery={initialQuery as unknown as Record<string, unknown>}
        loading={loading}
        permissionModule="product"
        query={query as unknown as Record<string, unknown>}
        // query={query}
        // searchFields={["th", "en", "productCode"]}
        title={t("navigation.super_app.topbar.product")}
        total={productData?.totalRecords as number || 0}
        getItemImage={product => ({
          url: product.attachment?.attUrl || "/images/crm/placeholder.svg",
          alt: product.attachment?.attName || (language === "th" ? product.th : product.en) || ""
        })}
        gridCardRender={renderGridCard}
        onAdd={() => {
          setEditingProduct(null);
          setShowForm(true);
        }}
        onDelete={handleDelete}
        onEdit={handleEdit}
        onQueryChange={newQuery => setQuery(newQuery as unknown as ProductQueryParams)}
        // onQueryChange={setQuery}
        onView={(
          // product
        ) => {
          // View is handled by the DetailModal in View
          // You can add custom view logic here if needed
        }}
      />

      {showStock && selectedProduct && (
        <StockModal
          header={t("navigation.super_app.topbar.more.menu.product.sub_menu.product_stock")}
          item={selectedProduct}
          open={showStock}
          stores={stores}
          type="product"
          onClose={() => setShowStock(false)}
        />
      )}

      {/* Form Modal */}
      <Form
        cancelLabel={t("crud.common.form.action.cancel")}
        customFieldGroup={["en", "th", "productCode"]}
        fields={formFields}
        initialValues={(editingProduct as unknown as Record<string, unknown>) || {
          active: true,
          brandId: "",
          categoryId: "",
          en: "",
          image: "",
          mfd: 0,
          price: 0,
          productCode: "",
          th: "",
          warranty: 0
        } as ProductCreateData}
        loading={loading}
        open={showForm}
        submitLabel={`${(editingProduct ? t("common.update_entity") : t("crud.common.create")).replace("_ENTITY_", t("navigation.super_app.topbar.product"))}`}
        title={`${(editingProduct ? t("common.edit_entity") : t("crud.common.create")).replace("_ENTITY_", t("navigation.super_app.topbar.product"))}`}
        uploadPath="product"
        onCancel={() => {
          setShowForm(false);
          setEditingProduct(null);
        }}
        onSubmit={handleSubmit}
      />

      {/* Standalone Image Preview Modal for grid cards */}
      <ImagePreviewModal
        alt={imagePreview?.alt}
        open={!!imagePreview}
        url={imagePreview?.url}
        onClose={() => setImagePreview(null)}
      />

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </>
  );
};

export default ProductView;
