// src/cms/store/api/graphql/caseHistoryQueries.ts
// Maps REST-style keys to GraphQL operation configs for the CaseHistory domain
// Source: SuperApp.postman_collection.json – "7. Case-History"

// ─── Queries ─────────────────────────────────────────────────────────────────

const GET_LIST_CASE_HISTORY_QUERY = {
  operationName: "GetListCaseHistory",
  root: "CaseHistory",
  inputType: "ListDataInput!",
  fields: `status msg data desc`
};

const GET_LIST_CASE_HISTORY_BY_CASE_ID_QUERY = {
  operationName: "GetListCaseHistoryByCaseId",
  root: "CaseHistory",
  inputType: "GetIdInput!",
  fields: `status msg data desc`
};

// ─── Mutations ────────────────────────────────────────────────────────────────

const CREATE_CASE_HISTORY_MUTATION = {
  operationName: "CreateCaseHistory",
  root: "CaseHistory",
  inputType: "CaseHistoryInput!",
  fields: `status msg data desc`,
  mutation: true
};

const DELETE_CASE_HISTORY_MUTATION = {
  operationName: "DeleteCaseHistory",
  root: "CaseHistory",
  inputType: "GetIdInput!",
  fields: `status msg data desc`,
  mutation: true
};

// ─── Registration Map ─────────────────────────────────────────────────────────

export const GQL_CASE_HISTORY = {
  "/case_history": GET_LIST_CASE_HISTORY_QUERY,
  "/case_history/add": CREATE_CASE_HISTORY_MUTATION,
  "/case_history/case": GET_LIST_CASE_HISTORY_BY_CASE_ID_QUERY,
  "/case_history/create": CREATE_CASE_HISTORY_MUTATION,
  "/case_history/:id": {
    DELETE: DELETE_CASE_HISTORY_MUTATION,
    GET: GET_LIST_CASE_HISTORY_BY_CASE_ID_QUERY,
  }
};
