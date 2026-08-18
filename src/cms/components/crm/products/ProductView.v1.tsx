// src/cms/components/crm/products/ProductView.v1.tsx
"use client"

import { useEffect, useMemo, useState } from "react";
import { Plus, Grid3x3, List, Edit, Trash2, Eye, X } from "lucide-react";
import { ToastContainer } from "@/core/components/crud/ToastContainer";
import { useToast } from "@/core/hooks/useToast";
import { useTranslation } from "@/core/hooks/useTranslation";
import { useReadBrandQuery } from "@/cms/store/api/brandApi";
import { useReadCategoryQuery } from "@/cms/store/api/categoryApi";
import {
  useReadProductQuery,
  // useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation
} from "@/cms/store/api/productApi";
import { convertDatetimeToUTCFullYear, convertMonthsToYears, formatPrice } from "@/cms/utils/productHelper";
import type { Brand } from "@/cms/types/brand";
import type { Category } from "@/cms/types/category";
import type {
  Product,
  ProductCreateData,
  ProductUpdateData
} from "@/cms/types/product";
import ProductForm from "@/cms/components/crm/products/ProductForm";
import Input from "@/core/components/form/input/InputField";
import Badge from "@/core/components/ui/badge/Badge";
import Button from "@/core/components/ui/button/Button";

