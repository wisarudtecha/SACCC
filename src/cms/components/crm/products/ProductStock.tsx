// src/cms/components/crm/products/ProductStock.tsx
"use client"

import { useState, useMemo } from "react";
import { ToastContainer } from "@/core/components/crud/ToastContainer";
import { useToast } from "@/core/hooks/useToast";
import { useTranslation } from "@/core/hooks/useTranslation";
import { useReadProductQuery } from "@/cms/store/api/productApi";
import { useReadProductSerialNumberQuery, useCreateProductStockMutation, useUpdateProductStockMutation, useDeleteProductStockMutation } from "@/cms/store/api/productStockApi";
import { useReadStoreQuery } from "@/cms/store/api/storeApi";
import { formatDateTime } from "@/cms/utils/productHelper";
import type { Column, FieldConfig, ViewFilterConfig } from "@/cms/types/product";
import type { ProductSerialNumber, ProductStockCreateData, ProductStockQueryParams, ProductStockUpdateData } from "@/cms/types/productStock";
import Form from "@/cms/components/crm/Form";
import View from "@/cms/components/crm/View";

const ProductStock = () => {
  const { language, t } = useTranslation();
  const { toasts, addToast, removeToast } = useToast();
  
  // State management
  const [showForm, setShowForm] = useState(false);
  const [editingProductStock, setEditingProductStock] = useState<{
    productId: string,
    serialNumber: string,
    storeId: string,
    registerDate: string,
    mfw: string
  } | null>(null);

  // API hooks
  const { data: productData } = useReadProductQuery({ 
    start: 0, 
    length: 1000
  });

  const { data: storeData } = useReadStoreQuery({ 
    start: 0, 
    length: 1000
  });

  const initialQuery: ProductStockQueryParams = {
    start: 0,
    length: 10,
    storeId: undefined,
    productId: undefined,
    createdBy: undefined,
    active: undefined,
    isBought: undefined,
    orderBy: undefined,
    direction: undefined,
    statusId: undefined
  };

  const [query, setQuery] = useState<ProductStockQueryParams>(initialQuery);

  // const [query, setQuery] = useState<ProductStockQueryParams>({
  //   start: 0,
  //   length: 10,
  //   storeId: "",
  //   productId: "",
  //   createdBy: "",
  //   active: undefined,
  //   isBought: undefined,
  //   orderBy: "",
  //   direction: "",
  //   statusId: ""
  // });
  
  const { data: productStockData, isLoading: isLoadingProductStock, refetch: refetchProductStock } = useReadProductSerialNumberQuery(query);
  
  const [createProductStock, { isLoading: isCreating }] = useCreateProductStockMutation();
  const [updateProductStock, { isLoading: isUpdating }] = useUpdateProductStockMutation();
  const [deleteProductStock, { isLoading: isDeleting }] = useDeleteProductStockMutation();

  // Extract data
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const products = productData?.data || [];
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const stores = storeData?.data || [];
  const productStock = productStockData?.data || [];

  // Combined loading state
  const loading = isLoadingProductStock || isCreating || isUpdating || isDeleting;

  // Field configuration for the form
  const formFields: FieldConfig[] = useMemo(() => [
    {
      name: "serialNumber",
      label: t("crud.product_stock.form.serialNumber.label"),
      type: "text",
      required: true,
      placeholder: t("crud.product_stock.form.serialNumber.placeholder"),
      colSpan: 2,
      errorMessage: `${t("common.required_field")} ${t("crud.product_stock.form.serialNumber.label")}`
    },
    {
      name: "productId",
      label: t("crud.product_stock.form.productId.label"),
      type: "customizable-select",
      required: true,
      placeholder: t("crud.product_stock.form.productId.placeholder"),
      colSpan: 1,
      options: products?.map(p => ({
        value: p?.productId,
        label: language === "th" ? p?.th : p?.en
      })),
      errorMessage: `${t("common.required_field")} ${t("crud.product_stock.form.productId.label")}`
    },
    {
      name: "storeId",
      label: t("crud.product_stock.form.storeId.label"),
      type: "customizable-select",
      required: true,
      placeholder: t("crud.product_stock.form.storeId.placeholder"),
      colSpan: 1,
      options: stores?.map(s => ({
        value: s?.storeId,
        label: language === "th" ? s?.th : s?.en
      })),
      errorMessage: `${t("common.required_field")} ${t("crud.product_stock.form.storeId.label")}`
    },
    {
      name: "registerDate",
      label: t("crud.product_stock.form.registerDate.label"),
      type: "datetime-local",
      required: true,
      colSpan: 1,
      errorMessage: `${t("common.required_field")} ${t("crud.product_stock.form.registerDate.label")}`
    },
    {
      name: "mfw",
      label: t("crud.product_stock.form.mfw.label"),
      type: "datetime-local",
      required: false,
      colSpan: 1
    }
  ], [
    language,
    products,
    stores,
    t
  ]);

  // Column configuration for table/list view
  const columns: Column<ProductSerialNumber>[] = useMemo(() => [
    {
      key: "serialNumber",
      label: t("crud.product_stock.list.header.serialNumber"),
      sortable: true,
      width: "w-32",
      align: "left",
      colSpan: 1
    },
    {
      key: "productId",
      label: t("crud.product_stock.list.header.productId"),
      sortable: false,
      width: "w-32",
      align: "left",
      colSpan: 1,
      render: productStock => {
        const product = products?.find(p => p?.productId === productStock?.product?.productId);
        return product ? (language === "th" ? product?.th : product?.en) : "-";
      }
    },
    {
      key: "registerDate",
      label: t("crud.product_stock.list.header.registerDate"),
      sortable: true,
      width: "w-32",
      align: "center",
      colSpan: 1,
      render: productStock => formatDateTime(productStock?.registerDate as string)
    },
    {
      key: "mfw",
      label: t("crud.product_stock.list.header.mfw"),
      sortable: true,
      width: "w-32",
      align: "center",
      colSpan: 1,
      render: productStock => formatDateTime(productStock?.mfw as string)
    },
    {
      key: "storeId",
      label: t("crud.product_stock.list.header.storeId"),
      sortable: false,
      width: "w-32",
      align: "left",
      colSpan: 1,
      render: productStock => {
        const store = stores?.find(s => s?.storeId === productStock?.store?.storeId);
        return store ? (language === "th" ? store?.th : store?.en) : "-";
      }
    },
    {
      key: "statusId",
      label: t("crud.product_stock.list.header.statusId"),
      sortable: false,
      width: "w-32",
      align: "left",
      colSpan: 1,
      render: productStock => {
        return productStock?.stockStatusMeta?.[language as keyof typeof productStock.stockStatusMeta] || productStock?.statusId || "-";
      }
    },
    {
      key: "purchaseDate",
      label: t("crud.product_stock.list.header.purchaseDate"),
      sortable: true,
      width: "w-32",
      align: "center",
      colSpan: 1,
      render: productStock => formatDateTime(productStock?.purchaseDate as string)
    },
    {
      key: "endWarrantyDate",
      label: t("crud.product_stock.list.header.endWarrantyDate"),
      sortable: true,
      width: "w-32",
      align: "center",
      colSpan: 1,
      render: productStock => formatDateTime(productStock?.endWarrantyDate as string)
    },
  ], [language, products, stores, t]);

  const filters: ViewFilterConfig[] = [
    {
      key: "productId",
      label: t("crud.product_stock.form.productId.label"),
      type: "select",
      placeholder: t("crud.product_stock.form.productId.placeholder"),
      options: products.map(p => ({
        value: p.productId,
        label: language === "th" ? p.th : p.en
      }))
    },
    {
      key: "storeId",
      label: t("crud.product_stock.form.storeId.label"),
      type: "select",
      placeholder: t("crud.product_stock.form.storeId.placeholder"),
      options: stores.map(s => ({
        value: s.storeId,
        label: language === "th" ? s.th : s.en
      }))
    }
  ];

  // Handle form submission (Create or Update)
  const handleSubmit = async (formData: Record<string, unknown>) => {
    try {
      // const registerDate = new Date(formData?.registerDate as string | number | Date);
      // const mfw = new Date(formData?.mfw as string | number | Date);

      // const data = {
      //   Item: [{
      //     // registerDate: String(registerDate.toISOString()),
      //     // mfw: String(mfw.toISOString()),
      //     serialNumber: String(formData?.serialNumber)
      //   }],
      //   active: typeof formData?.active === "boolean" ? formData?.active : true,
      //   productId: String(formData?.productId),
      //   // registerDate: String(registerDate.toISOString()),
      //   registerDate: String(formData?.registerDate),
      //   mfw: String(mfw.toISOString()),
      //   serialNumber: String(formData?.serialNumber),
      //   storeId: String(formData?.storeId)
      // }

      const data = {
        active: typeof formData?.active === "boolean" ? formData?.active : true,
        productId: String(formData?.productId),
        storeId: String(formData?.storeId),
        registerDate: String(new Date(formData?.registerDate as string | number | Date).toISOString()),
        mfw: String(new Date(formData?.mfw as string | number | Date).toISOString())
      }
      
      // Append file if exists
      if (formData?.file && formData?.file instanceof File && formData?.file?.size > 0) {
        // data.append("file", formData.file);
      }

      let response;
      
      if (editingProductStock) {
        // Update existing product stock
        const updateData = data as ProductStockUpdateData;

        response = await updateProductStock({
          productId: editingProductStock?.productId,
          serialNumber: editingProductStock?.serialNumber,
          data: updateData
        }).unwrap();

        if (response?.status && typeof response?.status === "string" && response?.status !== "-1") {
          addToast("success", response?.message || response?.desc || response?.msg || t("crud.common.form.action.update.success").replace("_ENTITY_", t("crud.product_stock.name")));
          setShowForm(false);
          setEditingProductStock(null);
          refetchProductStock();
        }
        else {
          addToast("error", response?.message || response?.desc || response?.msg || t("crud.common.form.action.update.error").replace("_ENTITY_", t("crud.product_stock.name")));
        }
      }
      else {
        // Create new product stock
        const createData = {
          ...data,
          Item: [{ serialNumber: String(formData?.serialNumber) }],
          // registerDate: String(formData?.registerDate),
          // registerDate: String(new Date(formData?.registerDate as string | number | Date).toISOString()),
          // mfw: String(new Date(formData?.mfw as string | number | Date).toISOString())
        } as ProductStockCreateData;
        
        response = await createProductStock(createData).unwrap();

        if (response?.status && typeof response?.status === "string" && response?.status !== "-1") {
          addToast("success", response?.message || response?.desc || response?.msg || t("crud.common.form.action.create.success").replace("_ENTITY_", t("crud.product_stock.name")));
          setShowForm(false);
          refetchProductStock();
        }
        else {
          addToast("error", response?.message || response?.desc || response?.msg || t("crud.common.form.action.create.error").replace("_ENTITY_", t("crud.product_stock.name")));
        }
      }
    }
    catch (error: unknown) {
      console.error("Submit error:", error);
      addToast("error", (error as { data?: { message?: string } })?.data?.message
        || (error as { data?: { desc?: string } })?.data?.desc
        || (error as { data?: { msg?: string } })?.data?.msg
        || `Operation failed: ${error instanceof Error ? error?.message : String(error)}`);
    }
  };

  // Handle product deletion
  const handleDelete = async (productStock: ProductSerialNumber) => {
    try {
      const response = await deleteProductStock({ productId: productStock?.product?.productId, serialNumber: productStock?.serialNumber }).unwrap();
      
      if (response?.status) {
        addToast("success", response?.message || response?.desc || response?.msg || t("crud.common.form.action.delete.success").replace("_ENTITY_", t("crud.product_stock.name")));
        refetchProductStock();
      }
      else {
        addToast("error", response?.message || response?.desc || response?.msg || t("crud.common.form.action.delete.error").replace("_ENTITY_", t("crud.product_stock.name")));
      }
    }
    catch (error: unknown) {
      console.error("Delete error:", error);
      addToast("error", (error as { data?: { message?: string } })?.data?.message
        || (error as { data?: { desc?: string } })?.data?.desc
        || (error as { data?: { msg?: string } })?.data?.msg
        || `Delete failed: ${error instanceof Error ? error?.message : String(error)}`);
    }
  };

  // Handle edit action
  const handleEdit = (productStock: ProductSerialNumber) => {
    // Format the product data for the form
    const formattedProduct = {
      ...productStock
    };
    
    setEditingProductStock({
      productId: formattedProduct?.product?.productId,
      serialNumber: formattedProduct?.serialNumber,
      storeId: formattedProduct?.store?.storeId,
      registerDate: formattedProduct?.registerDate,
      mfw: formattedProduct?.mfw
    });
    setShowForm(true);
  };

  return (
    <>
      <View
        columns={columns}
        createLabel={t("crud.common.create").replace("_ENTITY_", t("navigation.super_app.topbar.more.menu.product.sub_menu.product_stock"))}
        data={productStock}
        filtered={productStockData?.totalFiltered as number || 0}
        filters={filters}
        initialQuery={initialQuery as unknown as Record<string, unknown>}
        loading={loading}
        permissionModule="product_stock"
        query={query as unknown as Record<string, unknown>}
        // searchFields={["serialNumber"]}
        title={t("navigation.super_app.topbar.more.menu.product.sub_menu.product_stock")}
        total={productStockData?.totalRecords as number || productStock?.length || 0}
        onAdd={() => {
          setEditingProductStock(null);
          setShowForm(true);
        }}
        onDelete={handleDelete}
        onEdit={handleEdit}
        onQueryChange={newQuery => setQuery(newQuery as unknown as ProductStockQueryParams)}
        onView={(
          // productStock
        ) => {
          // View is handled by the DetailModal in View
          // You can add custom view logic here if needed
        }}
      />

      {/* Form Modal */}
      <Form
        cancelLabel={t("crud.common.form.action.cancel")}
        fields={formFields}
        initialValues={(editingProductStock as unknown as Record<string, unknown>) || {
          Item: [{
            serialNumber: ""
          }],
          active: true,
          productId: "",
          registerDate: "",
          mfw: "",
          serialNumber: "",
          storeId: ""
        }}
        loading={loading}
        open={showForm}
        submitLabel={`${(editingProductStock
          ? t("common.update_entity")
          : t("crud.common.create")
        ).replace("_ENTITY_", t("navigation.super_app.topbar.more.menu.product.sub_menu.product_stock"))}`}
        title={`${(editingProductStock
          ? t("common.edit_entity")
          : t("crud.common.create")
        ).replace("_ENTITY_", t("navigation.super_app.topbar.more.menu.product.sub_menu.product_stock"))}`}
        onCancel={() => {
          setShowForm(false);
          setEditingProductStock(null);
        }}
        onSubmit={handleSubmit}
      />

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </>
  );
};

export default ProductStock;
