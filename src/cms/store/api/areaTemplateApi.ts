// src/cms/store/api/areaTemplateApi.ts
/**
 * Area Template API Endpoints
 *
 * Versioned, publishable country/province/district templates carrying polygon
 * geometry, plus the operations that push one into an organization's own area
 * data. Mirrors src/cms/mocks/areaTemplateCURL.sh one-for-one.
 *
 * Response shapes: the curl reference documents a --response-body only for the
 * read operations, so those are typed against real payloads. The lifecycle
 * mutations (publish / fork / sync / from_template / generate_tree) have no
 * documented response and are typed `unknown` rather than guessed at - narrow
 * them once a live response confirms the shape.
 *
 * Every id-only POST here sends an explicit `body: { id }`. buildGraphQLQuery
 * bails out (returns null -> hard error, no REST fallback) on a POST with no
 * body, so omitting it would work under REST and fail only where
 * VITE_USE_GRAPHQL is true. See src/core/utils/gqlMapper.ts.
 */
import { baseApi } from "@/core/store/api/baseApi";
import type { ApiResponse } from "@/core/types";
import type {
  ForkTemplateData,
  FromTemplateCountryData,
  SyncTemplateData,
  TemplateCountry,
  TemplateCountryCreateData,
  TemplateCountryTree,
  TemplateCountryUpdateData,
  TemplateDistrict,
  TemplateDistrictCreateData,
  TemplateDistrictListParams,
  TemplateDistrictUpdateData,
  TemplateProvince,
  TemplateProvinceCreateData,
  TemplateProvinceListParams,
  TemplateProvinceUpdateData
} from "@/cms/types/areaTemplate";

