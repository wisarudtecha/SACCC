// src/cms/store/api/customerContactDefaultRoutes.ts
/**
 * The single source of truth for customer-contact-default URL shapes.
 *
 * Two consumers have to agree on these strings or the feature breaks in a way that is
 * invisible until runtime:
 *
 *   1. `customerContactDefault.ts` builds concrete request URLs from them.
 *   2. `graphql/customerContactDefaultQueries.ts` keys its `GQL_MAP` entries on the *pattern*
 *      form of the same paths.
 *
 * Every environment sets `VITE_USE_GRAPHQL="true"` and there is no REST fallback (see
 * CLAUDE.md and `hybridBaseQuery.ts`): a URL whose pattern isn't in `GQL_MAP` is a hard,
 * user-facing error. Keeping both forms in one file is what stops them drifting apart.
 *
 * THE TWO PATHS ARE ASYMMETRIC ON PURPOSE, and both halves are load-bearing:
 *
 *   - The read takes the customer in the path, and its parameter MUST be named `:id`.
 *     `matchUrl` (`src/core/utils/gqlMapper.ts`) injects path params into the GraphQL input
 *     under their placeholder name, and `GetCustomerContactDefault` takes `GetIdInput!` —
 *     an `id` field that happens to hold the customer's id. Naming it `:custId` would send
 *     `{ custId }` to an input type that has no such field.
 *   - The write takes NO path parameter. `CustomerContactDefaultInput` is
 *     `{ custId, referId, type }` and defines no `id`, so a `:id` segment would inject an
 *     undefined field and the GraphQL document would fail validation — a hard failure, not a
 *     degrade. (The contract file shows this operation under `PATCH /customer_contacts/{id}`,
 *     but that line is a copy-paste from `UpdateCustomerContact`: the real input carries the
 *     customer as `custId` in the body.)
 */

export const customerContactDefaultRoutes = {
  detail: (custId: string): string => `/customer_contact/default/${custId}`,
  update: (): string => "/customer_contact/default",
} as const;

/**
 * Pattern forms, for `GQL_MAP` keys.
 *
 * Unlike the sibling `customer_notes` / `customer_with_socials` maps, order is NOT
 * load-bearing here: `/customer_contact/default` has no path segment where
 * `/customer_contact/default/:id` expects one, so neither pattern can match the other's URL.
 */
export const CUSTOMER_CONTACT_DEFAULT_GQL_KEYS = {
  detail: "/customer_contact/default/:id",
  update: "/customer_contact/default",
} as const;
