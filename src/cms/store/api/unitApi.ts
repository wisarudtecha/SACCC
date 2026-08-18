// /src/store/api/unitApi.ts
/**
 * Unit Management API Endpoints
 * Admin unit management
 */
import { baseApi } from "@/core/store/api/baseApi";
import type { ApiResponse } from "@/core/types";
import type {
  Unit, UnitQueryParams, UnitUpdateData,
  UnitStatus, UnitStatusQueryParams,
  UnitType, UnitTypeQueryParams,
  Company, CompanyQueryParams,
  Property, PropertyQueryParams,
  Source, SourceQueryParams,
} from "@/cms/types/unit";

export const unitApi = baseApi.injectEndpoints({
  endpoints: builder => ({
    createUnits: builder.mutation<ApiResponse<Unit>, UnitUpdateData>({
      query: data => ({
        url: "/mdm/units/add",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["User"],
    }),

    getUnits: builder.query<ApiResponse<Unit[]>, UnitQueryParams>({
      query: params => {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined) {
            searchParams.append(key, String(value));
          }
        });
        return `/mdm/units?${searchParams.toString()}`;
      },
      providesTags: ["Unit"],
    }),

    getUnitsById: builder.query<ApiResponse<Unit[]>, number>({
      query: id => `/mdm/units/${id}`,
      providesTags: (_result, _error, id) => [{ type: "Unit", id }],
    }),

    updateUnits: builder.mutation<ApiResponse<Unit>, { id: number; data: UnitUpdateData }>({
      query: ({ id, data }) => ({
        url: `/mdm/units/${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: "Unit", id }],
    }),

    deleteUnits: builder.mutation<ApiResponse<void>, number>({
      query: id => ({
        url: `/mdm/units/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Unit"],
    }),

    getCompanies: builder.query<ApiResponse<Company[]>, CompanyQueryParams>({
      query: params => {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined) {
            searchParams.append(key, String(value));
          }
        });
        return `/mdm/companies?${searchParams.toString()}`;
      },
      providesTags: ["Unit"],
    }),

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
      providesTags: ["Unit"],
    }),

    getSources: builder.query<ApiResponse<Source[]>, SourceQueryParams>({
      query: params => {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined) {
            searchParams.append(key, String(value));
          }
        });
        return `/mdm/sources?${searchParams.toString()}`;
      },
      providesTags: ["Unit"],
    }),

    getUnitStatuses: builder.query<ApiResponse<UnitStatus[]>, UnitStatusQueryParams>({
      query: ({ start, length }) => ({
        url: `/mdm/status`,
        method: "GET",
        params: { start, length },
      }),
      providesTags: ["Unit"],
    }),

    getUnitTypes: builder.query<ApiResponse<UnitType[]>, UnitTypeQueryParams>({
      query: ({ start, length }) => ({
        url: `/mdm/types`,
        method: "GET",
        params: { start, length },
      }),
      providesTags: ["Unit"],
    })
  }),
});

export const {
  useCreateUnitsMutation,
  useGetUnitsQuery,
  useGetUnitsByIdQuery,
  useUpdateUnitsMutation,
  useDeleteUnitsMutation,
  useGetCompaniesQuery,
  useGetPropertiesQuery,
  useGetSourcesQuery,
  useGetUnitStatusesQuery,
  useGetUnitTypesQuery
} = unitApi;