const ProductView = () => {
  const { toasts, addToast, removeToast } = useToast();
  const {
    language,
    // t
  } = useTranslation();

  const itemsPerPage = 6;
  
  // const [actionConfirm, setActionConfirm] = useState<{ type: string, id: string}>();
  // const [brands, setBrands] = useState<Brand[]>([]);
  // const [categories, setCategories] = useState<Category[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [deletingProduct, setDeletingProduct] = useState("");
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedImage, setSelectedImage] = useState<{attUrl: string, attName: string} | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [viewMode, setViewMode] = useState("grid");

  // const [createProduct] = useCreateProductMutation();
  const [updateProduct] = useUpdateProductMutation();
  const [deleteProduct] = useDeleteProductMutation();
  
  const {
    data: brand,
    // brandIsLoading,
    // brandIsError
  } = useReadBrandQuery({ start: 0, length: 100, type: "product" });

  const {
    data: category,
    // categoryIsLoading,
    // categoryIsError
  } = useReadCategoryQuery({ start: 0, length: 100, type: "product" });
  
  const {
    data: product,
    // productIsLoading,
    // productIsError
  } = useReadProductQuery({ start: 0, length: 10 });

  const brands: Brand[] = brand?.data || [];
  const categories: Category[] = category?.data || [];
  // const products: Product[] = product?.data || [];
  
  // const filteredProducts = products.filter(
  //   (p) =>
  //     p.th.toLowerCase().includes(searchTerm.toLowerCase()) ||
  //     p.en.toLowerCase().includes(searchTerm.toLowerCase()) ||
  //     p.productCode.toLowerCase().includes(searchTerm.toLowerCase()),
  // );
  const filteredProducts = useMemo(() => {
    // const products: Product[] = product?.data || [];

    if (!products?.length) {
      return [];
    }
    const term = searchTerm.toLowerCase();
    return products.filter(p =>
      p.th?.toLowerCase().includes(term) ||
      p.en?.toLowerCase().includes(term) ||
      p.productCode?.toLowerCase().includes(term)
    );
  }, [
    // product?.data,
    products,
    searchTerm
  ]);

  // const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const totalPages = useMemo(() => Math.ceil(filteredProducts.length / itemsPerPage), [filteredProducts]);

  // const paginatedProducts = filteredProducts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const paginatedProducts = useMemo(() => filteredProducts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage), [filteredProducts, currentPage]);

  const handleAddProduct = async (
    // formData: ProductCreateData | ProductUpdateData
  ) => {
    // const newProduct = {
    //   id: `P${String(products.length + 1).padStart(3, "0")}`,
    //   ...formData,
    // };
    // setProducts([...products, newProduct]);

    setLoading(true);
    try {
      // const response = await createProduct(formData).unwrap();
      // const data = new FormData();
      // data.append("th", formData.th);
      // data.append("en", formData.en);
      // data.append("categoryId", formData.categoryId);
      // data.append("brandId", formData.brandId);
      // data.append("productCode", formData.productCode);
      // data.append("mfd", `${formData.mfd}:00Z`);
      // data.append("warranty", String(formData.warranty));
      // data.append("price", String(formData.price));
      // data.append("active", String(formData.active));
      // if (formData.file) {
      //   data.append("file", formData.file);
      // }
      // const response = await createProduct(data).unwrap();
      
      // if (response?.status) {
      //   addToast("success", "Product created successfully.");
      // }
      // else {
      //   addToast("error", "Product create failed, please try again.");
      // }
    }
    catch (err) {
      addToast("error", `An error occurred while creating the product, ${err}`);
    }
    finally {
      setLoading(false);
    }
    setShowForm(false);
  }

  const handleDeleteProduct = async (id: string) => {
    // setProducts(products.filter((p) => p.id !== id));

    setLoading(true);
    try {
      const response = await deleteProduct(id).unwrap();
      if (response?.status) {
        addToast("success", "Product deleted successfully.");
      }
      else {
        addToast("error", "Product delete failed, please try again.");
      }
    }
    catch (err) {
      addToast("error", `An error occurred while deleting the product, ${err}`);
    }
    finally {
      setLoading(false);
    }
  }

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setShowEditModal(true);
  }

  const handleUpdateProduct = async (formData: ProductCreateData | ProductUpdateData) => {
    if (editingProduct) {
      setLoading(true);
      // setProducts(products.map((p) => (p.id === editingProduct.id ? { ...p, ...formData } as Product : p)));
      try {
        const response = await updateProduct({ productId: editingProduct.productId, data: formData as ProductUpdateData }).unwrap();
        if (response?.status) {
          addToast("success", "Product updated successfully.");
        }
        else {
          addToast("error", "Product update failed, please try again.");
        }
      }
      catch (err) {
        addToast("error", `An error occurred while updating the product, ${err}`);
      }
      finally {
        setLoading(false);
      }
    }
    setShowEditModal(false);
    setEditingProduct(null);
  }

  // useEffect(() => {
  //   setBrands(brand?.data || []);
  // }, [brand]);

  // useEffect(() => {
  //   setCategories(category?.data || []);
  // }, [category]);

  useEffect(() => {
    if (!product) {
      setLoading(true);
    }
    else {
      setLoading(false);
    }

    setProducts(product?.data || []);
  }, [product]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white dark:bg-black h-full">
        <p className="text-gray-500 dark:text-gray-400">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-black h-full cursor-default">
      {showEditModal && editingProduct && (
        // <div className="fixed inset-0 bg-white dark:bg-black/70 flex items-center justify-center z-9999">
        //   <div className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        //     <div className="flex items-center justify-between mb-4">
        //       <h2 className="text-2xl font-semibold text-black dark:text-white">Edit Product</h2>
        //       <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-white">
        //         <X className="w-6 h-6" />
        //       </button>
        //     </div>
        //     <ProductForm
        //       onSubmit={handleUpdateProduct}
        //       onCancel={() => setShowEditModal(false)}
        //       initialValues={editingProduct}
        //       brands={brands}
        //       categories={categories}
        //     />
        //   </div>
        // </div>

        <ProductForm
          onSubmit={handleUpdateProduct}
          onCancel={() => setShowEditModal(false)}
          // initialValues={editingProduct}
          formLoading={loading}
          categories={categories}
          brands={brands}
        />
      )}

      {selectedProduct && (
        <div className="fixed inset-0 bg-white dark:bg-black/70 flex items-center justify-center z-9999">
          <div className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-semibold text-black dark:text-white">Product Details</h2>
              <button onClick={() => setSelectedProduct(null)} className="text-gray-400 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="h-64 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center mb-4 overflow-hidden">
                <img
                  src={`${selectedProduct.attachment?.attUrl || "/images/crm/placeholder.svg"}`}
                  alt={selectedProduct.attachment?.attName || (language === "th" && selectedProduct.th || selectedProduct.en || "")}
                  className="w-full h-full object-cover cursor-pointer"
                  onClick={() => setSelectedImage({attUrl: selectedProduct.attachment?.attUrl || "", attName: selectedProduct.attachment?.attName || ""})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-gray-500 dark:text-gray-400 text-sm">Product Name</label>
                  <p className="text-black dark:text-white font-semibold">{language === "th" && selectedProduct.th || selectedProduct.en || ""}</p>
                </div>
                <div>
                  <label className="text-gray-500 dark:text-gray-400 text-sm">Product Code</label>
                  <p className="text-black dark:text-white font-semibold">{selectedProduct.productCode || ""}</p>
                </div>
                <div>
                  <label className="text-gray-500 dark:text-gray-400 text-sm">Category</label>
                  <p className="text-black dark:text-white">
                    {language === "th" &&
                      categories.find(category => category.categoryId === selectedProduct.categoryId)?.th ||
                      categories.find(category => category.categoryId === selectedProduct.categoryId)?.en
                    || ""}
                  </p>
                </div>
                <div>
                  <label className="text-gray-500 dark:text-gray-400 text-sm">Brand</label>
                  <p className="text-black dark:text-white">
                    {language === "th" &&
                      brands.find(brand => brand.brandId === selectedProduct.brandId)?.th ||
                      brands.find(brand => brand.brandId === selectedProduct.brandId)?.en
                    || ""}
                  </p>
                </div>
                <div>
                  <label className="text-gray-500 dark:text-gray-400 text-sm">Year</label>
                  <p className="text-black dark:text-white">{convertDatetimeToUTCFullYear(selectedProduct.mfd) || ""}</p>
                </div>
                <div>
                  <label className="text-gray-500 dark:text-gray-400 text-sm">Price</label>
                  <p className="text-black dark:text-white font-semibold">{formatPrice(selectedProduct.price) || ""}</p>
                </div>
                <div className="col-span-2">
                  <label className="text-gray-500 dark:text-gray-400 text-sm">Warranty</label>
                  {selectedProduct.warranty && (
                    <p className="text-black dark:text-white">
                      {convertMonthsToYears(selectedProduct.warranty)}
                    </p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex gap-2 justify-start pt-4">
                  <Button
                    variant="outline-error"
                    // onClick={() => setSelectedProduct(null)}
                    size="sm"
                  >
                    Delete
                  </Button>
                </div>
                <div className="flex gap-2 justify-end pt-4">
                  <Button
                    variant="outline"
                    // onClick={() => setSelectedProduct(null)}
                    size="sm"
                  >
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setSelectedProduct(null)}
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
              <h2 className="text-2xl font-semibold text-black dark:text-white">Delete product confirmation</h2>
              <button
                onClick={() => setShowConfirm(false)}
                className="text-gray-400 hover:text-gray-600 absolute top-4 right-4"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="flex mb-4 overflow-hidden">
                Are you sure you want to delete this product? This action cannot be undone.
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
                    handleDeleteProduct(deletingProduct);
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

      {/*
      {showConfirm && (
        <div className="fixed inset-0 bg-white dark:bg-black flex items-center justify-center z-9999">
          <div className="bg-white dark:bg-gray-900 rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto relative">
            <h2 className="text-2xl font-semibold text-black dark:text-white">
              {
                (actionConfirm?.type === "create" ? "Create" : "") ||
                (actionConfirm?.type === "update" ? "Update" : "") ||
                (actionConfirm?.type === "delete" ? "Delete" : "")
              } product confirmation
            </h2>
            <button
              onClick={() => setShowConfirm(false)}
              className="text-gray-400 hover:text-gray-600 absolute top-4 right-4"
            >
              <X className="w-6 h-6" />
            </button>
            <div className="space-y-4">
              <div className="bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center mb-4 overflow-hidden">
                {
                  (actionConfirm?.type === "create" ? "Please confirm to create product." : "") ||
                  (actionConfirm?.type === "update" ? "Please confirm to update product." : "") ||
                  (actionConfirm?.type === "delete" ? "Are you sure you want to delete this product? This action cannot be undone." : "")
                } 
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
                    if (actionConfirm?.type === "create") {
                      handleAddProduct(editingProduct);
                    }
                    else if (actionConfirm?.type === "update") {
                      handleUpdateProduct(editingProduct);
                    }
                    else if (actionConfirm?.type === "delete") {
                      handleDeleteProduct(actionConfirm?.id);
                    }
                    setShowConfirm(false);
                  }}
                  variant="success"
                  size="sm"
                  className={`${loading ? "disabled cursor-not-allowed" : ""}`}
                  disabled={loading}
                >
                  {
                    (actionConfirm?.type === "create" && loading ? "Saving..." : "") ||
                    (actionConfirm?.type === "update" && loading ? "Saving..." : "") ||
                    (actionConfirm?.type === "delete" && loading ? "Deleting..." : "") ||
                    "Confirm"
                  }
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      */}

      {/* Header */}
      <div className="bg-white dark:bg-gray-800 px-4 py-2">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-semibold text-black dark:text-white">Products</h2>
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

      {/* Product Form Modal */}
      {showForm && (
        <ProductForm
          onSubmit={handleAddProduct}
          onCancel={() => setShowForm(false)}
          formLoading={loading}
          categories={categories}
          brands={brands}
        />
      )}

      {/* Grid View */}
      {viewMode === "grid" && (
        <div className="flex-1 overflow-auto px-4 flex flex-col bg-white dark:bg-gray-800">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 flex-1">
            {paginatedProducts.map(product => (
              <div
                key={product.id}
                className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-lg overflow-hidden hover:border-gray-200 dark:hover:border-gray-700 transition-colors flex flex-col"
              >
                <div className="h-48 bg-gray-100 dark:bg-gray-800 flex items-center justify-center overflow-hidden">
                  <img
                    src={`${product.attachment?.attUrl || "/images/crm/placeholder.svg"}`}
                    alt={product.attachment?.attName || (language === "th" && product.th || product.en || "")}
                    className="w-full h-full object-cover cursor-pointer"
                    onClick={() => setSelectedImage({attUrl: product.attachment?.attUrl || "", attName: product.attachment?.attName || ""})}
                  />
                </div>
                <div className="p-2 flex flex-col flex-1">
                  <h3 className="text-black dark:text-white font-semibold mb-1 min-h-12">{language === "th" && product.th || product.en || ""}</h3>
                  <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">{product.productCode || ""}</p>
                  <div className="space-y-1 mb-2 text-sm flex-1">
                    <div className="flex justify-between text-gray-500 dark:text-gray-400">
                      <span>Brand:</span>
                      <span className="text-black dark:text-white">
                        {language === "th" &&
                          brands.find(brand => brand.brandId === product.brandId)?.th ||
                          brands.find(brand => brand.brandId === product.brandId)?.en
                        || ""}
                      </span>
                    </div>
                    <div className="flex justify-between text-gray-500 dark:text-gray-400">
                      <span>Year:</span>
                      <span className="text-black dark:text-white">{convertDatetimeToUTCFullYear(product.mfd) || ""}</span>
                    </div>
                    <div className="flex justify-between text-gray-500 dark:text-gray-400">
                      <span>Price:</span>
                      <span className="text-black dark:text-white font-semibold">{formatPrice(product.price) || ""}</span>
                    </div>
                  </div>
                  {product.warranty && (
                    <Badge
                      className="mb-2 w-fit"
                      color="success"
                    >
                      {convertMonthsToYears(product.warranty)}
                    </Badge>
                  )}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedProduct(product)}
                      className="flex-1"
                    >
                      <Eye className="w-3 h-3 mr-1" />
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditProduct(product)}
                      className="flex-1"
                    >
                      <Edit className="w-3 h-3 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline-error"
                      size="sm"
                      // onClick={() => handleDeleteProduct(product.id)}
                      onClick={() => {
                        setDeletingProduct(product.productId);
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
                {Math.min(currentPage * itemsPerPage, filteredProducts.length)} of {filteredProducts.length} products
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
            {paginatedProducts.map(product => (
              <div
                key={product.id}
                className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-lg p-4 hover:border-gray-200 dark:hover:border-gray-700 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-black dark:text-white font-semibold">{language === "th" && product.th || product.en || ""}</h3>
                      <Badge className="text-xs">
                        {product.productCode || ""}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-4 gap-4 text-sm text-gray-500 dark:text-gray-400">
                      <div>
                        <span className="text-gray-400 dark:text-gray-500">Brand: </span>
                        {language === "th" &&
                          brands.find(brand => brand.brandId === product.brandId)?.th ||
                          brands.find(brand => brand.brandId === product.brandId)?.en
                        || ""}
                      </div>
                      <div>
                        <span className="text-gray-400 dark:text-gray-500">Year: </span>
                        {new Date(product.mfd).getUTCFullYear() || ""}
                      </div>
                      <div>
                        <span className="text-gray-400 dark:text-gray-500">Price: </span>
                        {formatPrice(product.price) || ""}
                      </div>
                      <div>
                        <span className="text-gray-400 dark:text-gray-500">Warranty: </span>
                        {convertMonthsToYears(product.warranty || 0)}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedProduct(product)}
                    >
                      <Eye className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditProduct(product)}
                    >
                      <Edit className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="outline-error"
                      size="sm"
                      // onClick={() => handleDeleteProduct(product.id)}
                      onClick={() => {
                        setDeletingProduct(product.productId);
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
                {Math.min(currentPage * itemsPerPage, filteredProducts.length)} of {filteredProducts.length} products
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

export default ProductView;
