// src/cms/components/crm/brands/BrandView.tsx
"use client"

import React, { useMemo, useState } from "react";
import { ToastContainer } from "@/core/components/crud/ToastContainer";
import { useToast } from "@/core/hooks/useToast";
import { useTranslation } from "@/core/hooks/useTranslation";
import {
  useReadBrandQuery,
  useCreateBrandMutation,
  useUpdateBrandMutation,
  useDeleteBrandMutation
} from "@/cms/store/api/brandApi";
import type { Brand, BrandCreateData, BrandQueryParams, BrandUpdateData } from "@/cms/types/brand";
import type { Column, FieldConfig, ViewFilterConfig } from "@/cms/types/product";
import Badge from "@/core/components/ui/badge/Badge";
import Form from "@/cms/components/crm/Form";
import ImagePreviewModal from "@/cms/components/crm/ImagePreviewModal";
import ItemCard from "@/cms/components/crm/ItemCard";
import ItemList from "@/cms/components/crm/ItemList";
import View from "@/cms/components/crm/View";

// Brands are scoped by type: ProductView reads type "product", InventoryView reads type "part".
// A brand saved with the wrong type appears in neither dropdown, so type is a required field.
const BRAND_TYPES = ["product", "part"];

// GetListBrand's response type carries no record count (no totalRecords/totalFiltered), and
// asking the BFF for those fields fails the whole query. Without a count View cannot render
// numbered pages, so the whole filtered set is fetched once and paged in the browser instead.
// Brands are master data - a few dozen rows - and ProductView already pulls stock the same way.
const ALL_RECORDS_LENGTH = 10000;

