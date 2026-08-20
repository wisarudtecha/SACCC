// src/cms/store/api/graphql/brandQueries.ts
const GET_LIST_BRAND_QUERY = {
  operationName: "GetListBrand",
  root: "Brand",
  inputType: "ListDataInput!",
  // No pagination counts here on purpose: the BFF's Brand list type does not expose
  // currentPage/pageSize/totalFiltered/totalRecords/totalPage, and asking for them fails the
  // whole query ("Cannot query fields ... Maybe they should be managed by client"). BrandView
  // therefore fetches the whole filtered set and pages it in the browser.
  fields: `status msg data desc`
};

const GET_BRAND_BY_ID_QUERY = {
  operationName: "GetBrandById",
  root: "Brand",
  inputType: "GetIdInput!",
  fields: `status msg data desc`
};

const CREATE_BRAND_MUTATION = {
  operationName: "CreateBrand",
  root: "Brand",
  inputType: "BrandInput!",
  fields: `status msg data desc`,
  mutation: true
};

const UPDATE_BRAND_MUTATION = {
  operationName: "UpdateBrand",
  root: "Brand",
  inputType: "BrandInput!",
  fields: `status msg data desc`,
  mutation: true
};

const DELETE_BRAND_MUTATION = {
  operationName: "DeleteBrand",
  root: "Brand",
  inputType: "GetIdInput!",
  fields: `status msg data desc`,
  mutation: true
};

export const GQL_BRAND = {
  // A bare config satisfies every method in matchUrl's definesMethod guard, so leaving this as
  // a plain GET_LIST_BRAND_QUERY made POST /brand resolve to the list query instead of
  // CreateBrand - same fix shape as GQL_WORKFLOW.
  // "/brand": GET_LIST_BRAND_QUERY,
  "/brand": {
    GET: GET_LIST_BRAND_QUERY,
    POST: CREATE_BRAND_MUTATION
  },
  "/brand/:id": {
    GET: GET_BRAND_BY_ID_QUERY,
    // POST: CREATE_BRAND_MUTATION, // create posts to the collection "/brand", not "/brand/:id"
    // brandApi.updateBrand sends PUT; PATCH kept for callers that use it.
    PUT: UPDATE_BRAND_MUTATION,
    PATCH: UPDATE_BRAND_MUTATION,
    DELETE: DELETE_BRAND_MUTATION
  }
};
