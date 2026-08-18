// src/cms/store/api/customerSocialRoutes.ts
/**
 * The single source of truth for customer-social URL shapes.
 *
 * Two consumers have to agree on these strings or the feature breaks in a way that is
 * invisible until runtime:
 *
 *   1. `customerSocial.ts` builds concrete request URLs from them.
 *   2. `graphql/customerSocialQueries.ts` keys its `GQL_MAP` entries on the *pattern*
 *      form of the same paths.
 *
 * Every environment sets `VITE_USE_GRAPHQL="true"` and there is no REST fallback (see
 * CLAUDE.md and `hybridBaseQuery.ts`): a URL whose pattern isn't in `GQL_MAP` is a hard,
 * user-facing error. Keeping both forms in one file is what stops them drifting apart.
 *
 * `customer_with_socials` follows the BFF's `X_with_Y` convention for link tables — the
 * same shape as `/users_with_area` and `/users_with_skills` in `core/store/api/userApi.ts`.
 * The customer is a `custId` field, not a path segment.
 */

export const customerSocialRoutes = {
  list: (): string => "/customer_with_socials",
  create: (): string => "/customer_with_socials/add",
  detail: (id: string): string => `/customer_with_socials/${id}`,
} as const;

/**
 * Pattern forms, for `GQL_MAP` keys.
 *
 * ORDER MATTERS. `matchUrl` (`src/core/utils/gqlMapper.ts`) compiles `:id` to `([^/]+)`,
 * so `/customer_with_socials/:id` also matches the literal `/customer_with_socials/add`.
 * Declaring `create` first means a POST resolves to the create mutation before the detail
 * key is ever considered. (`matchUrl` additionally skips candidates that don't define the
 * requested method, so this is belt and braces — but the ordering is what makes it
 * obviously correct.) `GQL_CUSTOMER` and `GQL_CUSTOMER_NOTE` rely on the same arrangement.
 */
export const CUSTOMER_SOCIAL_GQL_KEYS = {
  list: "/customer_with_socials",
  create: "/customer_with_socials/add",
  detail: "/customer_with_socials/:id",
} as const;
