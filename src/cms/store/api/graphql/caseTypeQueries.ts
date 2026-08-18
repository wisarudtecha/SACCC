// src/cms/store/api/graphql/caseTypeQueries.ts
// Maps REST-style keys to GraphQL operation configs for CaseTypes and CaseSubTypes domains
// Source: SuperApp.postman_collection.json – "9. Case-Type" and "10. Case-Sub-Type"

// ─── Case-Type Queries ────────────────────────────────────────────────────────

const GET_LIST_CASE_TYPE_QUERY = {
  operationName: "GetListCaseType",
  root: "CaseTypes",
  inputType: "ListDataInput!",
  fields: `status msg data desc`
};

const GET_LIST_CASE_TYPE_WITH_SUB_TYPES_QUERY = {
  operationName: "GetListCaseTypeWithSubTypes",
  root: "CaseTypes",
  fields: `status msg data desc`
};

// ─── Case-Type Mutations ──────────────────────────────────────────────────────

const CREATE_CASE_TYPE_MUTATION = {
  operationName: "CreateCaseType",
  root: "CaseTypes",
  inputType: "CaseTypeInput!",
  fields: `status msg data desc`,
  mutation: true
};

const UPDATE_CASE_TYPE_MUTATION = {
  operationName: "UpdateCaseType",
  root: "CaseTypes",
  inputType: "CaseTypeInput!",
  fields: `status msg data desc`,
  mutation: true
};

const DELETE_CASE_TYPE_MUTATION = {
  operationName: "DeleteCaseType",
  root: "CaseTypes",
  inputType: "GetIdInput!",
  fields: `status msg data desc`,
  mutation: true
};

// ─── Case-Sub-Type Queries ────────────────────────────────────────────────────

const GET_LIST_CASE_SUB_TYPE_QUERY = {
  operationName: "GetListCaseSubType",
  root: "CaseSubTypes",
  inputType: "ListDataInput!",
  fields: `status msg data desc`
};

// ─── Case-Sub-Type Mutations ──────────────────────────────────────────────────

const CREATE_CASE_SUB_TYPE_MUTATION = {
  operationName: "CreateCaseSubType",
  root: "CaseSubTypes",
  inputType: "CaseSubTypeInput!",
  fields: `status msg data desc`,
  mutation: true
};

const UPDATE_CASE_SUB_TYPE_MUTATION = {
  operationName: "UpdateCaseSubType",
  root: "CaseSubTypes",
  inputType: "CaseSubTypeInput!",
  fields: `status msg data desc`,
  mutation: true
};

const DELETE_CASE_SUB_TYPE_MUTATION = {
  operationName: "DeleteCaseSubType",
  root: "CaseSubTypes",
  inputType: "GetIdInput!",
  fields: `status msg data desc`,
  mutation: true
};

// ─── Registration Map ─────────────────────────────────────────────────────────

export const GQL_CASE_TYPE = {
  "/casetypes": GET_LIST_CASE_TYPE_QUERY,
  "/casetypes_with_subtype": GET_LIST_CASE_TYPE_WITH_SUB_TYPES_QUERY,
  "/casetypes/add": CREATE_CASE_TYPE_MUTATION,
  "/casetypes/:id": {
    DELETE: DELETE_CASE_TYPE_MUTATION,
    PATCH: UPDATE_CASE_TYPE_MUTATION,
  }
};

export const GQL_CASE_SUB_TYPE = {
  "/casesubtypes": GET_LIST_CASE_SUB_TYPE_QUERY,
  "/casesubtypes/add": CREATE_CASE_SUB_TYPE_MUTATION,
  "/casesubtypes/:id": {
    DELETE: DELETE_CASE_SUB_TYPE_MUTATION,
    PATCH: UPDATE_CASE_SUB_TYPE_MUTATION,
  }
};
