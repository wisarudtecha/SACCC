// src/cms/components/crm/inventory/InventoryView.v1.tsx
"use client"

import { useEffect, useMemo, useState } from "react";
import { Plus, Grid3x3, List, Edit, Trash2, Eye, X } from "lucide-react";
import { ToastContainer } from "@/core/components/crud/ToastContainer";
import { useToast } from "@/core/hooks/useToast";
import { useTranslation } from "@/core/hooks/useTranslation";
import { useReadBrandQuery } from "@/cms/store/api/brandApi";
import { useReadCategoryQuery } from "@/cms/store/api/categoryApi";
import { useReadProductQuery } from "@/cms/store/api/productApi";
import {
  useReadInventoryQuery,
  // useCreateInventoryMutation,
  useUpdateInventoryMutation,
  useDeleteInventoryMutation
} from "@/cms/store/api/inventoryApi";
import { convertMonthsToYears, formatPrice } from "@/cms/utils/productHelper";
import type { Brand } from "@/cms/types/brand";
import type { Category } from "@/cms/types/category";
import type { Product } from "@/cms/types/product";
import type { Inventory, InventoryCreateData, InventoryUpdateData } from "@/cms/types/inventory";
import InventoryForm from "@/cms/components/crm/inventory/InventoryForm";
import Input from "@/core/components/form/input/InputField";
import Badge from "@/core/components/ui/badge/Badge";
import Button from "@/core/components/ui/button/Button";

