import { AreaResponse, Province, District, Subdistrict } from "@/cms/types/area";
import type {
    CountryCreateData, CountryUpdateData,
    AreaProvinceCreateData, AreaProvinceUpdateData,
    AreaDistrictCreateData, AreaDistrictUpdateData,
    Country, AreaProvince, AreaDistrict,
    OrgCountryTree
} from "@/cms/types/area";
import { PaginationParams } from "@/cms/types/dispatch";
import { baseApi, baseWelcomeCrmApi } from "@/core/store/api/baseApi";
import { ApiResponse } from "@/core/types";


export interface Area {
    id: string;
    orgId: string;
    countryId: string;
    provId: string;
    distId: string;
    districtEn: string;
    districtTh: string;
    districtActive: boolean;
    provinceEn: string;
    provinceTh: string;
    provinceActive: boolean;
    countryEn: string;
    countryTh: string;
    countryActive: boolean;
}

export const mergeArea = (data: Area, language: string) => {
    if (language === "th") {
        return `${data.countryTh ? `${data.countryTh}` : ""}` +
            `${data.provinceTh ? `-${data.provinceTh}` : ""}` +
            `${data.districtTh ? `-${data.districtTh}` : ""}`
    } else {
        return `${data.countryEn ? `${data.countryEn}` : ""}` +
            `${data.provinceEn ? `-${data.provinceEn}` : ""}` +
            `${data.districtEn ? `-${data.districtEn}` : ""}`
    }
}

export const areaApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({

        getArea: builder.query<ApiResponse<Area[]>, null>({
            query: () => ({
                url: "/area/country_province_districts",
            }),
            providesTags: ["Area"],
        }),

        // ===================================================================
        // Country / Province / District lists (dedicated per-level endpoints,
        // each returns records carrying their own real numeric `id`)
        // ===================================================================

        // GET api/v1/area/countries
        getCountries: builder.query<ApiResponse<Country[]>, PaginationParams>({
            query: (params) => ({
                url: "/area/countries",
                params,
            }),
            providesTags: ["Area"],
        }),

        // GET api/v1/area/provinces
        getProvinces: builder.query<ApiResponse<AreaProvince[]>, PaginationParams & { countryId?: string }>({
            query: (params) => ({
                url: "/area/provinces",
                params,
            }),
            providesTags: ["Area"],
        }),

        // GET api/v1/area/districts
        getDistricts: builder.query<ApiResponse<AreaDistrict[]>, PaginationParams & { countryId?: string; provId?: string }>({
            query: (params) => ({
                url: "/area/districts",
                params,
            }),
            providesTags: ["Area"],
        }),

        // ===================================================================
        // Country
        // ===================================================================

        // POST api/v1/countries/add
        createCountry: builder.mutation<ApiResponse<Area>, CountryCreateData>({
            query: data => ({
                url: "/countries/add",
                method: "POST",
                body: data,
            }),
            invalidatesTags: ["Area"],
        }),

        // PATCH api/v1/countries/{id}
        updateCountry: builder.mutation<ApiResponse<Area>, { id: string; data: CountryUpdateData }>({
            query: ({ id, data }) => ({
                url: `/countries/${id}`,
                method: "PATCH",
                body: data
            }),
            invalidatesTags: ["Area"],
        }),

        // DELETE api/v1/countries/{id}
        deleteCountry: builder.mutation<ApiResponse<void>, string | number>({
            query: id => ({
                url: `/countries/${id}`,
                method: "DELETE"
            }),
            invalidatesTags: ["Area"],
        }),

        // ===================================================================
        // Province
        // ===================================================================

        // POST api/v1/provinces/add
        createProvince: builder.mutation<ApiResponse<Area>, AreaProvinceCreateData>({
            query: data => ({
                url: "/provinces/add",
                method: "POST",
                body: data,
            }),
            invalidatesTags: ["Area"],
        }),

        // PATCH api/v1/provinces/{id}
        updateProvince: builder.mutation<ApiResponse<Area>, { id: string; data: AreaProvinceUpdateData }>({
            query: ({ id, data }) => ({
                url: `/provinces/${id}`,
                method: "PATCH",
                body: data
            }),
            invalidatesTags: ["Area"],
        }),

        // DELETE api/v1/provinces/{id}
        deleteProvince: builder.mutation<ApiResponse<void>, string | number>({
            query: id => ({
                url: `/provinces/${id}`,
                method: "DELETE"
            }),
            invalidatesTags: ["Area"],
        }),

        // ===================================================================
        // District
        // ===================================================================

        // POST api/v1/districts/add
        createDistrict: builder.mutation<ApiResponse<Area>, AreaDistrictCreateData>({
            query: data => ({
                url: "/districts/add",
                method: "POST",
                body: data,
            }),
            invalidatesTags: ["Area"],
        }),

        // PATCH api/v1/districts/{id}
        updateDistrict: builder.mutation<ApiResponse<Area>, { id: string; data: AreaDistrictUpdateData }>({
            query: ({ id, data }) => ({
                url: `/districts/${id}`,
                method: "PATCH",
                body: data
            }),
            invalidatesTags: ["Area"],
        }),

        // DELETE api/v1/districts/{id}
        deleteDistrict: builder.mutation<ApiResponse<void>, string | number>({
            query: id => ({
                url: `/districts/${id}`,
                method: "DELETE"
            }),
            invalidatesTags: ["Area"],
        }),

        // ===================================================================
        // Org country tree
        // ===================================================================
        // Both of these sit under the /area/ REST path but resolve to the
        // AreaTemplate GraphQL root, not Area - see GQL_AREA in
        // store/api/graphql/areaQueries.ts. That is the BFF's shape, not a typo.

        // GET api/v1/area/countries/{id}/tree
        // The cached country -> provinces -> districts tree for this org, built
        // without DB joins. It is a *cache*: the country/province/district
        // mutations above do not refresh it, so call generateOrgCountryTree
        // after editing or this keeps serving the pre-edit shape.
        getOrgCountryTree: builder.query<ApiResponse<OrgCountryTree>, string | number>({
            query: id => ({
                url: `/area/countries/${id}/tree`,
            }),
            providesTags: ["Area"],
        }),

        // POST api/v1/area/countries/{id}/generate_tree
        // Regenerates the cache read by getOrgCountryTree. The explicit body is
        // required: buildGraphQLQuery returns null for a POST with no body, which
        // is a hard error wherever VITE_USE_GRAPHQL is true.
        generateOrgCountryTree: builder.mutation<ApiResponse<unknown>, string | number>({
            query: id => ({
                url: `/area/countries/${id}/generate_tree`,
                method: "POST",
                body: { id },
            }),
            invalidatesTags: ["Area"],
        }),

    }),
});
export const {
    useGetAreaQuery,
    useGetCountriesQuery,
    useGetProvincesQuery,
    useGetDistrictsQuery,
    useCreateCountryMutation,
    useUpdateCountryMutation,
    useDeleteCountryMutation,
    useCreateProvinceMutation,
    useUpdateProvinceMutation,
    useDeleteProvinceMutation,
    useCreateDistrictMutation,
    useUpdateDistrictMutation,
    useDeleteDistrictMutation,
    useGetOrgCountryTreeQuery,
    useLazyGetOrgCountryTreeQuery,
    useGenerateOrgCountryTreeMutation,
} = areaApi;


