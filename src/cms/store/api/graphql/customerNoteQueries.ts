// src/cms/store/api/graphql/customerNoteQueries.ts
/**
 * GraphQL mapping for the customer-note REST endpoints.
 *
 * Registering these is not optional. With `VITE_USE_GRAPHQL === "true"` the hybrid
 * base query has no REST fallback — a URL with no `GQL_MAP` entry is logged and
 * returned to the caller as a hard error. Any gap here is a user-facing failure.
 *
 * Operation names, input types and field selections all follow the live contract in
 * `src/cms/mocks/customerNoteCURL.sh`. Note the input types are NOT uniform: the list
 * takes `ListDataInput!`, delete takes `GetIdInput!` (it needs only an id), and
 * create/update take `CustomerNoteInput!`.
 */
import { CUSTOMER_NOTE_GQL_KEYS } from "@/cms/store/api/customerNoteRoutes";

const GET_LIST_CUSTOMER_NOTE_QUERY = {
  operationName: "GetListCustomerNote",
  root: "CustomerNote",
  inputType: "ListDataInput!",
  fields: `status msg data desc pageSize`,
};

const CREATE_CUSTOMER_NOTE_MUTATION = {
  operationName: "CreateCustomerNote",
  root: "CustomerNote",
  inputType: "CustomerNoteInput!",
  fields: `status msg data desc`,
  mutation: true,
};

const UPDATE_CUSTOMER_NOTE_MUTATION = {
  operationName: "UpdateCustomerNote",
  root: "CustomerNote",
  inputType: "CustomerNoteInput!",
  fields: `status msg data desc`,
  mutation: true,
};

const DELETE_CUSTOMER_NOTE_MUTATION = {
  operationName: "DeleteCustomerNote",
  root: "CustomerNote",
  inputType: "GetIdInput!",
  fields: `status msg data desc`,
  mutation: true,
};

/**
 * Key order is load-bearing — see the comment on `CUSTOMER_NOTE_GQL_KEYS`. `create`
 * must precede `detail`, since the detail pattern also matches `/customer_notes/add`.
 */
export const GQL_CUSTOMER_NOTE = {
  [CUSTOMER_NOTE_GQL_KEYS.list]: {
    GET: GET_LIST_CUSTOMER_NOTE_QUERY,
  },
  [CUSTOMER_NOTE_GQL_KEYS.create]: {
    POST: CREATE_CUSTOMER_NOTE_MUTATION,
  },
  [CUSTOMER_NOTE_GQL_KEYS.detail]: {
    PATCH: UPDATE_CUSTOMER_NOTE_MUTATION,
    DELETE: DELETE_CUSTOMER_NOTE_MUTATION,
  },
};
