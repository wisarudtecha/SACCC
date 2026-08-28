
import { Product, ProductUpdateData } from "@/cms/types/product";
import { ServiceType } from "@/cms/types/serviceType";
import { baseWelcomeCrmApi } from "@/core/store/api/baseApi";
import { ApiResponse } from "@/core/types";


export const customerServiceApi = baseWelcomeCrmApi.injectEndpoints({
  endpoints: builder => ({


    getCustomerService: builder.query<ApiResponse<ServiceType[]>, { customerId: string, orderBy?: string, direction?: string }>({
      query: (params) => {
        const { customerId, ...rest } = params;
        return {
          url: `/customer_service/${customerId}`,
          method: "GET",
          params: rest,
        };
      },
      providesTags: ["Service"],
    }),

    addCustomerService: builder.mutation<ApiResponse<null>, { serviceId: string, customerId: string, serviceDate: string }>({
      query: data => ({
        url: "/customer_service/add",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Service"],
    }),


    updateProduct: builder.mutation<ApiResponse<Product>, { productId: string; data: ProductUpdateData }>({
      query: ({ productId, data }) => ({
        url: `/service/${productId}`,
        method: "PATCH",
        body: data
      }),
      invalidatesTags: ["Service"],
    }),

    deleteProduct: builder.mutation<ApiResponse<void>, string>({
      query: productId => ({
        url: `/service/${productId}`,
        method: "DELETE"
      }),
      invalidatesTags: ["Service"],
    }),
  }),
  // Vite HMR re-runs this module without a full page reload, which calls injectEndpoints a
  // second time. Without this, RTK Query keeps the definitions registered by the previous
  // run and an edit to a `query` silently has no effect until the page is reloaded.
  overrideExisting: import.meta.env.DEV,
});

export const {
  useAddCustomerServiceMutation,
  useGetCustomerServiceQuery
} = customerServiceApi;
