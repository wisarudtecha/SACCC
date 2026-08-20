// src/cms/store/api/graphql/customerContactDefaultQueries.ts
/**
 * GraphQL mapping for the customer-contact-default REST endpoints.
 *
 * Registering these is not optional. With `VITE_USE_GRAPHQL === "true"` — which every
 * environment sets — the hybrid base query has no REST fallback: a URL with no `GQL_MAP`
 * entry is logged and returned to the caller as a hard error. Any gap here is a user-facing
 * failure.
 *
 * Operation names, input types and field selections follow the live contract in
 * `src/cms/mocks/customerContactCURL.sh`. The two input types differ: the read takes
 * `GetIdInput!` (an `id` holding the customer's id) and the write takes
 * `CustomerContactDefaultInput!` (`custId`, `referId`, `type`). See
 * `customerContactDefaultRoutes.ts` for why that forces the two URL shapes it defines.
 *
 * `fields` stays at `status msg data desc` — the contract exposes no pagination fields on
 * either operation, and a field the schema doesn't define is a GraphQL validation error
 * rather than an ignored extra.
 */
import { CUSTOMER_CONTACT_DEFAULT_GQL_KEYS } from "@/cms/store/api/customerContactDefaultRoutes";

const GET_CUSTOMER_CONTACT_DEFAULT_QUERY = {
  operationName: "GetCustomerContactDefault",
  root: "CustomerContactDefault",
  inputType: "GetIdInput!",
  fields: `status msg data desc`,
};

const UPDATE_CUSTOMER_CONTACT_DEFAULT_MUTATION = {
  operationName: "UpdateCustomerContactDefault",
  root: "CustomerContactDefault",
  inputType: "CustomerContactDefaultInput!",
  fields: `status msg data desc`,
  mutation: true,
};

export const GQL_CUSTOMER_CONTACT_DEFAULT = {
  [CUSTOMER_CONTACT_DEFAULT_GQL_KEYS.detail]: {
    GET: GET_CUSTOMER_CONTACT_DEFAULT_QUERY,
  },
  [CUSTOMER_CONTACT_DEFAULT_GQL_KEYS.update]: {
    PATCH: UPDATE_CUSTOMER_CONTACT_DEFAULT_MUTATION,
  },
};
