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
  Property, UnitPropertyQueryParams,
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

    // GET /mdm/units/properties/{unitId}
    // Read-only: the backend exposes no create/update/delete for the unit-property
    // relationship, and MmdUnitInput carries no property field - so assignments can be
    // displayed but not edited from the client. The path param is the unitId business
    // code (e.g. "UNIT-001"), not the numeric/UUID id.
    getUnitProperties: builder.query<ApiResponse<Property[]>, UnitPropertyQueryParams>({
      query: ({ id, start = 0, length = 100 }) => {
        const searchParams = new URLSearchParams({ start: String(start), length: String(length) });
        return `/mdm/units/properties/${id}?${searchParams.toString()}`;
      },
      providesTags: (_result, _error, { id }) => [{ type: "Unit", id }],
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
  useGetUnitPropertiesQuery,
  useGetCompaniesQuery,
  useGetSourcesQuery,
  useGetUnitStatusesQuery,
  useGetUnitTypesQuery
} = unitApi;
