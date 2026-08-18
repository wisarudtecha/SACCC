// src/cms/store/api/graphql/storeQueries.ts
const GET_LIST_STORE_QUERY = {
  operationName: "GetListStore",
  root: "Store",
  inputType: "ListDataInput!",
  fields: `status msg data desc`,
};

const GET_STORE_BY_ID_QUERY = {
  operationName: "GetStoreById",
  root: "Store",
  inputType: "GetIdInput!",
  fields: `status msg data desc`,
};

const CREATE_STORE_MUTATION = {
  operationName: "CreateStore",
  root: "Store",
  inputType: "StoreInput!",
  fields: `status msg data desc`,
  mutation: true,
};

const UPDATE_STORE_MUTATION = {
  operationName: "UpdateStore",
  root: "Store",
  inputType: "StoreInput!",
  fields: `status msg data desc`,
  mutation: true,
};

const DELETE_STORE_MUTATION = {
  operationName: "DeleteStore",
  root: "Store",
  inputType: "GetIdInput!",
  fields: `status msg data desc`,
  mutation: true,
};

export const GQL_STORE = {
  "/store": GET_LIST_STORE_QUERY,
  "/store/:id": {
    GET: GET_STORE_BY_ID_QUERY,
    POST: CREATE_STORE_MUTATION,
    PATCH: UPDATE_STORE_MUTATION,
    DELETE: DELETE_STORE_MUTATION,
  },
};
