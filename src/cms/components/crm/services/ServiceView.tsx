// src/cms/components/crm/services/ServiceView.tsx
"use client"

import { useState, useMemo } from "react";
import { ToastContainer } from "@/core/components/crud/ToastContainer";
import { useToast } from "@/core/hooks/useToast";
import { useTranslation } from "@/core/hooks/useTranslation";
import { useDeleteServiceTypeMutation, useGetServiceTypeQuery, useInsertServiceTypeMutation, useUpdateServiceTypeMutation } from "@/cms/store/api/serviceType";
import type { PaginationParams } from "@/cms/types/dispatch";
import type { Column, FieldConfig, ViewFilterConfig } from "@/cms/types/product";
import type { ServiceInsert, ServiceType, ServiceUpdate } from "@/cms/types/serviceType";
import Form from "@/cms/components/crm/Form";
import ImagePreviewModal from "@/cms/components/crm/ImagePreviewModal";
import ItemCard from "@/cms/components/crm/ItemCard";
import ItemList from "@/cms/components/crm/ItemList";
import View from "@/cms/components/crm/View";

interface ServiceQueryParams extends PaginationParams {
  orderBy: string;
  direction: string;
}

const ServiceView = () => {
  const { language, t } = useTranslation();
  const { toasts, addToast, removeToast } = useToast();
  
  // State management
  const [showForm, setShowForm] = useState(false);
  const [editingService, setEditingService] = useState<ServiceType | null>(null);
  const [imagePreview, setImagePreview] = useState<{ url: string; alt: string } | null>(null);

  // API hooks
  const initialQuery: ServiceQueryParams = {
    start: 0,
    length: 10,
    orderBy: "",
    direction: ""
  };

  const [query, setQuery] = useState<ServiceQueryParams>(initialQuery);

  // const [query, setQuery] = useState<ServiceQueryParams>({
  //   start: 0,
  //   length: 10,
  //   orderBy: "",
  //   direction: ""
  // });

  const { data: serviceData, isLoading: isLoadingServices, refetch: refetchServices } = useGetServiceTypeQuery(query);
  
  const [createService, { isLoading: isCreating }] = useInsertServiceTypeMutation();
  const [updateService, { isLoading: isUpdating }] = useUpdateServiceTypeMutation();
  const [deleteService, { isLoading: isDeleting }] = useDeleteServiceTypeMutation();

  // Extract data
  const services = serviceData?.data || [];

  // Combined loading state
  const loading = isLoadingServices || isCreating || isUpdating || isDeleting;

  // Field configuration for the form
  const formFields: FieldConfig[] = useMemo(() => [
    // {
    //   name: "attachment",
    //   label: t("crud.product_service.form.attachment.label"),
    //   type: "file",
    //   colSpan: 1,
    //   accept: "image/*"
    // },
    {
      name: "th",
      label: t("crud.product_service.form.th.label"),
      type: "text",
      required: true,
      placeholder: t("crud.product_service.form.th.placeholder"),
      colSpan: 1,
      errorMessage: `${t("common.required_field")} ${t("crud.product_service.form.th.label")}`
    },
    {
      name: "en",
      label: t("crud.product_service.form.en.label"),
      type: "text",
      required: true,
      placeholder: t("crud.product_service.form.en.placeholder"),
      colSpan: 1,
      errorMessage: `${t("common.required_field")} ${t("crud.product_service.form.en.label")}`
    },
    {
      name: "priority",
      label: t("crud.product_service.form.priority.label"),
      type: "number",
      required: true,
      placeholder: t("crud.product_service.form.priority.placeholder"),
      colSpan: 2,
      errorMessage: `${t("common.required_field")} ${t("crud.product_service.form.priority.label")}`
    }
  ], [t]);

  // Column configuration for table/list view
  const columns: Column<ServiceType>[] = useMemo(() => [
    {
      key: "name",
      label: t("crud.product_service.list.header.name"),
      sortable: true,
      width: "min-w-64",
      align: "left",
      colSpan: 2,
      render: service => (
        <ItemList
          item={service as unknown as Record<string, React.ReactNode>}
          language={language}
        />
      )
    },
    {
      key: "price",
      label: t("crud.product_service.list.header.price"),
      sortable: true,
      width: "w-32",
      align: "right",
      colSpan: 1
    },
    {
      key: "priority",
      label: t("crud.product_service.list.header.priority"),
      sortable: true,
      width: "w-32",
      align: "right",
      colSpan: 1
    }
  ], [language, t]);

  const filters: ViewFilterConfig[] = [];

  // Handle form submission (Create or Update)
  const handleSubmit = async (formData: Record<string, unknown>) => {
    try {
      const data = {
        active: typeof formData.active === "boolean" ? formData.active : true,
        en: String(formData.en),
        price: Number(formData.price),
        th: String(formData.th)
      }
      
      // Append file if exists
      if (formData.file && formData.file instanceof File && formData.file.size > 0) {
        // data.append("file", formData.file);
      }

      let response;
      
      if (editingService) {
        // Update existing service
        response = await updateService({ 
          ...(formData as unknown as ServiceUpdate),
          serviceId: editingService.serviceId, 
        }).unwrap();
        
        if (response?.status) {
          addToast("success", response?.message || t("crud.common.form.action.update.success").replace("_ENTITY_", t("crud.product_service.name")));
          setShowForm(false);
          setEditingService(null);
          refetchServices();
        }
        else {
          addToast("error", response?.message || t("crud.common.form.action.update.error").replace("_ENTITY_", t("crud.product_service.name")));
        }
      }
      else {
        // Create new service
        response = await createService(data as unknown as ServiceInsert).unwrap();
        
        if (response?.status) {
          addToast("success", response?.message || t("crud.common.form.action.create.success").replace("_ENTITY_", t("crud.product_service.name")));
          setShowForm(false);
          refetchServices();
        }
        else {
          addToast("error", response?.message || t("crud.common.form.action.create.error").replace("_ENTITY_", t("crud.product_service.name")));
        }
      }
    }
    catch (error: unknown) {
      console.error("Submit error:", error);
      addToast("error", (error as { data?: { message?: string } })?.data?.message || `Operation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  // Handle service deletion
  const handleDelete = async (service: ServiceType) => {
    try {
      const response = await deleteService({ serviceId: service.serviceId }).unwrap();
      
      if (response?.status) {
        addToast("success", response?.message || t("crud.common.form.action.delete.success").replace("_ENTITY_", t("crud.product_service.name")));
        refetchServices();
      }
      else {
        addToast("error", response?.message || t("crud.common.form.action.delete.error").replace("_ENTITY_", t("crud.product_service.name")));
      }
    }
    catch (error: unknown) {
      console.error("Delete error:", error);
      addToast("error", (error as { data?: { message?: string } })?.data?.message || `Delete failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  // Handle edit action
  const handleEdit = (service: ServiceType) => {
    // Format the service data for the form
    const formattedService = {
      ...service,
      file: new File([], "") // Empty file for edit mode
    };
    
    setEditingService(service);
    setEditingService(formattedService as unknown as ServiceType);
    setShowForm(true);
  };

  // Custom grid card renderer
  const renderGridCard = (service: ServiceType, actions: React.ReactNode) => {
    const item = {
      ...service
    };

    return (
      <ItemCard
        actions={actions}
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
        createLabel={t("crud.common.create").replace("_ENTITY_", t("navigation.super_app.topbar.more.menu.package_service.sub_menu.service"))}
        data={services}
        filtered={serviceData?.totalFiltered as number || services?.length || 0}
        filters={filters}
        gridCardRender={renderGridCard}
        initialQuery={initialQuery as unknown as Record<string, unknown>}
        loading={loading}
        permissionModule="crm_service"
        query={query as unknown as Record<string, unknown>}
        // searchFields={["th", "en"]}
        title={t("navigation.super_app.topbar.more.menu.package_service.sub_menu.service")}
        total={serviceData?.totalRecords as number || services?.length || 0}
        getItemImage = {service => ({
          url: service.attachment?.attUrl || "/images/crm/placeholder.svg",
          alt: service.attachment?.attName || (language === "th" ? service.th : service.en) || ""
        })}
        onAdd={() => {
          setEditingService(null);
          setShowForm(true);
        }}
        onDelete={handleDelete}
        onEdit={handleEdit}
        onQueryChange={newQuery => setQuery(newQuery as unknown as ServiceQueryParams)}
        onView={(
          // service
        ) => {
          // View is handled by the DetailModal in View
          // You can add custom view logic here if needed
        }}
      />

      {/* Form Modal */}
      {showForm && (
        <Form
          title={`${(editingService
            ? t("common.edit_entity")
            : t("crud.common.create")
          ).replace("_ENTITY_", t("navigation.super_app.topbar.more.menu.package_service.sub_menu.service"))}`}
          fields={formFields}
          initialValues={(editingService as unknown as Record<string, unknown>) || {
            active: true,
            en: "",
            price: 0,
            th: ""
          }}
          onSubmit={handleSubmit}
          onCancel={() => {
            setShowForm(false);
            setEditingService(null);
          }}
          loading={loading}
          submitLabel={`${(editingService
            ? t("common.update_entity")
            : t("crud.common.create")
          ).replace("_ENTITY_", t("navigation.super_app.topbar.more.menu.package_service.sub_menu.service"))}`}
          cancelLabel={t("crud.common.form.action.cancel")}
          open={showForm}
        />
      )}

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

export default ServiceView;
