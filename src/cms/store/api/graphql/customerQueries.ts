// src/cms/store/api/graphql/customerQueries.ts
const GET_LIST_CUSTOMER_QUERY = {
  operationName: "GetListCustomer",
  root: "Customer",
  inputType: "ListDataInput",
  fields: `status msg data desc`,
  // fields: `status msg currentPage pageSize totalFiltered totalRecords totalPage data desc`,
};

const GET_CUSTOMER_BY_ID_QUERY = {
  operationName: "GetCustomerById",
  root: "Customer",
  inputType: "GetIdInput!",
  fields: `status msg data desc`,
};

const GET_CUSTOMER_BY_PHONE_QUERY = {
  operationName: "GetCustomerByPhone",
  root: "Customer",
  inputType: "GetIdInput!",
  fields: `status msg data desc`,
};

const CREATE_CUSTOMER_MUTATION = {
  operationName: "CreateCustomer",
  root: "Customer",
  inputType: "CustomerInput!",
  fields: `status msg data desc`,
  mutation: true,
};

const UPDATE_CUSTOMER_MUTATION = {
  operationName: "UpdateCustomer",
  root: "Customer",
  inputType: "CustomerInput!",
  fields: `status msg data desc`,
  mutation: true,
};

const DELETE_CUSTOMER_MUTATION = {
  operationName: "DeleteCustomer",
  root: "Customer",
  inputType: "GetIdInput!",
  fields: `status msg data desc`,
  mutation: true,
};

export const GQL_CUSTOMER = {
  "/customer": GET_LIST_CUSTOMER_QUERY,
  "/customer/add": {
    POST: CREATE_CUSTOMER_MUTATION,
  },
  "/customer/byPhoneNo/:id": GET_CUSTOMER_BY_PHONE_QUERY,
  "/customer/:id": {
    GET: GET_CUSTOMER_BY_ID_QUERY,
    PATCH: UPDATE_CUSTOMER_MUTATION,
    DELETE: DELETE_CUSTOMER_MUTATION,
  },
};
