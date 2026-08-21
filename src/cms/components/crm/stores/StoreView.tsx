// src/cms/components/crm/stores/StoreView.tsx
"use client"

import { useMemo, useState } from "react";
import { ExternalLink } from "lucide-react";
import { ToastContainer } from "@/core/components/crud/ToastContainer";
import { usePermissions } from "@/core/hooks/usePermissions";
import { useToast } from "@/core/hooks/useToast";
import { useTranslation } from "@/core/hooks/useTranslation";
import { useReadInventoryStockQuery } from "@/cms/store/api/inventoryStockApi";
import { useReadProductStockQuery } from "@/cms/store/api/productStockApi";
import {
  useReadStoreQuery,
  useCreateStoreMutation,
  useUpdateStoreMutation,
  useDeleteStoreMutation
} from "@/cms/store/api/storeApi";
import { formatNumberWithComma } from "@/cms/utils/productHelper";
import type { Column, FieldConfig, ViewFilterConfig } from "@/cms/types/product";
import type { Store, StoreCreateData, StoreQueryParams, StoreUpdateData } from "@/cms/types/store";
import Badge from "@/core/components/ui/badge/Badge";
import Form from "@/cms/components/crm/Form";
import StoreStockModal, { StoreStockTab } from "@/cms/components/crm/stores/StoreStockModal";
import View from "@/cms/components/crm/View";

// GetListStore's response type carries no record count (no totalRecords/totalFiltered), and
// asking the BFF for those fields fails the whole query. Without a count View cannot render
// numbered pages, so the whole filtered set is fetched once and paged in the browser instead.
// Stores are master data - a handful of rows - and BrandView already works the same way.
const ALL_RECORDS_LENGTH = 10000;

// ProductView and InventoryView already read the full stock set with exactly these arguments.
// baseApi keys its cache on `${endpointName}-${JSON.stringify(queryArgs)}`, so matching them
// byte for byte reuses their cache entry instead of firing a second pair of large requests.
const STOCK_QUERY = { start: 0, length: 10000 };

// Units held at one store, split the way the sidebar and permissions already split the domain.
interface StoreStockTotals {
  productUnits: number;
  partUnits: number;
}

const EMPTY_TOTALS: StoreStockTotals = { productUnits: 0, partUnits: 0 };

