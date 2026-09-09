// src/cms/store/api/placesApi.ts
/**
 * Place Management API Endpoints
 * Admin MDM management of org-curated facilities (Police Station / Hospital /
 * Fire Station) shown as a case-map layer.
 *
 * Mirrors propertyApi.ts: same baseApi injection, same /mdm/* prefix, same
 * { id, data } PATCH convention. The GraphQL mapping lives in
 * src/cms/store/api/graphql/mdmQueries.ts (GQL_MDM) - required, since every
 * environment runs VITE_USE_GRAPHQL="true" with no REST fallback.
 *
 * Unlike propertyApi.ts, the "Place" cache tag IS wired: PlaceManagement relies
 * on it so a create/update/delete refreshes the list in place, without the
 * window.location.replace reload the older MDM admin screens use. The tag is
 * registered in commonTagTypes (src/core/store/api/baseApi.ts).
 */
import { baseApi } from "@/core/store/api/baseApi";
import type { ApiResponse } from "@/core/types";
import type {
  Place, PlaceCreateData, PlaceQueryParams, PlaceUpdateData,
} from "@/cms/types/place";

export const placesApi = baseApi.injectEndpoints({
  endpoints: builder => ({
    // POST /mdm/places/add
    createPlace: builder.mutation<ApiResponse<Place>, PlaceCreateData>({
      query: data => ({
        url: "/mdm/places/add",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Place"],
    }),

    // GET /mdm/places
    getPlaces: builder.query<ApiResponse<Place[]>, PlaceQueryParams>({
      query: params => {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined) {
            searchParams.append(key, String(value));
          }
        });
        return `/mdm/places?${searchParams.toString()}`;
      },
      providesTags: ["Place"],
    }),

    // GET /mdm/places/{id}
    getPlaceById: builder.query<ApiResponse<Place>, string>({
      query: id => `/mdm/places/${id}`,
      providesTags: ["Place"],
    }),

    // PATCH /mdm/places/{id}
    updatePlace: builder.mutation<ApiResponse<Place>, { id: string; data: PlaceUpdateData }>({
      query: ({ id, data }) => ({
        url: `/mdm/places/${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: ["Place"],
    }),

    // DELETE /mdm/places/{id}
    deletePlace: builder.mutation<ApiResponse<void>, string>({
      query: id => ({
        url: `/mdm/places/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Place"],
    }),
  }),
  // Vite HMR re-runs this module without a full page reload, which calls injectEndpoints a
  // second time. Without this, RTK Query keeps the definitions registered by the previous
  // run and an edit to a `query` silently has no effect until the page is reloaded.
  overrideExisting: import.meta.env.DEV,
});

export const {
  useCreatePlaceMutation,
  useGetPlacesQuery,
  useGetPlaceByIdQuery,
  useUpdatePlaceMutation,
  useDeletePlaceMutation,
} = placesApi;
