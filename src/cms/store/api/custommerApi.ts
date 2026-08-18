import { FormManager } from "@/cms/components/interface/FormField";
import { ApiResponse } from "@/cms/types";
import { AddCustomer, CustomerFormConfigType, AddressConfig } from "@/cms/types/customer";
// import { useTranslation } from "@/core/hooks/useTranslation";
import { useTranslation as UseTranslation } from "@/core/hooks/useTranslation";
import { baseWelcomeCrmApi } from "@/core/store/api/baseApi";

export interface Customer {
  id: string;
  orgId: string;
  displayName: string;
  title: string;
  firstName: string;
  middleName: string;
  lastName: string;
  citizenId: string;
  dob: string;
  blood: string;
  gender: string;
  mobileNo: string;
  address: Address;
  currentAddress?: Address;
  landline?: string;
  photo: string;
  email: string;
  userType: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
  note?: string;
  languagePreference?: string;
  contractPreference?: string;
  dynamicForm?: FormManager
}

export interface CustomerProduct {
  id: string;
  displayName: string;
  title: string;
  firstName: string;
  middleName: string;
  lastName: string;
  mobileNo: string;
  photo: string;
  email: string;
  userType: string;
  active: boolean;
  product: number;
  service: number;
}

export interface Address {
  no?: string;
  lat?: string;
  lon?: string;
  road?: string;
  room?: string;
  floor?: string;
  street?: string;
  country?: string;
  building?: string;
  district?: string;
  province?: string;
  postalCode?: string;
  subDistrict?: string;
}

export function mergeAddress(address: Address, config?: AddressConfig): string {
  const addressParts: string[] = [];
  // const { t } = useTranslation();
  const { t } = UseTranslation();

  const isEnabled = (key: keyof AddressConfig) => {
    return !config || config[key] !== false;
  };

  // House/Building number
  if (address.no && isEnabled("no")) {
    addressParts.push(address.no);
  }

  // Room and Floor
  const roomEnabled = isEnabled("room");
  const floorEnabled = isEnabled("floor");
  if (address.room && roomEnabled && address.floor && floorEnabled) {
    addressParts.push(`${t("common.room")} ${address.room}, ${t("common.floor")} ${address.floor}`);
  } else if (address.room && roomEnabled) {
    addressParts.push(`${t("common.room")} ${address.room}`);
  } else if (address.floor && floorEnabled) {
    addressParts.push(`${t("common.floor")} ${address.floor}`);
  }

  // Building name
  if (address.building && isEnabled("building")) {
    addressParts.push(address.building);
  }

  // Street or Road (handle both, prioritize the one with value)
  if (address.street && isEnabled("street")) {
    addressParts.push(address.street);
  } else if (address.road && isEnabled("road")) {
    addressParts.push(address.road);
  }

  // Sub-district
  if (address.subDistrict && isEnabled("subDistrict")) {
    addressParts.push(address.subDistrict);
  }

  // District
  if (address.district && isEnabled("district")) {
    addressParts.push(address.district);
  }

  // Province
  if (address.province && isEnabled("province")) {
    addressParts.push(address.province);
  }

  // Postal Code
  if (address.postalCode && isEnabled("postalCode")) {
    addressParts.push(address.postalCode);
  }

  // Country
  if (address.country && isEnabled("country")) {
    addressParts.push(address.country);
  }

  return addressParts.join(', ');
}

export interface PaginationParams {
  start?: number;
  length?: number;
}

