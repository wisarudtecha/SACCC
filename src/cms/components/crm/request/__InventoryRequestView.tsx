// src/cms/components/crm/request/InventoryRequestView.tsx
"use client"

import { useMemo, useState } from "react";
import { ToastContainer } from "@/core/components/crud/ToastContainer";
import { useToast } from "@/core/hooks/useToast";
import { useTranslation } from "@/core/hooks/useTranslation";
import {
  useCreateInventoryRequestMutation,
  insertRequestSparePart,
  // useDeleteInventoryRequestMutation,
  useReadInventoryRequestQuery,
  // useUpdateInventoryRequestMutation,
} from "@/cms/store/api/inventoryRequestApi";
// import { useReadInventoryStockQuery } from "@/cms/store/api/inventoryStockApi";
import { useReadInventoryQuery } from "@/cms/store/api/inventoryApi";
import { useReadStoreQuery } from "@/cms/store/api/storeApi";
import { formatDateTime } from "@/cms/utils/productHelper";
import { RequestRow, transformRequest } from "@/cms/utils/transformRequest";
// import type { Inventory } from "@/cms/types/inventory";
import type { InventoryRequest } from "@/cms/types/inventoryRequest";
import type { Column, FieldConfig } from "@/cms/types/product";
import Form from "@/cms/components/crm/Form";
import ImagePreviewModal from "@/cms/components/crm/ImagePreviewModal";
import View from "@/cms/components/crm/View";
// import InventoryRequestForm from "@/cms/components/crm/request/InventoryRequestForm";

