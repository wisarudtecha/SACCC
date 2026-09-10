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
  Organization, OrganizationQueryParams,
  OrgSettings,
  OrgMapSettings, OrgMapSettingsUpdateData,
  OrgAssignmentRuleSettings, OrgAssignmentRulesUpdateData
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

    // ===================================================================
    // Org settings (org record)
    // ===================================================================
    // GET api/v1/organizations/{orgId}
    //
    // FE contract ahead of the backend: neither this route nor the
    // `incidentRadiusMeters` field exists server-side yet. The nested
    // OrgMapIncidentSettings (getOrgMapSettings below) supersedes this flat
    // field and is now the only runtime reader of the incident radius, so this
    // endpoint currently has no consumer - kept as API surface for the eventual
    // backend. GraphQL environments must first register a GQL_ORG_SETTINGS entry
    // keyed by this url in src/core/utils/gqlMapper.ts (no REST fallback when GraphQL is on).
    getOrgSettings: builder.query<ApiResponse<OrgSettings>, string>({
      query: orgId => ({ url: `/organizations/${orgId}` }),
      providesTags: ["Organization"],
    }),

    // ===================================================================
    // Org map settings (Organization/System Settings -> Map Settings)
    // ===================================================================
    // GET / PATCH api/v1/organizations/{orgId}/map-settings
    //
    // FE contract ahead of the backend: neither route exists server-side yet.
    // A 404 (or a GraphQL error) on GET is expected until it ships -
    // useOrgMapSettings isolates the failure and falls back to schema defaults;
    // a failed PATCH keeps the admin's edits and shows a persistent "not saved"
    // banner. GraphQL environments need the matching GQL_ORG_MAP_SETTINGS entry
    // registered in src/core/store/api/graphql/organizationQueries.ts (no REST
    // fallback when GraphQL is on) - already added so the cut-over is a no-op.
    getOrgMapSettings: builder.query<ApiResponse<OrgMapSettings>, string>({
      query: orgId => ({ url: `/organizations/${orgId}/map-settings` }),
      providesTags: ["Organization"],
    }),

    // PATCH api/v1/organizations/{orgId}/map-settings
    updateOrgMapSettings: builder.mutation<ApiResponse<OrgMapSettings>, { orgId: string; data: OrgMapSettingsUpdateData }>({
      query: ({ orgId, data }) => ({
        url: `/organizations/${orgId}/map-settings`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: ["Organization"],
    }),

    // ===================================================================
    // Org assignment rules (Organization/System Settings -> Assignment Rules)
    // ===================================================================
    // GET / PATCH api/v1/organizations/{orgId}/assignment-rules
    //
    // FE contract ahead of the backend: neither route exists server-side yet.
    // A 404 (or a GraphQL error) on GET is expected until it ships -
    // useOrgAssignmentRules isolates the failure and falls back to schema
    // defaults; a failed PATCH keeps the admin's edits and shows a persistent
    // "not saved" banner. GraphQL environments need the matching entry
    // registered in src/core/store/api/graphql/organizationQueries.ts (no REST
    // fallback when GraphQL is on) - already added so the cut-over is a no-op.
    // Configuration only: no routing/assignment engine consumes these values.
    getOrgAssignmentRules: builder.query<ApiResponse<OrgAssignmentRuleSettings>, string>({
      query: orgId => ({ url: `/organizations/${orgId}/assignment-rules` }),
      providesTags: ["Organization"],
    }),

    // PATCH api/v1/organizations/{orgId}/assignment-rules
    updateOrgAssignmentRules: builder.mutation<ApiResponse<OrgAssignmentRuleSettings>, { orgId: string; data: OrgAssignmentRulesUpdateData }>({
      query: ({ orgId, data }) => ({
        url: `/organizations/${orgId}/assignment-rules`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: ["Organization"],
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
  useGetOrganizationsQuery,
  useGetOrgSettingsQuery,
  useGetOrgMapSettingsQuery,
  useUpdateOrgMapSettingsMutation,
  useGetOrgAssignmentRulesQuery,
  useUpdateOrgAssignmentRulesMutation
} = organizationApi;
