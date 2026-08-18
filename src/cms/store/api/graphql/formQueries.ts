// src/cms/store/api/graphql/formQueries.ts
const GET_LIST_FORM_QUERY = {
  operationName: "GetFormAll",
  root: "Forms",
  inputType: "ListDataInput!",
  fields: `status msg data totalPage totalRecords currentPage`,
};

const GET_LIST_FORM_WORKFLOW_QUERY = {
  operationName: "GetFormAllLinkWf",
  root: "Forms",
  inputType: "ListDataInput!",
  fields: `status msg data totalPage totalRecords currentPage`,
};

const GET_FORM_BY_CASE_SUBTYPE_QUERY = {
  operationName: "GetFormByCaseSubType",
  root: "Forms",
  inputType: "GetIdInput!",
  fields: `status msg data desc`,
};

const GET_FORM_BY_ID_QUERY = {
  operationName: "GetFormByFormId",
  root: "Forms",
  inputType: "GetIdInput!",
  fields: `status msg data desc`,
};

const CREATE_FORM_MUTATION = {
  operationName: "CreateForms",
  root: "Forms",
  inputType: "FormInput!",
  fields: `status msg data desc`,
  mutation: true,
};

const UPDATE_FORM_MUTATION = {
  operationName: "UpdateForms",
  root: "Forms",
  inputType: "FormInput!",
  fields: `status msg data desc`,
  mutation: true,
};

const DELETE_FORM_MUTATION = {
  operationName: "DeleteForms",
  root: "Forms",
  inputType: "GetIdInput!",
  fields: `status msg data desc`,
  mutation: true,
};

export const GQL_FORM = {
  // "/forms": GET_LIST_FORM_QUERY,
  "/forms": {
    GET: GET_LIST_FORM_QUERY,
    POST: CREATE_FORM_MUTATION,
  },
  "/forms/casesubtype": {
    POST: GET_FORM_BY_CASE_SUBTYPE_QUERY
  },
  "/forms/getAllForms": GET_LIST_FORM_QUERY,
  "/forms/getAllFormslinkWf": GET_LIST_FORM_WORKFLOW_QUERY,
  "/forms/:id": {
    GET: GET_FORM_BY_ID_QUERY,
    POST: CREATE_FORM_MUTATION,
    PATCH: UPDATE_FORM_MUTATION,
    DELETE: DELETE_FORM_MUTATION,
  },
};