const InventoryRequestView = () => {
  const { language } = useTranslation();
  const { toasts, addToast, removeToast } = useToast();

  // State management
  const [showForm, setShowForm] = useState(false);
  const [editingInventoryRequest, setEditingInventoryRequest] = useState<InventoryRequest | null>(null);
  const [imagePreview, setImagePreview] = useState<{ url: string; alt: string } | null>(null);

  // API hooks
  const { data: inventoryData } = useReadInventoryQuery({
    start: 0,
    length: 1000
  });

  const { data: storeData } = useReadStoreQuery({
    start: 0,
    length: 1000
  });

  // const { data: stockData } = useReadInventoryStockQuery({
  //   start: 0,
  //   length: 1000
  // });

  const { data: requestData, isLoading: isLoadingInventoriesRequest, refetch: refetchInventoriesRequest } = useReadInventoryRequestQuery({
    start: 0,
    length: 1000
  });

  const [createRequest, { isLoading: isCreating }] = useCreateInventoryRequestMutation();
  // const [updateRequest, { isLoading: isCreating }] = useUpdateInventoryRequestMutation();
  // const [deleteRequest, { isLoading: isCreating }] = useDeleteInventoryRequestMutation();

  // Extract data
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const inventories = inventoryData?.data || [];
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const stores = storeData?.data || [];
  // const stocks = stockData?.data || [];
  const rows = requestData?.data as InventoryRequest[] || [];
  const requests = transformRequest(rows) as RequestRow[];

  // Combined loading state
  const loading = isLoadingInventoriesRequest || isCreating;

  // Field configuration for the form
  const formFields: FieldConfig[] = useMemo(() => [
    {
      name: "partId",
      label: "Spare Parts",
      type: "select",
      required: true,
      placeholder: "Select spare part",
      colSpan: 1,
      options: inventories.map(i => ({
        value: i.partId,
        label: language === "th" ? i.th : i.en
      }))
    },
    {
      name: "storeId",
      label: "Store",
      type: "select",
      required: true,
      placeholder: "Select store",
      colSpan: 1,
      options: stores.map(s => ({
        value: s.storeId,
        label: language === "th" ? s.th : s.en
      }))
    },
    {
      name: "quantity",
      label: "Quantity",
      type: "input-group",
      required: true,
      placeholder: "e.g., 24",
      colSpan: 1
    }
  ], [
    inventories,
    stores,
    language,
    // editingInventoryRequest
  ]);

  // Column configuration for table/list view
  const columns: Column<RequestRow>[] = useMemo(() => [
    {
      key: "requestId",
      label: "Request ID",
      sortable: true,
      width: "min-w-64",
      align: "center",
      colSpan: 2
    },
    {
      key: "name",
      label: "Spare Parts",
      sortable: true,
      width: "min-w-64",
      align: "left",
      colSpan: 2,
      render: request => {
        return language === "th" ? request.partTh : request.partEn;
      }
      // render: request => {
      //   const inventory: Inventory | undefined = inventories.find(i => i.partId === request.partId);
      //   return (
      //     <div className="flex items-center gap-2">
      //       {inventory?.attachment?.attUrl && (
      //         <img
      //           src={inventory.attachment.attUrl}
      //           alt={inventory.attachment.attName}
      //           className="w-10 h-10 rounded object-cover"
      //         />
      //       )}
      //       <span className="font-medium">
      //         {language === "th" ? request.partTh : request.partEn}
      //       </span>
      //     </div>
      //   )
      // },
    },
    {
      key: "store",
      label: "Store",
      sortable: false,
      width: "min-w-64",
      align: "left",
      colSpan: 2,
      render: request => {
        return language === "th" && request.storeTh || request.storeEn;
      }
    },
    {
      key: "quantity",
      label: "Quantity",
      sortable: true,
      width: "min-w-64",
      align: "right",
      colSpan: 2
    },
    {
      key: "createAt",
      label: "Requested At",
      sortable: true,
      width: "w-32",
      align: "center",
      colSpan: 1,
      render: request => formatDateTime(String(request.createdAt))
    }
  ], [
    // inventories,
    // stores,
    language
  ]);

  // Handle form submission (Create or Update)
  const handleSubmit = async (formData: Record<string, unknown>) => {
    try {
      const profile = JSON.parse(localStorage.getItem("profile") ?? "{}");
      const data: insertRequestSparePart = {
        billTo: '',
        billAddr: '',
        requestBy: profile.username ?? '',
        shipTo: '',
        shipBy: '',
        shipAddr: '',
        requests: [{
          active: true,
          partId: String(formData.partId),
          productId: '',
          quantity: Number(formData.quantity || 0),
        }],
      };

      let response;

      if (editingInventoryRequest) {
        // Update existing inventory request
        // response = await updateRequest({ 
        //   partId: editingInventoryRequest.partId, 
        //   data: formData as unknown as InventoryRequestUpdateData 
        // }).unwrap();
        // if (response?.status) {
        //   addToast("success", "Spare part request updated successfully!");
        //   setShowForm(false);
        //   setEditingInventoryRequest(null);
        //   refetchInventoriesRequest();
        // }
        // else {
        //   addToast("error", response?.message || "Failed to update spare part request");
        // }
      }
      else {
        // Create new inventory request
        response = await createRequest(data).unwrap();

        if (response?.status) {
          addToast("success", "Spare parts requested successfully!");
          setShowForm(false);
          refetchInventoriesRequest();
        }
        else {
          addToast("error", response?.message || "Failed to request spare parts");
        }
      }
    }
    catch (error: unknown) {
      console.error("Submit error:", error);
      addToast("error", (error as { data?: { message?: string } })?.data?.message || `Operation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  // Handle inventory request deletion
  // const handleDelete = async (request: Inventory) => {
  //   try {
  //     const response = await deleteRequest(request.partId).unwrap();
  //     if (response?.status) {
  //       addToast("success", "Spare part request deleted successfully!");
  //       refetchInventoriesRequest();
  //     }
  //     else {
  //       addToast("error", response?.message || "Failed to delete spare part request");
  //     }
  //   }
  //   catch (error: unknown) {
  //     console.error("Delete error:", error);
  //     addToast("error", (error as { data?: { message?: string } })?.data?.message || `Delete failed: ${error instanceof Error ? error.message : String(error)}`);
  //   }
  // };

  // Handle edit action
  // const handleEdit = (request: Inventory) => {
  //   // Format the inventory request data for the form
  //   const formattedInventoryRequest = {
  //     ...request
  //   };
  //   setEditingInventoryRequest(formattedInventoryRequest as unknown as InventoryRequest);
  //   setShowForm(true);
  // };

  return (
    <>
      <View
        title="Request Spare Parts"
        data={requests}
        searchFields={["requestId"]}
        columns={columns}
        loading={loading}

        // CRUD Actions
        onAdd={() => {
          setEditingInventoryRequest(null);
          setShowForm(true);
        }}
        // onEdit={handleEdit}
        // onDelete={handleDelete}
        onView={(
          // request
        ) => {
          // View is handled by the DetailModal in View
          // You can add custom view logic here if needed
        }}

        // Image handling
        getItemImage={request => {
          const inventory = inventories.find(i => i.partId === request.partId);
          return ({
            url: inventory?.attachment?.attUrl || "/images/crm/placeholder.svg",
            alt: inventory?.attachment?.attName || (language === "th" ? inventory?.th : inventory?.en) || ""
          })
        }}

        createLabel="Request New"
      />

      {/* Form Modal */}
      {showForm && (
        <Form
          title={editingInventoryRequest ? "Edit Request Spare Part" : "New Request Spare Part"}
          fields={formFields}
          initialValues={(editingInventoryRequest as unknown as Record<string, unknown>) || {
            active: true,
            partId: "",
            quantity: 0,
            statusId: "",
            storeId: ""
          }}
          onSubmit={handleSubmit}
          onCancel={() => {
            setShowForm(false);
            setEditingInventoryRequest(null);
          }}
          loading={loading}
          submitLabel={editingInventoryRequest ? "Update" : "Create"}
          cancelLabel="Cancel"
          open={showForm}
        />
      )}

      {/* Standalone Image Preview Modal for grid cards */}
      {imagePreview && (
        <ImagePreviewModal
          url={imagePreview.url}
          alt={imagePreview.alt}
          open={!!imagePreview}
          onClose={() => setImagePreview(null)}
        />
      )}

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </>
  );
}

export default InventoryRequestView;