export const areaTemplateApi = baseApi.injectEndpoints({
  endpoints: builder => ({

    // ===================================================================
    // Template country - reads
    // ===================================================================

    // GET api/v1/template/countries
    // Takes no arguments at all - GetListTemplateCountry has no GraphQL input.
    getTemplateCountries: builder.query<ApiResponse<TemplateCountry[]>, void>({
      query: () => ({
        url: "/template/countries",
      }),
      providesTags: ["AreaTemplate"],
    }),

    // GET api/v1/template/countries/{id}
    getTemplateCountryById: builder.query<ApiResponse<TemplateCountry>, string | number>({
      query: id => ({
        url: `/template/countries/${id}`,
      }),
      providesTags: ["AreaTemplate"],
    }),

    // GET api/v1/template/countries/{id}/versions
    // Every version in the lineage the given template belongs to.
    getTemplateCountryVersions: builder.query<ApiResponse<TemplateCountry[]>, string | number>({
      query: id => ({
        url: `/template/countries/${id}/versions`,
      }),
      providesTags: ["AreaTemplate"],
    }),

    // GET api/v1/template/countries/{id}/tree
    // Reads the *cached* nested tree - regenerate with generateTemplateCountryTree
    // after editing the template, or this keeps serving the pre-edit shape.
    getTemplateCountryTree: builder.query<ApiResponse<TemplateCountryTree>, string | number>({
      query: id => ({
        url: `/template/countries/${id}/tree`,
      }),
      providesTags: ["AreaTemplate"],
    }),

    // ===================================================================
    // Template province / district - reads
    // ===================================================================

    // GET api/v1/template/provinces
    getTemplateProvinces: builder.query<ApiResponse<TemplateProvince[]>, TemplateProvinceListParams>({
      query: params => ({
        url: "/template/provinces",
        params,
      }),
      providesTags: ["AreaTemplate"],
    }),

    // GET api/v1/template/provinces/{id}
    getTemplateProvinceById: builder.query<ApiResponse<TemplateProvince>, string | number>({
      query: id => ({
        url: `/template/provinces/${id}`,
      }),
      providesTags: ["AreaTemplate"],
    }),

    // GET api/v1/template/districts
    getTemplateDistricts: builder.query<ApiResponse<TemplateDistrict[]>, TemplateDistrictListParams>({
      query: params => ({
        url: "/template/districts",
        params,
      }),
      providesTags: ["AreaTemplate"],
    }),

    // GET api/v1/template/districts/{id}
    getTemplateDistrictById: builder.query<ApiResponse<TemplateDistrict>, string | number>({
      query: id => ({
        url: `/template/districts/${id}`,
      }),
      providesTags: ["AreaTemplate"],
    }),

    // ===================================================================
    // Template country - writes
    // ===================================================================

    // POST api/v1/template/countries/add
    createTemplateCountry: builder.mutation<ApiResponse<TemplateCountry>, TemplateCountryCreateData>({
      query: data => ({
        url: "/template/countries/add",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["AreaTemplate"],
    }),

    // PATCH api/v1/template/countries/{id}
    // Rejected by the backend once the template is published - fork it first.
    updateTemplateCountry: builder.mutation<
      ApiResponse<TemplateCountry>,
      { id: string | number; data: TemplateCountryUpdateData }
    >({
      query: ({ id, data }) => ({
        url: `/template/countries/${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: ["AreaTemplate"],
    }),

    // DELETE api/v1/template/countries/{id}
    deleteTemplateCountry: builder.mutation<ApiResponse<void>, string | number>({
      query: id => ({
        url: `/template/countries/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["AreaTemplate"],
    }),

    // POST api/v1/template/countries/{id}/publish
    // Locks the template against further edits.
    publishTemplateCountry: builder.mutation<ApiResponse<unknown>, string | number>({
      query: id => ({
        url: `/template/countries/${id}/publish`,
        method: "POST",
        body: { id },
      }),
      invalidatesTags: ["AreaTemplate"],
    }),

    // POST api/v1/template/countries/{id}/fork
    // Opens a new draft version of a published template; `en` names it.
    forkTemplateCountry: builder.mutation<
      ApiResponse<unknown>,
      { id: string | number; data: ForkTemplateData }
    >({
      query: ({ id, data }) => ({
        url: `/template/countries/${id}/fork`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["AreaTemplate"],
    }),

    // POST api/v1/template/countries/{id}/generate_tree
    // Rebuilds the cache read by getTemplateCountryTree.
    generateTemplateCountryTree: builder.mutation<ApiResponse<unknown>, string | number>({
      query: id => ({
        url: `/template/countries/${id}/generate_tree`,
        method: "POST",
        body: { id },
      }),
      invalidatesTags: ["AreaTemplate"],
    }),

    // ===================================================================
    // Template province - writes
    // ===================================================================

    // POST api/v1/template/provinces/add
    createTemplateProvince: builder.mutation<ApiResponse<TemplateProvince>, TemplateProvinceCreateData>({
      query: data => ({
        url: "/template/provinces/add",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["AreaTemplate"],
    }),

    // PATCH api/v1/template/provinces/{id}
    updateTemplateProvince: builder.mutation<
      ApiResponse<TemplateProvince>,
      { id: string | number; data: TemplateProvinceUpdateData }
    >({
      query: ({ id, data }) => ({
        url: `/template/provinces/${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: ["AreaTemplate"],
    }),

    // DELETE api/v1/template/provinces/{id}
    deleteTemplateProvince: builder.mutation<ApiResponse<void>, string | number>({
      query: id => ({
        url: `/template/provinces/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["AreaTemplate"],
    }),

    // ===================================================================
    // Template district - writes
    // ===================================================================

    // POST api/v1/template/districts/add
    createTemplateDistrict: builder.mutation<ApiResponse<TemplateDistrict>, TemplateDistrictCreateData>({
      query: data => ({
        url: "/template/districts/add",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["AreaTemplate"],
    }),

    // PATCH api/v1/template/districts/{id}
    updateTemplateDistrict: builder.mutation<
      ApiResponse<TemplateDistrict>,
      { id: string | number; data: TemplateDistrictUpdateData }
    >({
      query: ({ id, data }) => ({
        url: `/template/districts/${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: ["AreaTemplate"],
    }),

    // DELETE api/v1/template/districts/{id}
    deleteTemplateDistrict: builder.mutation<ApiResponse<void>, string | number>({
      query: id => ({
        url: `/template/districts/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["AreaTemplate"],
    }),

    // ===================================================================
    // Template -> organization area
    // ===================================================================
    // These two write the org's own area data, so they invalidate "Area" as
    // well as "AreaTemplate".

    // POST api/v1/template/countries/from_template
    // First-time import: duplicates a template country into the org's area.
    createOrgAreaFromTemplateCountry: builder.mutation<ApiResponse<unknown>, FromTemplateCountryData>({
      query: data => ({
        url: "/template/countries/from_template",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Area", "AreaTemplate"],
    }),

    // POST api/v1/template/countries/{id}/sync_template
    // Subsequent merges; `id` is the org area country, not the template.
    syncTemplateCountry: builder.mutation<
      ApiResponse<unknown>,
      { id: string | number; data: SyncTemplateData }
    >({
      query: ({ id, data }) => ({
        url: `/template/countries/${id}/sync_template`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Area", "AreaTemplate"],
    }),

  }),
});

export const {
  useGetTemplateCountriesQuery,
  useGetTemplateCountryByIdQuery,
  useGetTemplateCountryVersionsQuery,
  useGetTemplateCountryTreeQuery,
  useGetTemplateProvincesQuery,
  useGetTemplateProvinceByIdQuery,
  useGetTemplateDistrictsQuery,
  useGetTemplateDistrictByIdQuery,
  useLazyGetTemplateCountryTreeQuery,
  useLazyGetTemplateProvincesQuery,
  useLazyGetTemplateDistrictsQuery,
  useCreateTemplateCountryMutation,
  useUpdateTemplateCountryMutation,
  useDeleteTemplateCountryMutation,
  usePublishTemplateCountryMutation,
  useForkTemplateCountryMutation,
  useGenerateTemplateCountryTreeMutation,
  useCreateTemplateProvinceMutation,
  useUpdateTemplateProvinceMutation,
  useDeleteTemplateProvinceMutation,
  useCreateTemplateDistrictMutation,
  useUpdateTemplateDistrictMutation,
  useDeleteTemplateDistrictMutation,
  useCreateOrgAreaFromTemplateCountryMutation,
  useSyncTemplateCountryMutation
} = areaTemplateApi;
