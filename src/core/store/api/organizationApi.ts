// src/core/store/api/organizationApi.ts
/**
 * Organization Management API Endpoints
 * Admin organization management
 */
import { baseApi } from "@/core/store/api/baseApi";
import type { ApiResponse } from "@/core/types";
import type {
  Department, DepartmentCreateData, DepartmentUpdateData,
  Command, CommandCreateData, CommandUpdateData,
  Station, StationCreateData, StationUpdateData,
  Organization, OrganizationQueryParams
} from "@/core/types/organization";

export const organizationApi = baseApi.injectEndpoints({
  endpoints: builder => ({
    // ===================================================================
    // Department
    // ===================================================================

    // POST api/v1/departments/add
    createDepartments: builder.mutation<ApiResponse<Department>, DepartmentCreateData>({
      query: data => ({
        url: "/departments/add",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Organization"],
    }),

    // GET api/v1/departments
    getDepartments: builder.query<ApiResponse<Department[]>, OrganizationQueryParams>({
      query: params => {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined) {
            searchParams.append(key, String(value));
          }
        });
        return `/departments?${searchParams.toString()}`;
      },
      providesTags: ["Organization"],
    }),

    // GET api/v1/departments/{id}
    getDepartmentsById: builder.query<ApiResponse<Department>, string | number>({
      query: id => `/departments/${id}`,
      providesTags: ["Organization"],
    }),

    // PATCH api/v1/departments/{id}
    updateDepartments: builder.mutation<ApiResponse<Department>, { id: string; data: DepartmentUpdateData }>({
      query: ({ id, data }) => ({
        url: `/departments/${id}`,
        method: "PATCH",
        body: data
      }),
      invalidatesTags: ["Organization"]
    }),

    // DELETE api/v1/departments/{id}
    deleteDepartments: builder.mutation<ApiResponse<void>, string | number>({
      query: id => ({
        url: `/departments/${id}`,
        method: "DELETE"
      }),
      invalidatesTags: ["Organization"],
    }),

    // ===================================================================
    // Command
    // ===================================================================

    // POST api/v1/commands/add
    createCommands: builder.mutation<ApiResponse<Command>, CommandCreateData>({
      query: data => ({
        url: "/commands/add",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Organization"],
    }),

    // GET api/v1/commands
    getCommands: builder.query<ApiResponse<Command[]>, OrganizationQueryParams>({
      query: params => {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined) {
            searchParams.append(key, String(value));
          }
        });
        return `/commands?${searchParams.toString()}`;
      },
      providesTags: ["Organization"],
    }),

    // GET api/v1/commands/{id}
    getCommandsById: builder.query<ApiResponse<Command>, string | number>({
      query: id => `/commands/${id}`,
      providesTags: ["Organization"],
    }),

    // PATCH api/v1/commands/{id}
    updateCommands: builder.mutation<ApiResponse<Command>, { id: string; data: CommandUpdateData }>({
      query: ({ id, data }) => ({
        url: `/commands/${id}`,
        method: "PATCH",
        body: data
      }),
      invalidatesTags: ["Organization"]
    }),

    // DELETE api/v1/commands/{id}
    deleteCommands: builder.mutation<ApiResponse<void>, string | number>({
      query: id => ({
        url: `/commands/${id}`,
        method: "DELETE"
      }),
      invalidatesTags: ["Organization"],
    }),

    // ===================================================================
    // Station
    // ===================================================================

    // POST api/v1/stations/add
    createStations: builder.mutation<ApiResponse<Station>, StationCreateData>({
      query: data => ({
        url: "/stations/add",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Organization"],
    }),

    // GET api/v1/stations
    getStations: builder.query<ApiResponse<Station[]>, OrganizationQueryParams>({
      query: params => {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined) {
            searchParams.append(key, String(value));
          }
        });
        return `/stations?${searchParams.toString()}`;
      },
      providesTags: ["Organization"],
    }),

    // GET api/v1/stations/{id}
    getStationsById: builder.query<ApiResponse<Station>, string | number>({
      query: id => `/stations/${id}`,
      providesTags: ["Organization"],
    }),

    // PATCH api/v1/stations/{id}
    updateStations: builder.mutation<ApiResponse<Station>, { id: string; data: StationUpdateData }>({
      query: ({ id, data }) => ({
        url: `/stations/${id}`,
        method: "PATCH",
        body: data
      }),
      invalidatesTags: ["Organization"]
    }),

    // DELETE api/v1/stations/{id}
    deleteStations: builder.mutation<ApiResponse<void>, string | number>({
      query: id => ({
        url: `/stations/${id}`,
        method: "DELETE"
      }),
      invalidatesTags: ["Organization"],
    }),

    // ===================================================================
    // Department + Command + Station
    // ===================================================================
    
    // GET api/v1/department_command_stations
    getOrganizations: builder.query<ApiResponse<Organization[]>, null>({
      query: () => "/department_command_stations",
      providesTags: ["Organization"],
    }),
  }),
  // Vite HMR re-runs this module without a full page reload, which calls injectEndpoints a
  // second time. Without this, RTK Query keeps the definitions registered by the previous
  // run and an edit to a `query` silently has no effect until the page is reloaded.
  overrideExisting: import.meta.env.DEV,
});

export const {
  // department
  useCreateDepartmentsMutation,
  useGetDepartmentsQuery,
  useGetDepartmentsByIdQuery,
  useUpdateDepartmentsMutation,
  useDeleteDepartmentsMutation,
  // command
  useCreateCommandsMutation,
  useGetCommandsQuery,
  useGetCommandsByIdQuery,
  useUpdateCommandsMutation,
  useDeleteCommandsMutation,
  // station
  useCreateStationsMutation,
  useGetStationsQuery,
  useGetStationsByIdQuery,
  useUpdateStationsMutation,
  useDeleteStationsMutation,
  // organization
  useGetOrganizationsQuery
} = organizationApi;