export const customerApi = baseWelcomeCrmApi.injectEndpoints({
  endpoints: (builder) => ({

    getCustommers: builder.query<ApiResponse<Customer[]>, PaginationParams>({
      query: (params) => ({
        url: "/customer",
        params,
      }),
      providesTags: ["Customer"],
    }),

    getCustomer: builder.query<ApiResponse<Customer>, string>({
      query: (id) => `/customer/${id}`,
      providesTags: (_result, _error, id) => [{ type: "Customer", id }],
    }),

    getCustommersProduct: builder.query<ApiResponse<CustomerProduct[]>, PaginationParams & { type?: string, active?: boolean, search?: string }>({
      query: (params) => ({
        url: "/customer_product",
        params,
      }),
      providesTags: ["Customer"],
      keepUnusedDataFor: 0,
    }),

    getCustommerByPhoneNo: builder.query<ApiResponse<Customer>, { id: string, phoneNo?: string }>({
      query: (params) => ({
        url: `/customer/byPhoneNo/${params?.phoneNo || params.id}`,
        params,
      }),
      providesTags: ["Customer"],
    }),

    getCustomerById: builder.query<ApiResponse<Customer>, { id: number }>({
      query: params => ({
        url: `/customer/${params.id}`,
        params,
      }),
      providesTags: ["Customer"]
    }),

    getCustommerByPhoneNoMutation: builder.mutation<ApiResponse<Customer>, { id: string, phoneNo?: string }>({
      query: (params) => ({
        url: `/customer/byPhoneNo/${params?.phoneNo || params.id}`,
        params,
      }),
      invalidatesTags: ["Customer"],
    }),

    insertCustommers: builder.query<ApiResponse<null>, AddCustomer>({
      query: (data) => ({
        url: "/customer/add",
        body: data,
        method: "POST"
      }),
      providesTags: ["Customer"],
    }),


    insertCustommersMutation: builder.mutation<ApiResponse<null>, AddCustomer>({
      query: (data) => ({
        url: "/customer/add",
        body: data,
        method: "POST"
      }),
      invalidatesTags: ["Customer"],
    }),

    updateCustommersMutation: builder.mutation<ApiResponse<null>, { id: string; data: AddCustomer }>({
      query: ({ id, data }) => ({
        url: `/customer/${id}`,
        body: data,
        method: "PATCH"
      }),
      invalidatesTags: ["Customer"],
    }),

    deleteCustommersMutation: builder.mutation<ApiResponse<null>, { id: string }>({
      query: ({ id }) => ({
        url: `/customer/${id}`,
        method: "DELETE"
      }),
      invalidatesTags: ["Customer"],
    }),

    deleteCustommers: builder.query<ApiResponse<null>, { id: string }>({
      query: ({ id }) => ({
        url: `/customer/${id}`,
        method: "DELETE"
      }),
      providesTags: ["Customer"],
    }),

    getCustomerFormConfig: builder.query<ApiResponse<CustomerFormConfigType>, void>({
      query: () => "/customer_form_config",
      providesTags: ["Customer"],
    }),

    updateCustomerFormConfigMutation: builder.mutation<ApiResponse<null>, CustomerFormConfigType>({
      query: (data) => ({
        url: "/customer_form_config",
        body: data,
        // method: "PUT",
        method: "POST",
      }),
      invalidatesTags: ["Customer"],
    }),

  }),
});
export const {
  useGetCustommersQuery,
  useGetCustommerByPhoneNoQuery,
  useLazyGetCustommerByPhoneNoQuery,
  useGetCustomerByIdQuery,
  useLazyGetCustomerByIdQuery,
  useLazyGetCustommersQuery,
  useGetCustommerByPhoneNoMutationMutation,
  useGetCustomerQuery,
  useLazyGetCustomerQuery,
  useGetCustommersProductQuery,
  useLazyGetCustommersProductQuery,
  useInsertCustommersMutationMutation,
  useUpdateCustommersMutationMutation,
  useInsertCustommersQuery,
  useLazyInsertCustommersQuery,
  useGetCustomerFormConfigQuery,
  useUpdateCustomerFormConfigMutationMutation,
  useDeleteCustommersMutationMutation,
  useDeleteCustommersQuery,
  useLazyDeleteCustommersQuery,
  useLazyGetCustomerFormConfigQuery
} = customerApi;
