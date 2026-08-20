// src/cms/components/crm/categories/CategoryView.tsx
"use client"

import React, { useMemo, useState } from "react";
import { ToastContainer } from "@/core/components/crud/ToastContainer";
import { useToast } from "@/core/hooks/useToast";
import { useTranslation } from "@/core/hooks/useTranslation";
import {
  useReadCategoryQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation
} from "@/cms/store/api/categoryApi";
import type { Category, CategoryCreateData, CategoryQueryParams, CategoryUpdateData } from "@/cms/types/category";
import type { Column, FieldConfig, ViewFilterConfig } from "@/cms/types/product";
import Badge from "@/core/components/ui/badge/Badge";
import Form from "@/cms/components/crm/Form";
import ItemCard from "@/cms/components/crm/ItemCard";
import ItemList from "@/cms/components/crm/ItemList";
import View from "@/cms/components/crm/View";

// Categories are scoped by type the same way brands are: ProductView reads type "product",
// InventoryView reads type "part". A category saved with the wrong type appears in neither
// dropdown, so type is a required field.
const CATEGORY_TYPES = ["product", "part"];

// GetListCategory's response type carries no record count (no totalRecords/totalFiltered), and
// asking the BFF for those fields fails the whole query. Without a count View cannot render
// numbered pages, so the whole filtered set is fetched once and paged in the browser instead.
// Categories are master data - a few dozen rows - the same shape as BrandView.
const ALL_RECORDS_LENGTH = 10000;

