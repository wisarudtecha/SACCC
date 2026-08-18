// /src/store/api/productApi.ts
/**
 * Product Management API Endpoints
 * Product CRUD operations, etc.
 */


import { ProductByCustomerIdReq } from "@/cms/types/customerProduct";
import { Product, ProductUpdateData } from "@/cms/types/product";
import { baseWelcomeCrmApi } from "@/core/store/api/baseApi";
import { ApiResponse } from "@/core/types";


export interface AddProductData {
    productId: string,
    purchaseDate: string,
    serialNumber: string,
    storeId?: string
}

export interface StoreMini {
    en: string;
    th: string;
    discount: number;
    storeId: string;
}

export interface ProductMini {
    id: string;
    productId: string;
    image:string;
    en: string;
    th: string;
}

export interface CustomerProductList {
    id: string;
    productId: string;
    serialNumber: string;
    store: StoreMini;
    product: ProductMini;
    purchaseDate: string;
    endWarrantyDate: string;
}



export const customerProductApi = baseWelcomeCrmApi.injectEndpoints({

    endpoints: builder => ({
        getCustomerProduct: builder.query<ApiResponse<CustomerProductList[]>, ProductByCustomerIdReq>({
            query: (params) => {
                const { customerId, ...rest } = params;
                return {
                    url: `/customer_product/${customerId}`,
                    method: "GET",
                    params: rest,
                };
            },
            providesTags: ["Product"],
        }),

        // POST api/v1/product
        addCustomerProduct: builder.mutation<ApiResponse<null>, AddProductData & { customerId: string }>({
            query: data => ({
                url: "/customer_product/add",
                method: "POST",
                body: data,
            }),
            invalidatesTags: ["Product"],
        }),

        // PUT api/v1/product/{productId}
        updateProduct: builder.mutation<ApiResponse<Product>, { productId: string; data: ProductUpdateData }>({
            query: ({ productId, data }) => ({
                url: `/product/${productId}`,
                method: "PATCH",
                body: data
            }),
            invalidatesTags: ["Product"],
        }),

        // DELETE api/v1/product/{productId}
        deleteProduct: builder.mutation<ApiResponse<void>, string>({
            query: productId => ({
                url: `/product/${productId}`,
                method: "DELETE"
            }),
            invalidatesTags: ["Product"],
        }),
    }),
});

export const {
    useAddCustomerProductMutation,
    useGetCustomerProductQuery
} = customerProductApi;
