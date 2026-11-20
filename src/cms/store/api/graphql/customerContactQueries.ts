// src/cms/store/api/graphql/customerContactQueries.ts
/**
 * GraphQL mapping for the `/customer_contacts` REST endpoints.
 *
 * Registering these is not optional. With `VITE_USE_GRAPHQL === "true"` — which every
 * environment sets — the hybrid base query has no REST fallback: a URL with no `GQL_MAP`
 * entry is logged and returned to the caller as a hard error. Any gap here is a user-facing
 * failure.
 *
 * Operation names, input types and field selections follow the live contract in
 * `src/cms/mocks/customerContactCURL.sh`. Input types are not uniform: the list takes
 * `ListDataInput!` (only `start`/`length` — there is no `custId` filter, which is why
 * `useCustomerContacts` sweeps pages and filters client-side), get-by-id takes `GetIdInput!`,
 * and update takes `CustomerContactInput!`.
 *
 * `fields` stays at `status msg data desc` — the contract exposes no pagination fields on either
 * read, and a field the schema doesn't define is a GraphQL validation error rather than an
 * ignored extra.
 */
import { CUSTOMER_CONTACT_GQL_KEYS } from "@/cms/store/api/customerContactRoutes";

const GET_LIST_CUSTOMER_CONTACT_QUERY = {
  operationName: "GetListCustomerContact",
  root: "CustomerContact",
  inputType: "ListDataInput!",
  fields: `status msg data desc`,
};

const GET_CUSTOMER_CONTACT_BY_ID_QUERY = {
  operationName: "GetCustomerContactById",
  root: "CustomerContact",
  inputType: "GetIdInput!",
  fields: `status msg data desc`,
};

const UPDATE_CUSTOMER_CONTACT_MUTATION = {
  operationName: "UpdateCustomerContact",
  root: "CustomerContact",
  inputType: "CustomerContactInput!",
  fields: `status msg data desc`,
  mutation: true,
};

export const GQL_CUSTOMER_CONTACT = {
  [CUSTOMER_CONTACT_GQL_KEYS.list]: {
    GET: GET_LIST_CUSTOMER_CONTACT_QUERY,
  },
  [CUSTOMER_CONTACT_GQL_KEYS.detail]: {
    GET: GET_CUSTOMER_CONTACT_BY_ID_QUERY,
    PATCH: UPDATE_CUSTOMER_CONTACT_MUTATION,
  },
};
