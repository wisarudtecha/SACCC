// src/cms/store/api/graphql/customerServiceQueries.ts
const GET_LIST_CUSTOMER_SERVICE_QUERY = {
  operationName: "GetListCustomerService",
  root: "CustomerService",
  inputType: "ListDataInput!",
  fields: `status msg data desc`,
};

const GET_CUSTOMER_SERVICE_BY_ID_QUERY = {
  operationName: "GetCustomerServiceByCustId",
  root: "CustomerService",
  inputType: "GetIdInput!",
  fields: `status msg data desc`,
};

const CREATE_CUSTOMER_SERVICE_MUTATION = {
  operationName: "CreateCustomerService",
  root: "CustomerService",
  inputType: "CustomerServiceInput!",
  fields: `status msg data desc`,
  mutation: true,
};

const UPDATE_CUSTOMER_SERVICE_MUTATION = {
  operationName: "UpdateCustomerService",
  root: "CustomerService",
  inputType: "CustomerServiceInput!",
  fields: `status msg data desc`,
  mutation: true,
};

const DELETE_CUSTOMER_SERVICE_MUTATION = {
  operationName: "DeleteCustomerService",
  root: "CustomerService",
  inputType: "GetIdInput!",
  fields: `status msg data desc`,
  mutation: true,
};

export const GQL_CUSTOMER_SERVICE = {
  "/customer_service": GET_LIST_CUSTOMER_SERVICE_QUERY,
  "/customer_service/:id": {
    GET: GET_CUSTOMER_SERVICE_BY_ID_QUERY,
    POST: CREATE_CUSTOMER_SERVICE_MUTATION,
    PATCH: UPDATE_CUSTOMER_SERVICE_MUTATION,
    DELETE: DELETE_CUSTOMER_SERVICE_MUTATION,
  },
};