const BrandView = () => {
  const { language, t } = useTranslation();
  const { toasts, addToast, removeToast } = useToast();

  // State management
  const [showForm, setShowForm] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [imagePreview, setImagePreview] = useState<{ url: string; alt: string } | null>(null);

  // API hooks
  const initialQuery: BrandQueryParams = {
    start: 0,
    length: 10,
    search: undefined,
    type: undefined,
    active: undefined
  };

  const [query, setQuery] = useState<BrandQueryParams>(initialQuery);

  // Filtering stays on the server; only the paging window is applied locally.
  const {
    data: brandData,
    isLoading: isLoadingBrands,
    refetch: refetchBrands
  } = useReadBrandQuery({
    ...query,
    start: 0,
    length: ALL_RECORDS_LENGTH
  });

  const [createBrand, { isLoading: isCreating }] = useCreateBrandMutation();
  const [updateBrand, { isLoading: isUpdating }] = useUpdateBrandMutation();
  const [deleteBrand, { isLoading: isDeleting }] = useDeleteBrandMutation();

  // Extract data
  const allBrands = useMemo(() => brandData?.data || [], [brandData]);

  // The rows for the page View is currently showing
  const brands = useMemo(
    () => allBrands.slice(query.start, query.start + query.length),
    [allBrands, query.start, query.length]
  );

  // Combined loading state
  const loading = isLoadingBrands || isCreating || isUpdating || isDeleting;

  const typeOptions = useMemo(() => BRAND_TYPES.map(type => ({
    value: type,
    label: t(`crud.brand.type.${type}`)
  })), [t]);

  // Field configuration for the form
  const formFields: FieldConfig[] = useMemo(() => [
    {
      // The name must stay "attachment": Form reads back an unchanged logo from
      // formData.attachment by that exact key when no new file was picked.
      name: "attachment",
      label: t("crud.brand.form.attachment.label"),
      type: "file",
      colSpan: 1,
      accept: "image/*"
    },
    {
      name: "th",
      label: t("crud.brand.form.th.label"),
      type: "text",
      required: true,
      placeholder: t("crud.brand.form.th.placeholder"),
      colSpan: 1,
      errorMessage: `${t("common.required_field")} ${t("crud.brand.form.th.label")}`
    },
    {
      name: "en",
      label: t("crud.brand.form.en.label"),
      type: "text",
      required: true,
      placeholder: t("crud.brand.form.en.placeholder"),
      colSpan: 1,
      errorMessage: `${t("common.required_field")} ${t("crud.brand.form.en.label")}`
    },
    {
      name: "type",
      label: t("crud.brand.form.type.label"),
      type: "select",
      required: true,
      placeholder: t("crud.brand.form.type.placeholder"),
      options: typeOptions,
      colSpan: 1,
      errorMessage: `${t("common.required_field")} ${t("crud.brand.form.type.label")}`
    },
    {
      // A toggle always carries a value, so it is never "required".
      name: "active",
      label: t("common.status"),
      type: "toggle",
      options: [
        { value: "true", label: t("common.active") },
        { value: "false", label: t("common.inactive") }
      ],
      colSpan: 1
    }
  ], [typeOptions, t]);

  // Column configuration for table/list view.
  // Sorting stays off: View.handleSort emits sortBy/sortDirection, which BrandQueryParams does
  // not carry and the BFF does not document for /brand.
  const columns: Column<Brand>[] = useMemo(() => [
    {
      key: "name",
      label: t("crud.brand.list.header.name"),
      sortable: false,
      width: "min-w-64",
      align: "left",
      colSpan: 2,
      render: brand => (
        <ItemList
          item={brand as unknown as Record<string, React.ReactNode>}
          language={language}
        />
      )
    },
    {
      key: "type",
      label: t("crud.brand.list.header.type"),
      sortable: false,
      width: "w-32",
      align: "left",
      colSpan: 1,
      render: brand => brand.type
        ? <Badge color="info" className="text-xs">{t(`crud.brand.type.${brand.type}`)}</Badge>
        : "-"
    },
    {
      key: "active",
      label: t("crud.brand.list.header.status"),
      sortable: false,
      width: "w-32",
      align: "right",
      colSpan: 1,
      render: brand => (
        <Badge color={brand.active ? "success" : "error"} className="text-xs">
          {brand.active ? t("common.active") : t("common.inactive")}
        </Badge>
      )
    }
  ], [language, t]);

  const filters: ViewFilterConfig[] = [
    {
      key: "type",
      label: t("crud.brand.form.type.label"),
      type: "select",
      placeholder: t("crud.brand.form.type.placeholder"),
      options: typeOptions
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
        active: Boolean(formData.active),
        en: String(formData.en),
        // Form resolves the logo before calling onSubmit: the attUrl of a freshly uploaded file,
        // or the existing attachment's attUrl when the picker was left untouched.
        image: String(formData.image ?? ""),
        th: String(formData.th),
        type: String(formData.type)
      };

      let response;

      if (editingBrand) {
        // Update existing brand
        response = await updateBrand({
          brandId: editingBrand.brandId,
          data: data as BrandUpdateData
        }).unwrap();

        if (response?.status) {
          addToast("success", response?.message || t("crud.common.form.action.update.success").replace("_ENTITY_", t("crud.brand.name")));
          setShowForm(false);
          setEditingBrand(null);
          refetchBrands();
        }
        else {
          addToast("error", response?.message || t("crud.common.form.action.update.error").replace("_ENTITY_", t("crud.brand.name")));
        }
      }
      else {
        // Create new brand
        response = await createBrand(data as BrandCreateData).unwrap();

        if (response?.status) {
          addToast("success", response?.message || t("crud.common.form.action.create.success").replace("_ENTITY_", t("crud.brand.name")));
          setShowForm(false);
          refetchBrands();
        }
        else {
          addToast("error", response?.message || t("crud.common.form.action.create.error").replace("_ENTITY_", t("crud.brand.name")));
        }
      }
    }
    catch (error: unknown) {
      console.error("Submit error:", error);
      addToast("error", (error as { data?: { message?: string } })?.data?.message || `Operation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  // Handle brand deletion
  const handleDelete = async (brand: Brand) => {
    try {
      const response = await deleteBrand(brand.brandId).unwrap();

      if (response?.status) {
        addToast("success", response?.message || t("crud.common.form.action.delete.success").replace("_ENTITY_", t("crud.brand.name")));
        refetchBrands();
      }
      else {
        addToast("error", response?.message || t("crud.common.form.action.delete.error").replace("_ENTITY_", t("crud.brand.name")));
      }
    }
    catch (error: unknown) {
      console.error("Delete error:", error);
      addToast("error", (error as { data?: { message?: string } })?.data?.message || `Delete failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  // Handle edit action
  const handleEdit = (brand: Brand) => {
    setEditingBrand(brand);
    setShowForm(true);
  };

  // Custom grid card renderer
  const renderGridCard = (brand: Brand, actions: React.ReactNode) => (
    <ItemCard
      actions={actions}
      item={brand as unknown as Record<string, React.ReactNode>}
      language={language}
      onPreview={(url, alt) => setImagePreview({ url, alt })}
    />
  );

  return (
    <>
      <View
        columns={columns}
        createLabel={t("crud.common.create").replace("_ENTITY_", t("crud.brand.name"))}
        data={brands}
        filtered={allBrands.length}
        filters={filters}
        gridCardRender={renderGridCard}
        initialQuery={initialQuery as unknown as Record<string, unknown>}
        loading={loading}
        permissionModule="product"
        query={query as unknown as Record<string, unknown>}
        title={t("crud.brand.name")}
        total={allBrands.length}
        getItemImage={brand => ({
          url: brand.attachment?.attUrl || "/images/crm/placeholder.svg",
          alt: brand.attachment?.attName || (language === "th" ? brand.th : brand.en) || ""
        })}
        onAdd={() => {
          setEditingBrand(null);
          setShowForm(true);
        }}
        onDelete={handleDelete}
        onEdit={handleEdit}
        onQueryChange={newQuery => setQuery(newQuery as unknown as BrandQueryParams)}
        onView={() => {
          // Viewing is handled by the DetailModal inside View
        }}
      />

      {/* Form Modal */}
      {showForm && (
        <Form
          cancelLabel={t("crud.common.form.action.cancel")}
          fields={formFields}
          initialValues={editingBrand
            ? {
              active: editingBrand.active,
              // Form rebuilds its state from `fields` alone, so the current attachment has to be
              // seeded here - without it the edit form shows an empty avatar and saving would
              // clear the brand's existing logo.
              attachment: editingBrand.attachment,
              en: editingBrand.en,
              th: editingBrand.th,
              type: editingBrand.type
            }
            : {
              active: true,
              attachment: "",
              en: "",
              th: "",
              type: ""
            }}
          loading={loading}
          open={showForm}
          submitLabel={`${(editingBrand
            ? t("common.update_entity")
            : t("crud.common.create")
          ).replace("_ENTITY_", t("crud.brand.name"))}`}
          title={`${(editingBrand
            ? t("common.edit_entity")
            : t("crud.common.create")
          ).replace("_ENTITY_", t("crud.brand.name"))}`}
          uploadPath="brand"
          onCancel={() => {
            setShowForm(false);
            setEditingBrand(null);
          }}
          onSubmit={handleSubmit}
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

export default BrandView;
