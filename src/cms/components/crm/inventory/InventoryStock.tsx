// src/cms/components/crm/inventories/InventoryStock.tsx
"use client"

import { useState, useMemo } from "react";
import { ToastContainer } from "@/core/components/crud/ToastContainer";
import { useToast } from "@/core/hooks/useToast";
import { useTranslation } from "@/core/hooks/useTranslation";
import { useReadInventoryQuery } from "@/cms/store/api/inventoryApi";
import { useReadInventorySerialNumberQuery, useCreateInventoryStockMutation, useUpdateInventoryStockMutation, useDeleteInventoryStockMutation } from "@/cms/store/api/inventoryStockApi";
import { useReadStoreQuery } from "@/cms/store/api/storeApi";
import type { Column, FieldConfig, ViewFilterConfig } from "@/cms/types/product";
import type { InventorySerialNumber, InventoryStockCreateData, InventoryStockQueryParams, InventoryStockUpdateData } from "@/cms/types/inventoryStock";
import Form from "@/cms/components/crm/Form";
import View from "@/cms/components/crm/View";

const InventoryStock = () => {
  const { language, t } = useTranslation();
  const { toasts, addToast, removeToast } = useToast();
  
  // State management
  const [showForm, setShowForm] = useState(false);
  const [editingInventoryStock, setEditingInventoryStock] = useState<{ partId: string, serialNumber: string, storeId: string } | null>(null);

  // API hooks
  const { data: inventoryData } = useReadInventoryQuery({ 
    start: 0, 
    length: 1000
  });

  const { data: storeData } = useReadStoreQuery({ 
    start: 0, 
    length: 1000
  });

  const initialQuery: InventoryStockQueryParams = {
    start: 0,
    length: 10,
    storeId: undefined,
    partId: undefined,
    createdBy: undefined,
    active: undefined,
    orderBy: undefined,
    direction: undefined,
    statusId: undefined
  };

  const [query, setQuery] = useState<InventoryStockQueryParams>(initialQuery);

  // const [query, setQuery] = useState<InventoryStockQueryParams>({
  //   start: 0,
  //   length: 10,
  //   storeId: "",
  //   partId: "",
  //   createdBy: "",
  //   active: undefined,
  //   orderBy: "",
  //   direction: "",
  //   statusId: ""
  // });
  
  const { data: inventoryStockData, isLoading: isLoadingInventoryStock, refetch: refetchInventoryStock } = useReadInventorySerialNumberQuery(query);
  
  const [createInventoryStock, { isLoading: isCreating }] = useCreateInventoryStockMutation();
  const [updateInventoryStock, { isLoading: isUpdating }] = useUpdateInventoryStockMutation();
  const [deleteInventoryStock, { isLoading: isDeleting }] = useDeleteInventoryStockMutation();

  // Extract data
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const inventories = inventoryData?.data || [];
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const stores = storeData?.data || [];
  const inventoryStock = inventoryStockData?.data || [];

  // Combined loading state
  const loading = isLoadingInventoryStock || isCreating || isUpdating || isDeleting;

  // Field configuration for the form
  const formFields: FieldConfig[] = useMemo(() => [
    {
      name: "serialNumber",
      label: t("crud.inventory_stock.form.serialNumber.label"),
      type: "text",
      required: true,
      placeholder: t("crud.inventory_stock.form.serialNumber.placeholder"),
      colSpan: 2,
      errorMessage: `${t("common.required_field")} ${t("crud.inventory_stock.form.serialNumber.label")}`
    },
    {
      name: "partId",
      label: t("crud.inventory_stock.form.partId.label"),
      type: "customizable-select",
      required: true,
      placeholder: t("crud.inventory_stock.form.partId.placeholder"),
      colSpan: 1,
      options: inventories?.map(p => ({
        value: p?.partId,
        label: language === "th" ? p?.th : p?.en
      })),
      errorMessage: `${t("common.required_field")} ${t("crud.inventory_stock.form.partId.label")}`
    },
    {
      name: "storeId",
      label: t("crud.inventory_stock.form.storeId.label"),
      type: "customizable-select",
      required: true,
      placeholder: t("crud.inventory_stock.form.storeId.placeholder"),
      colSpan: 1,
      options: stores?.map(s => ({
        value: s?.storeId,
        label: language === "th" ? s?.th : s?.en
      })),
      errorMessage: `${t("common.required_field")} ${t("crud.inventory_stock.form.storeId.label")}`
    }
  ], [
    language,
    inventories,
    stores,
    t
  ]);

  // Column configuration for table/list view
  const columns: Column<InventorySerialNumber>[] = useMemo(() => [
    {
      key: "serialNumber",
      label: t("crud.inventory_stock.list.header.serialNumber"),
      sortable: true,
      width: "w-32",
      align: "left",
      colSpan: 1
    },
    {
      key: "partId",
      label: t("crud.inventory_stock.list.header.partId"),
      sortable: false,
      width: "w-32",
      align: "left",
      colSpan: 1,
      render: inventoryStock => {
        const inventory = inventories?.find(p => p?.partId === inventoryStock?.part?.partId);
        return inventory ? (language === "th" ? inventory?.th : inventory?.en) : "-";
      }
    },
    {
      key: "storeId",
      label: t("crud.inventory_stock.list.header.storeId"),
      sortable: false,
      width: "w-32",
      align: "left",
      colSpan: 1,
      render: inventoryStock => {
        const store = stores?.find(s => s?.storeId === inventoryStock?.store?.storeId);
        return store ? (language === "th" ? store?.th : store?.en) : "-";
      }
    },
    {
      key: "statusId",
      label: t("crud.inventory_stock.list.header.statusId"),
      sortable: false,
      width: "w-32",
      align: "left",
      colSpan: 1,
      render: inventoryStock => {
        return inventoryStock?.stockStatusMeta?.[language as keyof typeof inventoryStock.stockStatusMeta] || inventoryStock?.statusId || "-";
      }
    }
  ], [language, inventories, stores, t]);

  const filters: ViewFilterConfig[] = [
    {
      key: "partId",
      label: t("crud.inventory_stock.form.partId.label"),
      type: "select",
      placeholder: t("crud.inventory_stock.form.partId.placeholder"),
      options: inventories.map(i => ({
        value: i.partId,
        label: language === "th" ? i.th : i.en
      }))
    },
    {
      key: "storeId",
      label: t("crud.inventory_stock.form.storeId.label"),
      type: "select",
      placeholder: t("crud.inventory_stock.form.storeId.placeholder"),
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
      //   active: typeof formData?.active === "boolean" ? formData?.active : true,
      //   partId: String(formData?.partId),
      //   // registerDate: String(registerDate.toISOString()),
      //   // mfw: String(mfw.toISOString()),
      //   serialNumber: String(formData?.serialNumber),
      //   storeId: String(formData?.storeId)
      // };

      const data = {
        partId: String(formData?.partId),
        storeId: String(formData?.storeId)
      };
      
      // Append file if exists
      if (formData?.file && formData?.file instanceof File && formData?.file?.size > 0) {
        // data.append("file", formData.file);
      }

      let response;
      
      if (editingInventoryStock) {
        // Update existing spare part stock
        const updateData = {
          ...data,
          active: typeof formData?.active === "boolean" ? formData?.active : true,
          serialNumber: String(formData?.serialNumber) || editingInventoryStock?.serialNumber
        } as InventoryStockUpdateData;

        response = await updateInventoryStock({ 
          partId: editingInventoryStock?.partId, 
          serialNumber: String(formData?.serialNumber) || editingInventoryStock?.serialNumber,
          data: updateData
        }).unwrap();
        
        if (response?.status) {
          addToast("success", response?.message || response?.desc || response?.msg || t("crud.common.form.action.update.success").replace("_ENTITY_", t("crud.inventory_stock.name")));
          setShowForm(false);
          setEditingInventoryStock(null);
          refetchInventoryStock();
        }
        else {
          addToast("error", response?.message || response?.desc || response?.msg || t("crud.common.form.action.update.error").replace("_ENTITY_", t("crud.inventory_stock.name")));
        }
      }
      else {
        // Create new spare part stock
        const createData = {
          ...data,
          serialNumber: [String(formData?.serialNumber)]
        } as InventoryStockCreateData;

        response = await createInventoryStock(createData).unwrap();
        
        if (response?.status) {
          addToast("success", response?.message || response?.desc || response?.msg || t("crud.common.form.action.create.success").replace("_ENTITY_", t("crud.inventory_stock.name")));
          setShowForm(false);
          refetchInventoryStock();
        }
        else {
          addToast("error", response?.message || response?.desc || response?.msg || t("crud.common.form.action.create.error").replace("_ENTITY_", t("crud.inventory_stock.name")));
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

  // Handle spare part deletion
  const handleDelete = async (inventoryStock: InventorySerialNumber) => {
    try {
      const response = await deleteInventoryStock({ partId: inventoryStock?.part?.partId, serialNumber: inventoryStock?.serialNumber }).unwrap();
      
      if (response?.status) {
        addToast("success", response?.message || response?.desc || response?.msg || t("crud.common.form.action.delete.success").replace("_ENTITY_", t("crud.inventory_stock.name")));
        refetchInventoryStock();
      }
      else {
        addToast("error", response?.message || response?.desc || response?.msg || t("crud.common.form.action.delete.error").replace("_ENTITY_", t("crud.inventory_stock.name")));
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
  const handleEdit = (inventoryStock: InventorySerialNumber) => {
    // Format the spare part data for the form
    const formattedSparePart = {
      ...inventoryStock
    };
    
    setEditingInventoryStock({ partId: formattedSparePart?.part?.partId, serialNumber: formattedSparePart?.serialNumber, storeId: formattedSparePart?.store?.storeId });
    setShowForm(true);
  };

  return (
    <>
      <View
        columns={columns}
        createLabel={t("crud.common.create").replace("_ENTITY_", t("navigation.super_app.topbar.more.menu.product.sub_menu.inventory_stock"))}
        data={inventoryStock}
        filtered={inventoryStockData?.totalFiltered as number || 0}
        filters={filters}
        initialQuery={initialQuery as unknown as Record<string, unknown>}
        loading={loading}
        permissionModule="sparepart_stock"
        query={query as unknown as Record<string, unknown>}
        // searchFields={["serialNumber"]}
        title={t("navigation.super_app.topbar.more.menu.product.sub_menu.inventory_stock")}
        total={inventoryStockData?.totalRecords as number || inventoryStock?.length || 0}
        onAdd={() => {
          setEditingInventoryStock(null);
          setShowForm(true);
        }}
        onDelete={handleDelete}
        onEdit={handleEdit}
        onQueryChange={newQuery => setQuery(newQuery as unknown as InventoryStockQueryParams)}
        onView={(
          // inventoryStock
        ) => {
          // View is handled by the DetailModal in View
          // You can add custom view logic here if needed
        }}
      />

      {/* Form Modal */}
      <Form
        cancelLabel={t("crud.common.form.action.cancel")}
        fields={formFields}
        initialValues={(editingInventoryStock as unknown as Record<string, unknown>) || {
          partId: "",
          serialNumber: [],
          storeId: ""
        }}
        loading={loading}
        open={showForm}
        submitLabel={`${(editingInventoryStock
          ? t("common.update_entity")
          : t("crud.common.create")
        ).replace("_ENTITY_", t("navigation.super_app.topbar.more.menu.product.sub_menu.inventory_stock"))}`}
        title={`${(editingInventoryStock
          ? t("common.edit_entity")
          : t("crud.common.create")
        ).replace("_ENTITY_", t("navigation.super_app.topbar.more.menu.product.sub_menu.inventory_stock"))}`}
        onCancel={() => {
          setShowForm(false);
          setEditingInventoryStock(null);
        }}
        onSubmit={handleSubmit}
      />

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </>
  );
};

export default InventoryStock;