const CategoryView = () => {
  const { language, t } = useTranslation();
  const { toasts, addToast, removeToast } = useToast();

  // State management
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  // API hooks
  const initialQuery: CategoryQueryParams = {
    start: 0,
    length: 10,
    search: undefined,
    type: undefined,
    active: undefined
  };

  const [query, setQuery] = useState<CategoryQueryParams>(initialQuery);

  // Filtering stays on the server; only the paging window is applied locally.
  const {
    data: categoryData,
    isLoading: isLoadingCategories,
    refetch: refetchCategories
  } = useReadCategoryQuery({
    ...query,
    start: 0,
    length: ALL_RECORDS_LENGTH
  });

  const [createCategory, { isLoading: isCreating }] = useCreateCategoryMutation();
  const [updateCategory, { isLoading: isUpdating }] = useUpdateCategoryMutation();
  const [deleteCategory, { isLoading: isDeleting }] = useDeleteCategoryMutation();

  // Extract data
  const allCategories = useMemo(() => categoryData?.data || [], [categoryData]);

  // The rows for the page View is currently showing
  const categories = useMemo(
    () => allCategories.slice(query.start, query.start + query.length),
    [allCategories, query.start, query.length]
  );

  // Combined loading state
  const loading = isLoadingCategories || isCreating || isUpdating || isDeleting;

  const typeOptions = useMemo(() => CATEGORY_TYPES.map(type => ({
    value: type,
    label: t(`crud.category.type.${type}`)
  })), [t]);

  // Field configuration for the form
  const formFields: FieldConfig[] = useMemo(() => [
    {
      name: "th",
      label: t("crud.category.form.th.label"),
      type: "text",
      required: true,
      placeholder: t("crud.category.form.th.placeholder"),
      colSpan: 1,
      errorMessage: `${t("common.required_field")} ${t("crud.category.form.th.label")}`
    },
    {
      name: "en",
      label: t("crud.category.form.en.label"),
      type: "text",
      required: true,
      placeholder: t("crud.category.form.en.placeholder"),
      colSpan: 1,
      errorMessage: `${t("common.required_field")} ${t("crud.category.form.en.label")}`
    },
    {
      name: "type",
      label: t("crud.category.form.type.label"),
      type: "select",
      required: true,
      placeholder: t("crud.category.form.type.placeholder"),
      options: typeOptions,
      colSpan: 1,
      errorMessage: `${t("common.required_field")} ${t("crud.category.form.type.label")}`
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
  // Sorting stays off: View.handleSort emits sortBy/sortDirection, which the BFF does not
  // document for /category.
  const columns: Column<Category>[] = useMemo(() => [
    {
      key: "name",
      label: t("crud.category.list.header.name"),
      sortable: false,
      width: "min-w-64",
      align: "left",
      colSpan: 2,
      render: category => (
        <ItemList
          item={category as unknown as Record<string, React.ReactNode>}
          language={language}
        />
      )
    },
    {
      key: "type",
      label: t("crud.category.list.header.type"),
      sortable: false,
      width: "w-32",
      align: "left",
      colSpan: 1,
      render: category => category.type
        ? <Badge color="info" className="text-xs">{t(`crud.category.type.${category.type}`)}</Badge>
        : "-"
    },
    {
      key: "active",
      label: t("crud.category.list.header.status"),
      sortable: false,
      width: "w-32",
      align: "right",
      colSpan: 1,
      render: category => (
        <Badge color={category.active ? "success" : "error"} className="text-xs">
          {category.active ? t("common.active") : t("common.inactive")}
        </Badge>
      )
    }
  ], [language, t]);

  const filters: ViewFilterConfig[] = [
    {
      key: "type",
      label: t("crud.category.form.type.label"),
      type: "select",
      placeholder: t("crud.category.form.type.placeholder"),
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
        th: String(formData.th),
        type: String(formData.type)
      };

      let response;

      if (editingCategory) {
        // Update existing category
        response = await updateCategory({
          categoryId: editingCategory.categoryId,
          data: data as CategoryUpdateData
        }).unwrap();

        if (response?.status) {
          addToast("success", response?.message || t("crud.common.form.action.update.success").replace("_ENTITY_", t("crud.category.name")));
          setShowForm(false);
          setEditingCategory(null);
          refetchCategories();
        }
        else {
          addToast("error", response?.message || t("crud.common.form.action.update.error").replace("_ENTITY_", t("crud.category.name")));
        }
      }
      else {
        // Create new category
        response = await createCategory(data as CategoryCreateData).unwrap();

        if (response?.status) {
          addToast("success", response?.message || t("crud.common.form.action.create.success").replace("_ENTITY_", t("crud.category.name")));
          setShowForm(false);
          refetchCategories();
        }
        else {
          addToast("error", response?.message || t("crud.common.form.action.create.error").replace("_ENTITY_", t("crud.category.name")));
        }
      }
    }
    catch (error: unknown) {
      console.error("Submit error:", error);
      addToast("error", (error as { data?: { message?: string } })?.data?.message || `Operation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  // Handle category deletion
  const handleDelete = async (category: Category) => {
    try {
      const response = await deleteCategory(category.categoryId).unwrap();

      if (response?.status) {
        addToast("success", response?.message || t("crud.common.form.action.delete.success").replace("_ENTITY_", t("crud.category.name")));
        refetchCategories();
      }
      else {
        addToast("error", response?.message || t("crud.common.form.action.delete.error").replace("_ENTITY_", t("crud.category.name")));
      }
    }
    catch (error: unknown) {
      console.error("Delete error:", error);
      addToast("error", (error as { data?: { message?: string } })?.data?.message || `Delete failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  // Handle edit action
  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setShowForm(true);
  };

  // Custom grid card renderer
  const renderGridCard = (category: Category, actions: React.ReactNode) => (
    <ItemCard
      actions={actions}
      item={category as unknown as Record<string, React.ReactNode>}
      language={language}
    />
  );

  return (
    <>
      <View
        columns={columns}
        createLabel={t("crud.common.create").replace("_ENTITY_", t("crud.category.name"))}
        data={categories}
        filtered={allCategories.length}
        filters={filters}
        gridCardRender={renderGridCard}
        initialQuery={initialQuery as unknown as Record<string, unknown>}
        loading={loading}
        permissionModule="product"
        query={query as unknown as Record<string, unknown>}
        title={t("crud.category.name")}
        total={allCategories.length}
        onAdd={() => {
          setEditingCategory(null);
          setShowForm(true);
        }}
        onDelete={handleDelete}
        onEdit={handleEdit}
        onQueryChange={newQuery => setQuery(newQuery as unknown as CategoryQueryParams)}
        onView={() => {
          // Viewing is handled by the DetailModal inside View
        }}
      />

      {/* Form Modal */}
      {showForm && (
        <Form
          cancelLabel={t("crud.common.form.action.cancel")}
          fields={formFields}
          initialValues={editingCategory
            ? {
              active: editingCategory.active,
              en: editingCategory.en,
              th: editingCategory.th,
              type: editingCategory.type
            }
            : {
              active: true,
              en: "",
              th: "",
              type: ""
            }}
          loading={loading}
          open={showForm}
          submitLabel={`${(editingCategory
            ? t("common.update_entity")
            : t("crud.common.create")
          ).replace("_ENTITY_", t("crud.category.name"))}`}
          title={`${(editingCategory
            ? t("common.edit_entity")
            : t("crud.common.create")
          ).replace("_ENTITY_", t("crud.category.name"))}`}
          onCancel={() => {
            setShowForm(false);
            setEditingCategory(null);
          }}
          onSubmit={handleSubmit}
        />
      )}

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </>
  );
};

export default CategoryView;
