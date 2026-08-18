// src/cms/store/api/graphql/productQueries.ts
const GET_LIST_PRODUCT_QUERY = {
  operationName: "GetListProduct",
  root: "Product",
  inputType: "ListDataInput!",
  // fields: `status msg data desc`,
  fields: `status msg currentPage pageSize totalFiltered totalRecords totalPage data desc`,
};

const GET_PRODUCT_BY_ID_QUERY = {
  operationName: "GetProductById",
  root: "Product",
  inputType: "GetIdInput!",
  fields: `status msg data desc`,
};

const CREATE_PRODUCT_MUTATION = {
  operationName: "CreateProduct",
  root: "Product",
  inputType: "ProductInput!",
  fields: `status msg data desc`,
  mutation: true,
};

const UPDATE_PRODUCT_MUTATION = {
  operationName: "UpdateProduct",
  root: "Product",
  inputType: "ProductInput!",
  fields: `status msg data desc`,
  mutation: true,
};

const DELETE_PRODUCT_MUTATION = {
  operationName: "DeleteProduct",
  root: "Product",
  inputType: "GetIdInput!",
  fields: `status msg data desc`,
  mutation: true,
};

export const GQL_PRODUCT = {
  // "/product": GET_LIST_PRODUCT_QUERY,
  "/product": {
    GET: GET_LIST_PRODUCT_QUERY,
    POST: CREATE_PRODUCT_MUTATION,
  },
  "/product/:id": {
    GET: GET_PRODUCT_BY_ID_QUERY,
    // POST: CREATE_PRODUCT_MUTATION,
    PUT: UPDATE_PRODUCT_MUTATION,
    DELETE: DELETE_PRODUCT_MUTATION,
  },
};
