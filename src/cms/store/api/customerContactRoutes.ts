// src/cms/store/api/customerContactRoutes.ts
/**
 * The single source of truth for `/customer_contacts` URL shapes.
 *
 * Two consumers have to agree on these strings or the feature breaks in a way that is invisible
 * until runtime:
 *
 *   1. `customerContact.ts` builds concrete request URLs from them.
 *   2. `graphql/customerContactQueries.ts` keys its `GQL_MAP` entries on the *pattern* form.
 *
 * Every environment sets `VITE_USE_GRAPHQL="true"` and there is no REST fallback (see
 * `CLAUDE.md` and `hybridBaseQuery.ts`): a URL whose pattern isn't in `GQL_MAP` is a hard,
 * user-facing error. Keeping both forms in one file is what stops them drifting apart.
 *
 * The detail path's parameter MUST be named `:id`. `matchUrl`
 * (`src/core/utils/gqlMapper.ts`) injects path params into the GraphQL input under their
 * placeholder name, and both `GetCustomerContactById` and `UpdateCustomerContact` key on `id` —
 * naming it `:contactId` would send a field the input type does not define, which is a hard
 * GraphQL validation failure rather than a degrade.
 *
 * The two patterns cannot collide: a URL with no second segment cannot match one that requires
 * it. Registering `list` first is convention (see `customerSocialQueries.ts`), not load-bearing
 * here.
 */
export const customerContactRoutes = {
    list: (): string => "/customer_contacts",
    detail: (id: string): string => `/customer_contacts/${id}`,
} as const;

/** Pattern forms, for `GQL_MAP` keys. */
export const CUSTOMER_CONTACT_GQL_KEYS = {
    list: "/customer_contacts",
    detail: "/customer_contacts/:id",
} as const;
