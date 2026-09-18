// src/cms/store/api/placesApi.ts
/**
 * Place Management API Endpoints
 * Admin management of org-curated facilities (Police Station / Hospital /
 * Fire Station) shown as a case-map layer.
 *
 * URLs match docs/specification/API_Specification_Place_Device.md (plain
 * /places*, no /mdm prefix or /add suffix) - the confirmed real backend
 * contract. KNOWN GAP (accepted, Phase 2 to fix): the GraphQL mapping in
 * src/cms/store/api/graphql/mdmQueries.ts (GQL_MDM) still keys off the OLD
 * /mdm/places* paths, and every real environment runs VITE_USE_GRAPHQL="true"
 * with no REST fallback - so these endpoints will hard-error there until
 * GQL_MAP is updated to match. Deliberate tradeoff, not an oversight.
 *
 * The "Place" cache tag IS wired: PlaceManagement relies on it so a
 * create/update/delete refreshes the list in place, without the
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
    // POST /places
    createPlace: builder.mutation<ApiResponse<Place>, PlaceCreateData>({
      query: data => ({
        url: "/places",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Place"],
    }),

    // GET /places
    getPlaces: builder.query<ApiResponse<Place[]>, PlaceQueryParams>({
      query: params => {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined) {
            searchParams.append(key, String(value));
          }
        });
        return `/places?${searchParams.toString()}`;
      },
      providesTags: ["Place"],
    }),

    // GET /places/{id}
    getPlaceById: builder.query<ApiResponse<Place>, string>({
      query: id => `/places/${id}`,
      providesTags: ["Place"],
    }),

    // PATCH /places/{id}
    updatePlace: builder.mutation<ApiResponse<Place>, { id: string; data: PlaceUpdateData }>({
      query: ({ id, data }) => ({
        url: `/places/${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: ["Place"],
    }),

    // DELETE /places/{id}
    deletePlace: builder.mutation<ApiResponse<void>, string>({
      query: id => ({
        url: `/places/${id}`,
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
