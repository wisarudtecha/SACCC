// src/cms/store/api/customerNoteRoutes.ts
/**
 * The single source of truth for customer-note URL shapes.
 *
 * Two consumers have to agree on these strings or the feature breaks in a way that
 * is invisible until runtime:
 *
 *   1. `customerNote.ts` builds concrete request URLs from them.
 *   2. `graphql/customerNoteQueries.ts` keys its `GQL_MAP` entries on the *pattern*
 *      form of the same paths.
 *
 * When `VITE_USE_GRAPHQL === "true"` there is no REST fallback (see CLAUDE.md and
 * `hybridBaseQuery.ts`): a URL whose pattern isn't in `GQL_MAP` is a hard, user-facing
 * error, not a silent degrade. Keeping both forms in one file is what stops the
 * builders and the map keys from drifting apart.
 *
 * Notes are a top-level collection rather than a sub-resource of a customer — the
 * customer is a `custId` parameter, not a path segment. This mirrors the shape the
 * `/customer` endpoints already use, including the `/add` suffix on create.
 */

export const customerNoteRoutes = {
  list: (): string => "/customer_notes",
  create: (): string => "/customer_notes/add",
  detail: (id: string): string => `/customer_notes/${id}`,
} as const;

/**
 * Pattern forms, for `GQL_MAP` keys.
 *
 * ORDER MATTERS. `matchUrl` (`src/core/utils/gqlMapper.ts`) compiles `:id` to `([^/]+)`,
 * so `/customer_notes/:id` also matches the literal `/customer_notes/add`. Declaring
 * `create` first means a POST resolves to the create mutation before the detail key is
 * ever considered. (`matchUrl` additionally skips candidates that don't define the
 * requested method, so this is belt and braces — but the ordering is what makes it
 * obviously correct.) `GQL_CUSTOMER` relies on exactly the same arrangement for
 * `/customer/add` vs `/customer/:id`.
 */
export const CUSTOMER_NOTE_GQL_KEYS = {
  list: "/customer_notes",
  create: "/customer_notes/add",
  detail: "/customer_notes/:id",
} as const;
