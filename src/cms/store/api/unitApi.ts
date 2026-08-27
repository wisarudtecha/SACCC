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
  UnitProperty, UnitPropertyQueryParams, UnitPropertyBulkAssignData,
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
    // Returns UnitProperty JOIN rows, NOT Property records - the display name is nested
    // under propMetaData, so reading item.en/item.th here yields undefined. The path param
    // is the unitId business code (e.g. "UNIT-001"), not the numeric id, and so is the one
    // bulkAssignUnitProperties writes with. The tag is namespaced "properties-" so that
    // shared code space cannot collide with getUnitsById's numeric { type: "Unit", id } tag.
    getUnitProperties: builder.query<ApiResponse<UnitProperty[]>, UnitPropertyQueryParams>({
      query: ({ id, start = 0, length = 100 }) => {
        const searchParams = new URLSearchParams({ start: String(start), length: String(length) });
        return `/mdm/units/properties/${id}?${searchParams.toString()}`;
      },
      providesTags: (_result, _error, { id }) => [{ type: "Unit", id: `properties-${id}` }],
    }),

    // POST /mdm/units/properties/{unitId}/bulk
    // Replaces a unit's whole property set in one request (an empty propIds clears it).
    // Keyed on the unitId business code, same as getUnitProperties above - so the tag it
    // invalidates is exactly the one that query provides. (The GraphQL sample in
    // src/cms/mocks/mdmCURL.sh shows a numeric "112" here; that sample value is stale.)
    bulkAssignUnitProperties: builder.mutation<ApiResponse<void>, UnitPropertyBulkAssignData>({
      query: ({ id, propIds }) => ({
        url: `/mdm/units/properties/${id}/bulk`,
        method: "POST",
        body: { propIds },
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: "Unit", id: `properties-${id}` }],
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
  useBulkAssignUnitPropertiesMutation,
  useGetCompaniesQuery,
  useGetSourcesQuery,
  useGetUnitStatusesQuery,
  useGetUnitTypesQuery
} = unitApi;
