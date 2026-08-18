// src/cms/store/api/graphql/customerSocialQueries.ts
/**
 * GraphQL mapping for the customer-social REST endpoints.
 *
 * Registering these is not optional. With `VITE_USE_GRAPHQL === "true"` — which every
 * environment sets — the hybrid base query has no REST fallback: a URL with no `GQL_MAP`
 * entry is logged and returned to the caller as a hard error. Any gap here is a
 * user-facing failure.
 *
 * Operation names, input types and field selections follow the live contract in
 * `src/cms/mocks/customerSocialCURL.sh`. Input types are NOT uniform: the list takes
 * `ListDataInput!`, get-by-id and delete take `GetIdInput!`, and create/update take
 * `CustomerSocialInput!`.
 *
 * Two corrections against the earlier speculative scaffold, both of which would have
 * failed at runtime:
 *
 *   - The paths were `/customer-socials`. The real base is `/customer_with_socials`, and
 *     create is `/add`-suffixed rather than sharing the `:id` key.
 *   - The list requested `currentPage pageSize totalFiltered totalRecords totalPage`.
 *     The contract exposes none of them on this operation, and a field the schema doesn't
 *     define is a GraphQL validation error — i.e. a hard failure, not a degrade. The
 *     absence of a total is why `useCustomerSocials` pages until it sees a short one.
 */
import { CUSTOMER_SOCIAL_GQL_KEYS } from "@/cms/store/api/customerSocialRoutes";

const GET_LIST_CUSTOMER_SOCIAL_QUERY = {
  operationName: "GetListCustomerSocial",
  root: "CustomerSocial",
  inputType: "ListDataInput!",
  fields: `status msg data desc`,
};

const GET_CUSTOMER_SOCIAL_BY_ID_QUERY = {
  operationName: "GetCustomerSocialById",
  root: "CustomerSocial",
  inputType: "GetIdInput!",
  fields: `status msg data desc`,
};

const CREATE_CUSTOMER_SOCIAL_MUTATION = {
  operationName: "CreateCustomerSocial",
  root: "CustomerSocial",
  inputType: "CustomerSocialInput!",
  fields: `status msg data desc`,
  mutation: true,
};

const UPDATE_CUSTOMER_SOCIAL_MUTATION = {
  operationName: "UpdateCustomerSocial",
  root: "CustomerSocial",
  inputType: "CustomerSocialInput!",
  fields: `status msg data desc`,
  mutation: true,
};

const DELETE_CUSTOMER_SOCIAL_MUTATION = {
  operationName: "DeleteCustomerSocial",
  root: "CustomerSocial",
  inputType: "GetIdInput!",
  fields: `status msg data desc`,
  mutation: true,
};

/**
 * Key order is load-bearing — see the comment on `CUSTOMER_SOCIAL_GQL_KEYS`. `create`
 * must precede `detail`, since the detail pattern also matches `/customer_with_socials/add`.
 */
export const GQL_CUSTOMER_SOCIAL = {
  [CUSTOMER_SOCIAL_GQL_KEYS.list]: {
    GET: GET_LIST_CUSTOMER_SOCIAL_QUERY,
  },
  [CUSTOMER_SOCIAL_GQL_KEYS.create]: {
    POST: CREATE_CUSTOMER_SOCIAL_MUTATION,
  },
  [CUSTOMER_SOCIAL_GQL_KEYS.detail]: {
    GET: GET_CUSTOMER_SOCIAL_BY_ID_QUERY,
    PATCH: UPDATE_CUSTOMER_SOCIAL_MUTATION,
    DELETE: DELETE_CUSTOMER_SOCIAL_MUTATION,
  },
};
