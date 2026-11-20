// src/core/store/api/configPropertyApi.ts
/**
 * Config-property endpoints - the storage behind the Organization Settings page.
 *
 * The BFF exposes one generic key/value resource (`/api/v1/config_properties`) and
 * the whole settings page lives in a single key, `org.config.properties`, whose
 * `propVal` is the JSON document `{ mapSettings, assignmentRules }`.
 *
 * Only the two operations the page actually needs are declared:
 *   GET  /config_properties/key/{propKey} -> ConfigProperty.GetConfigPropertyByKey
 *   POST /config_properties/key/{propKey} -> ConfigProperty.SetConfigPropertyByKey (upsert)
 *
 * Deliberately NOT declared: List / GetById / Create / Update / Delete. List omits
 * `propVal` entirely (`ConfigPropertyListItem` in the BFF), and Create/Update/Delete
 * are unnecessary because Set is an upsert - adding unused endpoints here would only
 * widen the surface that has to be kept in sync with the schema.
 *
 * GraphQL mapping: `src/core/store/api/graphql/configPropertyQueries.ts`, registered
 * in `GQL_MAP`. There is no REST fallback when `VITE_USE_GRAPHQL="true"`, so the two
 * entries must stay exactly in step with the BFF's input type names.
 */
import { baseApi } from "@/core/store/api/baseApi";
import type { ApiResponse } from "@/core/types";
import type { ConfigPropertyRow } from "@/core/types/organization";

export interface ConfigPropertyQueryArgs {
  propKey: string;
  /**
   * Cache-key salt only. The BFF scopes the row by the caller's token - there is no
   * `orgId` in any ConfigProperty input - but RTK Query keys a cache entry by the
   * whole argument object, so including it here keeps one tenant's document from
   * being served to another after a switch without a page reload.
   */
  orgId: string;
}

export const configPropertyApi = baseApi.injectEndpoints({
  endpoints: builder => ({
    // GET api/v1/config_properties/key/{propKey}
    //
    // An unsaved key answers `status: "-1"` with `data: null`, which the hybrid base
    // query surfaces as a real RTK error. Callers must read that as "nothing stored
    // yet" (defaults + a first Save that upserts), not as a broken page.
    getConfigPropertyByKey: builder.query<
      ApiResponse<ConfigPropertyRow>,
      ConfigPropertyQueryArgs
    >({
      query: ({ propKey }) => `/config_properties/key/${encodeURIComponent(propKey)}`,
      providesTags: ["OrgSettings"],
    }),

    // POST api/v1/config_properties/key/{propKey}
    //
    // Upsert: creates the row when the key is absent. The body carries `propVal`
    // only - `propKey` reaches the GraphQL input from the matched path segment and
    // the REST route from the URL, so sending it twice is unnecessary.
    setConfigPropertyByKey: builder.mutation<
      ApiResponse<ConfigPropertyRow>,
      { propKey: string; propVal: unknown }
    >({
      query: ({ propKey, propVal }) => ({
        url: `/config_properties/key/${encodeURIComponent(propKey)}`,
        method: "POST",
        body: { propVal },
      }),
      invalidatesTags: ["OrgSettings"],
    }),
  }),
  // Vite HMR re-runs this module without a full page reload, which calls
  // injectEndpoints a second time. Without this, RTK Query keeps the definitions
  // registered by the previous run and an edit to a `query` silently has no effect
  // until the page is reloaded.
  overrideExisting: import.meta.env.DEV,
});

export const { useGetConfigPropertyByKeyQuery, useSetConfigPropertyByKeyMutation } =
  configPropertyApi;
