// src/cms/store/api/graphql/storeQueries.ts
const GET_LIST_STORE_QUERY = {
  operationName: "GetListStore",
  root: "Store",
  inputType: "ListDataInput!",
  // No pagination counts here on purpose: like GetListBrand, the BFF's Store list type does not
  // expose currentPage/pageSize/totalFiltered/totalRecords/totalPage, and asking for them fails
  // the whole query. StoreView therefore fetches the whole filtered set and pages it in the browser.
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
  // A bare config satisfies every method in matchUrl's definesMethod guard, so leaving this as
  // a plain GET_LIST_STORE_QUERY made POST /store resolve to the list query instead of
  // CreateStore - same fix shape as GQL_BRAND.
  // "/store": GET_LIST_STORE_QUERY,
  "/store": {
    GET: GET_LIST_STORE_QUERY,
    POST: CREATE_STORE_MUTATION
  },
  "/store/:id": {
    GET: GET_STORE_BY_ID_QUERY,
    // POST: CREATE_STORE_MUTATION, // create posts to the collection "/store", not "/store/:id"
    // storeApi.updateStore sends PUT; without it matchUrl found no candidate and every update
    // failed with "No GraphQL mapping found". PATCH kept for callers that use it.
    PUT: UPDATE_STORE_MUTATION,
    PATCH: UPDATE_STORE_MUTATION,
    DELETE: DELETE_STORE_MUTATION,
  },
};
