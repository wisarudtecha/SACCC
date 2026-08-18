// src/cms/components/crm/inventory/InventoryView.tsx
"use client"

import { useCallback, useMemo, useState } from "react";
import { ExternalLink } from "lucide-react";
import { ToastContainer } from "@/core/components/crud/ToastContainer";
import { usePermissions } from "@/core/hooks/usePermissions";
import { useToast } from "@/core/hooks/useToast";
import { useTranslation } from "@/core/hooks/useTranslation";
import { useReadBrandQuery } from "@/cms/store/api/brandApi";
import { useReadCategoryQuery } from "@/cms/store/api/categoryApi";
import { useReadInventoryQuery, useCreateInventoryMutation, useUpdateInventoryMutation, useDeleteInventoryMutation } from "@/cms/store/api/inventoryApi";
import { useReadInventoryStockQuery } from "@/cms/store/api/inventoryStockApi";
import { useReadProductQuery } from "@/cms/store/api/productApi";
import { useReadStoreQuery } from "@/cms/store/api/storeApi";
import { convertDaysToMonths, formatNumberWithComma, formatPrice, getStockStatus } from "@/cms/utils/productHelper";
import type { Inventory, InventoryQueryParams } from "@/cms/types/inventory";
import type { Column, FieldConfig, ViewFilterConfig } from "@/cms/types/product";
import Badge, { BadgeColor } from "@/core/components/ui/badge/Badge";
import Form from "@/cms/components/crm/Form";
import ImagePreviewModal from "@/cms/components/crm/ImagePreviewModal";
import ItemCard from "@/cms/components/crm/ItemCard";
import ItemList from "@/cms/components/crm/ItemList";
import View from "@/cms/components/crm/View";
import StockModal from "@/cms/components/crm/stock/StockModal";

