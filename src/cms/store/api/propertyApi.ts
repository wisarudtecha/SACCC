// /src/store/api/propertyApi.ts
/**
 * Property Management API Endpoints
 * Admin MDM property management
 */
import { baseApi } from "@/core/store/api/baseApi";
import type { ApiResponse } from "@/core/types";
import type {
  Property, PropertyCreateData, PropertyQueryParams, PropertyUpdateData,
} from "@/cms/types/unit";

export const propertyApi = baseApi.injectEndpoints({
  endpoints: builder => ({
    // POST /mdm/properties/add
    createProperty: builder.mutation<ApiResponse<Property>, PropertyCreateData>({
      query: data => ({
        url: "/mdm/properties/add",
        method: "POST",
        body: data,
      }),
      // providesTags: ["Unit"],
    }),

    // GET /mdm/properties
    getProperties: builder.query<ApiResponse<Property[]>, PropertyQueryParams>({
      query: params => {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined) {
            searchParams.append(key, String(value));
          }
        });
        return `/mdm/properties?${searchParams.toString()}`;
      },
      // providesTags: ["Unit"],
    }),

    // GET /mdm/properties/{id}
    getPropertyById: builder.query<ApiResponse<Property>, string>({
      query: id => `/mdm/properties/${id}`,
      // providesTags: ["Unit"],
    }),

    // PATCH /mdm/properties/{id}
    updateProperty: builder.mutation<ApiResponse<Property>, { id: string; data: PropertyUpdateData }>({
      query: ({ id, data }) => ({
        url: `/mdm/properties/${id}`,
        method: "PATCH",
        body: data,
      }),
      // providesTags: ["Unit"],
    }),

    // DELETE /mdm/properties/{id}
    deleteProperty: builder.mutation<ApiResponse<void>, string>({
      query: id => ({
        url: `/mdm/properties/${id}`,
        method: "DELETE",
      }),
      // providesTags: ["Unit"],
    }),
  }),
  // Vite HMR re-runs this module without a full page reload, which calls injectEndpoints a
  // second time. Without this, RTK Query keeps the definitions registered by the previous
  // run and an edit to a `query` silently has no effect until the page is reloaded.
  overrideExisting: import.meta.env.DEV,
});

export const {
  useCreatePropertyMutation,
  useGetPropertiesQuery,
  useGetPropertyByIdQuery,
  useUpdatePropertyMutation,
  useDeletePropertyMutation,
} = propertyApi;
