// src/cms/store/api/graphql/categoryQueries.ts
const GET_LIST_CATEGORY_QUERY = {
  operationName: "GetListCategory",
  root: "Category",
  inputType: "ListDataInput!",
  // No pagination counts here on purpose: the BFF's Category list type does not expose
  // currentPage/pageSize/totalFiltered/totalRecords/totalPage, and asking for them fails the
  // whole query ("Cannot query fields ... Maybe they should be managed by client"). CategoryView
  // therefore fetches the whole filtered set and pages it in the browser.
  fields: `status msg data desc`,
};

const GET_CATEGORY_BY_ID_QUERY = {
  operationName: "GetCategoryById",
  root: "Category",
  inputType: "GetIdInput!",
  fields: `status msg data desc`,
};

const CREATE_CATEGORY_MUTATION = {
  operationName: "CreateCategory",
  root: "Category",
  inputType: "CategoryInput!",
  fields: `status msg data desc`,
  mutation: true,
};

const UPDATE_CATEGORY_MUTATION = {
  operationName: "UpdateCategory",
  root: "Category",
  inputType: "CategoryInput!",
  fields: `status msg data desc`,
  mutation: true,
};

const DELETE_CATEGORY_MUTATION = {
  operationName: "DeleteCategory",
  root: "Category",
  inputType: "GetIdInput!",
  fields: `status msg data desc`,
  mutation: true,
};

export const GQL_CATEGORY = {
  // A bare config satisfies every method in matchUrl's definesMethod guard, so leaving this as
  // a plain GET_LIST_CATEGORY_QUERY made POST /category resolve to the list query instead of
  // CreateCategory - same fix shape as GQL_WORKFLOW.
  // "/category": GET_LIST_CATEGORY_QUERY,
  "/category": {
    GET: GET_LIST_CATEGORY_QUERY,
    POST: CREATE_CATEGORY_MUTATION
  },
  "/category/:id": {
    GET: GET_CATEGORY_BY_ID_QUERY,
    // POST: CREATE_CATEGORY_MUTATION, // create posts to the collection "/category", not "/category/:id"
    // categoryApi.updateCategory sends PUT; PATCH kept for callers that use it.
    PUT: UPDATE_CATEGORY_MUTATION,
    PATCH: UPDATE_CATEGORY_MUTATION,
    DELETE: DELETE_CATEGORY_MUTATION,
  },
};