const InventoryView = () => {
  const permissions = usePermissions();
  const { language, t } = useTranslation();
  const { toasts, addToast, removeToast } = useToast();
  
  // State management
  const [showForm, setShowForm] = useState(false);
  const [editingInventory, setEditingInventory] = useState<Inventory | null>(null);
  const [imagePreview, setImagePreview] = useState<{ url: string; alt: string } | null>(null);
  const [showStock, setShowStock] = useState(false);
  const [selectedInventory, setSelectedInventory] = useState<Inventory | null>(null);

  // API hooks
  const { data: brandData } = useReadBrandQuery({ 
    start: 0, 
    length: 100, 
    type: "part" 
  });
  
  const { data: categoryData } = useReadCategoryQuery({ 
    start: 0, 
    length: 100, 
    type: "part" 
  });

  const { data: productData } = useReadProductQuery({ 
    start: 0, 
    length: 1000
  });

  const { data: storeData } = useReadStoreQuery({ 
    start: 0, 
    length: 1000
  });

  const { data: stockData } = useReadInventoryStockQuery({ 
    start: 0, 
    length: 10000
  });

  const initialQuery: InventoryQueryParams = {
    start: 0,
    length: 10,
    active: undefined,
    search: undefined,
    categoryId: undefined,
    partId: undefined,
    productId: undefined,
    brandId: undefined,
    mfd: undefined,
    warranty: undefined,
    price: undefined,
    lable: undefined,
    orderBy: undefined,
    direction: undefined
  };

  const [query, setQuery] = useState<InventoryQueryParams>(initialQuery);

  // const [query, setQuery] = useState<InventoryQueryParams>({
  //   start: 0,
  //   length: 10,
  //   active: undefined,
  //   search: "",
  //   categoryId: "",
  //   partId: "",
  //   productId: "",
  //   brandId: "",
  //   mfd: undefined,
  //   warranty: undefined,
  //   price: "",
  //   lable: "",
  //   orderBy: "",
  //   direction: ""
  // });
  
  const { data: inventoryData, isLoading: isLoadingInventories, refetch: refetchInventories } = useReadInventoryQuery(query);
  
  const [createInventory, { isLoading: isCreating }] = useCreateInventoryMutation();
  const [updateInventory, { isLoading: isUpdating }] = useUpdateInventoryMutation();
  const [deleteInventory, { isLoading: isDeleting }] = useDeleteInventoryMutation();

  // Extract data
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const brands = brandData?.data || [];
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const categories = categoryData?.data || [];
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const products = productData?.data || [];
  const stores = storeData?.data || [];
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const stocks = stockData?.data || [];
  const inventories = inventoryData?.data || [];

  // Combined loading state
  const loading = isLoadingInventories || isCreating || isUpdating || isDeleting;

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear - i); // Last 10 years

  // Field configuration for the form
  const formFields: FieldConfig[] = useMemo(() => [
    {
      name: "attachment",
      label: t("crud.inventory.form.attachment.label"),
      type: "file",
      colSpan: 1,
      accept: "image/*"
    },
    {
      name: "th",
      label: t("crud.inventory.form.th.label"),
      type: "text",
      required: true,
      placeholder: t("crud.inventory.form.th.placeholder"),
      colSpan: 1,
      errorMessage: `${t("common.required_field")} ${t("crud.inventory.form.th.label")}`
    },
    {
      name: "en",
      label: t("crud.inventory.form.en.label"),
      type: "text",
      required: true,
      placeholder: t("crud.inventory.form.en.placeholder"),
      colSpan: 1,
      errorMessage: `${t("common.required_field")} ${t("crud.inventory.form.en.label")}`
    },
    {
      name: "categoryId",
      label: t("crud.inventory.form.categoryId.label"),
      type: "customizable-select",
      required: true,
      placeholder: t("crud.inventory.form.categoryId.placeholder"),
      colSpan: 1,
      options: categories.map(c => ({
        value: c.categoryId,
        label: language === "th" ? c.th : c.en
      })),
      errorMessage: `${t("common.required_field")} ${t("crud.inventory.form.categoryId.label")}`
    },
    {
      name: "brandId",
      label: t("crud.inventory.form.brandId.label"),
      type: "customizable-select",
      required: true,
      placeholder: t("crud.inventory.form.brandId.placeholder"),
      colSpan: 1,
      options: brands.map(b => ({
        value: b.brandId,
        label: language === "th" ? b.th : b.en
      })),
      errorMessage: `${t("common.required_field")} ${t("crud.inventory.form.brandId.label")}`
    },
    {
      name: "mfd",
      label: t("crud.inventory.form.mfd.label"),
      type: "select",
      required: true,
      placeholder: t("crud.inventory.form.mfd.placeholder"),
      colSpan: 1,
      options: years.map(y => ({
        value: y.toString(),
        label: y.toString()
      })),
      errorMessage: `${t("common.required_field")} ${t("crud.inventory.form.mfd.label")}`
    },
    {
      name: "warranty",
      label: t("crud.inventory.form.warranty.label"),
      type: "number",
      required: true,
      placeholder: t("crud.inventory.form.warranty.placeholder"),
      colSpan: 1,
      errorMessage: `${t("common.required_field")} ${t("crud.inventory.form.warranty.label")}`
    },
    {
      name: "price",
      label: t("crud.inventory.form.price.label"),
      type: "number",
      required: true,
      placeholder: t("crud.inventory.form.price.placeholder"),
      colSpan: 1,
      errorMessage: `${t("common.required_field")} ${t("crud.inventory.form.price.label")}`
    },
    {
      name: "productId",
      label: t("crud.inventory.form.productId.label"),
      type: "customizable-select",
      required: false,
      placeholder: t("crud.inventory.form.productId.placeholder"),
      colSpan: 1,
      options: products.map(p => ({
        value: p.productId,
        label: language === "th" ? p.th : p.en
      }))
    }
  ], [brands, categories, products, language, years, t]);

  const handleStock = useCallback((inventory: Inventory) => {
    setSelectedInventory(inventory);
    setShowStock(true);
  }, []);

  // Column configuration for table/list view
  const columns: Column<Inventory>[] = useMemo(() => [
    {
      key: "name",
      label: t("crud.inventory.list.header.name"),
      sortable: true,
      width: "min-w-64",
      align: "left",
      colSpan: 2,
      render: inventory => (
        <ItemList
          item={inventory as unknown as Record<string, React.ReactNode>}
          language={language}
        />
      ),
    },
    {
      key: "stock",
      label: t("crud.inventory.list.header.stock"),
      sortable: false,
      width: "w-32",
      align: "left",
      colSpan: 1,
      render: inventory => {
        if (permissions.hasPermission("sparepart_stock.view")) {
          const stock = stocks.find(s => s.part.partId === inventory.partId);
          const stockStatus = getStockStatus(stock?.quantity as number);
          return (
            <div className="flex item-center gap-2">
              <Badge className="mb-0 w-fit" color={stockStatus.variant as BadgeColor}>
                {stockStatus.label} ({formatNumberWithComma(stock?.quantity || 0)})
              </Badge>
              <button
                className="p-0 text-blue-500 hover:text-blue-700"
                onClick={() => handleStock(inventory)}
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
      label: t("crud.inventory.list.header.brandId"),
      sortable: false,
      width: "w-32",
      align: "left",
      colSpan: 1,
      render: inventory => {
        const brand = brands.find(b => b.brandId === inventory.brandId);
        return brand ? (language === "th" ? brand.th : brand.en) : "-";
      }
    },
    {
      key: "categoryId",
      label: t("crud.inventory.list.header.categoryId"),
      sortable: false,
      width: "w-32",
      align: "left",
      colSpan: 1,
      render: inventory => {
        const category = categories.find(c => c.categoryId === inventory.categoryId);
        return category ? (language === "th" ? category.th : category.en) : "-";
      }
    },
    {
      key: "mfd",
      label: t("crud.inventory.list.header.mfd"),
      sortable: true,
      width: "w-32",
      align: "right",
      colSpan: 1
    },
    {
      key: "price",
      label: t("crud.inventory.list.header.price"),
      sortable: true,
      width: "w-32",
      align: "right",
      colSpan: 1,
      render: inventory => formatPrice(inventory.price)
    },
    {
      key: "warranty",
      label: t("crud.inventory.list.header.warranty"),
      sortable: true,
      width: "w-32",
      align: "right",
      colSpan: 1,
      render: inventory => {
        return inventory.warranty ? <Badge className="mb-0 w-fit" color="success">{convertDaysToMonths(inventory.warranty)}</Badge> : "";
      }
    },
    {
      key: "productId",
      label: t("crud.inventory.list.header.productId"),
      sortable: false,
      width: "min-w-64",
      align: "left",
      colSpan: 1,
      render: inventory => {
        const product = products.find(p => p.productId === inventory.productId);
        return product ? (language === "th" ? product.th : product.en) : "-";
      }
    }
  ], [
    brands,
    categories,
    products,
    stocks,
    language,
    permissions,
    handleStock,
    t
  ]);

  const filters: ViewFilterConfig[] = [
    {
      key: "brandId",
      label: t("crud.inventory.form.brandId.label"),
      type: "select",
      placeholder: t("crud.inventory.form.brandId.placeholder"),
      options: brands.map(b => ({
        value: b.brandId,
        label: language === "th" ? b.th : b.en
      }))
    },
    {
      key: "categoryId",
      label: t("crud.inventory.form.categoryId.label"),
      type: "select",
      placeholder: t("crud.inventory.form.categoryId.placeholder"),
      options: categories.map(c => ({
        value: c.categoryId,
        label: language === "th" ? c.th : c.en
      }))
    },
    {
      key: "productId",
      label: t("crud.inventory.form.productId.label"),
      type: "select",
      placeholder: t("crud.inventory.form.productId.placeholder"),
      options: products.map(p => ({
        value: p.productId,
        label: language === "th" ? p.th : p.en
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
        productId: String(formData.productId),
        th: String(formData.th),
        warranty: Number(formData.warranty)
      }
      
      // Append file if exists
      if (formData.file && formData.file instanceof File && formData.file.size > 0) {
        // data.append("file", formData.file);
      }

      let response;
      
      if (editingInventory) {
        // Update existing inventory
        response = await updateInventory({ 
          partId: editingInventory.partId, 
          data: data 
        }).unwrap();
        
        if (response?.status) {
          addToast("success", response?.message || response?.desc || response?.msg || t("crud.common.form.action.update.success").replace("_ENTITY_", t("crud.inventory.name")));
          setShowForm(false);
          setEditingInventory(null);
          refetchInventories();
        }
        else {
          addToast("error", response?.message || response?.desc || response?.msg || t("crud.common.form.action.update.error").replace("_ENTITY_", t("crud.inventory.name")));
        }
      }
      else {
        // Create new inventory
        response = await createInventory(data).unwrap();
        
        if (response?.status) {
          addToast("success", response?.message || response?.desc || response?.msg || t("crud.common.form.action.create.success").replace("_ENTITY_", t("crud.inventory.name")));
          setShowForm(false);
          refetchInventories();
        }
        else {
          addToast("error", response?.message || response?.desc || response?.msg || t("crud.common.form.action.create.error").replace("_ENTITY_", t("crud.inventory.name")));
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

  // Handle inventory deletion
  const handleDelete = async (inventory: Inventory) => {
    try {
      const response = await deleteInventory(inventory.partId).unwrap();
      
      if (response?.status) {
        addToast("success", response?.message || response?.desc || response?.msg || t("crud.common.form.action.delete.success").replace("_ENTITY_", t("crud.inventory.name")));
        refetchInventories();
      }
      else {
        addToast("error", response?.message || response?.desc || response?.msg || t("crud.common.form.action.delete.error").replace("_ENTITY_", t("crud.inventory.name")));
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
  const handleEdit = (inventory: Inventory) => {
    // Format the inventory data for the form
    const formattedInventory = {
      ...inventory,
      file: new File([], "") // Empty file for edit mode
    };
    
    // setEditingInventory(inventory);
    setEditingInventory(formattedInventory as unknown as Inventory);
    setShowForm(true);
  };

  // Custom grid card renderer
  const renderGridCard = (inventory: Inventory, actions: React.ReactNode) => {
    const item = {
      ...inventory
    };

    return (
      <ItemCard
        actions={actions}
        brands={brands}
        categories={categories}
        item={item as unknown as Record<string, React.ReactNode>}
        language={language}
        parentKey="productId"
        parents={products as unknown as Record<string, React.ReactNode>[]}
        onPreview={(url, alt) => setImagePreview({ url, alt })}
      />
    );
  };

  return (
    <>
      <View
        columns={columns}
        createLabel={t("crud.common.create").replace("_ENTITY_", t("navigation.super_app.topbar.more.menu.product.sub_menu.inventory"))}
        data={inventories}
        filtered={inventoryData?.totalFiltered as number || 0}
        filters={filters}
        gridCardRender={renderGridCard}
        initialQuery={initialQuery as unknown as Record<string, unknown>}
        loading={loading}
        permissionModule="sparepart"
        query={query as unknown as Record<string, unknown>}
        // searchFields={["th", "en"]}
        title={t("navigation.super_app.topbar.more.menu.product.sub_menu.inventory")}
        total={inventoryData?.totalRecords as number || inventories?.length || 0}
        getItemImage={inventory => ({
          url: inventory.attachment?.attUrl || "/images/crm/placeholder.svg",
          alt: inventory.attachment?.attName || (language === "th" ? inventory.th : inventory.en)
        })}
        onAdd={() => {
          setEditingInventory(null);
          setShowForm(true);
        }}
        onDelete={handleDelete}
        onEdit={handleEdit}
        onQueryChange={newQuery => setQuery(newQuery as unknown as InventoryQueryParams)}
        onView={(
          // inventory
        ) => {
          // View is handled by the DetailModal in View
          // You can add custom view logic here if needed
        }}
      />

      {showStock && selectedInventory && (
        <StockModal
          header={t("navigation.super_app.topbar.more.menu.product.sub_menu.inventory_stock")}
          item={selectedInventory}
          open={showStock}
          stores={stores}
          type="inventory"
          onClose={() => setShowStock(false)}
        />
      )}

      {/* Form Modal */}
      <Form
        cancelLabel={t("crud.common.form.action.cancel")}
        customFieldGroup={["en", "th", "categoryId"]}
        fields={formFields}
        initialValues={(editingInventory as unknown as Record<string, unknown>) || {
          active: true,
          brandId: "",
          categoryId: "",
          en: "",
          image: "",
          mfd: 0,
          price: 0,
          productId: "",
          th: "",
          warranty: 0
        }}
        loading={loading}
        open={showForm}
        submitLabel={`${(editingInventory
          ? t("common.update_entity")
          : t("crud.common.create")
        ).replace("_ENTITY_", t("navigation.super_app.topbar.more.menu.product.sub_menu.inventory"))}`}
        title={`${(editingInventory
          ? t("common.edit_entity")
          : t("crud.common.create")
        ).replace("_ENTITY_", t("navigation.super_app.topbar.more.menu.product.sub_menu.inventory"))}`}
        uploadPath="sparepart"
        onCancel={() => {
          setShowForm(false);
          setEditingInventory(null);
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

export default InventoryView;
