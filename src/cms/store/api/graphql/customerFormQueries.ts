// src/cms/store/api/graphql/customerFormQueries.ts
const GET_LIST_CUSTOMER_FORM_QUERY = {
  operationName: "GetListCustomerForm",
  root: "CustomerForm",
  inputType: "ListDataInput",
  fields: `status msg currentPage pageSize totalFiltered totalRecords totalPage data desc`,
};

const GET_LIST_CUSTOMER_FORM_CONFIG_QUERY = {
  operationName: "GetListCustomerForm",
  root: "CustomerForm",
  // inputType: "ListDataInput",
  fields: `status msg data desc`,
};

const GET_CUSTOMER_FORM_BY_ID_QUERY = {
  operationName: "GetCustomerFormById",
  root: "CustomerForm",
  inputType: "GetIdInput!",
  fields: `status msg data desc`,
};

const CREATE_CUSTOMER_FORM_MUTATION = {
  operationName: "CreateCustomerForm",
  root: "CustomerForm",
  inputType: "CustomerFormInput!",
  fields: `status msg data desc`,
  mutation: true,
};

const UPDATE_CUSTOMER_FORM_MUTATION = {
  operationName: "UpdateCustomerForm",
  root: "CustomerForm",
  inputType: "CustomerFormInput!",
  fields: `status msg data desc`,
  mutation: true,
};

const UPDATE_CUSTOMER_FORM_CONFIG_MUTATION = {
  operationName: "UpdateCustomerForm",
  root: "CustomerForm",
  inputType: "CustomerFormConfigUpdateInput!",
  fields: `status msg data desc`,
  mutation: true,
};

const DELETE_CUSTOMER_FORM_MUTATION = {
  operationName: "DeleteCustomerForm",
  root: "CustomerForm",
  inputType: "GetIdInput!",
  fields: `status msg data desc`,
  mutation: true,
};

export const GQL_CUSTOMER_FORM = {
  // "/customer_form_config": GET_LIST_CUSTOMER_FORM_CONFIG_QUERY,
  "/customer_form_config": {
    GET: GET_LIST_CUSTOMER_FORM_CONFIG_QUERY,
    POST: UPDATE_CUSTOMER_FORM_CONFIG_MUTATION,
  },
  "/customer-forms": GET_LIST_CUSTOMER_FORM_QUERY,
  "/customer-forms/:id": {
    GET: GET_CUSTOMER_FORM_BY_ID_QUERY,
    POST: CREATE_CUSTOMER_FORM_MUTATION,
    PATCH: UPDATE_CUSTOMER_FORM_MUTATION,
    DELETE: DELETE_CUSTOMER_FORM_MUTATION,
  },
};