const StoreView = () => {
  const { language, t } = useTranslation();
  const { toasts, addToast, removeToast } = useToast();
  const permissions = usePermissions();

  // State management
  const [showForm, setShowForm] = useState(false);
  const [editingStore, setEditingStore] = useState<Store | null>(null);
  const [stockDetail, setStockDetail] = useState<{ store: Store; tab: StoreStockTab } | null>(null);

  // API hooks
  const initialQuery: StoreQueryParams = {
    start: 0,
    length: 10,
    search: undefined,
    active: undefined
  };

  const [query, setQuery] = useState<StoreQueryParams>(initialQuery);

  // Filtering stays on the server; only the paging window is applied locally.
  const {
    data: storeData,
    isLoading: isLoadingStores,
    refetch: refetchStores
  } = useReadStoreQuery({
    ...query,
    start: 0,
    length: ALL_RECORDS_LENGTH
  });

  const { data: productStockData } = useReadProductStockQuery(STOCK_QUERY);
  const { data: inventoryStockData } = useReadInventoryStockQuery(STOCK_QUERY);

  const [createStore, { isLoading: isCreating }] = useCreateStoreMutation();
  const [updateStore, { isLoading: isUpdating }] = useUpdateStoreMutation();
  const [deleteStore, { isLoading: isDeleting }] = useDeleteStoreMutation();

  // Extract data
  const allStores = useMemo(() => storeData?.data || [], [storeData]);
  const productStock = useMemo(() => productStockData?.data || [], [productStockData]);
  const inventoryStock = useMemo(() => inventoryStockData?.data || [], [inventoryStockData]);

  // The rows for the page View is currently showing
  const stores = useMemo(
    () => allStores.slice(query.start, query.start + query.length),
    [allStores, query.start, query.length]
  );

  // Combined loading state
  const loading = isLoadingStores || isCreating || isUpdating || isDeleting;

  const canViewStock = permissions.hasPermission("product_stock.view");

  // Roll both stock sets up per store in one pass so a row lookup stays O(1).
  const stockTotals = useMemo(() => {
    const totals = new Map<string, StoreStockTotals>();

    const addUnits = (storeId: string | undefined, key: keyof StoreStockTotals, quantity: number) => {
      if (!storeId) {
        return;
      }
      const current = totals.get(storeId) || { ...EMPTY_TOTALS };
      totals.set(storeId, { ...current, [key]: current[key] + (quantity || 0) });
    };

    productStock.forEach(stock => addUnits(stock.store?.storeId, "productUnits", stock.quantity));
    inventoryStock.forEach(stock => addUnits(stock.store?.storeId, "partUnits", stock.quantity));

    return totals;
  }, [productStock, inventoryStock]);

  // Field configuration for the form
  const formFields: FieldConfig[] = useMemo(() => [
    {
      name: "th",
      label: t("crud.store.form.th.label"),
      type: "text",
      required: true,
      placeholder: t("crud.store.form.th.placeholder"),
      colSpan: 1,
      errorMessage: `${t("common.required_field")} ${t("crud.store.form.th.label")}`
    },
    {
      name: "en",
      label: t("crud.store.form.en.label"),
      type: "text",
      required: true,
      placeholder: t("crud.store.form.en.placeholder"),
      colSpan: 1,
      errorMessage: `${t("common.required_field")} ${t("crud.store.form.en.label")}`
    },
    {
      // Deliberately not `required`: Form treats a required field whose value is 0 as missing,
      // and a 0% discount is a legitimate value.
      name: "discount",
      label: t("crud.store.form.discount.label"),
      type: "number",
      placeholder: t("crud.store.form.discount.placeholder"),
      colSpan: 1
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
  ], [t]);

  // Renders one of the two stock totals plus its drill-down trigger.
  const renderStockCell = (store: Store, key: keyof StoreStockTotals, tab: StoreStockTab) => {
    if (!canViewStock) {
      return null;
    }

    const totals = stockTotals.get(store.storeId) || EMPTY_TOTALS;

    return (
      <div className="flex items-center gap-2">
        {/* A whole-store total is not comparable against LOW_STOCK_THRESHOLD, which is a
            per-item figure, so this stays a plain count. The stock status badge lives in
            StoreStockModal, where it applies per item. */}
        <span>{formatNumberWithComma(totals[key])}</span>

        <button
          className="p-0 text-blue-500 hover:text-blue-700"
          onClick={() => setStockDetail({ store, tab })}
        >
          <ExternalLink className="h-4 w-4" />
        </button>
      </div>
    );
  };

  // Column configuration for table/list view.
  // Sorting stays off: View.handleSort emits sortBy/sortDirection, which StoreQueryParams does
  // not carry (it has orderBy/direction) and the BFF does not document for /store.
  const columns: Column<Store>[] = useMemo(() => [
    {
      key: "name",
      label: t("crud.store.list.header.name"),
      sortable: false,
      width: "min-w-64",
      align: "left",
      colSpan: 2,
      // Not ItemList: that renders an attachment avatar and Store carries no attachment.
      render: store => (
        <span className="font-medium line-clamp-2">
          {language === "th" ? store.th : store.en}
        </span>
      )
    },
    {
      key: "discount",
      label: t("crud.store.list.header.discount"),
      sortable: false,
      width: "w-28",
      align: "left",
      colSpan: 1,
      render: store => `${formatNumberWithComma(store.discount || 0)}%`
    },
    {
      key: "productUnits",
      label: t("crud.store.list.header.products"),
      sortable: false,
      width: "w-32",
      align: "left",
      colSpan: 1,
      render: store => renderStockCell(store, "productUnits", "products")
    },
    {
      key: "partUnits",
      label: t("crud.store.list.header.parts"),
      sortable: false,
      width: "w-32",
      align: "left",
      colSpan: 1,
      render: store => renderStockCell(store, "partUnits", "parts")
    },
    {
      key: "active",
      label: t("crud.store.list.header.status"),
      sortable: false,
      width: "w-32",
      align: "right",
      colSpan: 1,
      render: store => (
        <Badge color={store.active ? "success" : "error"} className="text-xs">
          {store.active ? t("common.active") : t("common.inactive")}
        </Badge>
      )
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [language, t, stockTotals, canViewStock]);

  const filters: ViewFilterConfig[] = [
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
        // Input type="number" hands back a string, and an untouched field is seeded to "".
        discount: Number(formData.discount) || 0,
        en: String(formData.en),
        th: String(formData.th)
      };

      let response;

      if (editingStore) {
        // Update existing store
        response = await updateStore({
          storeId: editingStore.storeId,
          data: data as StoreUpdateData
        }).unwrap();

        if (response?.status) {
          addToast("success", response?.message || t("crud.common.form.action.update.success").replace("_ENTITY_", t("crud.store.name")));
          setShowForm(false);
          setEditingStore(null);
          refetchStores();
        }
        else {
          addToast("error", response?.message || t("crud.common.form.action.update.error").replace("_ENTITY_", t("crud.store.name")));
        }
      }
      else {
        // Create new store
        response = await createStore(data as StoreCreateData).unwrap();

        if (response?.status) {
          addToast("success", response?.message || t("crud.common.form.action.create.success").replace("_ENTITY_", t("crud.store.name")));
          setShowForm(false);
          refetchStores();
        }
        else {
          addToast("error", response?.message || t("crud.common.form.action.create.error").replace("_ENTITY_", t("crud.store.name")));
        }
      }
    }
    catch (error: unknown) {
      console.error("Submit error:", error);
      addToast("error", (error as { data?: { message?: string } })?.data?.message || `Operation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  // Handle store deletion
  const handleDelete = async (store: Store) => {
    try {
      const response = await deleteStore(store.storeId).unwrap();

      if (response?.status) {
        addToast("success", response?.message || t("crud.common.form.action.delete.success").replace("_ENTITY_", t("crud.store.name")));
        refetchStores();
      }
      else {
        addToast("error", response?.message || t("crud.common.form.action.delete.error").replace("_ENTITY_", t("crud.store.name")));
      }
    }
    catch (error: unknown) {
      console.error("Delete error:", error);
      addToast("error", (error as { data?: { message?: string } })?.data?.message || `Delete failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  // Handle edit action
  const handleEdit = (store: Store) => {
    setEditingStore(store);
    setShowForm(true);
  };

  return (
    <>
      <View
        columns={columns}
        createLabel={t("crud.common.create").replace("_ENTITY_", t("crud.store.name"))}
        data={stores}
        filtered={allStores.length}
        filters={filters}
        initialQuery={initialQuery as unknown as Record<string, unknown>}
        loading={loading}
        permissionModule="product"
        query={query as unknown as Record<string, unknown>}
        title={t("crud.store.name")}
        total={allStores.length}
        onAdd={() => {
          setEditingStore(null);
          setShowForm(true);
        }}
        onDelete={handleDelete}
        onEdit={handleEdit}
        onQueryChange={newQuery => setQuery(newQuery as unknown as StoreQueryParams)}
        onView={() => {
          // Viewing is handled by the DetailModal inside View
        }}
      />

      {/* Form Modal */}
      {showForm && (
        <Form
          cancelLabel={t("crud.common.form.action.cancel")}
          fields={formFields}
          initialValues={editingStore
            ? {
              active: editingStore.active,
              discount: editingStore.discount,
              en: editingStore.en,
              th: editingStore.th
            }
            : {
              active: true,
              discount: 0,
              en: "",
              th: ""
            }}
          loading={loading}
          open={showForm}
          submitLabel={`${(editingStore
            ? t("common.update_entity")
            : t("crud.common.create")
          ).replace("_ENTITY_", t("crud.store.name"))}`}
          title={`${(editingStore
            ? t("common.edit_entity")
            : t("crud.common.create")
          ).replace("_ENTITY_", t("crud.store.name"))}`}
          onCancel={() => {
            setShowForm(false);
            setEditingStore(null);
          }}
          onSubmit={handleSubmit}
        />
      )}

      {/* Per-store stock breakdown */}
      {stockDetail && (
        <StoreStockModal
          initialTab={stockDetail.tab}
          inventoryStock={inventoryStock}
          open={!!stockDetail}
          productStock={productStock}
          store={stockDetail.store}
          onClose={() => setStockDetail(null)}
        />
      )}

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </>
  );
};

export default StoreView;
