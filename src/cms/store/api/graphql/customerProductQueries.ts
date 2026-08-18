// src/cms/store/api/graphql/customerProductQueries.ts
const GET_LIST_CUSTOMER_PRODUCT_QUERY = {
  operationName: "GetListCustomerProduct",
  root: "CustomerProduct",
  inputType: "ListDataInput!",
  fields: `status msg currentPage pageSize totalFiltered totalRecords totalPage data desc`,
};

const GET_CUSTOMER_PRODUCT_BY_ID_QUERY = {
  operationName: "GetCustomerProductByCustId",
  root: "CustomerProduct",
  inputType: "GetIdInput!",
  fields: `status msg data desc`,
};

const CREATE_CUSTOMER_PRODUCT_MUTATION = {
  operationName: "CreateCustomerProduct",
  root: "CustomerProduct",
  inputType: "CustomerProductInput!",
  fields: `status msg data desc`,
  mutation: true,
};

const UPDATE_CUSTOMER_PRODUCT_MUTATION = {
  operationName: "UpdateCustomerProduct",
  root: "CustomerProduct",
  inputType: "CustomerProductInput!",
  fields: `status msg data desc`,
  mutation: true,
};

const DELETE_CUSTOMER_PRODUCT_MUTATION = {
  operationName: "DeleteCustomerProduct",
  root: "CustomerProduct",
  inputType: "GetIdInput!",
  fields: `status msg data desc`,
  mutation: true,
};

export const GQL_CUSTOMER_PRODUCT = {
  "/customer_product": GET_LIST_CUSTOMER_PRODUCT_QUERY,
  "/customer_product/add": {
    POST: CREATE_CUSTOMER_PRODUCT_MUTATION,
  },
  "/customer_product/:id": {
    GET: GET_CUSTOMER_PRODUCT_BY_ID_QUERY,
    // POST: CREATE_CUSTOMER_PRODUCT_MUTATION,
    PATCH: UPDATE_CUSTOMER_PRODUCT_MUTATION,
    DELETE: DELETE_CUSTOMER_PRODUCT_MUTATION,
  },
};