const InventoryView = () => {
  const { toasts, addToast, removeToast } = useToast();
  const {
    language,
    // t
  } = useTranslation();

  const itemsPerPage = 6;
  
  const [currentPage, setCurrentPage] = useState(1);
  const [deletingInventory, setDeletingInventory] = useState("");
  const [editingInventory, setEditingInventory] = useState<Inventory | null>(null);
  const [loading, setLoading] = useState(true);
  const [inventories, setInventories] = useState<Inventory[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedImage, setSelectedImage] = useState<{attUrl: string, attName: string} | null>(null);
  const [selectedInventory, setSelectedInventory] = useState<Inventory | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [viewMode, setViewMode] = useState("grid");

  // const [createInventory] = useCreateInventoryMutation();
  const [updateInventory] = useUpdateInventoryMutation();
  const [deleteInventory] = useDeleteInventoryMutation();
  
  const { data: brand } = useReadBrandQuery({ start: 0, length: 100, type: "part" });
  const { data: category } = useReadCategoryQuery({ start: 0, length: 100, type: "part" });
  const { data: inventory } = useReadInventoryQuery({ start: 0, length: 10 });
  const { data: product } = useReadProductQuery({ start: 0, length: 10 });

  const brands: Brand[] = brand?.data || [];
  const categories: Category[] = category?.data || [];
  const products: Product[] = product?.data || [];

  const filteredInventories = useMemo(() => {
    if (!inventories?.length) {
      return [];
    }
    const term = searchTerm.toLowerCase();
    return inventories.filter(p =>
      p.th?.toLowerCase().includes(term) ||
      p.en?.toLowerCase().includes(term)
    );
  }, [
    inventories,
    searchTerm
  ]);

  const totalPages = useMemo(() => Math.ceil(filteredInventories.length / itemsPerPage), [filteredInventories]);
  const paginatedInventories = useMemo(() => filteredInventories.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage), [filteredInventories, currentPage]);

  const handleAddInventory = async (
    // formData: InventoryCreateData | InventoryUpdateData
  ) => {
    setLoading(true);
    try {
      // const data = new FormData();
      // data.append("th", formData.th);
      // data.append("en", formData.en);
      // data.append("categoryId", formData.categoryId);
      // data.append("brandId", formData.brandId);
      // data.append("mfd", `${formData.mfd}:00Z`);
      // data.append("warranty", String(formData.warranty));
      // data.append("price", String(formData.price));
      // data.append("active", String(formData.active));
      // if (formData.file) {
      //   data.append("file", formData.file);
      // }
      // const response = await createInventory(data).unwrap();
      
      // if (response?.status) {
      //   addToast("success", "Spare part created successfully.");
      // }
      // else {
      //   addToast("error", "Spare part create failed, please try again.");
      // }
    }
    catch (err) {
      addToast("error", `An error occurred while creating the spare part, ${err}`);
    }
    finally {
      setLoading(false);
    }
    setShowForm(false);
  }

  const handleDeleteInventory = async (id: string) => {
    setLoading(true);
    try {
      const response = await deleteInventory(id).unwrap();
      if (response?.status) {
        addToast("success", "Spare part deleted successfully.");
      }
      else {
        addToast("error", "Spare part delete failed, please try again.");
      }
    }
    catch (err) {
      addToast("error", `An error occurred while deleting the spare part, ${err}`);
    }
    finally {
      setLoading(false);
    }
  }

  const handleEditInventory = (inventory: Inventory) => {
    setEditingInventory(inventory);
    setShowEditModal(true);
  }

  const handleUpdateInventory = async (formData: InventoryCreateData | InventoryUpdateData) => {
    if (editingInventory) {
      setLoading(true);
      try {
        const response = await updateInventory({ partId: editingInventory.partId, data: formData as InventoryUpdateData }).unwrap();
        if (response?.status) {
          addToast("success", "Spare part updated successfully.");
        }
        else {
          addToast("error", "Spare part update failed, please try again.");
        }
      }
      catch (err) {
        addToast("error", `An error occurred while updating the spare part, ${err}`);
      }
      finally {
        setLoading(false);
      }
    }
    setShowEditModal(false);
    setEditingInventory(null);
  }

  useEffect(() => {
    if (!inventory) {
      setLoading(true);
    }
    else {
      setLoading(false);
    }

    setInventories(inventory?.data || []);
  }, [inventory]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white dark:bg-black h-full">
        <p className="text-gray-500 dark:text-gray-400">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-black h-full cursor-default">
      {showEditModal && editingInventory && (
        <InventoryForm
          onSubmit={handleUpdateInventory}
          onCancel={() => setShowEditModal(false)}
          products={products}
          initialValues={editingInventory}
          formLoading={loading}
          categories={categories}
          brands={brands}
        />
      )}

      {selectedInventory && (
        <div className="fixed inset-0 bg-white dark:bg-black/70 flex items-center justify-center z-9999">
          <div className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-semibold text-black dark:text-white">Spare Part Details</h2>
              <button onClick={() => setSelectedInventory(null)} className="text-gray-400 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="h-64 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center mb-4 overflow-hidden">
                <img
                  src={`${selectedInventory.attachment?.attUrl || "/images/crm/placeholder.svg"}`}
                  alt={selectedInventory.attachment?.attName || (language === "th" && selectedInventory.th || selectedInventory.en || "")}
                  className="w-full h-full object-cover cursor-pointer"
                  onClick={() => setSelectedImage({attUrl: selectedInventory.attachment?.attUrl || "", attName: selectedInventory.attachment?.attName || ""})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-gray-500 dark:text-gray-400 text-sm">Spare Part Name</label>
                  <p className="text-black dark:text-white font-semibold">{language === "th" && selectedInventory.th || selectedInventory.en || ""}</p>
                </div>
                <div>
                  <label className="text-gray-500 dark:text-gray-400 text-sm">Category</label>
                  <p className="text-black dark:text-white">
                    {language === "th" &&
                      categories.find(category => category.categoryId === selectedInventory.categoryId)?.th ||
                      categories.find(category => category.categoryId === selectedInventory.categoryId)?.en
                    || ""}
                  </p>
                </div>
                <div>
                  <label className="text-gray-500 dark:text-gray-400 text-sm">Brand</label>
                  <p className="text-black dark:text-white">
                    {language === "th" &&
                      brands.find(brand => brand.brandId === selectedInventory.brandId)?.th ||
                      brands.find(brand => brand.brandId === selectedInventory.brandId)?.en
                    || ""}
                  </p>
                </div>
                <div>
                  <label className="text-gray-500 dark:text-gray-400 text-sm">Year</label>
                  <p className="text-black dark:text-white">
                    {/* {convertDatetimeToUTCFullYear(selectedInventory.mfd) || ""} */}
                    {selectedInventory.mfd}
                  </p>
                </div>
                <div>
                  <label className="text-gray-500 dark:text-gray-400 text-sm">Price</label>
                  <p className="text-black dark:text-white font-semibold">{formatPrice(selectedInventory.price) || ""}</p>
                </div>
                <div className="col-span-2">
                  <label className="text-gray-500 dark:text-gray-400 text-sm">Warranty</label>
                  {selectedInventory.warranty && (
                    <p className="text-black dark:text-white">
                      {convertMonthsToYears(selectedInventory.warranty)}
                    </p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex gap-2 justify-start pt-4">
                  <Button
                    variant="outline-error"
                    size="sm"
                  >
                    Delete
                  </Button>
                </div>
                <div className="flex gap-2 justify-end pt-4">
                  <Button
                    variant="outline"
                    size="sm"
                  >
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setSelectedInventory(null)}
                    size="sm"
                  >
                    Close
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedImage && (
        <div className="fixed inset-0 bg-white dark:bg-black flex items-center justify-center z-9999">
          <div className="bg-white dark:bg-gray-900 rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto relative">
            <button onClick={() => setSelectedImage(null)} className="text-gray-400 hover:text-gray-600 absolute top-4 right-4">
              <X className="w-6 h-6" />
            </button>
            <div className="space-y-4">
              <div className="bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center mb-4 overflow-hidden">
                <img
                  src={selectedImage?.attUrl}
                  alt={selectedImage?.attName}
                  className="w-full h-full"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {showConfirm && (
        <div className="fixed inset-0 bg-white dark:bg-black/70 flex items-center justify-center z-9999">
          <div className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-semibold text-black dark:text-white">Delete spare part confirmation</h2>
              <button
                onClick={() => setShowConfirm(false)}
                className="text-gray-400 hover:text-gray-600 absolute top-4 right-4"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="flex mb-4 overflow-hidden">
                Are you sure you want to delete this spare part? This action cannot be undone.
              </div>
              <div className="flex gap-3 justify-end p-4">
                <Button
                  onClick={() => setShowConfirm(false)}
                  variant="outline"
                  size="sm"
                  className={`${loading ? "disabled cursor-not-allowed" : ""}`}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    handleDeleteInventory(deletingInventory);
                    setShowConfirm(false);
                  }}
                  variant="error"
                  size="sm"
                  className={`${loading ? "disabled cursor-not-allowed" : ""}`}
                  disabled={loading}
                >
                  {loading && "Deleting..." || "Confirm"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white dark:bg-gray-800 px-4 py-2">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-semibold text-black dark:text-white">Inventory</h2>
          <Button
            onClick={() => setShowForm(true)}
            variant="primary"
            size="sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create New
          </Button>
        </div>

        <div className="flex items-center justify-between gap-2">
          <Input
            placeholder="Search by name or code..."
            value={searchTerm}
            onChange={e => {
              setSearchTerm(e.target.value)
              setCurrentPage(1)
            }}
          />
          <div className="flex gap-2">
            <Button
              variant={viewMode === "grid" ? "primary" : "outline"}
              size="sm"
              onClick={() => setViewMode("grid")}
            >
              <Grid3x3 className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "primary" : "outline"}
              size="sm"
              onClick={() => setViewMode("list")}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Inventory Form Modal */}
      {showForm && (
        <InventoryForm
          onSubmit={handleAddInventory}
          onCancel={() => setShowForm(false)}
          products={products}
          formLoading={loading}
          categories={categories}
          brands={brands}
        />
      )}

      {/* Grid View */}
      {viewMode === "grid" && (
        <div className="flex-1 overflow-auto px-4 flex flex-col bg-white dark:bg-gray-800">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 flex-1">
            {paginatedInventories.map(inventory => (
              <div
                key={inventory.id}
                className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-lg overflow-hidden hover:border-gray-200 dark:hover:border-gray-700 transition-colors flex flex-col"
              >
                <div className="h-48 bg-gray-100 dark:bg-gray-800 flex items-center justify-center overflow-hidden">
                  <img
                    src={`${inventory.attachment?.attUrl || "/images/crm/placeholder.svg"}`}
                    alt={inventory.attachment?.attName || (language === "th" && inventory.th || inventory.en || "")}
                    className="w-full h-full object-cover cursor-pointer"
                    onClick={() => setSelectedImage({attUrl: inventory.attachment?.attUrl || "", attName: inventory.attachment?.attName || ""})}
                  />
                </div>
                <div className="p-2 flex flex-col flex-1">
                  <h3 className="text-black dark:text-white font-semibold mb-1 min-h-12">{language === "th" && inventory.th || inventory.en || ""}</h3>
                  <div className="space-y-1 mb-2 text-sm flex-1">
                    <div className="flex justify-between text-gray-500 dark:text-gray-400">
                      <span>Brand:</span>
                      <span className="text-black dark:text-white">
                        {language === "th" &&
                          brands.find(brand => brand.brandId === inventory.brandId)?.th ||
                          brands.find(brand => brand.brandId === inventory.brandId)?.en
                        || ""}
                      </span>
                    </div>
                    <div className="flex justify-between text-gray-500 dark:text-gray-400">
                      <span>Year:</span>
                      <span className="text-black dark:text-white">
                        {/* {convertDatetimeToUTCFullYear(inventory.mfd) || ""} */}
                        {inventory.mfd}
                      </span>
                    </div>
                    <div className="flex justify-between text-gray-500 dark:text-gray-400">
                      <span>Price:</span>
                      <span className="text-black dark:text-white font-semibold">{formatPrice(inventory.price) || ""}</span>
                    </div>
                  </div>
                  {inventory.warranty && (
                    <Badge
                      className="mb-2 w-fit"
                      color="success"
                    >
                      {convertMonthsToYears(inventory.warranty)}
                    </Badge>
                  )}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedInventory(inventory)}
                      className="flex-1"
                    >
                      <Eye className="w-3 h-3 mr-1" />
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditInventory(inventory)}
                      className="flex-1"
                    >
                      <Edit className="w-3 h-3 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline-error"
                      size="sm"
                      onClick={() => {
                        setDeletingInventory(inventory.partId);
                        setShowConfirm(true);
                      }}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {totalPages >= 0 && (
            <div className="flex items-center justify-between mt-0 py-2">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                {Math.min(currentPage * itemsPerPage, filteredInventories.length)} of {filteredInventories.length} inventories
              </div>
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <Button
                      key={page}
                      variant={page === currentPage ? "primary" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </Button>
                  ))}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* List View */}
      {viewMode === "list" && (
        <div className="flex-1 overflow-auto flex flex-col">
          <div className="p-6 space-y-2 flex-1">
            {paginatedInventories.map(inventory => (
              <div
                key={inventory.id}
                className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-lg p-4 hover:border-gray-200 dark:hover:border-gray-700 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-black dark:text-white font-semibold">{language === "th" && inventory.th || inventory.en || ""}</h3>
                    </div>
                    <div className="grid grid-cols-4 gap-4 text-sm text-gray-500 dark:text-gray-400">
                      <div>
                        <span className="text-gray-400 dark:text-gray-500">Brand: </span>
                        {language === "th" &&
                          brands.find(brand => brand.brandId === inventory.brandId)?.th ||
                          brands.find(brand => brand.brandId === inventory.brandId)?.en
                        || ""}
                      </div>
                      <div>
                        <span className="text-gray-400 dark:text-gray-500">Year: </span>
                        {new Date(inventory.mfd).getUTCFullYear() || ""}
                      </div>
                      <div>
                        <span className="text-gray-400 dark:text-gray-500">Price: </span>
                        {formatPrice(inventory.price) || ""}
                      </div>
                      <div>
                        <span className="text-gray-400 dark:text-gray-500">Warranty: </span>
                        {convertMonthsToYears(inventory.warranty || 0)}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedInventory(inventory)}
                    >
                      <Eye className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditInventory(inventory)}
                    >
                      <Edit className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="outline-error"
                      size="sm"
                      onClick={() => {
                        setDeletingInventory(inventory.partId);
                        setShowConfirm(true);
                      }}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {totalPages >= 0 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 dark:border-gray-800">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                {Math.min(currentPage * itemsPerPage, filteredInventories.length)} of {filteredInventories.length} inventories
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <Button
                      key={page}
                      variant={page === currentPage ? "primary" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </Button>
                  ))}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}

export default InventoryView;