export const areaWelcomeApi = baseWelcomeCrmApi.injectEndpoints({
    endpoints: (builder) => ({

        getWelcomeArea: builder.query<ApiResponse<AreaResponse[]>, PaginationParams & { search?: string }>({
            query: (params) => ({
                url: "/area",
                params,
            }),
            providesTags: ["Area"],
        }),

        getWelcomeProvince: builder.query<ApiResponse<Province[]>, PaginationParams & { search: string }>({
            query: (params) => ({
                url: "/provinces",
                params,
            }),
            providesTags: ["Area"],
        }),

        getWelcomeDistricts: builder.query<ApiResponse<District[]>, PaginationParams & { search: string }>({
            query: (params) => ({
                url: "/districts",
                params,
            }),
            providesTags: ["Area"],
        }),

        getWelcomeSubDistricts: builder.query<ApiResponse<Subdistrict[]>, PaginationParams & { search: string }>({
            query: (params) => ({
                url: "/subdistricts",
                params,
            }),
            providesTags: ["Area"],
        }),







    }),
});
export const {
    useGetWelcomeAreaQuery,
    useLazyGetWelcomeAreaQuery,
    useGetWelcomeDistrictsQuery,
    useGetWelcomeProvinceQuery,
    useGetWelcomeSubDistrictsQuery,
    useLazyGetWelcomeDistrictsQuery,
    useLazyGetWelcomeProvinceQuery,
    useLazyGetWelcomeSubDistrictsQuery
} = areaWelcomeApi;